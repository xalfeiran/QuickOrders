import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from './business.entity';

// Slug of the business seeded on first boot. The legacy single-business
// endpoints (/api/menu, /orders/draft without a business) resolve to it.
export const DEFAULT_BUSINESS_SLUG = 'alita-mia';

@Injectable()
export class BusinessesService {
  constructor(
    @InjectRepository(Business)
    private readonly businesses: Repository<Business>,
  ) {}

  async findBySlug(slug: string): Promise<Business> {
    const business = await this.businesses.findOne({
      where: { slug, active: true },
    });
    if (!business) {
      throw new NotFoundException(`Business "${slug}" not found`);
    }
    return business;
  }

  // The default tenant, used by the not-yet-business-aware customer endpoints.
  getDefault(): Promise<Business> {
    return this.findBySlug(DEFAULT_BUSINESS_SLUG);
  }
}
