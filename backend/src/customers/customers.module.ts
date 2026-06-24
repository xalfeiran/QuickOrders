import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationModule } from '../verification/verification.module';
import { Address } from './address.entity';
import { Customer } from './customer.entity';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

// Imports VerificationModule so the lookup endpoint can be grant-guarded.
// Exports CustomersService so order placement (Phase 6) can upsert customers.
@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, Address]),
    VerificationModule,
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
