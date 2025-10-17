import { Injectable } from '@nestjs/common';
import { Provider } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PaginationDto } from '@common/interceptors/dto/pagination.dto';

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

const includeRole = {
  role: true,
};

interface IFindAllOptions {
  pagination?: PaginationDto;
  returnPermissions?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

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

  async findAll(options: IFindAllOptions = {}) {
    const {
      pagination,
      returnPermissions = false,
      sortBy,
      sortOrder,
    } = options;
    const { page = 1, limit = 10 } = pagination || {};
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prismaService.users.findMany({
        skip,
        take: limit,
        include: returnPermissions ? includePermissions : includeRole,
        orderBy:
          sortBy && sortOrder
            ? {
                [sortBy]: sortOrder,
              }
            : undefined,
      }),
      this.prismaService.users.count(),
    ]);

    return { items, total };
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
