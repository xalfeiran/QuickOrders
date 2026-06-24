import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessesModule } from '../businesses/businesses.module';
import { CustomersModule } from '../customers/customers.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ManagedSessionsModule } from '../managed-sessions/managed-sessions.module';
import { MenuModule } from '../menu/menu.module';
import { VerificationModule } from '../verification/verification.module';
import { DraftOrder } from './draft-order.entity';
import { DraftOrdersController } from './draft-orders.controller';
import { DraftOrdersService } from './draft-orders.service';
import { OrderLine } from './order-line.entity';
import { Order } from './order.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

// MenuModule       → price lines against the real menu
// CustomersModule  → remember the customer + address on confirm
// VerificationModule → grant guard on the confirm endpoint
@Module({
  imports: [
    MenuModule,
    CustomersModule,
    VerificationModule,
    BusinessesModule,
    InventoryModule,
    ManagedSessionsModule,
    TypeOrmModule.forFeature([DraftOrder, Order, OrderLine]),
  ],
  controllers: [OrdersController, DraftOrdersController],
  providers: [OrdersService, DraftOrdersService],
})
export class OrdersModule {}
