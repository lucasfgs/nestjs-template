import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { PermissionRole } from '../../permission-roles/entities/permission-role.entity';
import { Role } from '../entities/role.entity';

interface IPermission extends Partial<PermissionRole> {}

export class CreateRoleDto implements Partial<Role> {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'admin',
    description: 'The name of the role',
  })
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'Administrator role',
    description: 'The description of the role',
  })
  description: string;

  permissions: IPermission[];
}
