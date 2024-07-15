import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/shared/prisma/prisma.service';

import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private prismaService: PrismaService) {}

  create(createRoleDto: CreateRoleDto) {
    return this.prismaService.roles.create({
      data: createRoleDto,
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
    });
  }

  update(id: number, updateRoleDto: UpdateRoleDto) {
    return this.prismaService.roles.update({
      where: {
        id,
      },
      data: updateRoleDto,
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
