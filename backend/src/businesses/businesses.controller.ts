import { Controller, Get, Param } from '@nestjs/common';
import { BusinessesService } from './businesses.service';

@Controller()
export class BusinessesController {
  constructor(private readonly businesses: BusinessesService) {}

  // GET /api/b/:slug — public business info used by the customer app to render
  // its header and confirm the business exists.
  @Get('b/:slug')
  async findBySlug(@Param('slug') slug: string) {
    const business = await this.businesses.findBySlug(slug);
    return {
      slug: business.slug,
      name: business.name,
      phone: business.phone,
    };
  }
}
