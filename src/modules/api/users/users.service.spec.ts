import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from 'src/modules/shared/prisma/prisma.module';
import { PrismaService } from 'src/modules/shared/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

import { RolesModule } from '../roles/roles.module';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

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
        roleId: 1, // Valid roleId
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
});
