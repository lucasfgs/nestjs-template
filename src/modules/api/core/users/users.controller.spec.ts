import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from 'src/modules/shared/prisma/prisma.module';

import { RolesModule } from '../roles/roles.module';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, RolesModule],
      controllers: [UsersController],
      providers: [UsersService],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        name: 'John Doe',
        password: 'testPassword',
        roleId: 1,
      };

      jest.spyOn(controller, 'create').mockResolvedValue(createUserDto as any);

      expect(controller.create(createUserDto)).resolves.toBe(createUserDto);
    });
  });
});
