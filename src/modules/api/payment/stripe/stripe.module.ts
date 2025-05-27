import { Module } from '@nestjs/common';

import { UsersService } from '../../core/users/users.service';

import { StripeWebhooksService } from './stripe-webhooks.service';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';

@Module({
  providers: [StripeService, StripeWebhooksService, UsersService],
  controllers: [StripeController],
})
export class StripeModule {}
