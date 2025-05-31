import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Provider } from '@prisma/client';

import { RolesService } from '../../roles/roles.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let mockUsersService: jest.Mocked<Partial<UsersService>>;
  let mockRolesService: jest.Mocked<Partial<RolesService>>;

  beforeEach(async () => {
    mockUsersService = {
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    mockRolesService = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: RolesService, useValue: mockRolesService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a user when email is unique and role exists', async () => {
      const dto: CreateUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        provider: Provider.LOCAL,
        roleId: 1,
      };

      const mockUser = {
        id: '1',
        name: dto.name,
        email: dto.email,
        password: dto.password,
        provider: dto.provider,
        roleId: dto.roleId,
        providerId: 'local',
        created_at: new Date(),
        updated_at: new Date(),
        role: {
          id: 1,
          name: 'user',
          description: 'Regular user',
          permissionRole: [],
        },
      };

      mockUsersService.findByEmail.mockResolvedValue(null);
      mockRolesService.findOne.mockResolvedValue({
        id: 1,
        name: 'user',
        description: 'Regular user',
        permissionRole: [],
      });
      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await controller.create(dto);

      expect(result).toEqual(mockUser);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(mockRolesService.findOne).toHaveBeenCalledWith(dto.roleId);
      expect(mockUsersService.create).toHaveBeenCalledWith(dto);
    });

    it('should throw ConflictException if user already exists', async () => {
      const dto: CreateUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password',
        provider: Provider.LOCAL,
        roleId: 1,
      };

      const existingUser = {
        id: '1',
        name: dto.name,
        email: dto.email,
        password: dto.password,
        provider: dto.provider,
        roleId: dto.roleId,
        providerId: 'local',
        created_at: new Date(),
        updated_at: new Date(),
        role: {
          id: 1,
          name: 'user',
          description: 'Regular user',
          permissionRole: [],
        },
      };

      mockUsersService.findByEmail.mockResolvedValue(existingUser);

      await expect(controller.create(dto)).rejects.toThrow(ConflictException);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(mockRolesService.findOne).not.toHaveBeenCalled();
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if role does not exist', async () => {
      const dto: CreateUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password',
        provider: Provider.LOCAL,
        roleId: 1,
      };

      mockUsersService.findByEmail.mockResolvedValue(null);
      mockRolesService.findOne.mockResolvedValue(null);

      await expect(controller.create(dto)).rejects.toThrow(NotFoundException);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(mockRolesService.findOne).toHaveBeenCalledWith(dto.roleId);
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const mockUsers = [
        {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          password: 'hashedPassword',
          provider: Provider.LOCAL,
          roleId: 1,
          providerId: '123',
          created_at: new Date(),
          updated_at: new Date(),
          role: {
            id: 1,
            name: 'user',
            description: 'Regular user',
            permissionRole: [],
          },
        },
      ];

      mockUsersService.findAll.mockResolvedValue({
        items: mockUsers,
        total: 1,
      });

      const result = await controller.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({
        items: mockUsers,
        total: 1,
      });
      expect(mockUsersService.findAll).toHaveBeenCalledWith({
        pagination: { page: 1, limit: 10 },
      });
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        password: 'password',
        provider: Provider.LOCAL,
        roleId: 1,
        providerId: 'local',
        created_at: new Date(),
        updated_at: new Date(),
        role: {
          id: 1,
          name: 'user',
          description: 'Regular user',
          permissionRole: [],
        },
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockUser);
      expect(mockUsersService.findOne).toHaveBeenCalledWith('1', {
        returnPermissions: true,
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockUsersService.findOne.mockResolvedValue(null);
      await expect(controller.findOne('1')).rejects.toThrow(NotFoundException);
      expect(mockUsersService.findOne).toHaveBeenCalledWith('1', {
        returnPermissions: true,
      });
    });
  });

  describe('update', () => {
    it('should update a user when email is unique and role exists', async () => {
      const dto: UpdateUserDto = { name: 'Updated User' };
      const existingUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        password: 'password',
        provider: Provider.LOCAL,
        roleId: 1,
        providerId: 'local',
        created_at: new Date(),
        updated_at: new Date(),
        role: {
          id: 1,
          name: 'user',
          description: 'Regular user',
          permissionRole: [],
        },
      };
      const updatedUser = { ...existingUser, ...dto };

      mockUsersService.findOne.mockResolvedValue(existingUser);
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockRolesService.findOne.mockResolvedValue({
        id: 1,
        name: 'user',
        description: 'Regular user',
        permissionRole: [],
      });
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update('1', dto);

      expect(result).toEqual(updatedUser);
      expect(mockUsersService.findOne).toHaveBeenCalledWith('1');
      expect(mockUsersService.update).toHaveBeenCalledWith('1', dto);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const dto: UpdateUserDto = { name: 'Updated User' };
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(controller.update('1', dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUsersService.findOne).toHaveBeenCalledWith('1');
      expect(mockUsersService.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      const dto: UpdateUserDto = {
        email: 'updated@example.com',
        roleId: 2,
      };

      const existingUser = {
        id: '1',
        email: 'test@example.com',
        roleId: 1,
        name: 'Test User',
        password: 'password',
        provider: Provider.LOCAL,
        providerId: 'local',
        created_at: new Date(),
        updated_at: new Date(),
        role: {
          id: 1,
          name: 'user',
          description: 'Regular user',
          permissionRole: [],
        },
      };

      const userWithSameEmail = {
        id: '2',
        email: 'updated@example.com',
        name: 'Test User',
        password: 'password',
        provider: Provider.LOCAL,
        roleId: 1,
        providerId: 'local',
        created_at: new Date(),
        updated_at: new Date(),
        role: {
          id: 1,
          name: 'user',
          description: 'Regular user',
          permissionRole: [],
        },
      };

      mockUsersService.findOne.mockResolvedValue(existingUser);
      mockUsersService.findByEmail.mockResolvedValue(userWithSameEmail);

      await expect(controller.update('1', dto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUsersService.findOne).toHaveBeenCalledWith('1');
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(mockUsersService.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if role does not exist', async () => {
      const dto: UpdateUserDto = {
        email: 'updated@example.com',
        roleId: 2,
      };

      const existingUser = {
        id: '1',
        email: 'test@example.com',
        roleId: 1,
        name: 'Test User',
        password: 'password',
        provider: Provider.LOCAL,
        providerId: 'local',
        created_at: new Date(),
        updated_at: new Date(),
        role: {
          id: 1,
          name: 'user',
          description: 'Regular user',
          permissionRole: [],
        },
      };

      mockUsersService.findOne.mockResolvedValue(existingUser);
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockRolesService.findOne.mockResolvedValue(null);

      await expect(controller.update('1', dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUsersService.findOne).toHaveBeenCalledWith('1');
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(mockRolesService.findOne).toHaveBeenCalledWith(dto.roleId);
      expect(mockUsersService.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        password: 'password',
        provider: Provider.LOCAL,
        roleId: 1,
        providerId: 'local',
        created_at: new Date(),
        updated_at: new Date(),
        role: {
          id: 1,
          name: 'user',
          description: 'Regular user',
          permissionRole: [],
        },
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockUsersService.remove.mockResolvedValue(mockUser);

      const result = await controller.remove('1');

      expect(result).toEqual(mockUser);
      expect(mockUsersService.findOne).toHaveBeenCalledWith('1');
      expect(mockUsersService.remove).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(controller.remove('1')).rejects.toThrow(NotFoundException);
      expect(mockUsersService.findOne).toHaveBeenCalledWith('1');
      expect(mockUsersService.remove).not.toHaveBeenCalled();
    });
  });
});
