import { ApiProperty } from '@nestjs/swagger';

import { Role } from '../entities/role.entity';

export class CreateRoleDto implements Partial<Role> {
  @ApiProperty({
    example: 'admin',
    description: 'The name of the role',
  })
  name: string;
}
