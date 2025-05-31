import { AllowPermissions } from '@common/decorators/AllowPermissions';
import { PaginationDto } from '@common/interceptors/dto/pagination.dto';
import { PaginationInterceptor } from '@common/interceptors/pagination.interceptor';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ConflictException,
  NotFoundException,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { EPermission } from '../permissions/entities/permission.entity';

import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
@AllowPermissions(EPermission.ROLES)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  async create(@Body() createRoleDto: CreateRoleDto) {
    // Check if role exists
    const roleExists = await this.rolesService.findByName(createRoleDto.name);
    if (roleExists) {
      throw new ConflictException(
        `Role with name {${createRoleDto.name}} already exists.`,
      );
    }

    // Create new role if it doesn't exist
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @UseInterceptors(PaginationInterceptor)
  findAll(@Query() paginationDto: PaginationDto) {
    return this.rolesService.findAll({
      pagination: paginationDto,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    if (!id) {
      throw new NotFoundException('Role ID is required.');
    }

    // Check if role exists
    const role = await this.rolesService.findOne(+id);
    if (!role) {
      throw new NotFoundException(`Role with id {${id}} not found.`);
    }

    // Normalize permissions
    const normalizedPermissions = role.permissionRole.map((item) => ({
      id: item.permission.id,
      name: item.permission.name,
      description: item.permission.description,
      create: item.create,
      read: item.read,
      update: item.update,
      delete: item.delete,
    }));

    // Add normalized permissions to role
    const roleWithPermissions = { ...role, permissions: normalizedPermissions };

    return roleWithPermissions;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    // Check if the role exists
    const role = await this.rolesService.findOne(+id);

    if (!role) {
      throw new NotFoundException(`Role with id {${id}} not found.`);
    }

    // If role name is being updated, check if it already exists
    if (role.name !== updateRoleDto.name) {
      const existingRole = await this.rolesService.findByName(
        updateRoleDto.name,
      );

      if (existingRole && Number(existingRole.id) !== +id) {
        throw new ConflictException(
          `Role with name {${updateRoleDto.name}} already exists.`,
        );
      }
    }
    // Update the role if it exists and name doesn't already exist
    return this.rolesService.update(+id, updateRoleDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    // Check if role exists
    const role = await this.rolesService.findOne(+id);
    if (!role) {
      throw new NotFoundException(`Role with id {${id}} not found.`);
    }

    // Delete the role if it exists
    return this.rolesService.remove(+id);
  }
}
