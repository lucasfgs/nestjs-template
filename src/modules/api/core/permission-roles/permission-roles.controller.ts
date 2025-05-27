import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { PermissionsService } from '../permissions/permissions.service';
import { RolesService } from '../roles/roles.service';

import { PermissionRolesService } from './permission-roles.service';
import { CreatePermissionRoleDto } from './dto/create-permission-role.dto';
import { UpdatePermissionRoleDto } from './dto/update-permission-role.dto';

@ApiTags('permission-roles')
@ApiBearerAuth()
@Controller('permissions/:permissionId/roles/:roleId')
export class PermissionRolesController {
  constructor(
    private readonly permissionRolesService: PermissionRolesService,
    private readonly rolesService: RolesService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Post()
  async create(
    @Param('permissionId') permissionId: string,
    @Param('roleId') roleId: string,
    @Body()
    createPermissionRoleDto: CreatePermissionRoleDto,
  ) {
    // Check if permission already exists
    const permissionExists =
      await this.permissionsService.findOne(+permissionId);
    if (!permissionExists) {
      throw new NotFoundException('Permission not found');
    }

    // Check if role already exists
    const roleExists = await this.rolesService.findOne(+roleId);
    if (!roleExists) {
      throw new NotFoundException('Role not found');
    }

    // Check if the permission and role are already assigned
    const existingPermissionRole = await this.permissionRolesService.findOne(
      +permissionId,
      +roleId,
    );
    if (existingPermissionRole) {
      throw new ConflictException('Permission and role are already assigned');
    }

    // Create the permission role if it doesn't exist
    return this.permissionRolesService.create({
      ...createPermissionRoleDto,
      permissionId: +permissionId,
      roleId: +roleId,
    });
  }

  @Get()
  async findOne(
    @Param('permissionId') permissionId: string,
    @Param('roleId') roleId: string,
  ) {
    const permissionRole = await this.permissionRolesService.findOne(
      +permissionId,
      +roleId,
    );

    if (!permissionRole) {
      throw new NotFoundException(`No permission assigned to this role`);
    }

    return permissionRole;
  }

  @Patch()
  async update(
    @Param('permissionId') permissionId: string,
    @Param('roleId') roleId: string,
    @Body() updatePermissionRoleDto: UpdatePermissionRoleDto,
  ) {
    const permissionRole = await this.permissionRolesService.findOne(
      +permissionId,
      +roleId,
    );

    if (!permissionRole) {
      throw new NotFoundException(`No permission assigned to this role`);
    }

    return this.permissionRolesService.update(
      { permissionId: +permissionId, roleId: +roleId },
      updatePermissionRoleDto,
    );
  }

  @Delete()
  async remove(
    @Param('permissionId') permissionId: string,
    @Param('roleId') roleId: string,
  ) {
    const permissionRole = await this.permissionRolesService.findOne(
      +permissionId,
      +roleId,
    );

    if (!permissionRole) {
      throw new NotFoundException(`No permission assigned to this role`);
    }

    return this.permissionRolesService.remove(+permissionId, +roleId);
  }
}
