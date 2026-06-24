import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AdminUser } from '../auth/admin-user.entity';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminOrdersService } from './admin-orders.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@UseGuards(AuthenticatedGuard, RolesGuard)
@Roles('superadmin', 'business_admin')
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly orders: AdminOrdersService) {}

  // GET /api/admin/orders?businessSlug=&status=
  @Get()
  list(
    @Req() req: Request,
    @Query('businessSlug') businessSlug?: string,
    @Query('status') status?: string,
  ) {
    return this.orders.list(req.user as AdminUser, businessSlug, status);
  }

  // GET /api/admin/orders/:id
  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    return this.orders.findOne(req.user as AdminUser, id);
  }

  // PATCH /api/admin/orders/:id/status
  @Patch(':id/status')
  updateStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orders.updateStatus(req.user as AdminUser, id, dto.status);
  }
}
