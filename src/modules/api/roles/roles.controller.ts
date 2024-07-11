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

import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/CreateRoleDto';
import { UpdateRoleDto } from './dto/UpdateRoleDto';

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
    // Check if role exists
    const role = await this.rolesService.findOne(+id);
    if (!role) {
      throw new NotFoundException(`Role with id {${id}} not found.`);
    }

    // Return the role if it exists
    return role;
  }

  /**
   * Updates a role by its ID.
   *
   * @param id - The unique identifier of the role to update.
   * @param updateRoleDto - The data to update the role with.
   *
   * @throws ConflictException - If a role with the same name as the updated role already exists.
   * @throws NotFoundException - If a role with the given ID does not exist.
   *
   * @returns The updated role.
   */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    // Check if the role name already exists
    const existingRole = await this.rolesService.findByName(updateRoleDto.name);

    if (!existingRole) {
      throw new NotFoundException(`Role with id {${id}} not found.`);
    }

    if (Number(existingRole.id) !== +id) {
      throw new ConflictException(
        `Role with name {${updateRoleDto.name}} already exists.`,
      );
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
