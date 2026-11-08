import "reflect-metadata";
import { Test } from "@nestjs/testing";
import {
  Controller,
  Get,
  UseGuards,
  ValidationPipe,
  INestApplication,
} from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import request from "supertest";
import { createServer, Server } from "node:http";
import { generateKeyPair, exportJWK, SignJWT } from "jose";
import { PrismaService } from "../src/prisma/prisma.service";
import { HealthModule } from "../src/health/health.module";
import { PrismaModule } from "../src/prisma/prisma.module";
import { AuthModule } from "../src/auth/auth.module";
import { UsersModule } from "../src/users/users.module";
import { AuthGuard } from "../src/auth/auth.guard";
import { Roles, RolesGuard } from "../src/auth/roles";
@Controller("admin-probe")
class AdminProbe {
  @Get() @UseGuards(AuthGuard, RolesGuard) @Roles("ADMIN") get() {
    return { ok: true };
  }
}
const subject = "643d161b-0e85-4c43-97bb-35611b3b9af2";
const profile = {
  id: "7e0ed120-9f32-49e3-a371-2acf5390d75b",
  supabaseUserId: subject,
  fullName: "Collector",
  email: "collector@example.com",
  phone: null,
  role: "CUSTOMER",
  createdAt: new Date(),
  updatedAt: new Date(),
};
describe("API JWT and ownership boundary", () => {
  let app: INestApplication,
    server: Server,
    issuer: string,
    privateKey: Awaited<ReturnType<typeof generateKeyPair>>["privateKey"];
  const prisma = {
    status: jest.fn().mockResolvedValue("up"),
    db: {
      userProfile: {
        upsert: jest.fn().mockImplementation(async () => ({ ...profile })),
        update: jest
          .fn()
          .mockImplementation(async (args) => ({ ...profile, ...args.data })),
      },
    },
  };
  async function token(
    options: {
      expired?: boolean;
      role?: string;
      issuer?: string;
      sub?: string;
      aud?: string;
      key?: typeof privateKey;
    } = {},
  ) {
    return new SignJWT({
      email: profile.email,
      role: options.role || "authenticated",
      user_metadata: { full_name: "Collector", role: "ADMIN" },
    })
      .setProtectedHeader({ alg: "ES256", kid: "test-key" })
      .setIssuedAt()
      .setSubject(options.sub || subject)
      .setIssuer(options.issuer || issuer)
      .setAudience(options.aud || "authenticated")
      .setExpirationTime(options.expired ? "0s" : "5m")
      .sign(options.key || privateKey);
  }
  beforeAll(async () => {
    const keys = await generateKeyPair("ES256", { extractable: true });
    privateKey = keys.privateKey;
    const jwk = await exportJWK(keys.publicKey);
    server = createServer((_req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          keys: [{ ...jwk, kid: "test-key", alg: "ES256", use: "sig" }],
        }),
      );
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    const address = server.address() as { port: number };
    const base = `http://127.0.0.1:${address.port}`;
    issuer = base + "/auth/v1";
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              SUPABASE_URL: base,
              SUPABASE_JWT_ISSUER: issuer,
              SUPABASE_LEGACY_JWT: "false",
            }),
          ],
        }),
        PrismaModule,
        HealthModule,
        AuthModule,
        UsersModule,
      ],
      controllers: [AdminProbe],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = module.createNestApplication();
    app.setGlobalPrefix("api/v1");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });
  afterAll(async () => {
    await app?.close();
    await new Promise<void>((resolve) => server?.close(() => resolve()));
  });
  beforeEach(() => jest.clearAllMocks());
  it("health reports database connectivity", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/health")
      .expect(200)
      .expect(({ body }) => expect(body.database).toBe("up"));
  });
  it("health fails closed when database is down", async () => {
    prisma.status.mockResolvedValueOnce("down");
    await request(app.getHttpServer()).get("/api/v1/health").expect(503);
  });
  it("rejects missing authorization", async () => {
    await request(app.getHttpServer()).get("/api/v1/users/me").expect(401);
  });
  it("rejects malformed JWT", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/users/me")
      .auth("invalid", { type: "bearer" })
      .expect(401);
    expect(prisma.db.userProfile.upsert).not.toHaveBeenCalled();
  });
  it("rejects expired JWT", async () => {
    const value = await new SignJWT({
      email: profile.email,
      role: "authenticated",
    })
      .setProtectedHeader({ alg: "ES256", kid: "test-key" })
      .setSubject(subject)
      .setIssuer(issuer)
      .setAudience("authenticated")
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(privateKey);
    await request(app.getHttpServer())
      .get("/api/v1/users/me")
      .auth(value, { type: "bearer" })
      .expect(401);
  });
  it("rejects wrong issuer and audience", async () => {
    for (const options of [
      { issuer: "https://attacker.example/auth/v1" },
      { aud: "other" },
    ])
      await request(app.getHttpServer())
        .get("/api/v1/users/me")
        .auth(await token(options), { type: "bearer" })
        .expect(401);
  });
  it("rejects invalid subject and role", async () => {
    for (const options of [{ sub: "not-a-uuid" }, { role: "service_role" }])
      await request(app.getHttpServer())
        .get("/api/v1/users/me")
        .auth(await token(options), { type: "bearer" })
        .expect(401);
  });
  it("rejects a signature from another key", async () => {
    const keys = await generateKeyPair("ES256");
    await request(app.getHttpServer())
      .get("/api/v1/users/me")
      .auth(await token({ key: keys.privateKey }), { type: "bearer" })
      .expect(401);
  });
  it("accepts a real signed test customer JWT and creates CUSTOMER", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/users/me")
      .auth(await token(), { type: "bearer" })
      .expect(200);
    expect(prisma.db.userProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { supabaseUserId: subject },
        create: expect.objectContaining({ role: "CUSTOMER" }),
      }),
    );
  });
  it("allows only the authenticated profile to be patched", async () => {
    await request(app.getHttpServer())
      .patch("/api/v1/users/me")
      .auth(await token(), { type: "bearer" })
      .send({ fullName: "Updated" })
      .expect(200);
    expect(prisma.db.userProfile.update).toHaveBeenCalledWith({
      where: { id: profile.id },
      data: { fullName: "Updated" },
    });
  });
  it("rejects role elevation, supplied owner and email updates", async () => {
    for (const input of [
      { role: "ADMIN" },
      { userId: "other" },
      { email: "other@example.com" },
      { fullName: null },
      { fullName: " " },
    ])
      await request(app.getHttpServer())
        .patch("/api/v1/users/me")
        .auth(await token(), { type: "bearer" })
        .send(input)
        .expect(400);
  });
  it("denies customer admin access despite user metadata role", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/admin-probe")
      .auth(await token(), { type: "bearer" })
      .expect(403);
  });
  it("allows a trusted database ADMIN role", async () => {
    prisma.db.userProfile.upsert.mockResolvedValueOnce({
      ...profile,
      role: "ADMIN",
    });
    await request(app.getHttpServer())
      .get("/api/v1/admin-probe")
      .auth(await token(), { type: "bearer" })
      .expect(200);
  });
});
describe("Prisma lifecycle", () => {
  it("reports missing configuration and disconnects initialized clients", async () => {
    const service = new PrismaService(new ConfigService({}));
    expect(await service.status()).toBe("not_configured");
    expect(() => service.db).toThrow("Database is not configured");
    await service.onModuleDestroy();
  });
});
