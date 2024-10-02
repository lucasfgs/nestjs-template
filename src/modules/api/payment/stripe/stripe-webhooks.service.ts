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

  // Called when the checkout session is completed
  async handleCheckouSessionCompleted(
    event: Stripe.CheckoutSessionCompletedEvent,
  ) {
    if (event.data.object.mode !== 'subscription') return;

    // Get the user from the database
    const user = await this.usersService.findOne(
      String(event.data.object.customer),
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
    await this.prismaService.subscriptions.create({
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

  // Called when the recurring payment is successful
  async handleInvoicePaid(event: Stripe.InvoicePaidEvent) {
    const subscriptionId = event.data.object.subscription;

    // Get the subscription from the database
    const storedSubscription = this.prismaService.subscriptions.findFirst({
      where: {
        stripeSubscriptionId: String(subscriptionId),
      },
    });

    if (!storedSubscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Get more subscription details from the Stripe API
    const subscription = await this.stripeService.getSubscription(
      String(subscriptionId),
    );

    // Update the subscription status
    await this.prismaService.subscriptions.update({
      where: {
        id: subscription.id,
      },
      data: {
        status: subscription.status,
        startDate: new Date(subscription.current_period_start * 1000),
        endDate: new Date(subscription.current_period_end * 1000),
      },
    });
  }

  // Called when the subscription is deleted or canceled
  async handleSubscriptionDeleted(
    event: Stripe.CustomerSubscriptionDeletedEvent,
  ) {
    const subscriptionId = event.data.object.id;

    // Get the subscription from the database
    const subscription = await this.prismaService.subscriptions.findFirst({
      where: {
        stripeSubscriptionId: String(subscriptionId),
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Update the subscription status
    await this.prismaService.subscriptions.update({
      where: {
        id: subscription.id,
      },
      data: {
        status: 'canceled',
      },
    });
  }

  // Called when the payment is refunded
  async handleChargeRefunded(event: Stripe.ChargeRefundedEvent) {
    if (event.data.object.amount !== event.data.object.amount_refunded) {
      throw new Error('Partial refunds are not supported');
    }

    // Get more details about the invoice
    const invoice = await this.stripeService.getInvoice(
      String(event.data.object.invoice),
    );

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Update the invoice status
    await this.prismaService.subscriptions.update({
      where: {
        id: invoice.id,
      },
      data: {
        status: 'refunded',
      },
    });
  }
}
