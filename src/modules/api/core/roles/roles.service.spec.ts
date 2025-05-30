import { Test, TestingModule } from '@nestjs/testing';

import { EventsGateway } from 'src/modules/shared/events/events.gateway';
import { PrismaService } from 'src/modules/shared/prisma/prisma.service';

import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

describe('RolesService', () => {
  let service: RolesService;

  const mockPrismaService = {
    roles: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    users: {
      findFirst: jest.fn(),
    },
  };

  const mockEventsGateway = {
    io: {
      sockets: {
        sockets: new Map(),
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EventsGateway,
          useValue: mockEventsGateway,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a role with permissions', async () => {
      const createRoleDto: CreateRoleDto = {
        name: 'test-role',
        description: 'Test role description',
        permissions: [
          {
            permissionId: 1,
            create: true,
            read: true,
            update: false,
            delete: false,
          },
        ],
      };

      const expectedRole = {
        id: 1,
        ...createRoleDto,
      };

      mockPrismaService.roles.create.mockResolvedValue(expectedRole);

      const result = await service.create(createRoleDto);

      expect(result).toEqual(expectedRole);
      expect(mockPrismaService.roles.create).toHaveBeenCalledWith({
        data: {
          name: createRoleDto.name,
          description: createRoleDto.description,
          permissionRole: {
            create: createRoleDto.permissions.map((permission) => ({
              permission: { connect: { id: permission.permissionId } },
              create: permission.create,
              read: permission.read,
              update: permission.update,
              delete: permission.delete,
            })),
          },
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of roles', async () => {
      const expectedRoles = [
        { id: 1, name: 'role1' },
        { id: 2, name: 'role2' },
      ];

      mockPrismaService.roles.findMany.mockResolvedValue(expectedRoles);

      const result = await service.findAll();

      expect(result).toEqual(expectedRoles);
      expect(mockPrismaService.roles.findMany).toHaveBeenCalled();
    });
  });

  describe('findByName', () => {
    it('should find a role by name', async () => {
      const name = 'test-role';
      const expectedRole = {
        id: 1,
        name,
      };

      mockPrismaService.roles.findUnique.mockResolvedValue(expectedRole);

      const result = await service.findByName(name);

      expect(result).toEqual(expectedRole);
      expect(mockPrismaService.roles.findUnique).toHaveBeenCalledWith({
        where: { name },
      });
    });
  });

  describe('findOne', () => {
    it('should find a role by id with permissions', async () => {
      const id = 1;
      const expectedRole = {
        id,
        name: 'test-role',
        permissionRole: [
          {
            permission: {
              name: 'test',
            },
            create: true,
            read: true,
            update: false,
            delete: false,
          },
        ],
      };

      mockPrismaService.roles.findUnique.mockResolvedValue(expectedRole);

      const result = await service.findOne(id);

      expect(result).toEqual(expectedRole);
      expect(mockPrismaService.roles.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: {
          permissionRole: {
            include: {
              permission: true,
            },
          },
        },
      });
    });
  });

  describe('update', () => {
    it('should update a role and emit event to clients with same role', async () => {
      const id = 1;
      const updateRoleDto: UpdateRoleDto = {
        name: 'updated-role',
        description: 'Updated role description',
        permissions: [
          {
            permissionId: 1,
            create: true,
            read: true,
            update: true,
            delete: false,
          },
        ],
      };

      const mockSocket = {
        user: { role: 'updated-role' },
        emit: jest.fn(),
      };

      mockEventsGateway.io.sockets.sockets.set('socket1', mockSocket);

      const expectedRole = {
        id,
        name: updateRoleDto.name,
        description: updateRoleDto.description,
        permissionRole: [
          {
            permission: {
              name: 'test',
            },
            create: true,
            read: true,
            update: true,
            delete: false,
          },
        ],
      };

      mockPrismaService.roles.update.mockResolvedValue(expectedRole);

      const result = await service.update(id, updateRoleDto);

      expect(result).toEqual(expectedRole);
      expect(mockPrismaService.roles.update).toHaveBeenCalledWith({
        where: { id },
        data: {
          name: updateRoleDto.name,
          description: updateRoleDto.description,
          permissionRole: {
            upsert: updateRoleDto.permissions.map((permission) => ({
              where: {
                roleId_permissionId: {
                  roleId: id,
                  permissionId: permission.permissionId,
                },
              },
              update: {
                create: permission.create,
                read: permission.read,
                update: permission.update,
                delete: permission.delete,
              },
              create: {
                permission: { connect: { id: permission.permissionId } },
                create: permission.create,
                read: permission.read,
                update: permission.update,
                delete: permission.delete,
              },
            })),
          },
        },
        include: {
          permissionRole: {
            include: {
              permission: true,
            },
          },
        },
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('roles:update', {
        permissions: [
          {
            name: 'test',
            create: true,
            read: true,
            update: true,
            delete: false,
          },
        ],
      });
    });
  });

  describe('remove', () => {
    it('should remove a role when no users have it', async () => {
      const id = 1;
      const expectedRole = {
        id,
        name: 'test-role',
      };

      mockPrismaService.users.findFirst.mockResolvedValue(null);
      mockPrismaService.roles.delete.mockResolvedValue(expectedRole);

      const result = await service.remove(id);

      expect(result).toEqual(expectedRole);
      expect(mockPrismaService.roles.delete).toHaveBeenCalledWith({
        where: { id },
      });
    });

    it('should throw error when trying to remove role with users', async () => {
      const id = 1;
      mockPrismaService.users.findFirst.mockResolvedValue({ id: 1 });
      mockPrismaService.roles.delete.mockRejectedValue(
        new Error('Cannot delete role with users'),
      );

      await expect(service.remove(id)).rejects.toThrow(
        'Cannot delete role with users',
      );
      expect(mockPrismaService.roles.delete).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });
});
