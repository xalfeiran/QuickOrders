import { MigrationInterface, QueryRunner } from 'typeorm';

// Multi-tenant foundation (Phase 9): businesses + database-backed menu, and a
// business_id on orders and draft_orders. Column names match the entities.
export class CreateBusinessesAndMenu1782518800000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "businesses" (
        "id"         uuid        NOT NULL DEFAULT gen_random_uuid(),
        "name"       varchar(120) NOT NULL,
        "slug"       varchar(80)  NOT NULL,
        "phone"      varchar(32),
        "timezone"   varchar(64)  NOT NULL DEFAULT 'America/Mexico_City',
        "active"     boolean      NOT NULL DEFAULT true,
        "created_at" timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_businesses" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_businesses_slug" ON "businesses" ("slug")`,
    );

    await queryRunner.query(`
      CREATE TABLE "menu_items" (
        "id"            uuid        NOT NULL DEFAULT gen_random_uuid(),
        "business_id"   uuid        NOT NULL,
        "item_key"      varchar(64) NOT NULL,
        "name"          varchar(160) NOT NULL,
        "description"   text         NOT NULL DEFAULT '',
        "price_cents"   int          NOT NULL,
        "category"      varchar(80)  NOT NULL,
        "available"     boolean      NOT NULL DEFAULT true,
        "sort_order"    int          NOT NULL DEFAULT 0,
        "option_groups" jsonb        NOT NULL DEFAULT '[]'::jsonb,
        "created_at"    timestamptz  NOT NULL DEFAULT now(),
        "updated_at"    timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_menu_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_menu_items_business" FOREIGN KEY ("business_id")
          REFERENCES "businesses" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_menu_items_business_key" ON "menu_items" ("business_id", "item_key")`,
    );

    // Scope existing order tables to a business.
    await queryRunner.query(
      `ALTER TABLE "orders" ADD COLUMN "business_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_orders_business" FOREIGN KEY ("business_id") REFERENCES "businesses" ("id") ON DELETE SET NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "draft_orders" ADD COLUMN "business_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "draft_orders" ADD CONSTRAINT "FK_draft_orders_business" FOREIGN KEY ("business_id") REFERENCES "businesses" ("id") ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "draft_orders" DROP CONSTRAINT "FK_draft_orders_business"`,
    );
    await queryRunner.query(
      `ALTER TABLE "draft_orders" DROP COLUMN "business_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_business"`,
    );
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "business_id"`);
    await queryRunner.query(`DROP TABLE "menu_items"`);
    await queryRunner.query(`DROP TABLE "businesses"`);
  }
}
