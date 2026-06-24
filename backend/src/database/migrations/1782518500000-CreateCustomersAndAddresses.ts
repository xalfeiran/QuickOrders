import { MigrationInterface, QueryRunner } from 'typeorm';

// Creates the customers and addresses tables (Phase 4). Column names match the
// Customer and Address entities.
export class CreateCustomersAndAddresses1782518500000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "customers" (
        "id"         uuid         NOT NULL DEFAULT gen_random_uuid(),
        "phone"      varchar(32)  NOT NULL,
        "name"       varchar(120),
        "created_at" timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_customers" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_customers_phone" ON "customers" ("phone")`,
    );

    await queryRunner.query(`
      CREATE TABLE "addresses" (
        "id"              uuid              NOT NULL DEFAULT gen_random_uuid(),
        "customer_id"     uuid              NOT NULL,
        "street"          varchar(160)      NOT NULL,
        "exterior_number" varchar(32)       NOT NULL,
        "interior_number" varchar(32),
        "neighborhood"    varchar(120)      NOT NULL,
        "city"            varchar(120)      NOT NULL,
        "postal_code"     varchar(12)       NOT NULL,
        "references"      text,
        "latitude"        double precision,
        "longitude"       double precision,
        "last_used_at"    timestamptz       NOT NULL,
        "created_at"      timestamptz       NOT NULL DEFAULT now(),
        CONSTRAINT "PK_addresses" PRIMARY KEY ("id"),
        CONSTRAINT "FK_addresses_customer" FOREIGN KEY ("customer_id")
          REFERENCES "customers" ("id") ON DELETE CASCADE
      )
    `);
    // Supports "most recently used address for this customer".
    await queryRunner.query(
      `CREATE INDEX "IDX_addresses_customer_last_used" ON "addresses" ("customer_id", "last_used_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "addresses"`);
    await queryRunner.query(`DROP TABLE "customers"`);
  }
}
