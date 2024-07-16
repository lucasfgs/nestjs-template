import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class AuthenticateUserDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    example: 'test@mail.com',
    description: 'The email of the user',
  })
  email: string;

  @IsNotEmpty()
  @ApiProperty({
    example: 'R4ND0MP4$W0RD!',
    description: 'The password of the user',
  })
  password: string;
}
