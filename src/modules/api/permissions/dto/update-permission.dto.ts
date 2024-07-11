import { ApiProperty, PartialType } from '@nestjs/swagger';

import { CreatePermissionDto } from './create-permission.dto';

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {
  @ApiProperty({
    example: 'users',
    description: 'The updated name of the permission',
  })
  name?: string;
}
