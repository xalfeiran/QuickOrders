import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';

// A chosen option, captured with its name and price delta so the line can be
// displayed and audited without re-reading the menu.
export interface OrderLineOption {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDeltaCents: number;
}

// One priced line within an order.
@Entity({ name: 'order_lines' })
export class OrderLine {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ name: 'menu_item_id', type: 'varchar', length: 64 })
  menuItemId!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ name: 'unit_price_cents', type: 'int' })
  unitPriceCents!: number;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ name: 'line_total_cents', type: 'int' })
  lineTotalCents!: number;

  @Column({ name: 'selected_options', type: 'jsonb', default: () => "'[]'" })
  selectedOptions!: OrderLineOption[];
}
