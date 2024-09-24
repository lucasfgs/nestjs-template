import { Subscription } from '../entities/subscription.entity';

export class CreateSubscriptionDto implements Partial<Subscription> {
  name: string;
  userId: string;
  status: string;
  startDate: Date;
  endDate: Date;
  customerId: string;
  priceId: string;
  stripeId: string;
}
