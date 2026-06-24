import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Business } from '../businesses/business.entity';
import { Customer } from '../customers/customer.entity';
import { OrderLine } from './order-line.entity';

export type FulfillmentType = 'pickup' | 'delivery';
export type PaymentMethod = 'cash' | 'card';
export type OrderStatus = 'received' | 'preparing' | 'ready' | 'completed';

// Snapshot of the delivery address as entered at checkout. Stored on the order
// so it never changes if the customer later edits their saved address.
export interface DeliveryAddressSnapshot {
  street: string;
  exteriorNumber: string;
  interiorNumber?: string | null;
  neighborhood: string;
  city: string;
  postalCode: string;
  references?: string | null;
}

// A confirmed order.
@Entity({ name: 'orders' })
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // The draft/session token this order was placed from (traceability).
  @Column({ name: 'order_token', type: 'uuid' })
  orderToken!: string;

  // The business this order belongs to.
  @ManyToOne(() => Business, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'business_id' })
  business!: Business | null;

  @ManyToOne(() => Customer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer | null;

  // Name/phone captured at order time (snapshot, independent of the customer
  // record which may change later).
  @Column({ name: 'customer_name', type: 'varchar', length: 120 })
  customerName!: string;

  @Column({ name: 'customer_phone', type: 'varchar', length: 32 })
  customerPhone!: string;

  @Column({ name: 'fulfillment_type', type: 'varchar', length: 16 })
  fulfillmentType!: FulfillmentType;

  @Column({ name: 'payment_method', type: 'varchar', length: 16 })
  paymentMethod!: PaymentMethod;

  @Column({ type: 'varchar', length: 16, default: 'received' })
  status!: OrderStatus;

  @Column({ name: 'total_cents', type: 'int' })
  totalCents!: number;

  // Present only for delivery orders.
  @Column({ name: 'delivery_address', type: 'jsonb', nullable: true })
  deliveryAddress!: DeliveryAddressSnapshot | null;

  @OneToMany(() => OrderLine, (line) => line.order, { cascade: true })
  items!: OrderLine[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
