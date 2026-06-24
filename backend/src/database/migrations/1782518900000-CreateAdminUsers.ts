import { MigrationInterface, QueryRunner } from 'typeorm';

// Dashboard users (Phase 11). The session table is created at runtime by
// connect-pg-simple, so it isn't part of this migration.
export class CreateAdminUsers1782518900000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "admin_users" (
        "id"            uuid        NOT NULL DEFAULT gen_random_uuid(),
        "email"         varchar(160) NOT NULL,
        "password_hash" varchar(100) NOT NULL,
        "name"          varchar(120) NOT NULL,
        "role"          varchar(16)  NOT NULL,
        "business_id"   uuid,
        "active"        boolean      NOT NULL DEFAULT true,
        "created_at"    timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_admin_users" PRIMARY KEY ("id"),
        CONSTRAINT "FK_admin_users_business" FOREIGN KEY ("business_id")
          REFERENCES "businesses" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_admin_users_email" ON "admin_users" ("email")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "admin_users"`);
  }
}
