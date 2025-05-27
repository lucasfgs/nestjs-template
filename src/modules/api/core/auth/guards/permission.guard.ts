import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Method } from 'axios';
import { ALLOW_PERMISSIONS } from 'src/decorators/AllowPermissions';
import { normalizePermissions } from 'src/utils/normalizePermissions';

import { IAuthenticatedUser } from '../dto/authenticate-user.dto';
import { UsersService } from '../../users/users.service';

const MethodPermissions = {
  POST: 'create',
  GET: 'read',
  PUT: 'update',
  PATCH: 'update',
  DELETE: 'delete',
};

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowedPermissions = this.reflector.getAllAndOverride(
      ALLOW_PERMISSIONS,
      [context.getHandler(), context.getClass()],
    );

    if (!allowedPermissions) return true;

    const { user, method } = context
      .switchToHttp()
      .getRequest<{ user: IAuthenticatedUser; method: Method }>();

    const storedUser = await this.usersService.findOne(user.sub, {
      withPermissions: true,
    });

    const userNormalizerPermissions = normalizePermissions(storedUser);

    const mappedMathod = MethodPermissions[method];

    return (
      userNormalizerPermissions?.some((permission) => {
        return (
          allowedPermissions.includes(permission.name.toLowerCase()) &&
          permission[mappedMathod]
        );
      }) || false
    );
  }
}
