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

// One chosen option inside a draft line (e.g. group "size" → option "large").
export interface DraftSelectedOption {
  groupId: string;
  optionId: string;
}

// A line the customer has added to their draft order. Prices are NOT stored
// here — they're computed from the live menu at confirmation time so the
// client can never dictate a price.
export interface DraftOrderLine {
  menuItemId: string;
  quantity: number;
  selectedOptions: DraftSelectedOption[];
}

export type DraftOrderStatus = 'draft' | 'confirmed' | 'expired';

// A server-side order session created the moment a customer starts ordering.
// The opaque `token` is handed to the browser and used throughout checkout.
@Entity({ name: 'draft_orders' })
export class DraftOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Opaque handle given to the client. Separate from the primary key so the
  // internal id is never exposed.
  @Index({ unique: true })
  @Column({ type: 'uuid' })
  token!: string;

  // The business this session belongs to.
  @ManyToOne(() => Business, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'business_id' })
  business!: Business | null;

  @Column({ type: 'varchar', length: 16, default: 'draft' })
  status!: DraftOrderStatus;

  // Cart contents. Empty until the cart is synced (at checkout). Stored as
  // JSONB so the nested option selections travel as one column.
  @Column({ type: 'jsonb', default: () => "'[]'" })
  items!: DraftOrderLine[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  // After this moment the draft is considered abandoned and may be purged.
  @Index()
  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;
}
