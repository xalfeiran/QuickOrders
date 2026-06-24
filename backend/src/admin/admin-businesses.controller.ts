import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Business } from '../businesses/business.entity';

// Superadmin-only: the list of businesses for the dashboard switcher.
@UseGuards(AuthenticatedGuard, RolesGuard)
@Roles('superadmin')
@Controller('admin/businesses')
export class AdminBusinessesController {
  constructor(
    @InjectRepository(Business)
    private readonly businesses: Repository<Business>,
  ) {}

  @Get()
  async list() {
    const rows = await this.businesses.find({
      where: { active: true },
      order: { name: 'ASC' },
    });
    return rows.map((b) => ({ id: b.id, slug: b.slug, name: b.name }));
  }
}
