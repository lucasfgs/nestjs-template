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
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@ApiBearerAuth()
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  /**
   * Handles POST requests to create a new permission.
   *
   * @param createPermissionDto - The data transfer object containing the necessary information to create a new permission.
   * @throws ConflictException - If a permission with the same name already exists.
   * @returns The newly created permission.
   */
  @Post()
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    // Check if permission name already exists
    const permissionAlreadyExists = await this.permissionsService.findByName(
      createPermissionDto.name,
    );

    if (permissionAlreadyExists) {
      throw new ConflictException('Permission with this name already exists');
    }

    return this.permissionsService.create(createPermissionDto);
  }

  /**
   * Handles GET requests to retrieve all permissions.
   *
   * @returns An array of all permissions.
   */
  @Get()
  findAll() {
    return this.permissionsService.findAll();
  }

  /**
   * Handles GET requests to retrieve a single permission by its ID.
   *
   * @param id - The unique identifier of the permission to retrieve.
   * @throws NotFoundException - If a permission with the given ID does not exist.
   * @returns The permission with the specified ID.
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    // Check if permission exists
    const permissions = await this.permissionsService.findOne(+id);

    if (!permissions) {
      throw new NotFoundException(`Permission with id {${id}} not found`);
    }

    return permissions;
  }

  /**
   * Handles PATCH requests to update an existing permission by its ID.
   *
   * @param id - The unique identifier of the permission to update.
   * @param updatePermissionDto - The data transfer object containing the updated information for the permission.
   *
   * @throws NotFoundException - If a permission with the given ID does not exist.
   * @throws ConflictException - If a permission with the given name already exists
   * @returns The updated permission.
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    // Check if the permission exists
    const permission = await this.permissionsService.findOne(+id);

    if (!permission) {
      throw new NotFoundException(`Permission with id {${id}} not found`);
    }

    // If permission name is being updated, check if it already exists
    if (permission.name !== updatePermissionDto.name) {
      const existingPermission = await this.permissionsService.findByName(
        updatePermissionDto.name,
      );

      if (existingPermission && Number(existingPermission.id) !== Number(+id)) {
        throw new ConflictException(
          `Permission with name {${updatePermissionDto.name}} already exists`,
        );
      }
    }

    // Update the permission if it exists and name doesn't already exist
    return this.permissionsService.update(+id, updatePermissionDto);
  }

  /**
   * Handles DELETE requests to remove a permission by its ID.
   *
   * @param id - The unique identifier of the permission to remove.
   * @throws NotFoundException - If a permission with the given ID does not exist.
   * @returns The ID of the deleted permission.
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    // Check if permission exists
    const permission = await this.permissionsService.findOne(+id);

    if (!permission) {
      throw new NotFoundException(`Permission with id {${id}} not found`);
    }

    // Delete the permission if it exists
    return this.permissionsService.remove(+id);
  }
}
