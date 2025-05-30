import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from 'src/modules/shared/prisma/prisma.service';

import { CreatePermissionDto } from '../dto/create-permission.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { PermissionsService } from '../permissions.service';

describe('PermissionsService', () => {
  let service: PermissionsService;

  const mockPrismaService = {
    permissions: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a permission', async () => {
      const createPermissionDto: CreatePermissionDto = {
        name: 'test-permission',
      };
      const expectedPermission = {
        id: 1,
        ...createPermissionDto,
        description: 'Test permission',
      };
      mockPrismaService.permissions.create.mockResolvedValue(
        expectedPermission,
      );
      const result = await service.create(createPermissionDto);
      expect(result).toEqual(expectedPermission);
      expect(mockPrismaService.permissions.create).toHaveBeenCalledWith({
        data: createPermissionDto,
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of permissions', async () => {
      const expectedPermissions = [
        {
          id: 1,
          name: 'test-permission-1',
          description: 'Test permission 1',
        },
        {
          id: 2,
          name: 'test-permission-2',
          description: 'Test permission 2',
        },
      ];
      mockPrismaService.permissions.findMany.mockResolvedValue(
        expectedPermissions,
      );
      const result = await service.findAll();
      expect(result).toEqual(expectedPermissions);
      expect(mockPrismaService.permissions.findMany).toHaveBeenCalled();
    });
  });

  describe('findByName', () => {
    it('should return a permission by name', async () => {
      const expectedPermission = {
        id: 1,
        name: 'test-permission',
        description: 'Test permission',
      };
      mockPrismaService.permissions.findFirst.mockResolvedValue(
        expectedPermission,
      );
      const result = await service.findByName('test-permission');
      expect(result).toEqual(expectedPermission);
      expect(mockPrismaService.permissions.findFirst).toHaveBeenCalledWith({
        where: { name: 'test-permission' },
      });
    });

    it('should return null when permission is not found', async () => {
      mockPrismaService.permissions.findFirst.mockResolvedValue(null);
      const result = await service.findByName('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('findOne', () => {
    it('should return a permission by id', async () => {
      const expectedPermission = {
        id: 1,
        name: 'test-permission',
        description: 'Test permission',
      };
      mockPrismaService.permissions.findUnique.mockResolvedValue(
        expectedPermission,
      );
      const result = await service.findOne(1);
      expect(result).toEqual(expectedPermission);
      expect(mockPrismaService.permissions.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should return null when permission is not found', async () => {
      mockPrismaService.permissions.findUnique.mockResolvedValue(null);
      const result = await service.findOne(999);
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a permission', async () => {
      const updatePermissionDto: UpdatePermissionDto = {
        name: 'updated-permission',
      };
      const expectedPermission = {
        id: 1,
        ...updatePermissionDto,
        description: 'Updated permission',
      };
      mockPrismaService.permissions.update.mockResolvedValue(
        expectedPermission,
      );
      const result = await service.update(1, updatePermissionDto);
      expect(result).toEqual(expectedPermission);
      expect(mockPrismaService.permissions.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updatePermissionDto,
      });
    });
  });

  describe('remove', () => {
    it('should remove a permission', async () => {
      const expectedPermission = {
        id: 1,
        name: 'test-permission',
        description: 'Test permission',
      };
      mockPrismaService.permissions.delete.mockResolvedValue(
        expectedPermission,
      );
      const result = await service.remove(1);
      expect(result).toEqual(expectedPermission);
      expect(mockPrismaService.permissions.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});
