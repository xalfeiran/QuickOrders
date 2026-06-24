import { Injectable, Logger } from '@nestjs/common';

// Seam for delivering verification codes over WhatsApp. Swap the binding in
// VerificationModule for a real provider (WhatsApp Cloud API / Twilio) without
// touching the OTP service — it only depends on this abstract class.
export abstract class WhatsAppNotifier {
  abstract sendVerificationCode(phone: string, code: string): Promise<void>;
}

// Development implementation: doesn't send anything, just logs the code so you
// can complete the flow locally. Never use in production.
@Injectable()
export class MockWhatsAppNotifier extends WhatsAppNotifier {
  private readonly logger = new Logger('WhatsApp(mock)');

  async sendVerificationCode(phone: string, code: string): Promise<void> {
    this.logger.log(`Verification code for ${phone}: ${code}`);
  }
}
