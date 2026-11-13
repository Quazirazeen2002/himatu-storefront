import { Body, Controller, Inject, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { Roles, RolesGuard } from "../auth/roles";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";

@Controller("admin/content/hero/upload")
@UseGuards(AuthGuard, RolesGuard)
@Roles("ADMIN")
export class HeroUploadController {
  constructor(
    @Inject(StorageService) private readonly storage: StorageService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  @Post()
  start(@Body() body: { fileName: string; contentType: string; size: number }) {
    return this.storage.createHeroUpload(body.fileName, body.contentType, body.size);
  }

  @Post("complete")
  async complete(@Body() body: { path: string; contentType: string; alt: string }) {
    const media = await this.storage.completeHeroUpload(body.path, body.contentType, body.alt || "");
    const value = { media };
    await this.prisma.db.siteContent.upsert({
      where: { key: "hero-media" },
      create: { key: "hero-media", value },
      update: { value },
    });
    return value;
  }
}
