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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  /**
   * Creates a new role in the database.
   *
   * @param createRoleDto - The data to create the new role with.
   *
   * @throws ConflictException - If a role with the same name as the provided data already exists.
   *
   * @returns The newly created role.
   */
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

  /**
   * Retrieves all roles from the database.
   *
   * @returns An array of all roles.
   */
  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  /**
   * Retrieves a role by its ID.
   *
   * @param id - The unique identifier of the role to retrieve.
   *
   * @throws NotFoundException - If a role with the given ID does not exist.
   *
   * @returns The role with the specified ID.
   */
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

  /**
   * Updates a role by its ID.
   *
   * @param id - The unique identifier of the role to update.
   * @param updateRoleDto - The data to update the role with.
   *
   * @throws NotFoundException - If the role does not exist
   * @throws ConflictException - If a role with the same name as the updated role already exists.
   * @returns The updated role.
   */
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

  /**
   * Deletes a role by its ID.
   *
   * @param id - The unique identifier of the role to delete.
   * @throws NotFoundException - If a role with the given ID does not exist.
   * @returns The deleted role.
   */
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
