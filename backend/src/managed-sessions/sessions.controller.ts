import { Controller, Get, Param } from '@nestjs/common';
import { ManagedSessionsService } from './managed-sessions.service';

// Public: the customer app exchanges a link token for a verification grant.
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessions: ManagedSessionsService) {}

  @Get(':token')
  resolve(@Param('token') token: string) {
    return this.sessions.resolve(token);
  }
}
