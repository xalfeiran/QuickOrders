import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './database/data-source';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { BusinessesModule } from './businesses/businesses.module';
import { CustomersModule } from './customers/customers.module';
import { HealthModule } from './health/health.module';
import { InventoryModule } from './inventory/inventory.module';
import { MenuModule } from './menu/menu.module';
import { OrdersModule } from './orders/orders.module';
import { SeedModule } from './seed/seed.module';
import { VerificationModule } from './verification/verification.module';

// Root module: wires the feature modules together.
@Module({
  imports: [
    // Database connection, shared with the migration CLI (see data-source.ts).
    TypeOrmModule.forRoot(dataSourceOptions),
    HealthModule,
    BusinessesModule,
    MenuModule,
    OrdersModule,
    CustomersModule,
    VerificationModule,
    AuthModule,
    InventoryModule,
    AdminModule,
    SeedModule,
  ],
})
export class AppModule {}
