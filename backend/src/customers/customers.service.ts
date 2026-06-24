import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { normalizePhone } from '../common/phone.util';
import { Address } from './address.entity';
import { Customer } from './customer.entity';

// Fields needed to record a delivery address. Mirrors the Address columns the
// customer fills in at checkout.
export interface AddressInput {
  street: string;
  exteriorNumber: string;
  interiorNumber?: string | null;
  neighborhood: string;
  city: string;
  postalCode: string;
  references?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customers: Repository<Customer>,
    @InjectRepository(Address)
    private readonly addresses: Repository<Address>,
  ) {}

  // Creates the customer if new (or updates their name), and records the
  // delivery address for next time. Called when an order is placed.
  async upsertWithAddress(input: {
    phone: string;
    name?: string | null;
    address?: AddressInput | null;
  }): Promise<Customer> {
    const phone = normalizePhone(input.phone);

    let customer = await this.customers.findOne({ where: { phone } });
    if (!customer) {
      customer = this.customers.create({ phone, name: input.name ?? null });
    } else if (input.name) {
      customer.name = input.name;
    }
    customer = await this.customers.save(customer);

    if (input.address) {
      const address = this.addresses.create({
        ...input.address,
        customer,
        lastUsedAt: new Date(),
      });
      await this.addresses.save(address);
    }

    return customer;
  }

  // Returns the customer and their most recently used address, or null if the
  // number isn't registered. Used by the (verification-gated) lookup endpoint.
  async findByPhone(
    rawPhone: string,
  ): Promise<{ customer: Customer; lastAddress: Address | null } | null> {
    const phone = normalizePhone(rawPhone);
    const customer = await this.customers.findOne({ where: { phone } });
    if (!customer) return null;

    const lastAddress = await this.addresses.findOne({
      where: { customer: { id: customer.id } },
      order: { lastUsedAt: 'DESC' },
    });

    return { customer, lastAddress: lastAddress ?? null };
  }
}
