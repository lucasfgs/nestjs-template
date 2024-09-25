import StripeSDK from 'stripe';

export class StripeService {
  private readonly secretKey = process.env.STRIPE_SECRET_KEY;
  private readonly webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  private api: StripeSDK;

  constructor() {
    this.api = new StripeSDK(this.secretKey, {
      apiVersion: '2024-06-20',
    });
  }

  async getCustomer(customerId: string) {
    try {
      return await this.api.customers.retrieve(customerId);
    } catch (error) {
      return null;
    }
  }

  async getSubscription(subscriptionId: string) {
    try {
      return await this.api.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      return null;
    }
  }

  async getInvoice(invoiceId: string) {
    try {
      return await this.api.invoices.retrieve(invoiceId);
    } catch (error) {
      return null;
    }
  }

  async createCustomer(customer: StripeSDK.CustomerCreateParams) {
    return this.api.customers.create(customer);
  }

  async createCheckoutSession(options: StripeSDK.Checkout.SessionCreateParams) {
    return this.api.checkout.sessions.create(options);
  }

  async validateWebhook(payload: string | Buffer, signature: string) {
    try {
      return this.api.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret,
      );
    } catch (error) {
      return false;
    }
  }
}
