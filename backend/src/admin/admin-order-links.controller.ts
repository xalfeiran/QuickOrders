import {
  Body,
  Controller,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { Request } from 'express';
import { AdminUser } from '../auth/admin-user.entity';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ManagedSessionsService } from '../managed-sessions/managed-sessions.service';

export class CreateOrderLinkDto {
  @IsString()
  @MinLength(7)
  phone!: string;
}

@UseGuards(AuthenticatedGuard, RolesGuard)
@Roles('superadmin', 'business_admin')
@Controller('admin/order-links')
export class AdminOrderLinksController {
  constructor(private readonly sessions: ManagedSessionsService) {}

  // POST /api/admin/order-links?businessSlug= { phone }
  @Post()
  create(
    @Req() req: Request,
    @Body() dto: CreateOrderLinkDto,
    @Query('businessSlug') businessSlug?: string,
  ) {
    return this.sessions.create(req.user as AdminUser, businessSlug, dto.phone);
  }
}
