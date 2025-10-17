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

import { Public } from '@common/decorators/Public';

import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionsService } from './permissions.service';

@Public()
@ApiBearerAuth()
@ApiTags('permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

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

  @Get()
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    // Check if permission exists
    const permissions = await this.permissionsService.findOne(+id);

    if (!permissions) {
      throw new NotFoundException(`Permission with id {${id}} not found`);
    }

    return permissions;
  }

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
