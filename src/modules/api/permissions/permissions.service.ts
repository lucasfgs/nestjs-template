import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/shared/prisma/prisma.service';

import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(private prismaService: PrismaService) {}
  create(createPermissionDto: CreatePermissionDto) {
    return this.prismaService.permissions.create({
      data: createPermissionDto,
    });
  }

  findAll() {
    return this.prismaService.permissions.findMany();
  }

  findByName(name: string) {
    return this.prismaService.permissions.findFirst({
      where: { name },
    });
  }

  findOne(id: number) {
    return this.prismaService.permissions.findUnique({ where: { id } });
  }

  update(id: number, updatePermissionDto: UpdatePermissionDto) {
    return this.prismaService.permissions.update({
      where: {
        id,
      },
      data: updatePermissionDto,
    });
  }

  remove(id: number) {
    return this.prismaService.permissions.delete({ where: { id } });
  }
}
