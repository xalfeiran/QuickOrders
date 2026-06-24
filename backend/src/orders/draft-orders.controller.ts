import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateDraftDto } from './dto/create-draft.dto';
import { DraftOrdersService } from './draft-orders.service';

// Order-session endpoints. Mounted under /api/orders alongside OrdersController.
@Controller('orders')
export class DraftOrdersController {
  constructor(private readonly draftOrders: DraftOrdersService) {}

  // POST /api/orders/draft — start an order session for a business, returns the
  // token the client carries through checkout.
  @Post('draft')
  async create(@Body() dto: CreateDraftDto) {
    const draft = await this.draftOrders.create(dto.businessSlug);
    return { orderToken: draft.token, expiresAt: draft.expiresAt };
  }

  // GET /api/orders/draft/:token — confirm a session is still alive (used to
  // resume an existing cart). 404 if unknown, 410 if expired.
  @Get('draft/:token')
  async get(@Param('token') token: string) {
    const draft = await this.draftOrders.findActiveByToken(token);
    return {
      orderToken: draft.token,
      status: draft.status,
      expiresAt: draft.expiresAt,
    };
  }
}
