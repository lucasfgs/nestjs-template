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

export type TPermission = {
  name: string;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
};

export interface IAuthenticatedUser {
  sub: string;
  email: string;
  role: string;
  permissions: TPermission[];
}
