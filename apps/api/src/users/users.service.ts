import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { VerifiedIdentity } from "../auth/auth.service";
@Injectable()
export class UsersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}
  async synchronize(identity: VerifiedIdentity) {
    return this.prisma.db.userProfile.upsert({
      where: { supabaseUserId: identity.sub },
      create: {
        supabaseUserId: identity.sub,
        email: identity.email,
        fullName: identity.fullName,
        role: "CUSTOMER",
      },
      update: { email: identity.email },
    });
  }
  update(userId: string, input: { fullName?: string; phone?: string | null }) {
    return this.prisma.db.userProfile.update({
      where: { id: userId },
      data: input,
    });
  }
}
