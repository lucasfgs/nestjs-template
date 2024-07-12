import { ApiProperty, PartialType } from '@nestjs/swagger';

import { CreatePermissionRoleDto } from './create-permission-role.dto';

export class UpdatePermissionRoleDto extends PartialType(
  CreatePermissionRoleDto,
) {
  @ApiProperty({
    example: true,
    description: 'Whether the role has permission to create',
  })
  create?: boolean;
  @ApiProperty({
    example: true,
    description: 'Whether the role has permission to read',
  })
  read?: boolean;
  @ApiProperty({
    example: true,
    description: 'Whether the role has permission to update',
  })
  update?: boolean;
  @ApiProperty({
    example: true,
    description: 'Whether the role has permission to delete',
  })
  delete?: boolean;
  permissionId?: number;
  roleId?: number;
}
