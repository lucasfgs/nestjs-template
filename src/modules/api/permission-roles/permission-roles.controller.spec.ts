import { Test, TestingModule } from '@nestjs/testing';
import { PermissionRolesController } from './permission-roles.controller';
import { PermissionRolesService } from './permission-roles.service';

describe('PermissionRolesController', () => {
  let controller: PermissionRolesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionRolesController],
      providers: [PermissionRolesService],
    }).compile();

    controller = module.get<PermissionRolesController>(PermissionRolesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
