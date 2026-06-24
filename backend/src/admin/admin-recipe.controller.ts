import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AdminUser } from '../auth/admin-user.entity';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RecipeDto } from '../inventory/dto/recipe.dto';
import { InventoryService } from '../inventory/inventory.service';

// Recipe editing for a menu item. Mounted under /api/admin/menu alongside the
// menu CRUD controller (different sub-paths, no collision).
@UseGuards(AuthenticatedGuard, RolesGuard)
@Roles('superadmin', 'business_admin')
@Controller('admin/menu')
export class AdminRecipeController {
  constructor(private readonly inventory: InventoryService) {}

  @Get(':id/recipe')
  get(@Req() req: Request, @Param('id') id: string) {
    return this.inventory.getRecipe(req.user as AdminUser, id);
  }

  @Put(':id/recipe')
  save(@Req() req: Request, @Param('id') id: string, @Body() dto: RecipeDto) {
    return this.inventory.saveRecipe(req.user as AdminUser, id, dto);
  }
}
