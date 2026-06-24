import { NotFoundException } from '@nestjs/common';
import { AdminUser } from '../auth/admin-user.entity';
import { BusinessesService } from '../businesses/businesses.service';

// Resolves which business an admin may act on for list/create operations:
//   business_admin → their own (any requested slug is ignored)
//   superadmin     → the requested business, or null when none is selected
export async function resolveBusinessId(
  user: AdminUser,
  slug: string | undefined,
  businesses: BusinessesService,
): Promise<string | null> {
  if (user.role === 'business_admin') {
    return user.business ? user.business.id : null;
  }
  if (!slug) return null;
  const business = await businesses.findBySlug(slug);
  return business.id;
}

// Guards a resource loaded by id: a business_admin may only touch their own
// business's data. We throw 404 (not 403) so cross-tenant existence isn't
// leaked. Superadmins pass through.
export function assertBusinessAccess(
  user: AdminUser,
  businessId: string | null | undefined,
): void {
  if (user.role === 'superadmin') return;
  const own = user.business ? user.business.id : null;
  if (!own || !businessId || businessId !== own) {
    throw new NotFoundException('Recurso no encontrado');
  }
}
