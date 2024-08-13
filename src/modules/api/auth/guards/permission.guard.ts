import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Method } from 'axios';
import { ALLOW_PERMISSIONS } from 'src/decorators/AllowPermissions';

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
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedPermissions = this.reflector.getAllAndOverride(
      ALLOW_PERMISSIONS,
      [context.getHandler(), context.getClass()],
    );

    if (!allowedPermissions) return true;

    const { user, method } = context
      .switchToHttp()
      .getRequest<{ user: IAuthenticatedUser; method: Method }>();

    const mappedMathod = MethodPermissions[method];

    return (
      user.permissions?.some((permission) => {
        return (
          allowedPermissions.includes(permission.name) &&
          permission[mappedMathod]
        );
      }) || false
    );
  }
}
