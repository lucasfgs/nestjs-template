import StripeSDK from 'stripe';

export class StripeService {
  private readonly secretKey = process.env.STRIPE_SECRET_KEY;
  private readonly publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  private api: StripeSDK;

  constructor() {
    this.api = new StripeSDK(this.secretKey, {
      apiVersion: '2024-06-20',
    });
  }

  async getPaymentMethods() {
    return this.api.paymentMethods.list({ type: 'card' });
  }

  async getCustomer(customerId: string) {
    return this.api.customers.retrieve(customerId);
  }

  async createCustomer(customer: StripeSDK.CustomerCreateParams) {
    return this.api.customers.create(customer);
  }

  async createPaymentMethod(options: StripeSDK.PaymentMethodCreateParams) {
    return this.api.paymentMethods.create(options);
  }

  async attachPaymentMethodToCustomer(
    paymentMethodId: string,
    options: StripeSDK.PaymentMethodAttachParams,
  ) {
    return this.api.paymentMethods.attach(paymentMethodId, options);
  }

  async createCheckoutSession(options: StripeSDK.Checkout.SessionCreateParams) {
    return this.api.checkout.sessions.create(options);
  }
}
