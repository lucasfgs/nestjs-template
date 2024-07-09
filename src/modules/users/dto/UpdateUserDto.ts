import { PartialType } from '@nestjs/mapped-types';

import { CreateUserDto } from './CreateUserDto';

export class UpdateUserDto extends PartialType(CreateUserDto) {}
