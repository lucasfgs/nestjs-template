import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

import { PermissionRole } from '../entities/permission-role.entity';

export class CreatePermissionRoleDto implements Partial<PermissionRole> {
  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty({
    example: true,
    description: 'Whether the role has permission to create',
  })
  create: boolean;

  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty({
    example: true,
    description: 'Whether the role has permission to read',
  })
  read: boolean;

  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty({
    example: true,
    description: 'Whether the role has permission to update',
  })
  update: boolean;

  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty({
    example: true,
    description: 'Whether the role has permission to delete',
  })
  delete: boolean;

  permissionId: number;

  roleId: number;
}
