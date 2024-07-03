import { ApiProperty } from '@nestjs/swagger';

export class AuthenticateUserDto {
  @ApiProperty()
  username: string;

  @ApiProperty()
  password: string;
}
