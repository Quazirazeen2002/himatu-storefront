import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { UsersModule } from "../users/users.module";
import { SocialOrdersController } from "./social-orders.controller";
import { SocialOrdersService } from "./social-orders.service";
@Module({
  imports: [PrismaModule, AuthModule, UsersModule],
  controllers: [SocialOrdersController],
  providers: [SocialOrdersService],
})
export class SocialOrdersModule {}
