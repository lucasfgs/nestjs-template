import {
  Body,
  Controller,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { Public } from 'src/decorators/Public';

import { UsersService } from '../../users/users.service';

import { StripeService } from './stripe.service';
import { CreatePaymentMethodDto } from './dto/createPaymentMethod.dto';

@Public()
@Controller('payments/stripe')
export class StripeController {
  constructor(
    private stripeService: StripeService,
    private usersService: UsersService,
  ) {}

  @Post('customers/:id')
  async createCustomer(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, roleId, created_at, updated_at, ...filteredUser } = user;

    return this.stripeService.createCustomer(filteredUser);
  }

  @Post('paymentMethods')
  async createPaymentMethod(@Body() body: CreatePaymentMethodDto) {
    return this.stripeService.createPaymentMethod(body);
  }

  @Post('customers/:customer_id/paymentMethods/:payment_id')
  async attachCustomerToPaymentMethod(
    @Param('payment_id') paymentId: string,
    @Param('customer_id') customerId: string,
  ) {
    return this.stripeService.attachPaymentMethodToCustomer(paymentId, {
      customer: customerId,
    });
  }

  @Post('customers/:customer_id/checkoutSession')
  async createCustomerSession(@Param('customer_id') customerId: string) {
    // Check if customer exists
    let customer = await this.stripeService.getCustomer(customerId);

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
          price: 'price_1LG453EvRxB1mR03k0vKKuSu',
          quantity: 1,
        },
      ],
      mode: 'payment',
      allow_promotion_codes: true,
      success_url: process.env.STRIPE_SUCCESS_URL,
      cancel_url: process.env.STRIPE_CANCEL_URL,
    });
  }
}
