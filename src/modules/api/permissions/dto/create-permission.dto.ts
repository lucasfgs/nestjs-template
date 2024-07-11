import { ApiProperty } from '@nestjs/swagger';

import { Permission } from '../entities/permission.entity';

export class CreatePermissionDto implements Partial<Permission> {
  @ApiProperty({
    example: 'users',
    description: 'The name of the permission',
  })
  name: string;
}
