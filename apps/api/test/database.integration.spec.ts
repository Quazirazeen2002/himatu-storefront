import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../src/prisma/prisma.service";
import { UsersService } from "../src/users/users.service";
const database = process.env.TEST_DATABASE_URL;
(database ? describe : describe.skip)(
  "Real PostgreSQL integration (requires migrated disposable TEST_DATABASE_URL)",
  () => {
    let prisma: PrismaService;
    beforeAll(() => {
      prisma = new PrismaService(new ConfigService({ DATABASE_URL: database }));
    });
    afterAll(async () => {
      await prisma.onModuleDestroy();
    });
    it("connects, synchronizes idempotently and preserves trusted roles", async () => {
      expect(await prisma.status()).toBe("up");
      const users = new UsersService(prisma);
      const sub = crypto.randomUUID();
      try {
        const first = await users.synchronize({
          sub,
          email: "database-test@example.invalid",
          fullName: "Test Collector",
        });
        const again = await users.synchronize({
          sub,
          email: "database-test@example.invalid",
          fullName: "Test Collector",
        });
        expect(again.id).toBe(first.id);
        expect(again.role).toBe("CUSTOMER");
        await prisma.db.userProfile.update({
          where: { id: first.id },
          data: { role: "ADMIN" },
        });
        expect(
          (
            await users.synchronize({
              sub,
              email: "database-test@example.invalid",
              fullName: "Changed",
            })
          ).role,
        ).toBe("ADMIN");
      } finally {
        await prisma.db.userProfile.deleteMany({
          where: { supabaseUserId: sub },
        });
      }
    });
  },
);
