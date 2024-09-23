import { Module } from '@nestjs/common';

import { PaymentService } from './payment.service';
import { StripeModule } from './stripe/stripe.module';

@Module({
  providers: [PaymentService],
  controllers: [],
  imports: [StripeModule],
})
export class PaymentModule {}
