import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { SupabaseAuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(SupabaseAuthService) private readonly auth: SupabaseAuthService,
    @Inject(UsersService) private readonly users: UsersService,
  ) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const authorization = req.headers.authorization;
    if (
      typeof authorization !== "string" ||
      !/^Bearer [^ ]+$/.test(authorization)
    )
      throw new UnauthorizedException("Bearer authorization required");
    const identity = await this.auth.verifyLegacyToken(authorization.slice(7));
    req.customer = await this.users.synchronize(identity);
    return true;
  }
}
