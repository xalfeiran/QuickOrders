import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUser } from '../auth/admin-user.entity';
import { BusinessesService } from '../businesses/businesses.service';
import { Order, OrderStatus } from '../orders/order.entity';
import { assertBusinessAccess, resolveBusinessId } from './tenant.util';

@Injectable()
export class AdminOrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    private readonly businesses: BusinessesService,
  ) {}

  async list(user: AdminUser, slug: string | undefined, status?: string) {
    const businessId = await resolveBusinessId(user, slug, this.businesses);
    if (!businessId) return [];

    const where: Record<string, unknown> = { business: { id: businessId } };
    if (status) where.status = status;

    const rows = await this.orders.find({
      where,
      relations: ['items'],
      order: { createdAt: 'DESC' },
      take: 100,
    });

    return rows.map((o) => ({
      id: o.id,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      fulfillmentType: o.fulfillmentType,
      paymentMethod: o.paymentMethod,
      status: o.status,
      totalCents: o.totalCents,
      itemCount: o.items.reduce((n, l) => n + l.quantity, 0),
      createdAt: o.createdAt,
    }));
  }

  async findOne(user: AdminUser, id: string): Promise<Order> {
    const order = await this.orders.findOne({
      where: { id },
      relations: ['items', 'business'],
    });
    if (!order) throw new NotFoundException('Order not found');
    assertBusinessAccess(user, order.business ? order.business.id : null);
    return order;
  }

  async updateStatus(
    user: AdminUser,
    id: string,
    status: OrderStatus,
  ): Promise<Order> {
    const order = await this.findOne(user, id);
    order.status = status;
    return this.orders.save(order);
  }
}
