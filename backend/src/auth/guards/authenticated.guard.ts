import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

// Allows the request only if a login session is present.
@Injectable()
export class AuthenticatedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    return typeof request.isAuthenticated === 'function'
      ? request.isAuthenticated()
      : false;
  }
}
