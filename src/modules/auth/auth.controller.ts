import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticateUserDto } from './dto/authenticateUserDto';

@Controller('auth')
export class AuthController {
  @UseGuards(AuthGuard('local'))
  @Post('/login')
  async login(@Body() authenticateUserDto: AuthenticateUserDto) {
    return authenticateUserDto;
  }
}
