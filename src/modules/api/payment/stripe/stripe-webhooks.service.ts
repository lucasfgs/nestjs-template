import { Injectable, NotFoundException } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from 'src/modules/shared/prisma/prisma.service';

import { UsersService } from '../../users/users.service';

import { StripeService } from './stripe.service';

@Injectable()
export class StripeWebhooksService {
  constructor(
    private usersService: UsersService,
    private stripeService: StripeService,
    private prismaService: PrismaService,
  ) {}

  async handleCheckouSessionCompleted(
    event: Stripe.CheckoutSessionCompletedEvent,
  ) {
    if (event.data.object.mode !== 'subscription') return;

    // Get the user from the database
    const user = await this.usersService.findByEmail(
      event.data.object.customer_details.email,
    );

    // Would be good to create a new user account if the user doesn't exist
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get more subscription details from the Stripe API
    const subscription = await this.stripeService.getSubscription(
      String(event.data.object.subscription),
    );

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Store a new subscription in the database
    await this.prismaService.subscription.create({
      data: {
        name: 'Subscription',
        userId: user.id,
        startDate: new Date(subscription.current_period_start * 1000),
        endDate: new Date(subscription.current_period_end * 1000),
        status: subscription.status,
        stripeSubscriptionId: subscription.id,
      },
    });
  }

  handleInvoicePaid(event: Stripe.InvoicePaidEvent) {
    console.log('Invoice paid', event);
  }

  handleSubscriptionDeleted(event: Stripe.CustomerSubscriptionDeletedEvent) {
    console.log('Subscription deleted', event);
  }

  handleChargeRefunded(event: Stripe.ChargeRefundedEvent) {
    console.log('Charge refunded', event);
  }
}
