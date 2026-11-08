import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from "@nestjs/common";
import { SupabaseAuthService } from "./auth.service";
import { UsersService } from "../users/users.service";

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    @Inject(SupabaseAuthService) private readonly auth: SupabaseAuthService,
    @Inject(UsersService) private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authorization = req.headers.authorization;

    if (
      typeof authorization === "string" &&
      /^Bearer [^ ]+$/.test(authorization)
    ) {
      try {
        const identity = await this.auth.verifyLegacyToken(authorization.slice(7));
        req.customer = await this.users.synchronize(identity);
      } catch {
        req.customer = null;
      }
    } else {
      req.customer = null;
    }

    return true;
  }
}

