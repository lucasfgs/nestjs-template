import { Module } from '@nestjs/common';

import { UsersService } from '../../users/users.service';

import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { StripeWebhooksService } from './stripe-webhooks.service';

@Module({
  providers: [StripeService, StripeWebhooksService, UsersService],
  controllers: [StripeController],
})
export class StripeModule {}
