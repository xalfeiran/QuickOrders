import { SetMetadata } from '@nestjs/common';
import { AdminRole } from './admin-user.entity';

export const ROLES_KEY = 'roles';

// Restricts a route to the given admin roles. Use with RolesGuard.
export const Roles = (...roles: AdminRole[]) => SetMetadata(ROLES_KEY, roles);
