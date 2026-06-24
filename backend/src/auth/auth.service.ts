import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { AdminUser } from './admin-user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AdminUser)
    private readonly users: Repository<AdminUser>,
  ) {}

  // Returns the user if the email + password match an active account.
  async validateUser(
    email: string,
    password: string,
  ): Promise<AdminUser | null> {
    const user = await this.users.findOne({
      where: { email: email.trim().toLowerCase(), active: true },
      relations: ['business'],
    });
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.passwordHash);
    return ok ? user : null;
  }

  // Used by the session deserializer to reload the user on each request.
  findById(id: string): Promise<AdminUser | null> {
    return this.users.findOne({ where: { id }, relations: ['business'] });
  }

  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}
