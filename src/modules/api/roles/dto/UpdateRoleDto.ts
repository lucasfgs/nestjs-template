import { PartialType } from '@nestjs/swagger';

import { CreateRoleDto } from './CreateRoleDto';

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}
