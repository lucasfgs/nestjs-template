import { Module } from '@nestjs/common';

import { RolesModule } from '../roles/roles.module';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [RolesModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
