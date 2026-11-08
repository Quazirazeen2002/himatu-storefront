import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  Inject,
  Injectable,
  OnModuleDestroy,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
@Injectable()
export class PrismaService implements OnModuleDestroy {
  private client?: PrismaClient;
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}
  get db(): PrismaClient {
    if (!this.client) {
      const connectionString = this.config.get<string>("DATABASE_URL");
      if (!connectionString)
        throw new ServiceUnavailableException("Database is not configured");
      const url = new URL(connectionString),
        rawCaPath = this.config.get<string>("DATABASE_SSL_CA_PATH");
      let caCert: string | undefined;
      if (rawCaPath) {
        url.searchParams.delete("sslmode");
        url.searchParams.delete("sslrootcert");
        const resolvedPath = existsSync(rawCaPath)
          ? rawCaPath
          : existsSync(resolve(process.cwd(), "apps/api", rawCaPath))
            ? resolve(process.cwd(), "apps/api", rawCaPath)
            : resolve(__dirname, "../../", rawCaPath);
        if (existsSync(resolvedPath)) {
          caCert = readFileSync(resolvedPath, "utf8");
        }
      }
      this.client = new PrismaClient({
        adapter: new PrismaPg({
          connectionString: url.toString(),
          max: 3,
          connectionTimeoutMillis: 5000,
          idleTimeoutMillis: 10000,
          ...(caCert
            ? {
                ssl: {
                  ca: caCert,
                  rejectUnauthorized: true,
                },
              }
            : {}),
        }),
      });
    }
    return this.client;
  }
  async status() {
    if (!this.config.get("DATABASE_URL")) return "not_configured" as const;
    try {
      await this.db.$queryRaw`SELECT 1`;
      return "up" as const;
    } catch {
      return "down" as const;
    }
  }
  async onModuleDestroy() {
    await this.client?.$disconnect();
  }
}
