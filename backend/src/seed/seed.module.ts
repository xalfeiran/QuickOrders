import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUser } from '../auth/admin-user.entity';
import { Business } from '../businesses/business.entity';
import { MenuItemEntity } from '../menu/menu-item.entity';
import { SeedService } from './seed.service';

// Runs the first-boot seed (default business + its menu + initial superadmin).
@Module({
  imports: [TypeOrmModule.forFeature([Business, MenuItemEntity, AdminUser])],
  providers: [SeedService],
})
export class SeedModule {}
