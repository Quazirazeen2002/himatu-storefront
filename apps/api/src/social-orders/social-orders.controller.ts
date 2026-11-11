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
} from "@nestjs/common";
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
    return (
      (
        await this.prisma.db.siteContent.findUnique({
          where: { key: "hero-slides" },
        })
      )?.value || { slides: [] }
    );
  }
  @Patch("admin/content/hero")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  async saveHero(@Body() body: unknown) {
    const value = HeroSlidesSchema.parse(body);
    return this.prisma.db.siteContent.upsert({
      where: { key: "hero-slides" },
      create: { key: "hero-slides", value },
      update: { value },
    });
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
