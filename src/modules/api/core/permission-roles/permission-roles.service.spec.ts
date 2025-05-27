import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from 'src/modules/shared/prisma/prisma.module';

import { RolesModule } from '../roles/roles.module';
import { PermissionsModule } from '../permissions/permissions.module';

import { PermissionRolesService } from './permission-roles.service';

describe('PermissionRolesService', () => {
  let service: PermissionRolesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PermissionsModule, RolesModule, PrismaModule],
      providers: [PermissionRolesService],
    }).compile();

    service = module.get<PermissionRolesService>(PermissionRolesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
