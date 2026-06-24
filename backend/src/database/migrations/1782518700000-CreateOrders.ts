import { MigrationInterface, QueryRunner } from 'typeorm';

// Creates the orders and order_lines tables (Phase 6). Replaces the previous
// in-memory order store. Column names match the Order and OrderLine entities.
export class CreateOrders1782518700000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id"               uuid        NOT NULL DEFAULT gen_random_uuid(),
        "order_token"      uuid        NOT NULL,
        "customer_id"      uuid,
        "customer_name"    varchar(120) NOT NULL,
        "customer_phone"   varchar(32)  NOT NULL,
        "fulfillment_type" varchar(16)  NOT NULL,
        "payment_method"   varchar(16)  NOT NULL,
        "status"           varchar(16)  NOT NULL DEFAULT 'received',
        "total_cents"      int          NOT NULL,
        "delivery_address" jsonb,
        "created_at"       timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_orders" PRIMARY KEY ("id"),
        CONSTRAINT "FK_orders_customer" FOREIGN KEY ("customer_id")
          REFERENCES "customers" ("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "order_lines" (
        "id"               uuid        NOT NULL DEFAULT gen_random_uuid(),
        "order_id"         uuid        NOT NULL,
        "menu_item_id"     varchar(64) NOT NULL,
        "name"             varchar(120) NOT NULL,
        "unit_price_cents" int          NOT NULL,
        "quantity"         int          NOT NULL,
        "line_total_cents" int          NOT NULL,
        "selected_options" jsonb        NOT NULL DEFAULT '[]'::jsonb,
        CONSTRAINT "PK_order_lines" PRIMARY KEY ("id"),
        CONSTRAINT "FK_order_lines_order" FOREIGN KEY ("order_id")
          REFERENCES "orders" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_order_lines_order" ON "order_lines" ("order_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "order_lines"`);
    await queryRunner.query(`DROP TABLE "orders"`);
  }
}
