import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Business } from '../businesses/business.entity';
import { numericTransformer } from '../common/numeric.transformer';

// A raw stock item a business consumes through recipes (e.g. "alitas" in grams,
// "aderezo bbq" in grams). Scoped to a business.
@Entity({ name: 'ingredients' })
export class Ingredient {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  // Unit of measure: gr | ml | pza.
  @Column({ type: 'varchar', length: 8 })
  unit!: string;

  @Column({
    name: 'stock_qty',
    type: 'numeric',
    precision: 12,
    scale: 3,
    default: 0,
    transformer: numericTransformer,
  })
  stockQty!: number;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
