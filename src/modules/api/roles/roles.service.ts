import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/shared/prisma/prisma.service';

import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private prismaService: PrismaService) {}

  create(createRoleDto: CreateRoleDto) {
    return this.prismaService.roles.create({
      data: {
        name: createRoleDto.name,
        description: createRoleDto.description,
        permissionRole: {
          create: createRoleDto.permissions.map((permission) => ({
            permission: { connect: { id: permission.permissionId } },
            create: permission.create,
            read: permission.read,
            update: permission.update,
            delete: permission.delete,
          })),
        },
      },
    });
  }

  findAll() {
    return this.prismaService.roles.findMany();
  }

  findByName(name: string) {
    return this.prismaService.roles.findUnique({
      where: {
        name,
      },
    });
  }

  findOne(id: number) {
    return this.prismaService.roles.findUnique({
      where: {
        id,
      },
      include: {
        permissionRole: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  update(id: number, updateRoleDto: UpdateRoleDto) {
    return this.prismaService.roles.update({
      where: {
        id,
      },
      data: {
        name: updateRoleDto.name,
        description: updateRoleDto.description,
        permissionRole: {
          upsert: updateRoleDto.permissions.map((permission) => ({
            where: {
              roleId_permissionId: {
                roleId: id,
                permissionId: permission.permissionId,
              },
            },
            update: {
              create: permission.create,
              read: permission.read,
              update: permission.update,
              delete: permission.delete,
            },
            create: {
              permission: { connect: { id: permission.permissionId } },
              create: permission.create,
              read: permission.read,
              update: permission.update,
              delete: permission.delete,
            },
          })),
        },
      },
    });
  }

  remove(id: number) {
    return this.prismaService.roles.delete({
      where: {
        id,
      },
    });
  }
}
