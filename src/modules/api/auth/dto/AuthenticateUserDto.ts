import { ApiProperty } from '@nestjs/swagger';

export class AuthenticateUserDto {
  @ApiProperty({
    example: 'test@mail.com',
    description: 'The email of the user',
  })
  username: string;

  @ApiProperty({
    example: 'R4ND0MP4$W0RD!',
    description: 'The password of the user',
  })
  password: string;
}
