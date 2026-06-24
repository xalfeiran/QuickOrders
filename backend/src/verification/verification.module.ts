import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationController } from './verification.controller';
import { VerificationGrantService } from './verification-grant.service';
import { VerificationGuard } from './verification.guard';
import { VerificationOtpService } from './verification-otp.service';
import { VerificationToken } from './verification-token.entity';
import { MockWhatsAppNotifier, WhatsAppNotifier } from './whatsapp-notifier';

// Owns phone verification: the OTP request/confirm flow and the grant primitive
// + guard other modules use to protect customer data.
@Module({
  imports: [TypeOrmModule.forFeature([VerificationToken])],
  controllers: [VerificationController],
  providers: [
    VerificationGrantService,
    VerificationGuard,
    VerificationOtpService,
    // Swap useClass for a real provider to send codes over WhatsApp.
    { provide: WhatsAppNotifier, useClass: MockWhatsAppNotifier },
  ],
  exports: [VerificationGrantService, VerificationGuard],
})
export class VerificationModule {}
