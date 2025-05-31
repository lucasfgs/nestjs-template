import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { RolesController } from '../roles.controller';
import { RolesService } from '../roles.service';

describe('RolesController', () => {
  let controller: RolesController;

  const mockRolesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByName: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        {
          provide: RolesService,
          useValue: mockRolesService,
        },
      ],
    }).compile();

    controller = module.get<RolesController>(RolesController);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a role', async () => {
      const dto: CreateRoleDto = {
        name: 'role1',
        description: 'desc',
        permissions: [],
      };
      mockRolesService.findByName.mockResolvedValue(null);
      mockRolesService.create.mockResolvedValue({ id: 1, ...dto });
      const result = await controller.create(dto);
      expect(result).toEqual({ id: 1, ...dto });
      expect(mockRolesService.create).toHaveBeenCalledWith(dto);
    });

    it('should throw ConflictException if role already exists', async () => {
      const dto: CreateRoleDto = {
        name: 'role1',
        description: 'desc',
        permissions: [],
      };
      mockRolesService.findByName.mockResolvedValue({ id: 1, ...dto });
      await expect(controller.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return an array of roles', async () => {
      const expectedRoles = [
        { id: 1, name: 'admin' },
        { id: 2, name: 'user' },
      ];

      mockRolesService.findAll.mockResolvedValue({
        items: expectedRoles,
        total: 2,
      });

      const result = await controller.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({
        items: expectedRoles,
        total: 2,
      });
      expect(mockRolesService.findAll).toHaveBeenCalledWith({
        pagination: { page: 1, limit: 10 },
      });
    });
  });

  describe('findOne', () => {
    it('should return a role by id with normalized permissions', async () => {
      const role = {
        id: 1,
        name: 'role1',
        permissionRole: [
          {
            permission: { id: 1, name: 'perm1', description: 'desc1' },
            create: true,
            read: true,
            update: false,
            delete: false,
          },
        ],
      };
      mockRolesService.findOne.mockResolvedValue(role);
      const result = await controller.findOne('1');
      expect(result).toHaveProperty('permissions');
      expect(result.permissions[0]).toEqual({
        id: 1,
        name: 'perm1',
        description: 'desc1',
        create: true,
        read: true,
        update: false,
        delete: false,
      });
      expect(mockRolesService.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if role does not exist', async () => {
      mockRolesService.findOne.mockResolvedValue(null);
      await expect(controller.findOne('1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if id is not provided', async () => {
      await expect(controller.findOne(undefined as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a role', async () => {
      const dto: UpdateRoleDto = {
        name: 'role2',
        description: 'desc2',
        permissions: [],
      };
      mockRolesService.findOne.mockResolvedValue({ id: 1, name: 'role1' });
      mockRolesService.findByName.mockResolvedValue(null);
      mockRolesService.update.mockResolvedValue({ id: 1, ...dto });
      const result = await controller.update('1', dto);
      expect(result).toEqual({ id: 1, ...dto });
      expect(mockRolesService.update).toHaveBeenCalledWith(1, dto);
    });

    it('should throw NotFoundException if role does not exist', async () => {
      const dto: UpdateRoleDto = {
        name: 'role2',
        description: 'desc2',
        permissions: [],
      };
      mockRolesService.findOne.mockResolvedValue(null);
      await expect(controller.update('1', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if role name already exists', async () => {
      const dto: UpdateRoleDto = {
        name: 'role2',
        description: 'desc2',
        permissions: [],
      };
      mockRolesService.findOne.mockResolvedValue({ id: 1, name: 'role1' });
      mockRolesService.findByName.mockResolvedValue({ id: 2, name: 'role2' });
      await expect(controller.update('1', dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should update a role when name is not changed', async () => {
      const dto: UpdateRoleDto = {
        name: 'role1',
        description: 'desc1',
        permissions: [],
      };
      mockRolesService.findOne.mockResolvedValue({ id: 1, name: 'role1' });
      mockRolesService.update.mockResolvedValue({ id: 1, ...dto });
      const result = await controller.update('1', dto);
      expect(result).toEqual({ id: 1, ...dto });
      expect(mockRolesService.update).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('remove', () => {
    it('should remove a role', async () => {
      mockRolesService.findOne.mockResolvedValue({ id: 1, name: 'role1' });
      mockRolesService.remove.mockResolvedValue({ id: 1, name: 'role1' });
      const result = await controller.remove('1');
      expect(result).toEqual({ id: 1, name: 'role1' });
      expect(mockRolesService.remove).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if role does not exist', async () => {
      mockRolesService.findOne.mockResolvedValue(null);
      await expect(controller.remove('1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if id is not provided', async () => {
      await expect(controller.remove(undefined as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
