import { Module } from '@nestjs/common';

import { UsersService } from '../../users/users.service';

import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';

@Module({
  providers: [StripeService, UsersService],
  controllers: [StripeController],
})
export class StripeModule {}
