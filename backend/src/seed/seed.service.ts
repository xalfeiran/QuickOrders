import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { AdminUser } from '../auth/admin-user.entity';
import { Business } from '../businesses/business.entity';
import { DEFAULT_BUSINESS_SLUG } from '../businesses/businesses.service';
import { MENU } from '../menu/menu.data';
import { MenuItemEntity } from '../menu/menu-item.entity';

// Seeds the first business and its menu on boot. Idempotent: if the default
// business already exists, it does nothing.
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger('Seed');

  constructor(
    @InjectRepository(Business)
    private readonly businesses: Repository<Business>,
    @InjectRepository(MenuItemEntity)
    private readonly menuItems: Repository<MenuItemEntity>,
    @InjectRepository(AdminUser)
    private readonly admins: Repository<AdminUser>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedBusinessAndMenu();
    await this.seedSuperadmin();
  }

  private async seedBusinessAndMenu(): Promise<void> {
    const existing = await this.businesses.findOne({
      where: { slug: DEFAULT_BUSINESS_SLUG },
    });
    if (existing) return;

    const business = await this.businesses.save(
      this.businesses.create({
        name: 'Alita Mía',
        slug: DEFAULT_BUSINESS_SLUG,
        phone: null,
        active: true,
      }),
    );

    const items = MENU.map((item, index) =>
      this.menuItems.create({
        business,
        itemKey: item.id,
        name: item.name,
        description: item.description,
        priceCents: item.priceCents,
        category: item.category,
        available: item.available,
        sortOrder: index,
        optionGroups: item.optionGroups,
      }),
    );
    await this.menuItems.save(items);

    this.logger.log(
      `Seeded business "${business.slug}" with ${items.length} menu items`,
    );
  }

  // Creates the initial superadmin if there are no admin users yet.
  private async seedSuperadmin(): Promise<void> {
    const count = await this.admins.count();
    if (count > 0) return;

    const email = (process.env.ADMIN_EMAIL ?? 'admin@quickorder.local')
      .trim()
      .toLowerCase();
    const password = process.env.ADMIN_PASSWORD ?? 'changeme';

    await this.admins.save(
      this.admins.create({
        email,
        passwordHash: await bcrypt.hash(password, 10),
        name: 'Super Admin',
        role: 'superadmin',
        business: null,
        active: true,
      }),
    );

    this.logger.log(`Seeded superadmin "${email}"`);
    if (!process.env.ADMIN_PASSWORD) {
      this.logger.warn(
        'Superadmin created with the default password "changeme" — set ADMIN_PASSWORD and change it.',
      );
    }
  }
}
