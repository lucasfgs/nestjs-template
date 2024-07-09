import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';

export class CreateUserDto implements Partial<Prisma.UsersCreateInput> {
  @ApiProperty({
    example: 'John Doe',
    description: 'The name of the user',
  })
  name: string;
  @ApiProperty({
    example: 'test@mail.com',
    description: 'The email of the user',
  })
  email: string;
  @ApiProperty({
    example: 'R4ND0MP4$W0RD!',
    description: 'The password of the user',
  })
  password: string;
  @ApiProperty({
    example: 1,
    description: 'The role id of the user',
  })
  roleId: number;
}
