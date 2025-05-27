import { PartialType } from '@nestjs/swagger';

import { PermissionRole } from '../../permission-roles/entities/permission-role.entity';

import { CreateRoleDto } from './create-role.dto';

interface IPermission extends Partial<PermissionRole> {}

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
  permissions: IPermission[];
}
