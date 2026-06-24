import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ConfirmCodeDto } from './dto/confirm-code.dto';
import { RequestCodeDto } from './dto/request-code.dto';
import { VerificationOtpService } from './verification-otp.service';

@Controller('verify')
export class VerificationController {
  constructor(private readonly otp: VerificationOtpService) {}

  // POST /api/verify/request — send a WhatsApp code to the phone number.
  @Post('request')
  @HttpCode(200)
  request(@Body() dto: RequestCodeDto) {
    return this.otp.requestCode(dto.phone);
  }

  // POST /api/verify/confirm — exchange a valid code for a verification grant.
  @Post('confirm')
  @HttpCode(200)
  confirm(@Body() dto: ConfirmCodeDto) {
    return this.otp.confirmCode(dto.phone, dto.code);
  }
}
