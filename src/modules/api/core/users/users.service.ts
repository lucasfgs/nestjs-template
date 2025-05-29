import { Injectable } from '@nestjs/common';
import { Provider } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../../shared/prisma/prisma.service';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prismaService: PrismaService) {}

  create(user: CreateUserDto, options: { withPermissions: boolean } = null) {
    const { email, name, password, roleId, provider, providerId } = user;

    const hashedPassword = password ? bcrypt.hashSync(password, 10) : null;

    return this.prismaService.users.create({
      data: {
        email,
        name,
        password: hashedPassword,
        provider,
        providerId,
        role: {
          connect: {
            id: roleId,
          },
        },
      },
      ...(options?.withPermissions && {
        include: {
          role: {
            include: {
              permissionRole: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      }),
    });
  }

  findByProvider(
    provider: Provider,
    providerId: string,
    options: { withPermissions: boolean } = null,
  ) {
    return this.prismaService.users.findFirst({
      where: { provider, providerId },
      ...(options?.withPermissions && {
        include: {
          role: {
            include: {
              permissionRole: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      }),
    });
  }

  findAll() {
    return this.prismaService.users.findMany();
  }

  findOne(id: string, options: { withPermissions: boolean } = null) {
    return this.prismaService.users.findUnique({
      where: { id },
      ...(options?.withPermissions && {
        include: {
          role: {
            include: {
              permissionRole: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      }),
    });
  }

  findByEmail(email: string, withPermissions: boolean = false) {
    return this.prismaService.users.findFirst({
      where: { email },
      ...(withPermissions && {
        include: {
          role: {
            include: {
              permissionRole: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      }),
    });
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      updateUserDto.password = bcrypt.hashSync(updateUserDto.password, 10);
    }

    return this.prismaService.users.update({
      where: { id },
      data: updateUserDto,
    });
  }

  remove(id: string) {
    return this.prismaService.users.delete({ where: { id } });
  }
}
