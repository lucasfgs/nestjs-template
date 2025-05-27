import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { Permission } from '../entities/permission.entity';

export class CreatePermissionDto implements Partial<Permission> {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'users',
    description: 'The name of the permission',
  })
  name: string;
}
