import { Public } from '@common/decorators/Public';
import {
  Body,
  Controller,
  Get,
  GoneException,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Req,
  Request,
  Res,
  Response,
  Session,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response as ExpressResponse } from 'express';

import { cookieConstants } from '@configs/authentication.config';

import { UsersService } from '../users/users.service';

import { AuthService } from './auth.service';
import {
  AuthenticateUserDto,
  IAuthenticatedUser,
} from './dto/authenticate-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyPasswordCodeDto } from './dto/verify-password-code.dto';
import { GoogleAuthGuard } from './guards/google.guard';
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

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.NO_CONTENT)
  async login(
    @Request() req,
    @Response({ passthrough: true }) res: ExpressResponse,
    @Body() _dto: AuthenticateUserDto,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(
      req.user,
    );

    res.cookie('refreshToken', refreshToken, cookieConstants.refresh);
    res.cookie('accessToken', accessToken, cookieConstants.access);
  }

  @Public()
  @UseGuards(JwtRefreshAuthGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Request() req,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    const { accessToken, refreshToken } = await this.authService.refreshTokens(
      req.user,
      req.cookies.refreshToken,
    );

    res.cookie('refreshToken', refreshToken, cookieConstants.refresh);
    res.cookie('accessToken', accessToken, cookieConstants.access);

    return req.user;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Response({ passthrough: true }) res: ExpressResponse) {
    res.clearCookie('refreshToken', { path: cookieConstants.refresh.path });
    res.clearCookie('accessToken', { path: cookieConstants.access.path });
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {}

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(
    @Req() req,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    const userPayload = req.user as IAuthenticatedUser;

    const { accessToken, refreshToken } =
      await this.refreshToeknService.generateTokenPair(
        userPayload.sub,
        userPayload,
        req.cookies['refreshToken'],
      );

    res.cookie('refreshToken', refreshToken, cookieConstants.refresh);
    res.cookie('accessToken', accessToken, cookieConstants.access);

    return res.redirect(`${process.env.APP_URL}/dashboard`);
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
