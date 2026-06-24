import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AdminUser } from './admin-user.entity';
import { AuthenticatedGuard } from './guards/authenticated.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { LoginDto } from './dto/login.dto';

// The public shape of the logged-in user (never expose the password hash).
function toDto(user: AdminUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    businessId: user.business ? user.business.id : null,
    businessSlug: user.business ? user.business.slug : null,
  };
}

@Controller('auth')
export class AuthController {
  // POST /api/auth/login — validates credentials and starts a session.
  // The body is documented by LoginDto; LocalAuthGuard does the actual check.
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(200)
  login(@Req() req: Request, @Body() _dto: LoginDto) {
    return toDto(req.user as AdminUser);
  }

  // POST /api/auth/logout — clears the session.
  @Post('logout')
  @HttpCode(200)
  logout(@Req() req: Request): Promise<{ ok: true }> {
    return new Promise((resolve, reject) => {
      req.logout((err) => {
        if (err) return reject(err);
        req.session.destroy(() => resolve({ ok: true }));
      });
    });
  }

  // GET /api/auth/me — the current user, or 403 if not logged in.
  @UseGuards(AuthenticatedGuard)
  @Get('me')
  me(@Req() req: Request) {
    return toDto(req.user as AdminUser);
  }
}
