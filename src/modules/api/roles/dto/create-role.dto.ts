import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { Role } from '../entities/role.entity';

export class CreateRoleDto implements Partial<Role> {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'admin',
    description: 'The name of the role',
  })
  name: string;
}
