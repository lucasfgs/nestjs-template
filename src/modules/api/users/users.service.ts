import * as bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../shared/prisma/prisma.service';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prismaService: PrismaService) {}

  create(user: CreateUserDto) {
    const { email, name, password, roleId } = user;

    const hashedPassword = bcrypt.hashSync(password, 10);

    return this.prismaService.users.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: {
          connect: {
            id: roleId,
          },
        },
      },
    });
  }

  findAll() {
    return this.prismaService.users.findMany();
  }

  findOne(id: string, options: { withRole: boolean } = null) {
    return this.prismaService.users.findUnique({
      where: { id },
      include: {
        role: options?.withRole || false,
      },
    });
  }

  findByEmail(email: string) {
    return this.prismaService.users.findFirst({
      where: { email },
      include: { role: true },
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
