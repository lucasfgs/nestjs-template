import { Module } from '@nestjs/common';

import { StripeModule } from './stripe/stripe.module';

@Module({
  providers: [],
  controllers: [],
  imports: [StripeModule],
})
export class PaymentModule {}
