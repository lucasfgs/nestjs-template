import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class VerifyPasswordCodeDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    example: 'test@mail.com',
    description: 'The email of the user',
  })
  email: string;

  @IsNotEmpty()
  @ApiProperty({
    example: '154803',
    description: 'The recover code sent to the user email',
  })
  code: string;
}
