import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Business } from '../businesses/business.entity';
import { MenuOptionGroup } from './menu-item.model';

// A menu item stored in the database, scoped to a business. The public-facing
// id (used by the cart and orders) is `itemKey`, e.g. "alitas-10"; the uuid
// primary key stays internal.
@Entity({ name: 'menu_items' })
@Index(['business', 'itemKey'], { unique: true })
export class MenuItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  // Stable, human-readable id unique within the business.
  @Column({ name: 'item_key', type: 'varchar', length: 64 })
  itemKey!: string;

  @Column({ type: 'varchar', length: 160 })
  name!: string;

  @Column({ type: 'text', default: '' })
  description!: string;

  @Column({ name: 'price_cents', type: 'int' })
  priceCents!: number;

  @Column({ type: 'varchar', length: 80 })
  category!: string;

  @Column({ type: 'boolean', default: true })
  available!: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  // The full option-group structure (see menu-item.model.ts) as one column.
  @Column({ name: 'option_groups', type: 'jsonb', default: () => "'[]'" })
  optionGroups!: MenuOptionGroup[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
