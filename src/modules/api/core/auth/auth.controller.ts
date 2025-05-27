import {
  Body,
  Controller,
  Get,
  GoneException,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Post,
  Request,
  Session,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Public } from 'src/decorators/Public';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { normalizePermissions } from 'src/utils/normalizePermissions';

import { UsersService } from '../users/users.service';

import { AuthenticateUserDto } from './dto/authenticate-user.dto';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local.guard';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyPasswordCodeDto } from './dto/verify-password-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { RefreshTokenService } from './refresh-token.service';

@ApiTags('auth')
@Controller('')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private refreshToeknService: RefreshTokenService,
  ) {}

  @Throttle({
    short: { limit: 2, ttl: 1000 },
    long: { limit: 5, ttl: 60000 },
  })
  @Public()
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post('/login')
  async login(
    @Body() authenticateUserDto: AuthenticateUserDto,
    @Request() req,
  ) {
    return this.authService.login(req.user);
  }

  @Throttle({
    short: { limit: 1, ttl: 1000 },
    long: { limit: 2, ttl: 60000 },
  })
  @ApiBearerAuth()
  @Public()
  @UseGuards(JwtRefreshAuthGuard)
  @Post('refresh')
  refreshTokens(@Request() req) {
    if (!req.user) {
      throw new InternalServerErrorException();
    }

    const normalizedPermissions = normalizePermissions(req.user);

    const payload = {
      email: req.user.email,
      sub: req.user.id,
      role: req.user.role.name,
      permissions: normalizedPermissions,
    };

    return this.refreshToeknService.generateTokenPair(
      req.user,
      payload,
      req.headers.authorization?.split(' ')[1],
      req.user.refreshTokenExpiresAt,
    );
  }

  @ApiBearerAuth()
  @Get('/me')
  async me(@Request() req) {
    const user = await this.usersService.findOne(req.user.sub, {
      withPermissions: true,
    });
    const permissions = normalizePermissions(user);

    return { ...req.user, permissions };
  }

  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('/password/forgot')
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Request() req,
  ) {
    const code = await this.authService.forgotPassword(forgotPasswordDto.email);
    req.session.forgotPasswordEmail = forgotPasswordDto.email;
    req.session.forgotPasswordCode = code;

    return;
  }

  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('/password/code/verify')
  async verifyPasswordCode(
    @Body() verifyPasswordCodeDto: VerifyPasswordCodeDto,
    @Session() session,
  ) {
    if (!session.forgotPasswordCode)
      throw new GoneException('Password code expired');

    if (!session.forgotPasswordEmail)
      throw new NotFoundException('Email address not found');

    if (verifyPasswordCodeDto.code != session.forgotPasswordCode)
      throw new UnauthorizedException('Invalid password code');

    return;
  }

  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('/password/reset')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Session() session,
  ) {
    if (!session.forgotPasswordCode)
      throw new GoneException('Password code expired');

    if (!session.forgotPasswordEmail)
      throw new NotFoundException('Email address not found');

    if (resetPasswordDto.code != session.forgotPasswordCode)
      throw new UnauthorizedException('Invalid password code');

    const user = await this.usersService.findByEmail(resetPasswordDto.email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersService.update(user.id, {
      password: resetPasswordDto.password,
    });

    session.forgotPasswordEmail = null;
    session.forgotPasswordCode = null;

    return;
  }
}
