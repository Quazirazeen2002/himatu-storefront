import { BadRequestException, Body, Controller, Inject, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { heroMediaLimit } from "../storage/local-media";
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

  @Post("file")
  @UseInterceptors(FileInterceptor("file", { dest: tmpdir(), limits: { fileSize: heroMediaLimit, files: 1, fields: 1, fieldSize: 1000 } }))
  async upload(@UploadedFile() file: Express.Multer.File | undefined, @Body() body: { alt?: string }) {
    if (!file) throw new BadRequestException("Choose a media file");
    try {
      if (body.alt !== undefined && typeof body.alt !== "string") throw new BadRequestException("Invalid media description");
      const media = await this.storage.uploadHeroFile(file, body.alt || "");
      const value = { media };
      await this.prisma.db.siteContent.upsert({ where: { key: "hero-media" }, create: { key: "hero-media", value }, update: { value } });
      return value;
    } finally { await unlink(file.path).catch(() => {}); }
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
