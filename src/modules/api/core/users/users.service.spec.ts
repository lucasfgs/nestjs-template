import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from 'src/modules/shared/prisma/prisma.module';
import { PrismaService } from 'src/modules/shared/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

import { RolesModule } from '../roles/roles.module';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

jest.mock('bcrypt', () => ({
  hashSync: jest.fn().mockReturnValue('hashedPassword'),
}));

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, RolesModule],
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  beforeEach(() => {
    prismaService = {
      users: {
        create: jest.fn().mockResolvedValue(null),
      },
    } as unknown as PrismaService;

    service = new UsersService(prismaService);
  });

  describe('create', () => {
    it('should create a user when roleId is a positive number', async () => {
      const user: CreateUserDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
        roleId: 1,
      };

      await expect(service.create(user)).resolves.not.toThrow();
    });

    it('should hash the password before creating a user', async () => {
      const user: CreateUserDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
        roleId: 1,
      };

      await service.create(user);

      expect(bcrypt.hashSync).toHaveBeenCalledWith(user.password, 10);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      prismaService.users.findMany = jest.fn().mockResolvedValue([]);

      await expect(service.findAll()).resolves.toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      prismaService.users.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.findOne('testId')).resolves.toEqual(null);
    });
  });

  describe('update', () => {
    it('should update a user by id', async () => {
      prismaService.users.update = jest.fn().mockResolvedValue(null);

      await expect(
        service.update('testId', {} as UpdateUserDto),
      ).resolves.not.toThrow();
    });
  });

  describe('remove', () => {
    it('should remove a user by id', async () => {
      prismaService.users.delete = jest.fn().mockResolvedValue(null);

      await expect(service.remove('testId')).resolves.not.toThrow();
    });
  });
});
