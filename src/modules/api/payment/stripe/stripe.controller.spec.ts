import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { UsersService } from '../../core/users/users.service';

import { StripeWebhooksService } from './stripe-webhooks.service';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';

describe('StripeController', () => {
  let controller: StripeController;

  const mockStripeService = {
    getCustomer: jest.fn(),
    createCustomer: jest.fn(),
    createCheckoutSession: jest.fn(),
    validateWebhook: jest.fn(),
  };

  const mockUsersService = {
    findOne: jest.fn(),
  };

  const mockStripeWebhooksService = {
    handleCheckouSessionCompleted: jest.fn(),
    handleInvoicePaid: jest.fn(),
    handleChargeRefunded: jest.fn(),
    handleSubscriptionDeleted: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StripeController],
      providers: [
        {
          provide: StripeService,
          useValue: mockStripeService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: StripeWebhooksService,
          useValue: mockStripeWebhooksService,
        },
      ],
    }).compile();

    controller = module.get<StripeController>(StripeController);
    jest.clearAllMocks();
  });

  describe('createCustomerSession', () => {
    const customerId = 'customer_123';
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed_password',
      roleId: 1,
      created_at: new Date(),
      updated_at: new Date(),
    };
    const mockCustomer = { id: 'cus_123' };
    const mockSession = { id: 'sess_123' };

    it('should create a checkout session for existing customer', async () => {
      mockStripeService.getCustomer.mockResolvedValue(mockCustomer);
      mockStripeService.createCheckoutSession.mockResolvedValue(mockSession);

      const result = await controller.createCustomerSession(customerId);

      expect(result).toEqual(mockSession);
      expect(mockStripeService.getCustomer).toHaveBeenCalledWith(customerId);
      expect(mockStripeService.createCheckoutSession).toHaveBeenCalledWith({
        customer: mockCustomer.id,
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
    });

    it('should create a new customer and session if customer does not exist', async () => {
      mockStripeService.getCustomer.mockResolvedValue(null);
      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockStripeService.createCustomer.mockResolvedValue(mockCustomer);
      mockStripeService.createCheckoutSession.mockResolvedValue(mockSession);

      const result = await controller.createCustomerSession(customerId);

      expect(result).toEqual(mockSession);
      expect(mockStripeService.getCustomer).toHaveBeenCalledWith(customerId);
      expect(mockUsersService.findOne).toHaveBeenCalledWith(customerId);
      expect(mockStripeService.createCustomer).toHaveBeenCalledWith({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
      });
      expect(mockStripeService.createCheckoutSession).toHaveBeenCalledWith({
        customer: mockCustomer.id,
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
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockStripeService.getCustomer.mockResolvedValue(null);
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(
        controller.createCustomerSession(customerId),
      ).rejects.toThrow(NotFoundException);
      expect(mockStripeService.getCustomer).toHaveBeenCalledWith(customerId);
      expect(mockUsersService.findOne).toHaveBeenCalledWith(customerId);
    });
  });

  describe('handleWebhook', () => {
    const mockRequest = {
      rawBody: Buffer.from('test'),
      headers: {},
      method: 'POST',
      url: '/webhook',
      cache: 'no-cache',
      credentials: 'same-origin',
      destination: '',
      integrity: '',
      keepalive: true,
      mode: 'cors',
      redirect: 'follow',
      referrer: '',
      referrerPolicy: 'no-referrer',
      signal: null,
    } as any;
    const mockSignature = 'test_signature';
    const mockEvent = { type: 'checkout.session.completed' };

    it('should handle checkout.session.completed event', async () => {
      mockStripeService.validateWebhook.mockResolvedValue(mockEvent);

      await controller.handleWebhook(mockRequest, mockSignature);

      expect(mockStripeService.validateWebhook).toHaveBeenCalledWith(
        mockRequest.rawBody,
        mockSignature,
      );
      expect(
        mockStripeWebhooksService.handleCheckouSessionCompleted,
      ).toHaveBeenCalledWith(mockEvent);
    });

    it('should handle invoice.paid event', async () => {
      const invoiceEvent = { type: 'invoice.paid' };
      mockStripeService.validateWebhook.mockResolvedValue(invoiceEvent);

      await controller.handleWebhook(mockRequest, mockSignature);

      expect(mockStripeService.validateWebhook).toHaveBeenCalledWith(
        mockRequest.rawBody,
        mockSignature,
      );
      expect(mockStripeWebhooksService.handleInvoicePaid).toHaveBeenCalledWith(
        invoiceEvent,
      );
    });

    it('should handle charge.refunded event', async () => {
      const refundEvent = { type: 'charge.refunded' };
      mockStripeService.validateWebhook.mockResolvedValue(refundEvent);

      await controller.handleWebhook(mockRequest, mockSignature);

      expect(mockStripeService.validateWebhook).toHaveBeenCalledWith(
        mockRequest.rawBody,
        mockSignature,
      );
      expect(
        mockStripeWebhooksService.handleChargeRefunded,
      ).toHaveBeenCalledWith(refundEvent);
    });

    it('should handle customer.subscription.deleted event', async () => {
      const subscriptionEvent = { type: 'customer.subscription.deleted' };
      mockStripeService.validateWebhook.mockResolvedValue(subscriptionEvent);

      await controller.handleWebhook(mockRequest, mockSignature);

      expect(mockStripeService.validateWebhook).toHaveBeenCalledWith(
        mockRequest.rawBody,
        mockSignature,
      );
      expect(
        mockStripeWebhooksService.handleSubscriptionDeleted,
      ).toHaveBeenCalledWith(subscriptionEvent);
    });

    it('should throw UnauthorizedException if webhook validation fails', async () => {
      mockStripeService.validateWebhook.mockResolvedValue(null);

      await expect(
        controller.handleWebhook(mockRequest, mockSignature),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockStripeService.validateWebhook).toHaveBeenCalledWith(
        mockRequest.rawBody,
        mockSignature,
      );
    });
  });
});
