import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { IngredientDto } from '../inventory/dto/ingredient.dto';
import { InventoryService } from '../inventory/inventory.service';

@UseGuards(AuthenticatedGuard, RolesGuard)
@Roles('superadmin', 'business_admin')
@Controller('admin/inventory')
export class AdminInventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get()
  list(@Req() req: Request, @Query('businessSlug') businessSlug?: string) {
    return this.inventory.listIngredients(req.user as AdminUser, businessSlug);
  }

  @Post()
  create(
    @Req() req: Request,
    @Body() dto: IngredientDto,
    @Query('businessSlug') businessSlug?: string,
  ) {
    return this.inventory.createIngredient(
      req.user as AdminUser,
      businessSlug,
      dto,
    );
  }

  @Put(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: IngredientDto,
  ) {
    return this.inventory.updateIngredient(req.user as AdminUser, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.inventory.removeIngredient(req.user as AdminUser, id);
  }
}
