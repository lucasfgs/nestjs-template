import { ApiProperty } from '@nestjs/swagger';

import { PermissionRole } from '../entities/permission-role.entity';

export class CreatePermissionRoleDto implements Partial<PermissionRole> {
  @ApiProperty({
    example: true,
    description: 'Whether the role has permission to create',
  })
  create: boolean;
  @ApiProperty({
    example: true,
    description: 'Whether the role has permission to read',
  })
  read: boolean;
  @ApiProperty({
    example: true,
    description: 'Whether the role has permission to update',
  })
  update: boolean;
  @ApiProperty({
    example: true,
    description: 'Whether the role has permission to delete',
  })
  delete: boolean;
  permissionId: number;
  roleId: number;
}
