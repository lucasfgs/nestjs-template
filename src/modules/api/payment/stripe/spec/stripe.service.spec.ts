import { Test, TestingModule } from '@nestjs/testing';
import StripeSDK from 'stripe';

import { StripeService } from '../stripe.service';

describe('StripeService', () => {
  let service: StripeService;
  let stripeMock: any;
  const secretKey = 'sk_test_123';
  const webhookSecret = 'whsec_test_123';
  let StripeSDKOriginal: any;

  beforeEach(async () => {
    process.env.STRIPE_SECRET_KEY = secretKey;
    process.env.STRIPE_WEBHOOK_SECRET = webhookSecret;

    stripeMock = {
      customers: {
        retrieve: jest.fn(),
        create: jest.fn(),
      },
      subscriptions: {
        retrieve: jest.fn(),
      },
      invoices: {
        retrieve: jest.fn(),
      },
      checkout: {
        sessions: {
          create: jest.fn(),
        },
      },
      webhooks: {
        constructEvent: jest.fn(),
      },
    };

    // Save the original StripeSDK
    StripeSDKOriginal = (global as any).StripeSDK || StripeSDK;
    // Mock the StripeSDK constructor to always return our mock
    (StripeSDK as any) = jest.fn(() => stripeMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [StripeService],
    }).compile();

    service = module.get<StripeService>(StripeService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    // Restore the original StripeSDK
    (StripeSDK as any) = StripeSDKOriginal;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCustomer', () => {
    it('should return customer if found', async () => {
      const customer = { id: 'cus_123' };
      stripeMock.customers.retrieve.mockResolvedValue(customer);
      const result = await service.getCustomer('cus_123');
      expect(result).toBe(customer);
      expect(stripeMock.customers.retrieve).toHaveBeenCalledWith('cus_123');
    });
    it('should return null if error thrown', async () => {
      stripeMock.customers.retrieve.mockRejectedValue(new Error('not found'));
      const result = await service.getCustomer('cus_404');
      expect(result).toBeNull();
    });
  });

  describe('getSubscription', () => {
    it('should return subscription if found', async () => {
      const subscription = { id: 'sub_123' };
      stripeMock.subscriptions.retrieve.mockResolvedValue(subscription);
      const result = await service.getSubscription('sub_123');
      expect(result).toBe(subscription);
      expect(stripeMock.subscriptions.retrieve).toHaveBeenCalledWith('sub_123');
    });
    it('should return null if error thrown', async () => {
      stripeMock.subscriptions.retrieve.mockRejectedValue(
        new Error('not found'),
      );
      const result = await service.getSubscription('sub_404');
      expect(result).toBeNull();
    });
  });

  describe('getInvoice', () => {
    it('should return invoice if found', async () => {
      const invoice = { id: 'inv_123' };
      stripeMock.invoices.retrieve.mockResolvedValue(invoice);
      const result = await service.getInvoice('inv_123');
      expect(result).toBe(invoice);
      expect(stripeMock.invoices.retrieve).toHaveBeenCalledWith('inv_123');
    });
    it('should return null if error thrown', async () => {
      stripeMock.invoices.retrieve.mockRejectedValue(new Error('not found'));
      const result = await service.getInvoice('inv_404');
      expect(result).toBeNull();
    });
  });

  describe('createCustomer', () => {
    it('should create a customer', async () => {
      const params = { email: 'test@example.com' };
      const customer = { id: 'cus_123', ...params };
      stripeMock.customers.create.mockResolvedValue(customer);
      const result = await service.createCustomer(params);
      expect(result).toBe(customer);
      expect(stripeMock.customers.create).toHaveBeenCalledWith(params);
    });
  });

  describe('createCheckoutSession', () => {
    it('should create a checkout session', async () => {
      const params = { customer: 'cus_123', mode: 'subscription' };
      const session = { id: 'cs_test_123' };
      stripeMock.checkout.sessions.create.mockResolvedValue(session);
      const result = await service.createCheckoutSession(params as any);
      expect(result).toBe(session);
      expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith(params);
    });
  });

  describe('validateWebhook', () => {
    it('should return event if valid', async () => {
      const payload = Buffer.from('test');
      const signature = 'sig_test';
      const event = { id: 'evt_123' };
      stripeMock.webhooks.constructEvent.mockReturnValue(event);
      const result = await service.validateWebhook(payload, signature);
      expect(result).toBe(event);
      expect(stripeMock.webhooks.constructEvent).toHaveBeenCalledWith(
        payload,
        signature,
        webhookSecret,
      );
    });
    it('should return false if error thrown', async () => {
      stripeMock.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('invalid');
      });
      const result = await service.validateWebhook('bad', 'sig');
      expect(result).toBe(false);
    });
  });
});
