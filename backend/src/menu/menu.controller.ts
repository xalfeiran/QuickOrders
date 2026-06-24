import { Controller, Get, Param } from '@nestjs/common';
import { BusinessesService } from '../businesses/businesses.service';
import { MenuService } from './menu.service';

// Public menu endpoints. Two shapes:
//   /api/menu[...]          → the default business (legacy, single-tenant app)
//   /api/b/:slug/menu[...]  → a specific business by slug
@Controller()
export class MenuController {
  constructor(
    private readonly menuService: MenuService,
    private readonly businesses: BusinessesService,
  ) {}

  @Get('menu')
  async findAllDefault() {
    const business = await this.businesses.getDefault();
    return this.menuService.findAll(business.id);
  }

  @Get('menu/:id')
  async findOneDefault(@Param('id') id: string) {
    const business = await this.businesses.getDefault();
    return this.menuService.findOne(business.id, id);
  }

  @Get('b/:slug/menu')
  async findAllForBusiness(@Param('slug') slug: string) {
    const business = await this.businesses.findBySlug(slug);
    return this.menuService.findAll(business.id);
  }

  @Get('b/:slug/menu/:id')
  async findOneForBusiness(
    @Param('slug') slug: string,
    @Param('id') id: string,
  ) {
    const business = await this.businesses.findBySlug(slug);
    return this.menuService.findOne(business.id, id);
  }
}
