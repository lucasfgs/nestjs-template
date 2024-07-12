import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { RolesService } from '../roles/roles.service';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
  ) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    // Check if user with the same email already exists
    const userAlreadyExists = await this.usersService.findByEmail(
      createUserDto.email,
    );

    if (userAlreadyExists) {
      throw new ConflictException('User with this email already exists');
    }

    // Check if role exists
    const roleExists = await this.rolesService.findOne(+createUserDto.roleId);

    if (!roleExists) {
      throw new NotFoundException('Role not found');
    }

    // Create new user if all checks pass
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
