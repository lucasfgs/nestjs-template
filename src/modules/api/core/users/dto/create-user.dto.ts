import { ApiProperty } from '@nestjs/swagger';
import { Provider } from '@prisma/client';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  ValidateIf,
  IsIn,
} from 'class-validator';

import { User } from '../entity/user.entity';

export class CreateUserDto implements Partial<User> {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'John Doe', description: 'The name of the user' })
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    example: 'admin@example.com',
    description: 'The email of the user',
  })
  email: string;

  // ── Password is required only for local users ──
  @ValidateIf((o) => o.provider === 'local')
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  @ApiProperty({
    example: 'admin123',
    description: 'The password for local authentication',
  })
  password?: string;

  // ── Provider must be one of the known types ──
  @IsString()
  @IsIn(['local', 'google', 'facebook'])
  @ApiProperty({
    example: 'local',
    description: 'Authentication provider (e.g. local, google)',
    enum: () => ['local', 'google', 'facebook'],
  })
  provider: Provider;

  // ── providerId is required only for OAuth users ──
  @ValidateIf((o) => o.provider !== 'local')
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '109876543210-abcdefg.apps.googleusercontent.com',
    description: 'OAuth provider user ID',
    required: false,
  })
  providerId?: string;

  // ── roleId always required ──
  @IsNotEmpty()
  @ApiProperty({ example: 1, description: 'The role id of the user' })
  roleId: number;
}
