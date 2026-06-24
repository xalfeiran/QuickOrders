import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUser } from '../auth/admin-user.entity';
import { BusinessesService } from '../businesses/businesses.service';
import { MenuItemEntity } from '../menu/menu-item.entity';
import { normalizeOptionGroups, slugify } from '../menu/menu-validation';
import { AdminMenuItemDto } from './dto/menu-item.dto';
import { assertBusinessAccess, resolveBusinessId } from './tenant.util';

@Injectable()
export class AdminMenuService {
  constructor(
    @InjectRepository(MenuItemEntity)
    private readonly items: Repository<MenuItemEntity>,
    private readonly businesses: BusinessesService,
  ) {}

  async list(user: AdminUser, slug?: string) {
    const businessId = await resolveBusinessId(user, slug, this.businesses);
    if (!businessId) return [];
    const rows = await this.items.find({
      where: { business: { id: businessId } },
      order: { sortOrder: 'ASC' },
    });
    return rows.map(toDto);
  }

  async findOne(user: AdminUser, id: string) {
    const item = await this.load(user, id);
    return toDto(item);
  }

  async create(user: AdminUser, slug: string | undefined, dto: AdminMenuItemDto) {
    const businessId = await resolveBusinessId(user, slug, this.businesses);
    if (!businessId) {
      throw new BadRequestException('Selecciona un negocio');
    }

    const item = this.items.create({
      business: { id: businessId } as MenuItemEntity['business'],
      itemKey: await this.uniqueItemKey(businessId, slugify(dto.name)),
      name: dto.name.trim(),
      description: dto.description?.trim() ?? '',
      priceCents: dto.priceCents,
      category: dto.category.trim(),
      available: dto.available ?? true,
      sortOrder: dto.sortOrder ?? 0,
      optionGroups: normalizeOptionGroups(dto.optionGroups),
    });
    return toDto(await this.items.save(item));
  }

  async update(user: AdminUser, id: string, dto: AdminMenuItemDto) {
    const item = await this.load(user, id);
    item.name = dto.name.trim();
    item.description = dto.description?.trim() ?? '';
    item.priceCents = dto.priceCents;
    item.category = dto.category.trim();
    if (dto.available !== undefined) item.available = dto.available;
    if (dto.sortOrder !== undefined) item.sortOrder = dto.sortOrder;
    item.optionGroups = normalizeOptionGroups(dto.optionGroups);
    return toDto(await this.items.save(item));
  }

  async setAvailability(user: AdminUser, id: string, available: boolean) {
    const item = await this.load(user, id);
    item.available = available;
    return toDto(await this.items.save(item));
  }

  async remove(user: AdminUser, id: string) {
    const item = await this.load(user, id);
    await this.items.remove(item);
    return { ok: true };
  }

  // Loads an item with its business and enforces tenant access.
  private async load(user: AdminUser, id: string): Promise<MenuItemEntity> {
    const item = await this.items.findOne({
      where: { id },
      relations: ['business'],
    });
    if (!item) throw new NotFoundException('Platillo no encontrado');
    assertBusinessAccess(user, item.business ? item.business.id : null);
    return item;
  }

  // Ensures the generated itemKey is unique within the business.
  private async uniqueItemKey(businessId: string, base: string): Promise<string> {
    const existing = await this.items.find({
      where: { business: { id: businessId } },
      select: { itemKey: true },
    });
    const taken = new Set(existing.map((e) => e.itemKey));
    let key = base;
    let n = 2;
    while (taken.has(key)) key = `${base}-${n++}`;
    return key;
  }
}

function toDto(e: MenuItemEntity) {
  return {
    id: e.id,
    itemKey: e.itemKey,
    name: e.name,
    description: e.description,
    priceCents: e.priceCents,
    category: e.category,
    available: e.available,
    sortOrder: e.sortOrder,
    optionGroups: e.optionGroups ?? [],
    // Present when the item was loaded with its business (findOne); used by the
    // recipe editor to fetch that business's ingredients.
    businessSlug: e.business ? e.business.slug : undefined,
  };
}
