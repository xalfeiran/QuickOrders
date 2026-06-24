import { MigrationInterface, QueryRunner } from 'typeorm';

// Inventory & recipes (Phase 14): ingredients with stock, and recipe components
// linking a menu item's base/options to ingredient quantities.
export class CreateInventory1782519000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "ingredients" (
        "id"          uuid          NOT NULL DEFAULT gen_random_uuid(),
        "business_id" uuid          NOT NULL,
        "name"        varchar(120)  NOT NULL,
        "unit"        varchar(8)    NOT NULL,
        "stock_qty"   numeric(12,3) NOT NULL DEFAULT 0,
        "active"      boolean       NOT NULL DEFAULT true,
        "created_at"  timestamptz   NOT NULL DEFAULT now(),
        "updated_at"  timestamptz   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ingredients" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ingredients_business" FOREIGN KEY ("business_id")
          REFERENCES "businesses" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "recipe_components" (
        "id"              uuid          NOT NULL DEFAULT gen_random_uuid(),
        "business_id"     uuid          NOT NULL,
        "menu_item_id"    uuid          NOT NULL,
        "scope"           varchar(8)    NOT NULL,
        "option_group_id" varchar(64),
        "option_id"       varchar(64),
        "ingredient_id"   uuid          NOT NULL,
        "quantity"        numeric(12,3) NOT NULL,
        "created_at"      timestamptz   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_recipe_components" PRIMARY KEY ("id"),
        CONSTRAINT "FK_recipe_business" FOREIGN KEY ("business_id")
          REFERENCES "businesses" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_recipe_menu_item" FOREIGN KEY ("menu_item_id")
          REFERENCES "menu_items" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_recipe_ingredient" FOREIGN KEY ("ingredient_id")
          REFERENCES "ingredients" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_recipe_menu_item" ON "recipe_components" ("menu_item_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "recipe_components"`);
    await queryRunner.query(`DROP TABLE "ingredients"`);
  }
}
