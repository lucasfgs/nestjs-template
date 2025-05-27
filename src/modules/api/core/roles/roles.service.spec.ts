import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from 'src/modules/shared/prisma/prisma.module';

import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';

describe('RolesService', () => {
  let service: RolesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      controllers: [RolesController],
      providers: [RolesService],
      exports: [RolesService],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
