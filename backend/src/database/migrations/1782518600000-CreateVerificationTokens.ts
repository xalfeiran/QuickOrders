import { MigrationInterface, QueryRunner } from 'typeorm';

// Creates the verification_tokens table backing the WhatsApp OTP flow (Phase 5).
export class CreateVerificationTokens1782518600000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "verification_tokens" (
        "id"           uuid        NOT NULL DEFAULT gen_random_uuid(),
        "phone"        varchar(32) NOT NULL,
        "code_hash"    varchar(64) NOT NULL,
        "attempts"     int         NOT NULL DEFAULT 0,
        "expires_at"   timestamptz NOT NULL,
        "last_sent_at" timestamptz NOT NULL,
        "created_at"   timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_verification_tokens" PRIMARY KEY ("id")
      )
    `);
    // One active code per phone number.
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_verification_tokens_phone" ON "verification_tokens" ("phone")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "verification_tokens"`);
  }
}
