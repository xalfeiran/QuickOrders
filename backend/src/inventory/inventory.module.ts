import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessesModule } from '../businesses/businesses.module';
import { MenuItemEntity } from '../menu/menu-item.entity';
import { Ingredient } from './ingredient.entity';
import { InventoryService } from './inventory.service';
import { RecipeComponent } from './recipe-component.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ingredient, RecipeComponent, MenuItemEntity]),
    BusinessesModule,
  ],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
