import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AdminUser } from '../auth/admin-user.entity';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminMenuService } from './admin-menu.service';
import { AdminMenuItemDto, AvailabilityDto } from './dto/menu-item.dto';

@UseGuards(AuthenticatedGuard, RolesGuard)
@Roles('superadmin', 'business_admin')
@Controller('admin/menu')
export class AdminMenuController {
  constructor(private readonly menu: AdminMenuService) {}

  @Get()
  list(@Req() req: Request, @Query('businessSlug') businessSlug?: string) {
    return this.menu.list(req.user as AdminUser, businessSlug);
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    return this.menu.findOne(req.user as AdminUser, id);
  }

  @Post()
  create(
    @Req() req: Request,
    @Body() dto: AdminMenuItemDto,
    @Query('businessSlug') businessSlug?: string,
  ) {
    return this.menu.create(req.user as AdminUser, businessSlug, dto);
  }

  @Put(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: AdminMenuItemDto,
  ) {
    return this.menu.update(req.user as AdminUser, id, dto);
  }

  @Patch(':id/availability')
  setAvailability(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: AvailabilityDto,
  ) {
    return this.menu.setAvailability(req.user as AdminUser, id, dto.available);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.menu.remove(req.user as AdminUser, id);
  }
}
