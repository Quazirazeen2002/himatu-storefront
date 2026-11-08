import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Role } from "@himatu/shared";
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest().customer,
);
export const Roles = (...roles: Role[]) => SetMetadata("roles", roles);
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly reflector: Reflector;
  constructor(reflector?: Reflector) {
    this.reflector = reflector || new Reflector();
  }
  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<Role[]>("roles", [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;
    const customer = context.switchToHttp().getRequest().customer;
    if (!customer || !roles.includes(customer.role))
      throw new ForbiddenException("Insufficient permissions");
    return true;
  }
}
