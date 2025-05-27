import { PartialType } from '@nestjs/swagger';

import { CreatePermissionRoleDto } from './create-permission-role.dto';

export class UpdatePermissionRoleDto extends PartialType(
  CreatePermissionRoleDto,
) {}
