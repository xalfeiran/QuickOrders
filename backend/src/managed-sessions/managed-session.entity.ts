import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AdminUser } from '../auth/admin-user.entity';
import { Business } from '../businesses/business.entity';

// A manager-created, single-use, expiring link that pre-verifies a customer's
// phone for a business — so the customer can order without the SMS/WhatsApp
// code step. Consumed when the order is placed.
@Entity({ name: 'managed_sessions' })
export class ManagedSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  // Opaque handle embedded in the shareable link.
  @Index({ unique: true })
  @Column({ type: 'uuid' })
  token!: string;

  // Normalised phone the link is bound to.
  @Column({ type: 'varchar', length: 32 })
  phone!: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  // Set when an order is placed from this link; blocks reuse.
  @Column({ name: 'consumed_at', type: 'timestamptz', nullable: true })
  consumedAt!: Date | null;

  @ManyToOne(() => AdminUser, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  createdBy!: AdminUser | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
