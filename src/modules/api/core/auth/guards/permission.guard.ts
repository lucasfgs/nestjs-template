import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Method } from 'axios';

import { IS_PUBLIC_KEY } from '@decorators/Public';

import { ALLOW_PERMISSIONS } from 'src/decorators/AllowPermissions';
import { normalizePermissions } from 'src/utils/normalizePermissions';

import { UsersService } from '../../users/users.service';
import { IAuthenticatedUser } from '../dto/authenticate-user.dto';

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

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    if (!allowedPermissions) return true;

    const { user, method } = context
      .switchToHttp()
      .getRequest<{ user: IAuthenticatedUser | null; method: Method }>();

    if (!user) return false;

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
