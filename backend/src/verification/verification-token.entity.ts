import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

// The one active OTP for a phone number. Replaced each time a new code is
// requested. The code itself is never stored — only a keyed hash of it.
@Entity({ name: 'verification_tokens' })
export class VerificationToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Normalised phone. One active code per number.
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 32 })
  phone!: string;

  // HMAC-SHA256 of the code, bound to the phone (see VerificationOtpService).
  @Column({ name: 'code_hash', type: 'varchar', length: 64 })
  codeHash!: string;

  // Failed confirm attempts against the current code; locks at the maximum.
  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  // When the current code was last sent — enforces a resend cooldown.
  @Column({ name: 'last_sent_at', type: 'timestamptz' })
  lastSentAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
