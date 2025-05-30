import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from 'src/modules/shared/prisma/prisma.service';

import { CreatePermissionRoleDto } from '../dto/create-permission-role.dto';
import { UpdatePermissionRoleDto } from '../dto/update-permission-role.dto';
import { PermissionRolesService } from '../permission-roles.service';

describe('PermissionRolesService', () => {
  let service: PermissionRolesService;

  const mockPrismaService = {
    permissionRole: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionRolesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PermissionRolesService>(PermissionRolesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a permission role', async () => {
      const createPermissionRoleDto: CreatePermissionRoleDto = {
        permissionId: 1,
        roleId: 1,
        create: true,
        read: true,
        update: false,
        delete: false,
      };
      const expectedPermissionRole = { id: 1, ...createPermissionRoleDto };
      mockPrismaService.permissionRole.create.mockResolvedValue(
        expectedPermissionRole,
      );
      const result = await service.create(createPermissionRoleDto);
      expect(result).toEqual(expectedPermissionRole);
      expect(mockPrismaService.permissionRole.create).toHaveBeenCalledWith({
        data: createPermissionRoleDto,
      });
    });
  });

  describe('findAll', () => {
    it('should return all permission roles with permission and role', async () => {
      const expectedPermissionRoles = [
        {
          id: 1,
          permission: { id: 1, name: 'perm1' },
          role: { id: 1, name: 'role1' },
        },
      ];
      mockPrismaService.permissionRole.findMany.mockResolvedValue(
        expectedPermissionRoles,
      );
      const result = await service.findAll();
      expect(result).toEqual(expectedPermissionRoles);
      expect(mockPrismaService.permissionRole.findMany).toHaveBeenCalledWith({
        include: {
          permission: true,
          role: true,
        },
      });
    });
  });

  describe('findOne', () => {
    it('should find a permission role by permissionId and roleId', async () => {
      const permissionId = 1;
      const roleId = 1;
      const expectedPermissionRole = {
        id: 1,
        permissionId,
        roleId,
      };
      mockPrismaService.permissionRole.findFirst.mockResolvedValue(
        expectedPermissionRole,
      );
      const result = await service.findOne(permissionId, roleId);
      expect(result).toEqual(expectedPermissionRole);
      expect(mockPrismaService.permissionRole.findFirst).toHaveBeenCalledWith({
        where: { AND: [{ permissionId }, { roleId }] },
      });
    });
  });

  describe('update', () => {
    it('should update a permission role', async () => {
      const permissionId = 1;
      const roleId = 1;
      const updatePermissionRoleDto: UpdatePermissionRoleDto = {
        create: false,
        read: true,
        update: true,
        delete: false,
      };
      const expectedPermissionRole = {
        id: 1,
        permissionId,
        roleId,
        ...updatePermissionRoleDto,
      };
      mockPrismaService.permissionRole.update.mockResolvedValue(
        expectedPermissionRole,
      );
      const result = await service.update(
        { permissionId, roleId },
        updatePermissionRoleDto,
      );
      expect(result).toEqual(expectedPermissionRole);
      expect(mockPrismaService.permissionRole.update).toHaveBeenCalledWith({
        where: {
          roleId_permissionId: {
            permissionId,
            roleId,
          },
        },
        data: updatePermissionRoleDto,
      });
    });
  });

  describe('remove', () => {
    it('should remove a permission role', async () => {
      const permissionId = 1;
      const roleId = 1;
      const expectedPermissionRole = {
        id: 1,
        permissionId,
        roleId,
      };
      mockPrismaService.permissionRole.delete.mockResolvedValue(
        expectedPermissionRole,
      );
      const result = await service.remove(permissionId, roleId);
      expect(result).toEqual(expectedPermissionRole);
      expect(mockPrismaService.permissionRole.delete).toHaveBeenCalledWith({
        where: {
          roleId_permissionId: {
            permissionId,
            roleId,
          },
        },
      });
    });
  });
});
