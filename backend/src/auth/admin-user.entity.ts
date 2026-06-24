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

export type AdminRole = 'superadmin' | 'business_admin';

// A dashboard user. Superadmins manage every business; business_admins are
// pinned to one business (their `business` relation).
@Entity({ name: 'admin_users' })
export class AdminUser {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Stored lower-cased; unique across all businesses.
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 160 })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 100 })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 16 })
  role!: AdminRole;

  // Null for superadmins; set for business_admins.
  @ManyToOne(() => Business, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'business_id' })
  business!: Business | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
