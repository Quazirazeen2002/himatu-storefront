import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { invoicePdf, type InvoiceSnapshot } from "./invoice";
import { SocialOrdersService } from "./social-orders.service";
import { PrismaService } from "../prisma/prisma.service";
import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard, Roles, CurrentUser } from "../auth/roles";
import {
  SocialRequestSchema,
  ConfirmSocialOrderSchema,
  HeroSlidesSchema,
} from "@himatu/shared";

@Controller()
export class SocialOrdersController {
  constructor(
    @Inject(SocialOrdersService) private readonly orders: SocialOrdersService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}
  @Post("social-orders")
  @UseGuards(AuthGuard)
  submit(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    const input = SocialRequestSchema.parse(body);
    if (input.channel === "manual")
      throw new BadRequestException("Choose a social channel");
    return this.orders.submit(user.id, input);
  }
  @Get("admin/social-orders")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN", "MODERATOR")
  list(@Query("page") page?: string) {
    return this.orders.list(Math.max(1, Number(page) || 1));
  }
  @Post("admin/social-orders/manual")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN", "MODERATOR")
  manual(
    @CurrentUser() user: { id: string; role: string },
    @Body() body: unknown,
  ) {
    const request = SocialRequestSchema.parse(body),
      confirmation = ConfirmSocialOrderSchema.parse(body);
    return this.orders.manual(user.id, request, confirmation, user.role);
  }
  @Post("admin/social-orders/:id/confirm")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN", "MODERATOR")
  confirm(
    @CurrentUser() user: { role: string },
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.orders.confirm(
      id,
      ConfirmSocialOrderSchema.parse(body),
      user.role,
    );
  }
  @Post("admin/social-orders/:id/dismiss")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN", "MODERATOR")
  dismiss(@Param("id") id: string) {
    return this.orders.dismiss(id);
  }
  @Post("admin/invoices/:id/review")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  review(@CurrentUser() user: { id: string }, @Param("id") id: string) {
    return this.orders.reviewInvoice(id, user.id);
  }
  @Get("admin/invoices/:id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  invoice(@Param("id") id: string) {
    return this.orders.getInvoice(id);
  }
  @Get("admin/invoices/:id/pdf")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  async pdf(@Param("id") id: string, @Res() response: Response) {
    const invoice = await this.orders.getInvoice(id);
    const snapshot = invoice.snapshot as unknown as InvoiceSnapshot;
    const pdf = await invoicePdf(snapshot);
    const name = snapshot.number.replace(/[^a-zA-Z0-9_-]/g, "-");
    response.set({"Content-Type":"application/pdf", "Content-Disposition":`attachment; filename="HIMATU-Invoice-${name}.pdf"`, "Cache-Control":"private, no-store"});
    response.send(pdf);
  }
  @Post("admin/invoices/:id/send")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  send(@Param("id") id: string) {
    return this.orders.sendInvoice(id);
  }
  @Post("admin/invoices/:id/unlock")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  unlock(@Param("id") id: string, @Body() body: { deliveryChecked?: boolean }) {
    return this.orders.unlockInvoice(id, body.deliveryChecked === true);
  }
  @Get("content/hero")
  async hero() {
    const heroMedia = await this.prisma.db.siteContent.findUnique({
      where: { key: "hero-media" },
    });
    if (heroMedia?.value) return heroMedia.value;

    const heroSlides = await this.prisma.db.siteContent.findUnique({
      where: { key: "hero-slides" },
    });
    if (heroSlides?.value) return heroSlides.value;

    return {
      media: {
        type: "video",
        src: "/videos/hero-anime.mp4",
        poster: "/videos/hero-anime-poster.jpg",
        alt: "HIMATU One Piece Anime Horizontal Cinematic Visual",
      },
    };
  }
  @Patch("admin/content/hero")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  async saveHero(@Body() body: any) {
    const value = body.media ? body : { media: body };
    return this.prisma.db.siteContent.upsert({
      where: { key: "hero-media" },
      create: { key: "hero-media", value },
      update: { value },
    });
  }
  @Get("admin/staff/access")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  async staffAccess(@CurrentUser() user: { id: string }) {
    const owner = await this.prisma.db.siteContent.findUnique({where:{key:"store-owner"}});
    const ownerId = (owner?.value as {userId?:string} | undefined)?.userId;
    return { isOwner: ownerId === user.id, ownerId: ownerId || null };
  }
  @Get("admin/staff")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  staff(@Query("search") search?: string) {
    return this.prisma.db.userProfile.findMany({
      where: search
        ? { email: { contains: search, mode: "insensitive" } }
        : { role: { in: ["ADMIN", "MODERATOR"] } },
      select: { id: true, fullName: true, email: true, role: true },
      take: 30,
      orderBy: { createdAt: "desc" },
    });
  }
  @Patch("admin/staff/:id/role")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  async role(
    @CurrentUser() user: { id: string },
    @Param("id") id: string,
    @Body() body: { role?: string },
  ) {
    if (!["CUSTOMER", "MODERATOR", "ADMIN"].includes(body.role || ""))
      throw new BadRequestException("Invalid role");
    if (id === user.id)
      throw new ConflictException("You cannot change your own role");
    return this.prisma.db.$transaction(async tx => {
      const owner = await tx.siteContent.findUnique({where:{key:"store-owner"}});
      const ownerId = (owner?.value as {userId?:string} | undefined)?.userId;
      if (!ownerId || user.id !== ownerId) throw new ForbiddenException("Only the store owner can assign staff roles");
      if (id === ownerId) throw new ConflictException("The permanent owner account cannot be changed");
      const actor = await tx.userProfile.findUnique({where:{id:user.id}});
      if(actor?.role !== "ADMIN") throw new ConflictException("Your permissions changed. Sign in again.");
      if(body.role !== "ADMIN" && await tx.userProfile.count({where:{role:"ADMIN"}}) < 2) {
        const target = await tx.userProfile.findUnique({where:{id}});
        if(target?.role === "ADMIN") throw new ConflictException("The last administrator cannot be removed");
      }
      return tx.userProfile.update({where:{id},data:{role:body.role as "CUSTOMER"|"ADMIN"|"MODERATOR"},select:{id:true,email:true,role:true}});
    }, {isolationLevel:"Serializable"});
  }
}
