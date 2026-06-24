import {
  BadRequestException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { EntityManager, Repository } from 'typeorm';
import { AdminUser } from '../auth/admin-user.entity';
import { Business } from '../businesses/business.entity';
import { BusinessesService } from '../businesses/businesses.service';
import { normalizePhone } from '../common/phone.util';
import { VerificationGrantService } from '../verification/verification-grant.service';
import { ManagedSession } from './managed-session.entity';

// How long a link stays valid after the manager creates it.
const LINK_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

@Injectable()
export class ManagedSessionsService {
  constructor(
    @InjectRepository(ManagedSession)
    private readonly sessions: Repository<ManagedSession>,
    private readonly businesses: BusinessesService,
    private readonly grants: VerificationGrantService,
  ) {}

  // Manager creates a link for a customer phone (tenant-scoped).
  async create(user: AdminUser, slug: string | undefined, rawPhone: string) {
    const business = await this.resolveBusiness(user, slug);
    const phone = normalizePhone(rawPhone);
    if (phone.replace(/\D/g, '').length < 7) {
      throw new BadRequestException('Teléfono inválido');
    }

    const session = await this.sessions.save(
      this.sessions.create({
        business,
        token: randomUUID(),
        phone,
        expiresAt: new Date(Date.now() + LINK_TTL_MS),
        consumedAt: null,
        createdBy: { id: user.id } as AdminUser,
      }),
    );

    return {
      token: session.token,
      phone: session.phone,
      businessSlug: business.slug,
      path: `/b/${business.slug}/s/${session.token}`,
      expiresAt: session.expiresAt,
    };
  }

  // Customer opens the link: validate and hand back a verification grant for
  // the phone (no SMS — the manager vouched). Does not consume the session.
  async resolve(token: string) {
    const session = await this.sessions.findOne({
      where: { token },
      relations: ['business'],
    });
    if (!session) throw new NotFoundException('Enlace no encontrado');
    if (session.consumedAt) throw new GoneException('El enlace ya fue usado');
    if (session.expiresAt.getTime() <= Date.now()) {
      throw new GoneException('El enlace expiró');
    }

    return {
      token: session.token,
      phone: session.phone,
      businessSlug: session.business.slug,
      grant: this.grants.issueGrant(session.phone),
      expiresAt: session.expiresAt,
    };
  }

  // Marks a session consumed at order placement (runs inside the order
  // transaction). Validates it belongs to the same business + phone.
  async consumeForOrder(
    manager: EntityManager,
    token: string,
    businessId: string,
    rawPhone: string,
  ): Promise<void> {
    const session = await manager.findOne(ManagedSession, {
      where: { token },
      relations: ['business'],
    });
    if (!session) throw new NotFoundException('Enlace no encontrado');
    if (session.consumedAt) throw new GoneException('El enlace ya fue usado');
    if (session.expiresAt.getTime() <= Date.now()) {
      throw new GoneException('El enlace expiró');
    }
    if (
      session.business.id !== businessId ||
      session.phone !== normalizePhone(rawPhone)
    ) {
      throw new BadRequestException('El enlace no corresponde a este pedido');
    }
    session.consumedAt = new Date();
    await manager.save(session);
  }

  private async resolveBusiness(
    user: AdminUser,
    slug?: string,
  ): Promise<Business> {
    if (user.role === 'business_admin') {
      if (!user.business) throw new ForbiddenException('Sin negocio asignado');
      return user.business;
    }
    if (!slug) throw new BadRequestException('Selecciona un negocio');
    return this.businesses.findBySlug(slug);
  }
}
