import bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../infrastructure/prisma/prisma.service';

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

  findOne(id: string) {
    return this.prismaService.users.findUnique({ where: { id } });
  }

  findByEmail(email: string) {
    return this.prismaService.users.findFirst({
      where: { email },
      include: { role: true },
    });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user ${updateUserDto}`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
