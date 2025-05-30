import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import Stripe from 'stripe';

import { UsersService } from '@modules/api/core/users/users.service';
import { PrismaService } from '@modules/shared/prisma/prisma.service';

import { StripeWebhooksService } from './stripe-webhooks.service';
import { StripeService } from './stripe.service';

describe('StripeWebhooksService', () => {
  let service: StripeWebhooksService;
  let mockUsersService: Partial<UsersService>;
  let mockStripeService: Partial<StripeService>;
  let mockPrismaService: Partial<PrismaService>;

  beforeEach(async () => {
    mockUsersService = {
      findOne: jest.fn().mockImplementation(),
    };

    mockStripeService = {
      getSubscription: jest.fn().mockImplementation(),
      getInvoice: jest.fn().mockImplementation(),
    };

    mockPrismaService = {
      subscriptions: {
        create: jest.fn().mockImplementation(),
        findFirst: jest.fn().mockImplementation(),
        update: jest.fn().mockImplementation(),
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeWebhooksService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: StripeService, useValue: mockStripeService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<StripeWebhooksService>(StripeWebhooksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleCheckouSessionCompleted', () => {
    const mockEvent = {
      data: {
        object: {
          mode: 'subscription',
          customer: 'cus_123',
          subscription: 'sub_123',
        },
      },
    } as Stripe.CheckoutSessionCompletedEvent;

    const mockUser = { id: 1 };
    const mockSubscription = {
      id: 'sub_123',
      status: 'active',
      current_period_start: 1234567890,
      current_period_end: 1234567890,
    };

    it('should create a new subscription when checkout session is completed', async () => {
      (mockUsersService.findOne as jest.Mock).mockResolvedValue(mockUser);
      (mockStripeService.getSubscription as jest.Mock).mockResolvedValue(
        mockSubscription,
      );
      (mockPrismaService.subscriptions.create as jest.Mock).mockResolvedValue({
        id: 1,
      });

      await service.handleCheckouSessionCompleted(mockEvent);

      expect(mockUsersService.findOne).toHaveBeenCalledWith('cus_123');
      expect(mockStripeService.getSubscription).toHaveBeenCalledWith('sub_123');
      expect(mockPrismaService.subscriptions.create).toHaveBeenCalledWith({
        data: {
          name: 'Subscription',
          userId: mockUser.id,
          startDate: new Date(mockSubscription.current_period_start * 1000),
          endDate: new Date(mockSubscription.current_period_end * 1000),
          status: mockSubscription.status,
          stripeSubscriptionId: mockSubscription.id,
        },
      });
    });

    it('should throw NotFoundException if user is not found', async () => {
      (mockUsersService.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.handleCheckouSessionCompleted(mockEvent),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if subscription is not found', async () => {
      (mockUsersService.findOne as jest.Mock).mockResolvedValue(mockUser);
      (mockStripeService.getSubscription as jest.Mock).mockResolvedValue(null);

      await expect(
        service.handleCheckouSessionCompleted(mockEvent),
      ).rejects.toThrow(NotFoundException);
    });

    it('should do nothing if mode is not subscription', async () => {
      const event = {
        data: {
          object: {
            mode: 'payment',
          },
        },
      } as any;
      await expect(
        service.handleCheckouSessionCompleted(event),
      ).resolves.toBeUndefined();
    });
  });

  describe('handleInvoicePaid', () => {
    const mockEvent = {
      data: {
        object: {
          subscription: 'sub_123',
        },
      },
    } as Stripe.InvoicePaidEvent;

    const mockStoredSubscription = { id: 1, stripeSubscriptionId: 'sub_123' };
    const mockSubscription = {
      id: 'sub_123',
      status: 'active',
      current_period_start: 1234567890,
      current_period_end: 1234567890,
    };

    it('should update subscription when invoice is paid', async () => {
      (
        mockPrismaService.subscriptions.findFirst as jest.Mock
      ).mockResolvedValue(mockStoredSubscription);
      (mockStripeService.getSubscription as jest.Mock).mockResolvedValue(
        mockSubscription,
      );
      (mockPrismaService.subscriptions.update as jest.Mock).mockResolvedValue({
        id: 1,
      });

      await service.handleInvoicePaid(mockEvent);

      expect(mockPrismaService.subscriptions.findFirst).toHaveBeenCalledWith({
        where: {
          stripeSubscriptionId: 'sub_123',
        },
      });
      expect(mockStripeService.getSubscription).toHaveBeenCalledWith('sub_123');
      expect(mockPrismaService.subscriptions.update).toHaveBeenCalledWith({
        where: {
          id: mockStoredSubscription.id,
        },
        data: {
          status: mockSubscription.status,
          startDate: new Date(mockSubscription.current_period_start * 1000),
          endDate: new Date(mockSubscription.current_period_end * 1000),
        },
      });
    });

    it('should throw NotFoundException if subscription is not found', async () => {
      (
        mockPrismaService.subscriptions.findFirst as jest.Mock
      ).mockResolvedValue(null);

      await expect(service.handleInvoicePaid(mockEvent)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('handleSubscriptionDeleted', () => {
    const mockEvent = {
      data: {
        object: {
          id: 'sub_123',
        },
      },
    } as Stripe.CustomerSubscriptionDeletedEvent;

    const mockSubscription = { id: 1, stripeSubscriptionId: 'sub_123' };

    it('should update subscription status to canceled when subscription is deleted', async () => {
      (
        mockPrismaService.subscriptions.findFirst as jest.Mock
      ).mockResolvedValue(mockSubscription);
      (mockPrismaService.subscriptions.update as jest.Mock).mockResolvedValue({
        id: 1,
      });

      await service.handleSubscriptionDeleted(mockEvent);

      expect(mockPrismaService.subscriptions.findFirst).toHaveBeenCalledWith({
        where: {
          stripeSubscriptionId: 'sub_123',
        },
      });
      expect(mockPrismaService.subscriptions.update).toHaveBeenCalledWith({
        where: {
          id: mockSubscription.id,
        },
        data: {
          status: 'canceled',
        },
      });
    });

    it('should throw NotFoundException if subscription is not found', async () => {
      (
        mockPrismaService.subscriptions.findFirst as jest.Mock
      ).mockResolvedValue(null);

      await expect(
        service.handleSubscriptionDeleted(mockEvent),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('handleChargeRefunded', () => {
    const mockEvent = {
      data: {
        object: {
          amount: 1000,
          amount_refunded: 1000,
          invoice: 'inv_123',
        },
      },
    } as Stripe.ChargeRefundedEvent;

    const mockInvoice = { id: 'inv_123', subscription: 'sub_123' };

    it('should update subscription status to refunded when charge is refunded', async () => {
      (mockStripeService.getInvoice as jest.Mock).mockResolvedValue(
        mockInvoice,
      );
      (
        mockPrismaService.subscriptions.findFirst as jest.Mock
      ).mockResolvedValue({
        id: 1,
        stripeSubscriptionId: 'sub_123',
      });
      (mockPrismaService.subscriptions.update as jest.Mock).mockResolvedValue({
        id: 1,
      });

      await service.handleChargeRefunded(mockEvent);

      expect(mockStripeService.getInvoice).toHaveBeenCalledWith('inv_123');
      expect(mockPrismaService.subscriptions.findFirst).toHaveBeenCalledWith({
        where: {
          stripeSubscriptionId: mockInvoice.subscription,
        },
      });
      expect(mockPrismaService.subscriptions.update).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        data: {
          status: 'refunded',
        },
      });
    });

    it('should throw error for partial refunds', async () => {
      const event = {
        data: {
          object: {
            amount: 1000,
            amount_refunded: 500,
            invoice: 'inv_123',
          },
        },
      } as any;
      await expect(service.handleChargeRefunded(event)).rejects.toThrow(
        'Partial refunds are not supported',
      );
    });

    it('should throw NotFoundException if invoice is not found', async () => {
      (mockStripeService.getInvoice as jest.Mock).mockResolvedValue(null);
      const event = {
        data: {
          object: {
            amount: 1000,
            amount_refunded: 1000,
            invoice: 'inv_123',
          },
        },
      } as any;
      await expect(service.handleChargeRefunded(event)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if subscription is not found', async () => {
      (mockStripeService.getInvoice as jest.Mock).mockResolvedValue(
        mockInvoice,
      );
      (
        mockPrismaService.subscriptions.findFirst as jest.Mock
      ).mockResolvedValue(null);
      const event = {
        data: {
          object: {
            amount: 1000,
            amount_refunded: 1000,
            invoice: 'inv_123',
          },
        },
      } as any;
      await expect(service.handleChargeRefunded(event)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
