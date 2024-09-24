import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';

import { UsersModule } from './src/modules/api/users/users.module';
import { AuthService } from './src/modules/api/auth/auth.service';
import { LocalStrategy } from './src/modules/api/auth/strategies/local.strategy';
import { AuthController } from './src/modules/api/auth/auth.controller';
import { jwtConstants } from './src/modules/api/auth/constants';
import { JwtStrategy } from './src/modules/api/auth/strategies/jwt.strategy';
import { JwtAuthGuard } from './src/modules/api/auth/guards/jwt.guard';
import { PermissionGuard } from './src/modules/api/auth/guards/permission.guard';
import { EmailModule } from './src/modules/shared/email/email.module';
import { WebhooksController } from './src/modules/api/payment/stripe/webhooks/webhooks.controller';
import { WebhooksService } from './src/webhooks/webhooks.service';
import { StripeWebhooksService } from './src/stripe-webhooks/stripe-webhooks.service';
import { WebhooksService } from './src/webhooks/webhooks.service';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: jwtConstants.expiresIn },
    }),
    EmailModule,
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
    WebhooksService,
    StripeWebhooksService,
  ],
  controllers: [AuthController, WebhooksController],
})
export class AuthModule {}
