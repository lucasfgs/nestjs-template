import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { CreatePermissionDto } from '../dto/create-permission.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { PermissionsController } from '../permissions.controller';
import { PermissionsService } from '../permissions.service';

describe('PermissionsController', () => {
  let controller: PermissionsController;

  const mockPermissionsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByName: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionsController],
      providers: [
        {
          provide: PermissionsService,
          useValue: mockPermissionsService,
        },
      ],
    }).compile();

    controller = module.get<PermissionsController>(PermissionsController);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a permission', async () => {
      const dto: CreatePermissionDto = {
        name: 'test:permission',
      };
      mockPermissionsService.findByName.mockResolvedValue(null);
      mockPermissionsService.create.mockResolvedValue({ id: 1, ...dto });
      const result = await controller.create(dto);
      expect(result).toEqual({ id: 1, ...dto });
      expect(mockPermissionsService.create).toHaveBeenCalledWith(dto);
    });

    it('should throw ConflictException if permission name already exists', async () => {
      const dto: CreatePermissionDto = {
        name: 'test:permission',
      };
      mockPermissionsService.findByName.mockResolvedValue({ id: 1, ...dto });
      await expect(controller.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all permissions', async () => {
      const expected = [{ id: 1, name: 'test:permission' }];
      mockPermissionsService.findAll.mockResolvedValue(expected);
      const result = await controller.findAll();
      expect(result).toEqual(expected);
      expect(mockPermissionsService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a permission by id', async () => {
      const permission = { id: 1, name: 'test:permission' };
      mockPermissionsService.findOne.mockResolvedValue(permission);
      const result = await controller.findOne('1');
      expect(result).toEqual(permission);
      expect(mockPermissionsService.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if permission does not exist', async () => {
      mockPermissionsService.findOne.mockResolvedValue(null);
      await expect(controller.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a permission', async () => {
      const dto: UpdatePermissionDto = {
        name: 'updated:permission',
      };
      mockPermissionsService.findOne.mockResolvedValue({
        id: 1,
        name: 'test:permission',
      });
      mockPermissionsService.findByName.mockResolvedValue(null);
      mockPermissionsService.update.mockResolvedValue({ id: 1, ...dto });
      const result = await controller.update('1', dto);
      expect(result).toEqual({ id: 1, ...dto });
      expect(mockPermissionsService.update).toHaveBeenCalledWith(1, dto);
    });

    it('should throw NotFoundException if permission does not exist', async () => {
      const dto: UpdatePermissionDto = {
        name: 'updated:permission',
      };
      mockPermissionsService.findOne.mockResolvedValue(null);
      await expect(controller.update('1', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if new name already exists', async () => {
      const dto: UpdatePermissionDto = {
        name: 'updated:permission',
      };
      mockPermissionsService.findOne.mockResolvedValue({
        id: 1,
        name: 'test:permission',
      });
      mockPermissionsService.findByName.mockResolvedValue({
        id: 2,
        name: 'updated:permission',
      });
      await expect(controller.update('1', dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should allow updating with same name', async () => {
      const dto: UpdatePermissionDto = {
        name: 'test:permission',
      };
      mockPermissionsService.findOne.mockResolvedValue({
        id: 1,
        name: 'test:permission',
      });
      mockPermissionsService.update.mockResolvedValue({ id: 1, ...dto });
      const result = await controller.update('1', dto);
      expect(result).toEqual({ id: 1, ...dto });
      expect(mockPermissionsService.update).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('remove', () => {
    it('should remove a permission', async () => {
      mockPermissionsService.findOne.mockResolvedValue({
        id: 1,
        name: 'test:permission',
      });
      mockPermissionsService.remove.mockResolvedValue({
        id: 1,
        name: 'test:permission',
      });
      const result = await controller.remove('1');
      expect(result).toEqual({ id: 1, name: 'test:permission' });
      expect(mockPermissionsService.remove).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if permission does not exist', async () => {
      mockPermissionsService.findOne.mockResolvedValue(null);
      await expect(controller.remove('1')).rejects.toThrow(NotFoundException);
    });
  });
});
