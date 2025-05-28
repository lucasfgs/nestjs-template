import {
  Body,
  Controller,
  Get,
  GoneException,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Request,
  Response,
  Session,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response as ExpressResponse } from 'express';

import { Public } from 'src/decorators/Public';
import { normalizePermissions } from 'src/utils/normalizePermissions';

import { UsersService } from '../users/users.service';

import { AuthService } from './auth.service';
import { cookieConstants } from './constants';
import { AuthenticateUserDto } from './dto/authenticate-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyPasswordCodeDto } from './dto/verify-password-code.dto';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { JwtAuthGuard } from './guards/jwt.guard';
import { LocalAuthGuard } from './guards/local.guard';
import { RefreshTokenService } from './refresh-token.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private refreshToeknService: RefreshTokenService,
  ) {}

  @Throttle({ short: { limit: 2, ttl: 1000 }, long: { limit: 5, ttl: 60000 } })
  @Public()
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Request() req,
    @Response({ passthrough: true }) res: ExpressResponse,
    @Body() _dto: AuthenticateUserDto,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(
      req.user,
    );

    res.cookie('refreshToken', refreshToken, cookieConstants);

    res.cookie('accessToken', accessToken, {
      ...cookieConstants,
      httpOnly: false,
    });

    return req.user;
  }

  @Throttle({ short: { limit: 1, ttl: 1000 }, long: { limit: 2, ttl: 60000 } })
  @Public()
  @UseGuards(JwtRefreshAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Request() req,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    const { accessToken, refreshToken } = await this.authService.refreshTokens(
      req.user,
    );

    res.cookie('refreshToken', refreshToken, cookieConstants);

    res.cookie('accessToken', accessToken, {
      ...cookieConstants,
      httpOnly: false,
    });

    return req.user;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('/me')
  async me(@Request() req) {
    const user = await this.usersService.findOne(req.user.sub, {
      withPermissions: true,
    });
    const permissions = normalizePermissions(user);

    return { ...req.user, permissions };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Response({ passthrough: true }) res: ExpressResponse) {
    res.clearCookie('refreshToken', { path: '/' });
    res.clearCookie('accessToken', { path: '/' });
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
