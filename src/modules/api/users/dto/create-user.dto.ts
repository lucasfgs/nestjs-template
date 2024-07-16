import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto implements Partial<Prisma.UsersCreateInput> {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'John Doe',
    description: 'The name of the user',
  })
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    example: 'test@mail.com',
    description: 'The email of the user',
  })
  email: string;

  @MinLength(8)
  @IsNotEmpty()
  @ApiProperty({
    example: 'R4ND0MP4$W0RD!',
    description: 'The password of the user',
  })
  password: string;

  @IsNotEmpty()
  @ApiProperty({
    example: 1,
    description: 'The role id of the user',
  })
  roleId: number;
}
