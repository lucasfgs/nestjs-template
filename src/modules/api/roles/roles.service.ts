import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/shared/prisma/prisma.service';
import { EventsGateway } from 'src/modules/shared/events/events.gateway';

import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    private prismaService: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

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

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    const updatedRole = await this.prismaService.roles.update({
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
      include: {
        permissionRole: {
          include: {
            permission: true,
          },
        },
      },
    });

    // Emit a websocket event to clients with the same role
    this.eventsGateway.io.sockets.sockets.forEach(async (client) => {
      // Check if the client's role matches
      if (client.user.role.toLowerCase() === updatedRole.name.toLowerCase()) {
        // Get the updated role with permissions from database
        const permissions = updatedRole.permissionRole?.map(
          (permissionRole) => ({
            name: permissionRole.permission.name,
            create: permissionRole.create,
            read: permissionRole.read,
            update: permissionRole.update,
            delete: permissionRole.delete,
          }),
        );

        // Emit the updated role with permissions to the client
        client.emit('roles:update', {
          permissions,
        });
      }
    });

    return updatedRole;
  }

  async remove(id: number) {
    // Check if there's a user with this role
    const userWithRole = await this.prismaService.users.findFirst({
      where: {
        roleId: id,
      },
    });

    if (userWithRole) {
      throw new Error('Cannot delete role with users');
    }

    return this.prismaService.roles.delete({
      where: {
        id,
      },
    });
  }
}
