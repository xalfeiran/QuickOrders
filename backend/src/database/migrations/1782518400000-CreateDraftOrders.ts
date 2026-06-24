import { MigrationInterface, QueryRunner } from 'typeorm';

// Creates the draft_orders table backing the order-session token.
// Written by hand (rather than generated) so the schema is explicit and
// reviewable; column names match the DraftOrder entity.
export class CreateDraftOrders1782518400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "draft_orders" (
        "id"         uuid        NOT NULL DEFAULT gen_random_uuid(),
        "token"      uuid        NOT NULL,
        "status"     varchar(16) NOT NULL DEFAULT 'draft',
        "items"      jsonb       NOT NULL DEFAULT '[]'::jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "expires_at" timestamptz NOT NULL,
        CONSTRAINT "PK_draft_orders" PRIMARY KEY ("id")
      )
    `);

    // Token is the public handle — must be unique and is looked up on it.
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_draft_orders_token" ON "draft_orders" ("token")`,
    );
    // Supports the periodic purge of abandoned (expired) drafts.
    await queryRunner.query(
      `CREATE INDEX "IDX_draft_orders_expires_at" ON "draft_orders" ("expires_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "draft_orders"`);
  }
}
