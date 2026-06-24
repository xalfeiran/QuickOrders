import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { VerificationGrantService } from './verification-grant.service';

// Header carrying the verification grant (see VerificationGrantService).
export const GRANT_HEADER = 'x-verification-grant';

// Protects endpoints that expose customer data: the caller must present a
// valid grant bound to the phone number they're asking about. The phone is
// read from the query (?phone=) or the request body.
@Injectable()
export class VerificationGuard implements CanActivate {
  constructor(private readonly grants: VerificationGrantService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const phone = request.query?.phone ?? request.body?.phone;
    const grant = request.headers?.[GRANT_HEADER];

    if (!phone || !this.grants.verifyGrant(phone, grant)) {
      throw new ForbiddenException('Phone verification required');
    }
    return true;
  }
}
