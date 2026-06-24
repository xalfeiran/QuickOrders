import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { AdminUser } from '../auth/admin-user.entity';
import {
  assertBusinessAccess,
  resolveBusinessId,
} from '../admin/tenant.util';
import { BusinessesService } from '../businesses/businesses.service';
import { MenuItemEntity } from '../menu/menu-item.entity';
import { IngredientDto } from './dto/ingredient.dto';
import { RecipeDto } from './dto/recipe.dto';
import { Ingredient } from './ingredient.entity';
import { RecipeComponent } from './recipe-component.entity';

// One order line as seen by the stock check.
export interface ConsumeLine {
  menuItemId: string; // itemKey
  quantity: number;
  selectedOptions: { groupId: string; optionId: string }[];
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Ingredient)
    private readonly ingredients: Repository<Ingredient>,
    @InjectRepository(RecipeComponent)
    private readonly recipes: Repository<RecipeComponent>,
    @InjectRepository(MenuItemEntity)
    private readonly menuItems: Repository<MenuItemEntity>,
    private readonly businesses: BusinessesService,
    private readonly dataSource: DataSource,
  ) {}

  // ----- Ingredients CRUD (tenant-scoped) -----

  async listIngredients(user: AdminUser, slug?: string) {
    const businessId = await resolveBusinessId(user, slug, this.businesses);
    if (!businessId) return [];
    const rows = await this.ingredients.find({
      where: { business: { id: businessId } },
      order: { name: 'ASC' },
    });
    return rows.map(ingredientDto);
  }

  async createIngredient(user: AdminUser, slug: string | undefined, dto: IngredientDto) {
    const businessId = await resolveBusinessId(user, slug, this.businesses);
    if (!businessId) throw new BadRequestException('Selecciona un negocio');
    const ingredient = this.ingredients.create({
      business: { id: businessId } as Ingredient['business'],
      name: dto.name.trim(),
      unit: dto.unit,
      stockQty: dto.stockQty,
      active: dto.active ?? true,
    });
    return ingredientDto(await this.ingredients.save(ingredient));
  }

  async updateIngredient(user: AdminUser, id: string, dto: IngredientDto) {
    const ingredient = await this.loadIngredient(user, id);
    ingredient.name = dto.name.trim();
    ingredient.unit = dto.unit;
    ingredient.stockQty = dto.stockQty;
    if (dto.active !== undefined) ingredient.active = dto.active;
    return ingredientDto(await this.ingredients.save(ingredient));
  }

  async removeIngredient(user: AdminUser, id: string) {
    const ingredient = await this.loadIngredient(user, id);
    await this.ingredients.remove(ingredient);
    return { ok: true };
  }

  private async loadIngredient(user: AdminUser, id: string): Promise<Ingredient> {
    const ingredient = await this.ingredients.findOne({
      where: { id },
      relations: ['business'],
    });
    if (!ingredient) throw new NotFoundException('Ingrediente no encontrado');
    assertBusinessAccess(user, ingredient.business ? ingredient.business.id : null);
    return ingredient;
  }

  // ----- Recipe per menu item -----

  async getRecipe(user: AdminUser, menuItemId: string) {
    const item = await this.loadMenuItem(user, menuItemId);
    const components = await this.recipes.find({
      where: { menuItem: { id: item.id } },
      relations: ['ingredient'],
    });

    const base = components
      .filter((c) => c.scope === 'base')
      .map(componentDto);

    const options: Record<string, ReturnType<typeof componentDto>[]> = {};
    for (const c of components) {
      if (c.scope !== 'option' || !c.optionGroupId || !c.optionId) continue;
      const key = `${c.optionGroupId}:${c.optionId}`;
      (options[key] ??= []).push(componentDto(c));
    }
    return { base, options };
  }

  async saveRecipe(user: AdminUser, menuItemId: string, dto: RecipeDto) {
    const item = await this.loadMenuItem(user, menuItemId);
    const businessId = item.business.id;

    // Only ingredients belonging to this business may be referenced.
    const owned = await this.ingredients.find({
      where: { business: { id: businessId } },
    });
    const ownedIds = new Set(owned.map((i) => i.id));

    const rows: RecipeComponent[] = [];
    const pushRow = (
      scope: 'base' | 'option',
      ingredientId: unknown,
      quantity: unknown,
      groupId?: string | null,
      optionId?: string | null,
    ) => {
      const qty = Number(quantity);
      if (!ingredientId || !ownedIds.has(String(ingredientId)) || !(qty > 0)) {
        return; // skip empty/invalid rows silently
      }
      rows.push(
        this.recipes.create({
          business: { id: businessId } as RecipeComponent['business'],
          menuItem: { id: item.id } as RecipeComponent['menuItem'],
          scope,
          optionGroupId: scope === 'option' ? groupId ?? null : null,
          optionId: scope === 'option' ? optionId ?? null : null,
          ingredient: { id: String(ingredientId) } as RecipeComponent['ingredient'],
          quantity: qty,
        }),
      );
    };

    for (const raw of (dto.base ?? []) as Record<string, unknown>[]) {
      pushRow('base', raw.ingredientId, raw.quantity);
    }
    for (const raw of (dto.options ?? []) as Record<string, unknown>[]) {
      const groupId = typeof raw.groupId === 'string' ? raw.groupId : null;
      const optionId = typeof raw.optionId === 'string' ? raw.optionId : null;
      const comps = Array.isArray(raw.components) ? raw.components : [];
      if (!groupId || !optionId) continue;
      for (const c of comps as Record<string, unknown>[]) {
        pushRow('option', c.ingredientId, c.quantity, groupId, optionId);
      }
    }

    // Replace the item's recipe atomically.
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(RecipeComponent, { menuItem: { id: item.id } });
      if (rows.length > 0) await manager.save(rows);
    });

    return this.getRecipe(user, menuItemId);
  }

  private async loadMenuItem(user: AdminUser, id: string): Promise<MenuItemEntity> {
    const item = await this.menuItems.findOne({
      where: { id },
      relations: ['business'],
    });
    if (!item) throw new NotFoundException('Platillo no encontrado');
    assertBusinessAccess(user, item.business ? item.business.id : null);
    return item;
  }

  // ----- Stock consumption at order confirmation (runs in a transaction) -----

  // Computes how much of each ingredient the order needs (base + selected
  // options, × line quantity), rejects if any ingredient is short, otherwise
  // decrements stock. Items without recipes consume nothing.
  async consumeForOrder(
    manager: EntityManager,
    businessId: string,
    lines: ConsumeLine[],
  ): Promise<void> {
    const itemKeys = [...new Set(lines.map((l) => l.menuItemId))];
    if (itemKeys.length === 0) return;

    const items = await manager.find(MenuItemEntity, {
      where: { business: { id: businessId }, itemKey: In(itemKeys) },
    });
    const keyToId = new Map(items.map((m) => [m.itemKey, m.id]));
    const itemIds = items.map((m) => m.id);
    if (itemIds.length === 0) return;

    const components = await manager.find(RecipeComponent, {
      where: { menuItem: { id: In(itemIds) } },
      relations: ['ingredient', 'menuItem'],
    });
    if (components.length === 0) return; // no recipes → nothing to consume

    const byItem = new Map<string, RecipeComponent[]>();
    for (const c of components) {
      const list = byItem.get(c.menuItem.id) ?? [];
      list.push(c);
      byItem.set(c.menuItem.id, list);
    }

    const required = new Map<string, number>(); // ingredientId → quantity
    for (const line of lines) {
      const itemId = keyToId.get(line.menuItemId);
      if (!itemId) continue;
      const comps = byItem.get(itemId) ?? [];
      const selected = new Set(
        (line.selectedOptions ?? []).map((o) => `${o.groupId}:${o.optionId}`),
      );
      for (const c of comps) {
        const applies =
          c.scope === 'base' ||
          (c.scope === 'option' &&
            !!c.optionGroupId &&
            !!c.optionId &&
            selected.has(`${c.optionGroupId}:${c.optionId}`));
        if (!applies) continue;
        const add = Number(c.quantity) * line.quantity;
        required.set(
          c.ingredient.id,
          (required.get(c.ingredient.id) ?? 0) + add,
        );
      }
    }
    if (required.size === 0) return;

    const ingredients = await manager.find(Ingredient, {
      where: { id: In([...required.keys()]) },
    });

    const shortages: string[] = [];
    for (const ing of ingredients) {
      const need = required.get(ing.id) ?? 0;
      if (Number(ing.stockQty) < need) {
        shortages.push(
          `${ing.name} (faltan ${(need - Number(ing.stockQty)).toFixed(3)} ${ing.unit})`,
        );
      }
    }
    if (shortages.length > 0) {
      throw new BadRequestException(
        `Inventario insuficiente: ${shortages.join(', ')}`,
      );
    }

    for (const ing of ingredients) {
      ing.stockQty = Number(ing.stockQty) - (required.get(ing.id) ?? 0);
    }
    await manager.save(ingredients);
  }
}

function ingredientDto(i: Ingredient) {
  return {
    id: i.id,
    name: i.name,
    unit: i.unit,
    stockQty: Number(i.stockQty),
    active: i.active,
  };
}

function componentDto(c: RecipeComponent) {
  return {
    ingredientId: c.ingredient.id,
    ingredientName: c.ingredient.name,
    unit: c.ingredient.unit,
    quantity: Number(c.quantity),
  };
}
