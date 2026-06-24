import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { VerificationGuard } from '../verification/verification.guard';
import { ConfirmOrderDto } from './dto/confirm-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // POST /api/orders/confirm — place the order at the end of checkout.
  // Guarded: the caller must present a verification grant for dto.phone.
  @UseGuards(VerificationGuard)
  @Post('confirm')
  confirm(@Body() dto: ConfirmOrderDto) {
    return this.ordersService.confirm(dto);
  }

  // GET /api/orders/:id — retrieve an order for the confirmation screen.
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }
}
