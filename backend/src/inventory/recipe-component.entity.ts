import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Business } from '../businesses/business.entity';
import { numericTransformer } from '../common/numeric.transformer';
import { MenuItemEntity } from '../menu/menu-item.entity';
import { Ingredient } from './ingredient.entity';

export type RecipeScope = 'base' | 'option';

// One line of a menu item's recipe: how much of an ingredient is consumed,
// either by the base item (scope 'base') or by a specific option (scope
// 'option', identified by its group + option id within the item).
@Entity({ name: 'recipe_components' })
@Index(['menuItem'])
export class RecipeComponent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @ManyToOne(() => MenuItemEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menu_item_id' })
  menuItem!: MenuItemEntity;

  @Column({ type: 'varchar', length: 8 })
  scope!: RecipeScope;

  @Column({ name: 'option_group_id', type: 'varchar', length: 64, nullable: true })
  optionGroupId!: string | null;

  @Column({ name: 'option_id', type: 'varchar', length: 64, nullable: true })
  optionId!: string | null;

  @ManyToOne(() => Ingredient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient!: Ingredient;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    transformer: numericTransformer,
  })
  quantity!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
