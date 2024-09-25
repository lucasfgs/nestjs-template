import {
  Controller,
  Headers,
  NotFoundException,
  Param,
  Post,
  RawBodyRequest,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Public } from 'src/decorators/Public';

import { UsersService } from '../../users/users.service';

import { StripeService } from './stripe.service';
import { StripeWebhooksService } from './stripe-webhooks.service';

@Public()
@Controller('payments/stripe')
export class StripeController {
  constructor(
    private stripeService: StripeService,
    private usersService: UsersService,
    private stripeWebhooksService: StripeWebhooksService,
  ) {}

  @Post('customers/:customer_id/checkoutSession')
  async createCustomerSession(@Param('customer_id') customerId: string) {
    // Check if customer exists
    let customer = await this.stripeService.getCustomer(customerId).catch();

    if (!customer) {
      const user = await this.usersService.findOne(customerId);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, roleId, created_at, updated_at, ...filteredUser } =
        user;

      customer = await this.stripeService.createCustomer(filteredUser);
    }

    // Create a Checkout Session
    // TODO: Implement the logic to create a product, add it to the line items, and set the success and cancel URLs from environment variables.
    return this.stripeService.createCheckoutSession({
      customer: customer.id,
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      line_items: [
        {
          price: 'price_1IYVyCEC5LqKqHayXqJAtnVL',
          quantity: 1,
        },
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
      success_url: process.env.STRIPE_SUCCESS_URL,
      cancel_url: process.env.STRIPE_CANCEL_URL,
    });
  }

  @Post('webhooks')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const event = await this.stripeService.validateWebhook(
      req.rawBody,
      signature,
    );

    if (!event) {
      throw new UnauthorizedException('Invalid webhook');
    }

    // Handle the webhook event
    switch (event.type) {
      case 'checkout.session.completed':
        await this.stripeWebhooksService.handleCheckouSessionCompleted(event);
        break;
      case 'invoice.paid':
        await this.stripeWebhooksService.handleInvoicePaid(event);
        break;
      case 'charge.refunded':
        await this.stripeWebhooksService.handleChargeRefunded(event);
        break;
      case 'customer.subscription.deleted':
        await this.stripeWebhooksService.handleSubscriptionDeleted(event);
        break;
    }
  }
}
