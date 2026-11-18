import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { UsersModule } from "../users/users.module";
import { SocialOrdersController } from "./social-orders.controller";
import { SocialOrdersService } from "./social-orders.service";
import { HeroUploadController } from "./hero-upload.controller";
import { StorageModule } from "../storage/storage.module";
@Module({
  imports: [PrismaModule, AuthModule, UsersModule, StorageModule],
  controllers: [SocialOrdersController, HeroUploadController],
  providers: [SocialOrdersService],
})
export class SocialOrdersModule {}
