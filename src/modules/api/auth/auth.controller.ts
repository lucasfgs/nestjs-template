import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Public } from 'src/decorators/Public';
import { ApiBearerAuth } from '@nestjs/swagger';

import { AuthenticateUserDto } from './dto/authenticate-user.dto';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local.guard';

@Controller('')
export class AuthController {
  constructor(private authService: AuthService) {}

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
}
