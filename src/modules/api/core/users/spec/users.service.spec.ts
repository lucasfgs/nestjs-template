import { Test, TestingModule } from '@nestjs/testing';
import { Provider } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UsersService } from '../users.service';

jest.mock('bcrypt', () => ({
  hashSync: jest.fn().mockReturnValue('hashedPassword'),
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compareSync: jest.fn().mockReturnValue(true),
}));

describe('UsersService', () => {
  let service: UsersService;

  const mockPrismaService = {
    users: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user with hashed password', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
        roleId: 1,
        provider: Provider.LOCAL,
      };

      const expectedUser = {
        ...createUserDto,
        password: 'hashedPassword',
      };

      mockPrismaService.users.create.mockResolvedValue(expectedUser);

      const result = await service.create(createUserDto);

      expect(result).toEqual(expectedUser);
      expect(mockPrismaService.users.create).toHaveBeenCalledWith({
        data: {
          email: createUserDto.email,
          name: createUserDto.name,
          password: 'hashedPassword',
          provider: Provider.LOCAL,
          providerId: undefined,
          role: {
            connect: {
              id: createUserDto.roleId,
            },
          },
        },
      });
      expect(bcrypt.compareSync(createUserDto.password, result.password)).toBe(
        true,
      );
    });

    it('should create a user without password for OAuth', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        name: 'Test User',
        roleId: 1,
        provider: Provider.GOOGLE,
        providerId: 'google-id',
      };

      const expectedUser = {
        ...createUserDto,
        password: null,
      };

      mockPrismaService.users.create.mockResolvedValue(expectedUser);

      const result = await service.create(createUserDto);

      expect(result).toEqual(expectedUser);
      expect(mockPrismaService.users.create).toHaveBeenCalledWith({
        data: {
          email: createUserDto.email,
          name: createUserDto.name,
          password: null,
          provider: createUserDto.provider,
          providerId: createUserDto.providerId,
          role: {
            connect: {
              id: createUserDto.roleId,
            },
          },
        },
      });
    });

    it('should include permissions when requested', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
        roleId: 1,
        provider: Provider.LOCAL,
      };

      const expectedUser = {
        ...createUserDto,
        password: 'hashedPassword',
        role: {
          permissionRole: [
            {
              permission: {
                name: 'test',
              },
            },
          ],
        },
      };

      mockPrismaService.users.create.mockResolvedValue(expectedUser);

      const result = await service.create(createUserDto, {
        returnPermissions: true,
      });

      expect(result).toEqual(expectedUser);
      expect(mockPrismaService.users.create).toHaveBeenCalledWith({
        data: {
          email: createUserDto.email,
          name: createUserDto.name,
          password: 'hashedPassword',
          provider: Provider.LOCAL,
          providerId: undefined,
          role: {
            connect: {
              id: createUserDto.roleId,
            },
          },
        },
        include: {
          role: {
            include: {
              permissionRole: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });
    });
  });

  describe('findByProvider', () => {
    it('should find a user by provider and providerId', async () => {
      const provider = Provider.GOOGLE;
      const providerId = 'google-id';
      const expectedUser = {
        id: 1,
        email: 'test@example.com',
        provider,
        providerId,
      };

      mockPrismaService.users.findFirst.mockResolvedValue(expectedUser);

      const result = await service.findByProvider(provider, providerId);

      expect(result).toEqual(expectedUser);
      expect(mockPrismaService.users.findFirst).toHaveBeenCalledWith({
        where: { provider, providerId },
      });
    });

    it('should include permissions when requested', async () => {
      const provider = Provider.GOOGLE;
      const providerId = 'google-id';
      const expectedUser = {
        id: 1,
        email: 'test@example.com',
        provider,
        providerId,
        role: {
          permissionRole: [
            {
              permission: {
                name: 'test',
              },
            },
          ],
        },
      };

      mockPrismaService.users.findFirst.mockResolvedValue(expectedUser);

      const result = await service.findByProvider(provider, providerId, {
        returnPermissions: true,
      });

      expect(result).toEqual(expectedUser);
      expect(mockPrismaService.users.findFirst).toHaveBeenCalledWith({
        where: { provider, providerId },
        include: {
          role: {
            include: {
              permissionRole: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const expectedUsers = [
        { id: 1, email: 'test1@example.com' },
        { id: 2, email: 'test2@example.com' },
      ];

      mockPrismaService.users.findMany.mockResolvedValue(expectedUsers);
      mockPrismaService.users.count.mockResolvedValue(2);

      const result = await service.findAll();

      expect(result).toEqual({ items: expectedUsers, total: 2 });
      expect(mockPrismaService.users.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        include: { role: true },
      });
    });

    it('should apply sorting when sortBy and sortOrder are provided', async () => {
      const expectedUsers = [
        { id: 1, email: 'test1@example.com' },
        { id: 2, email: 'test2@example.com' },
      ];

      mockPrismaService.users.findMany.mockResolvedValue(expectedUsers);
      mockPrismaService.users.count.mockResolvedValue(2);

      const result = await service.findAll({
        sortBy: 'email',
        sortOrder: 'asc',
      });

      expect(result).toEqual({ items: expectedUsers, total: 2 });
      expect(mockPrismaService.users.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        include: { role: true },
        orderBy: {
          email: 'asc',
        },
      });
    });

    it('should not apply sorting when only sortBy is provided', async () => {
      const expectedUsers = [
        { id: 1, email: 'test1@example.com' },
        { id: 2, email: 'test2@example.com' },
      ];

      mockPrismaService.users.findMany.mockResolvedValue(expectedUsers);
      mockPrismaService.users.count.mockResolvedValue(2);

      const result = await service.findAll({
        sortBy: 'email',
      });

      expect(result).toEqual({ items: expectedUsers, total: 2 });
      expect(mockPrismaService.users.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        include: { role: true },
        orderBy: undefined,
      });
    });

    it('should not apply sorting when only sortOrder is provided', async () => {
      const expectedUsers = [
        { id: 1, email: 'test1@example.com' },
        { id: 2, email: 'test2@example.com' },
      ];

      mockPrismaService.users.findMany.mockResolvedValue(expectedUsers);
      mockPrismaService.users.count.mockResolvedValue(2);

      const result = await service.findAll({
        sortOrder: 'asc',
      });

      expect(result).toEqual({ items: expectedUsers, total: 2 });
      expect(mockPrismaService.users.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        include: { role: true },
        orderBy: undefined,
      });
    });
  });

  describe('findOne', () => {
    it('should find a user by id', async () => {
      const id = '1';
      const expectedUser = {
        id,
        email: 'test@example.com',
      };

      mockPrismaService.users.findUnique.mockResolvedValue(expectedUser);

      const result = await service.findOne(id);

      expect(result).toEqual(expectedUser);
      expect(mockPrismaService.users.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
    });

    it('should include permissions when requested', async () => {
      const id = '1';
      const expectedUser = {
        id,
        email: 'test@example.com',
        role: {
          permissionRole: [
            {
              permission: {
                name: 'test',
              },
            },
          ],
        },
      };

      mockPrismaService.users.findUnique.mockResolvedValue(expectedUser);

      const result = await service.findOne(id, { returnPermissions: true });

      expect(result).toEqual(expectedUser);
      expect(mockPrismaService.users.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: {
          role: {
            include: {
              permissionRole: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });
    });
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      const email = 'test@example.com';
      const expectedUser = {
        id: 1,
        email,
      };

      mockPrismaService.users.findFirst.mockResolvedValue(expectedUser);

      const result = await service.findByEmail(email);

      expect(result).toEqual(expectedUser);
      expect(mockPrismaService.users.findFirst).toHaveBeenCalledWith({
        where: { email },
      });
    });

    it('should include permissions when requested', async () => {
      const email = 'test@example.com';
      const expectedUser = {
        id: 1,
        email,
        role: {
          permissionRole: [
            {
              permission: {
                name: 'test',
              },
            },
          ],
        },
      };

      mockPrismaService.users.findFirst.mockResolvedValue(expectedUser);

      const result = await service.findByEmail(email, {
        returnPermissions: true,
      });

      expect(result).toEqual(expectedUser);
      expect(mockPrismaService.users.findFirst).toHaveBeenCalledWith({
        where: { email },
        include: {
          role: {
            include: {
              permissionRole: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const id = '1';
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };
      const expectedUser = {
        id,
        ...updateUserDto,
      };

      mockPrismaService.users.update.mockResolvedValue(expectedUser);

      const result = await service.update(id, updateUserDto);

      expect(result).toEqual(expectedUser);
      expect(mockPrismaService.users.update).toHaveBeenCalledWith({
        where: { id },
        data: updateUserDto,
      });
    });

    it('should hash password when updating', async () => {
      const id = '1';
      const updateUserDto: UpdateUserDto = {
        password: 'newpassword',
      };
      const expectedUser = {
        id,
        password: 'hashedPassword',
      };

      mockPrismaService.users.update.mockResolvedValue(expectedUser);

      const result = await service.update(id, updateUserDto);

      expect(result).toEqual(expectedUser);
      expect(mockPrismaService.users.update).toHaveBeenCalledWith({
        where: { id },
        data: {
          ...updateUserDto,
          password: 'hashedPassword',
        },
      });
      expect(bcrypt.compareSync(updateUserDto.password, result.password)).toBe(
        true,
      );
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      const id = '1';
      const expectedUser = {
        id,
        email: 'test@example.com',
      };

      mockPrismaService.users.delete.mockResolvedValue(expectedUser);

      const result = await service.remove(id);

      expect(result).toEqual(expectedUser);
      expect(mockPrismaService.users.delete).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });
});
