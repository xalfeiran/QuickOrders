import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { AdminUser } from './admin-user.entity';
import { AuthService } from './auth.service';

// Stores only the user id in the session cookie/store and reloads the full
// user on each request.
@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly auth: AuthService) {
    super();
  }

  serializeUser(user: AdminUser, done: (err: unknown, id?: string) => void) {
    done(null, user.id);
  }

  async deserializeUser(
    id: string,
    done: (err: unknown, user?: AdminUser | null) => void,
  ) {
    try {
      const user = await this.auth.findById(id);
      done(null, user ?? null);
    } catch (err) {
      done(err);
    }
  }
}
