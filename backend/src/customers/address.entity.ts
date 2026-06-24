import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Customer } from './customer.entity';

// A delivery address belonging to a customer. A customer may have several over
// time; the one with the most recent last_used_at is offered on return visits.
@Entity({ name: 'addresses' })
@Index(['customer', 'lastUsedAt'])
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Customer, (customer) => customer.addresses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @Column({ type: 'varchar', length: 160 })
  street!: string;

  @Column({ name: 'exterior_number', type: 'varchar', length: 32 })
  exteriorNumber!: string;

  @Column({ name: 'interior_number', type: 'varchar', length: 32, nullable: true })
  interiorNumber!: string | null;

  @Column({ type: 'varchar', length: 120 })
  neighborhood!: string;

  @Column({ type: 'varchar', length: 120 })
  city!: string;

  @Column({ name: 'postal_code', type: 'varchar', length: 12 })
  postalCode!: string;

  // Free-text landmarks / delivery notes ("blue door next to the pharmacy").
  @Column({ type: 'text', nullable: true })
  references!: string | null;

  @Column({ type: 'double precision', nullable: true })
  latitude!: number | null;

  @Column({ type: 'double precision', nullable: true })
  longitude!: number | null;

  @Column({ name: 'last_used_at', type: 'timestamptz' })
  lastUsedAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
