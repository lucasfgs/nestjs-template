import { Test, TestingModule } from '@nestjs/testing';

import { StripeWebhooksService } from './stripe-webhooks.service';

describe('StripeWebhooksService', () => {
  let service: StripeWebhooksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StripeWebhooksService],
    }).compile();

    service = module.get<StripeWebhooksService>(StripeWebhooksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
