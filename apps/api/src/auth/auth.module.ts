import { Global, Module } from "@nestjs/common";
import { SupabaseAuthService } from "./auth.service";
import { AuthGuard } from "./auth.guard";
import { RolesGuard } from "./roles";
import { UsersService } from "../users/users.service";
@Global()
@Module({
  providers: [SupabaseAuthService, AuthGuard, RolesGuard, UsersService],
  exports: [SupabaseAuthService, AuthGuard, RolesGuard, UsersService],
})
export class AuthModule {}
