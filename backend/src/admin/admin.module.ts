import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { BusinessesModule } from '../businesses/businesses.module';
import { InventoryModule } from '../inventory/inventory.module';
import { MenuItemEntity } from '../menu/menu-item.entity';
import { Order } from '../orders/order.entity';
import { AdminBusinessesController } from './admin-businesses.controller';
import { AdminInventoryController } from './admin-inventory.controller';
import { AdminMenuController } from './admin-menu.controller';
import { AdminMenuService } from './admin-menu.service';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminOrdersService } from './admin-orders.service';
import { AdminRecipeController } from './admin-recipe.controller';

// Dashboard API. AuthModule supplies the auth/role guards; BusinessesModule
// supplies business lookup; InventoryModule supplies ingredient/recipe logic.
@Module({
  imports: [
    TypeOrmModule.forFeature([Order, MenuItemEntity]),
    BusinessesModule,
    AuthModule,
    InventoryModule,
  ],
  controllers: [
    AdminOrdersController,
    AdminBusinessesController,
    AdminMenuController,
    AdminInventoryController,
    AdminRecipeController,
  ],
  providers: [AdminOrdersService, AdminMenuService],
})
export class AdminModule {}
