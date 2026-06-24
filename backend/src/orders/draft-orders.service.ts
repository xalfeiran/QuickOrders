import { GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { LessThan, Repository } from 'typeorm';
import { BusinessesService } from '../businesses/businesses.service';
import { DraftOrder } from './draft-order.entity';

// How long a draft order stays valid before it's considered abandoned.
const DRAFT_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

@Injectable()
export class DraftOrdersService {
  constructor(
    @InjectRepository(DraftOrder)
    private readonly drafts: Repository<DraftOrder>,
    private readonly businesses: BusinessesService,
  ) {}

  // Starts an order session: mints a token and persists an empty draft. When no
  // business slug is given (legacy single-tenant app) it defaults to the seeded
  // business.
  async create(businessSlug?: string): Promise<DraftOrder> {
    // Clean up abandoned drafts opportunistically — cheap, and avoids needing
    // a separate scheduler at this scale. Swap for a cron job if volume grows.
    await this.purgeExpired();

    const business = businessSlug
      ? await this.businesses.findBySlug(businessSlug)
      : await this.businesses.getDefault();

    const draft = this.drafts.create({
      token: randomUUID(),
      status: 'draft',
      items: [],
      business,
      expiresAt: new Date(Date.now() + DRAFT_TTL_MS),
    });
    return this.drafts.save(draft);
  }

  // Looks up a draft by its public token (with its business). Throws 404 if
  // unknown, 410 if expired (so the client knows to start a fresh session).
  async findActiveByToken(token: string): Promise<DraftOrder> {
    const draft = await this.drafts.findOne({
      where: { token },
      relations: ['business'],
    });
    if (!draft) {
      throw new NotFoundException('Order session not found');
    }
    if (draft.expiresAt.getTime() <= Date.now()) {
      throw new GoneException('Order session has expired');
    }
    return draft;
  }

  // Removes a draft once its order has been placed, so it can't be reused.
  async consume(token: string): Promise<void> {
    await this.drafts.delete({ token });
  }

  // Deletes drafts whose expiry has passed.
  private async purgeExpired(): Promise<void> {
    await this.drafts.delete({ expiresAt: LessThan(new Date()) });
  }
}
