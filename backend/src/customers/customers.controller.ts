import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { VerificationGuard } from '../verification/verification.guard';
import { CustomersService } from './customers.service';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  // GET /api/customers/lookup?phone=... — tells the checkout flow whether the
  // number is registered and returns its last address to prefill.
  //
  // Guarded: the caller must present a valid verification grant for this phone
  // (see VerificationGuard), so addresses are never exposed to an unverified
  // request.
  @UseGuards(VerificationGuard)
  @Get('lookup')
  async lookup(@Query('phone') phone: string) {
    const found = await this.customers.findByPhone(phone);
    if (!found) {
      return { registered: false, name: null, lastAddress: null };
    }
    return {
      registered: true,
      name: found.customer.name,
      lastAddress: found.lastAddress,
    };
  }
}
