import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuItemEntity } from './menu-item.entity';
import { MenuItem } from './menu-item.model';

// Serves the menu catalogue from the database, scoped to a business. The DB
// rows are mapped to the public MenuItem shape (id = itemKey) so the cart,
// order pricing, and frontend keep working unchanged.
@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(MenuItemEntity)
    private readonly items: Repository<MenuItemEntity>,
  ) {}

  async findAll(businessId: string): Promise<MenuItem[]> {
    const rows = await this.items.find({
      where: { business: { id: businessId } },
      order: { sortOrder: 'ASC' },
    });
    return rows.map(toModel);
  }

  async findOne(businessId: string, itemKey: string): Promise<MenuItem> {
    const row = await this.items.findOne({
      where: { business: { id: businessId }, itemKey },
    });
    if (!row) {
      throw new NotFoundException(`Menu item "${itemKey}" not found`);
    }
    return toModel(row);
  }
}

// Maps a DB row to the public/domain MenuItem shape used everywhere else.
function toModel(row: MenuItemEntity): MenuItem {
  return {
    id: row.itemKey,
    name: row.name,
    description: row.description,
    priceCents: row.priceCents,
    category: row.category,
    available: row.available,
    optionGroups: row.optionGroups ?? [],
  };
}
