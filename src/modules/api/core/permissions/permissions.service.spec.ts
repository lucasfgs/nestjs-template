import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from 'src/modules/shared/prisma/prisma.module';

import { PermissionsService } from './permissions.service';

describe('PermissionsService', () => {
  let service: PermissionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [PermissionsService],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
