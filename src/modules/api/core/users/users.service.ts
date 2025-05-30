import { Injectable } from '@nestjs/common';
import { Provider } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../../shared/prisma/prisma.service';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const includePermissions = {
  role: {
    include: {
      permissionRole: {
        include: {
          permission: true,
        },
      },
    },
  },
};

@Injectable()
export class UsersService {
  constructor(private prismaService: PrismaService) {}

  create(user: CreateUserDto, options: { returnPermissions?: boolean } = {}) {
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
      ...(options.returnPermissions && { include: includePermissions }),
    });
  }

  findByProvider(
    provider: Provider,
    providerId: string,
    options: { returnPermissions?: boolean } = {},
  ) {
    return this.prismaService.users.findFirst({
      where: { provider, providerId },
      ...(options.returnPermissions && { include: includePermissions }),
    });
  }

  findAll() {
    return this.prismaService.users.findMany();
  }

  findOne(id: string, options: { returnPermissions?: boolean } = {}) {
    return this.prismaService.users.findUnique({
      where: { id },
      ...(options.returnPermissions && { include: includePermissions }),
    });
  }

  findByEmail(email: string, options: { returnPermissions?: boolean } = {}) {
    return this.prismaService.users.findFirst({
      where: { email },
      ...(options.returnPermissions && { include: includePermissions }),
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
