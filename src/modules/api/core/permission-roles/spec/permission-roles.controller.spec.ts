import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PermissionsService } from '../../permissions/permissions.service';
import { RolesService } from '../../roles/roles.service';
import { CreatePermissionRoleDto } from '../dto/create-permission-role.dto';
import { UpdatePermissionRoleDto } from '../dto/update-permission-role.dto';
import { PermissionRolesController } from '../permission-roles.controller';
import { PermissionRolesService } from '../permission-roles.service';

describe('PermissionRolesController', () => {
  let controller: PermissionRolesController;

  const mockPermissionRolesService = {
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockRolesService = {
    findOne: jest.fn(),
  };

  const mockPermissionsService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionRolesController],
      providers: [
        {
          provide: PermissionRolesService,
          useValue: mockPermissionRolesService,
        },
        {
          provide: RolesService,
          useValue: mockRolesService,
        },
        {
          provide: PermissionsService,
          useValue: mockPermissionsService,
        },
      ],
    }).compile();

    controller = module.get<PermissionRolesController>(
      PermissionRolesController,
    );
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a permission role', async () => {
      const dto: CreatePermissionRoleDto = {
        create: true,
        read: true,
        update: false,
        delete: false,
        permissionId: 1,
        roleId: 1,
      };
      mockPermissionsService.findOne.mockResolvedValue({ id: 1 });
      mockRolesService.findOne.mockResolvedValue({ id: 1 });
      mockPermissionRolesService.findOne.mockResolvedValue(null);
      mockPermissionRolesService.create.mockResolvedValue({
        permissionId: 1,
        roleId: 1,
        ...dto,
      });
      const result = await controller.create('1', '1', dto);
      expect(result).toEqual({
        permissionId: 1,
        roleId: 1,
        ...dto,
      });
      expect(mockPermissionRolesService.create).toHaveBeenCalledWith({
        ...dto,
        permissionId: 1,
        roleId: 1,
      });
    });

    it('should throw NotFoundException if permission does not exist', async () => {
      const dto: CreatePermissionRoleDto = {
        create: true,
        read: true,
        update: false,
        delete: false,
        permissionId: 1,
        roleId: 1,
      };
      mockPermissionsService.findOne.mockResolvedValue(null);
      await expect(controller.create('1', '1', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if role does not exist', async () => {
      const dto: CreatePermissionRoleDto = {
        create: true,
        read: true,
        update: false,
        delete: false,
        permissionId: 1,
        roleId: 1,
      };
      mockPermissionsService.findOne.mockResolvedValue({ id: 1 });
      mockRolesService.findOne.mockResolvedValue(null);
      await expect(controller.create('1', '1', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if permission role already exists', async () => {
      const dto: CreatePermissionRoleDto = {
        create: true,
        read: true,
        update: false,
        delete: false,
        permissionId: 1,
        roleId: 1,
      };
      mockPermissionsService.findOne.mockResolvedValue({ id: 1 });
      mockRolesService.findOne.mockResolvedValue({ id: 1 });
      mockPermissionRolesService.findOne.mockResolvedValue({
        permissionId: 1,
        roleId: 1,
        ...dto,
      });
      await expect(controller.create('1', '1', dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a permission role', async () => {
      const permissionRole = {
        permissionId: 1,
        roleId: 1,
        create: true,
        read: true,
        update: false,
        delete: false,
      };
      mockPermissionRolesService.findOne.mockResolvedValue(permissionRole);
      const result = await controller.findOne('1', '1');
      expect(result).toEqual(permissionRole);
      expect(mockPermissionRolesService.findOne).toHaveBeenCalledWith(1, 1);
    });

    it('should throw NotFoundException if permission role does not exist', async () => {
      mockPermissionRolesService.findOne.mockResolvedValue(null);
      await expect(controller.findOne('1', '1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a permission role', async () => {
      const dto: UpdatePermissionRoleDto = {
        create: false,
        read: true,
        update: true,
        delete: false,
      };
      mockPermissionRolesService.findOne.mockResolvedValue({
        permissionId: 1,
        roleId: 1,
        create: true,
        read: true,
        update: false,
        delete: false,
      });
      mockPermissionRolesService.update.mockResolvedValue({
        permissionId: 1,
        roleId: 1,
        ...dto,
      });
      const result = await controller.update('1', '1', dto);
      expect(result).toEqual({
        permissionId: 1,
        roleId: 1,
        ...dto,
      });
      expect(mockPermissionRolesService.update).toHaveBeenCalledWith(
        { permissionId: 1, roleId: 1 },
        dto,
      );
    });

    it('should throw NotFoundException if permission role does not exist', async () => {
      const dto: UpdatePermissionRoleDto = {
        create: false,
        read: true,
        update: true,
        delete: false,
      };
      mockPermissionRolesService.findOne.mockResolvedValue(null);
      await expect(controller.update('1', '1', dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a permission role', async () => {
      mockPermissionRolesService.findOne.mockResolvedValue({
        permissionId: 1,
        roleId: 1,
        create: true,
        read: true,
        update: false,
        delete: false,
      });
      mockPermissionRolesService.remove.mockResolvedValue({
        permissionId: 1,
        roleId: 1,
        create: true,
        read: true,
        update: false,
        delete: false,
      });
      const result = await controller.remove('1', '1');
      expect(result).toEqual({
        permissionId: 1,
        roleId: 1,
        create: true,
        read: true,
        update: false,
        delete: false,
      });
      expect(mockPermissionRolesService.remove).toHaveBeenCalledWith(1, 1);
    });

    it('should throw NotFoundException if permission role does not exist', async () => {
      mockPermissionRolesService.findOne.mockResolvedValue(null);
      await expect(controller.remove('1', '1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
