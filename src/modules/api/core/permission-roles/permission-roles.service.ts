import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/shared/prisma/prisma.service';

import { CreatePermissionRoleDto } from './dto/create-permission-role.dto';
import { UpdatePermissionRoleDto } from './dto/update-permission-role.dto';

@Injectable()
export class PermissionRolesService {
  constructor(private prismaService: PrismaService) {}

  create(createPermissionRoleDto: CreatePermissionRoleDto) {
    return this.prismaService.permissionRole.create({
      data: createPermissionRoleDto,
    });
  }

  findAll() {
    return this.prismaService.permissionRole.findMany({
      include: {
        permission: true,
        role: true,
      },
    });
  }

  findOne(permissionId: number, roleId: number) {
    return this.prismaService.permissionRole.findFirst({
      where: { AND: [{ permissionId }, { roleId }] },
    });
  }

  update(
    { permissionId, roleId }: { permissionId: number; roleId: number },
    updatePermissionRoleDto: UpdatePermissionRoleDto,
  ) {
    return this.prismaService.permissionRole.update({
      where: {
        roleId_permissionId: {
          permissionId: +permissionId,
          roleId: +roleId,
        },
      },
      data: updatePermissionRoleDto,
    });
  }

  remove(permissionId: number, roleId: number) {
    return this.prismaService.permissionRole.delete({
      where: {
        roleId_permissionId: {
          permissionId: +permissionId,
          roleId: +roleId,
        },
      },
    });
  }
}
