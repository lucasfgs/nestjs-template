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
  Session,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Public } from 'src/decorators/Public';
import { ApiBearerAuth } from '@nestjs/swagger';

import { UsersService } from '../users/users.service';

import { AuthenticateUserDto } from './dto/authenticate-user.dto';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local.guard';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyPasswordCodeDto } from './dto/verify-password-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

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

  @ApiBearerAuth()
  @Get('/me')
  async me(@Request() req) {
    return req.user;
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
