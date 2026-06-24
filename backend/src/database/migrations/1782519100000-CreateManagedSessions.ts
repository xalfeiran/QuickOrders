import { MigrationInterface, QueryRunner } from 'typeorm';

// Manager-generated pre-verified order links (Phase 15).
export class CreateManagedSessions1782519100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "managed_sessions" (
        "id"          uuid        NOT NULL DEFAULT gen_random_uuid(),
        "business_id" uuid        NOT NULL,
        "token"       uuid        NOT NULL,
        "phone"       varchar(32) NOT NULL,
        "expires_at"  timestamptz NOT NULL,
        "consumed_at" timestamptz,
        "created_by"  uuid,
        "created_at"  timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_managed_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_managed_sessions_business" FOREIGN KEY ("business_id")
          REFERENCES "businesses" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_managed_sessions_creator" FOREIGN KEY ("created_by")
          REFERENCES "admin_users" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_managed_sessions_token" ON "managed_sessions" ("token")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "managed_sessions"`);
  }
}
