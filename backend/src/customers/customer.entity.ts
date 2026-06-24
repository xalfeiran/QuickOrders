import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Address } from './address.entity';

// A returning customer, identified by their phone number. Created/updated the
// first time someone places an order with a given number.
@Entity({ name: 'customers' })
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Normalised phone (see common/phone.util.ts). One customer per number.
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 32 })
  phone!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  name!: string | null;

  @OneToMany(() => Address, (address) => address.customer)
  addresses!: Address[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
