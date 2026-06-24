import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { normalizePhone } from '../common/phone.util';
import { CustomersService } from '../customers/customers.service';
import { InventoryService } from '../inventory/inventory.service';
import { ManagedSessionsService } from '../managed-sessions/managed-sessions.service';
import { MenuService } from '../menu/menu.service';
import { DraftOrdersService } from './draft-orders.service';
import { ConfirmOrderDto } from './dto/confirm-order.dto';
import { OrderLine } from './order-line.entity';
import { Order } from './order.entity';
import { priceLine, PricedLine } from './order-pricing';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectRepository(OrderLine)
    private readonly orderLines: Repository<OrderLine>,
    private readonly menu: MenuService,
    private readonly customers: CustomersService,
    private readonly draftOrders: DraftOrdersService,
    private readonly inventory: InventoryService,
    private readonly managedSessions: ManagedSessionsService,
    private readonly dataSource: DataSource,
  ) {}

  // Finalises an order from a verified checkout. The verification grant is
  // enforced by the controller's guard before this runs.
  async confirm(dto: ConfirmOrderDto): Promise<Order> {
    // Tie the order to a live session; throws 404/410 if the token is gone.
    // The draft carries the business the order belongs to.
    const draft = await this.draftOrders.findActiveByToken(dto.orderToken);
    const business = draft.business;

    if (dto.fulfillmentType === 'delivery' && !dto.address) {
      throw new BadRequestException('A delivery address is required');
    }

    // Price every line on the server against this business's real menu.
    const lines: PricedLine[] = [];
    for (const item of dto.items) {
      const menuItem = await this.menu.findOne(
        business!.id,
        item.menuItemId,
      ); // 404 if unknown for this business
      lines.push(priceLine(menuItem, item.selectedOptions ?? [], item.quantity));
    }
    const totalCents = lines.reduce((sum, l) => sum + l.lineTotalCents, 0);

    const deliveryAddress =
      dto.fulfillmentType === 'delivery' && dto.address
        ? {
            street: dto.address.street,
            exteriorNumber: dto.address.exteriorNumber,
            interiorNumber: dto.address.interiorNumber ?? null,
            neighborhood: dto.address.neighborhood,
            city: dto.address.city,
            postalCode: dto.address.postalCode,
            references: dto.address.references ?? null,
          }
        : null;

    // Remember the customer (and their address for next time).
    const customer = await this.customers.upsertWithAddress({
      phone: dto.phone,
      name: dto.customerName,
      address: deliveryAddress,
    });

    // Stock check + decrement and the order insert happen in one transaction,
    // so an order is never recorded without the inventory to back it (and vice
    // versa). Items without recipes consume nothing.
    const saved = await this.dataSource.transaction(async (manager) => {
      // If this order came from a manager link, consume it (single-use).
      if (dto.managedSessionToken) {
        await this.managedSessions.consumeForOrder(
          manager,
          dto.managedSessionToken,
          business!.id,
          dto.phone,
        );
      }

      await this.inventory.consumeForOrder(
        manager,
        business!.id,
        lines.map((l) => ({
          menuItemId: l.menuItemId,
          quantity: l.quantity,
          selectedOptions: l.selectedOptions.map((o) => ({
            groupId: o.groupId,
            optionId: o.optionId,
          })),
        })),
      );

      const order = manager.create(Order, {
        orderToken: dto.orderToken,
        business,
        customer,
        customerName: dto.customerName,
        customerPhone: normalizePhone(dto.phone),
        fulfillmentType: dto.fulfillmentType,
        paymentMethod: dto.paymentMethod,
        status: 'received',
        totalCents,
        deliveryAddress,
        items: lines.map((l) => manager.create(OrderLine, l)),
      });
      return manager.save(order);
    });

    // Consume the session token so the same draft can't be ordered twice.
    await this.draftOrders.consume(dto.orderToken);

    return saved;
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orders.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!order) {
      throw new NotFoundException(`Order "${id}" not found`);
    }
    return order;
  }
}
