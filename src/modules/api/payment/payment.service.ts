import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/shared/prisma/prisma.service';

import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class PaymentService {
  constructor(private prismaService: PrismaService) {}

  createSubscription(createSubscriptionDto: CreateSubscriptionDto) {
    return this.prismaService.subscriptions.create({
      data: createSubscriptionDto,
    });
  }
}
