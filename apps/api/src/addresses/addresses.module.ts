import { Module } from "@nestjs/common";
import { AddressesService } from "./addresses.service";
import { AddressesController } from "./addresses.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [PrismaModule, AuthModule, UsersModule],
  providers: [AddressesService],
  controllers: [AddressesController],
  exports: [AddressesService],
})
export class AddressesModule {}

