import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength, ValidateIf } from 'class-validator';

export class ResetPasswordDto {
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

  @MinLength(8)
  @IsNotEmpty()
  @ApiProperty({
    example: 'R4ND0MP4$W0RD!',
    description: 'The password of the user',
  })
  password: string;

  @IsNotEmpty()
  @ApiProperty({
    example: 'R4ND0MP4$W0RD!',
    description: 'Confirm the password',
  })
  @ValidateIf((item) => item.password !== item.passwordConfirmation)
  passwordConfirmation: string;
}
