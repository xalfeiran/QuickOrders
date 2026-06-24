import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessesModule } from '../businesses/businesses.module';
import { VerificationModule } from '../verification/verification.module';
import { ManagedSession } from './managed-session.entity';
import { ManagedSessionsService } from './managed-sessions.service';
import { SessionsController } from './sessions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ManagedSession]),
    BusinessesModule,
    VerificationModule,
  ],
  controllers: [SessionsController],
  providers: [ManagedSessionsService],
  exports: [ManagedSessionsService],
})
export class ManagedSessionsModule {}
