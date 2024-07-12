import { Test, TestingModule } from '@nestjs/testing';
import { PermissionRolesService } from './permission-roles.service';

describe('PermissionRolesService', () => {
  let service: PermissionRolesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionRolesService],
    }).compile();

    service = module.get<PermissionRolesService>(PermissionRolesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
