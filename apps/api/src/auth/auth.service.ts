import {
  Inject,
  Injectable,
  UnauthorizedException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
export interface VerifiedIdentity {
  sub: string;
  email: string;
  fullName: string;
}
const claims = z.object({
  sub: z.uuid(),
  email: z.email(),
  role: z.literal("authenticated"),
  exp: z.number(),
  iat: z.number(),
  is_anonymous: z.boolean().optional(),
  user_metadata: z
    .object({ full_name: z.string().max(120).optional() })
    .passthrough()
    .optional(),
});
@Injectable()
export class SupabaseAuthService {
  private jwks?: ReturnType<typeof createRemoteJWKSet>;
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}
  async verify(token: string): Promise<VerifiedIdentity> {
    const url = this.config.get<string>("SUPABASE_URL"),
      issuer = this.config.get<string>("SUPABASE_JWT_ISSUER");
    if (!url || !issuer)
      throw new ServiceUnavailableException("Authentication is not configured");
    try {
      this.jwks ??= createRemoteJWKSet(
        new URL(`${url}/auth/v1/.well-known/jwks.json`),
        { cacheMaxAge: 600000, cooldownDuration: 30000, timeoutDuration: 5000 },
      );
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer,
        audience: "authenticated",
        algorithms: ["ES256", "RS256"],
        requiredClaims: ["exp", "iat", "sub", "email"],
        clockTolerance: 5,
      });
      return this.identity(payload);
    } catch {
      throw new UnauthorizedException("Invalid or expired access token");
    }
  }
  identity(payload: JWTPayload): VerifiedIdentity {
    const parsed = claims.safeParse(payload);
    if (!parsed.success || parsed.data.is_anonymous)
      throw new UnauthorizedException("Invalid customer claims");
    return {
      sub: parsed.data.sub,
      email: parsed.data.email,
      fullName: parsed.data.user_metadata?.full_name || "",
    };
  }
  async verifyLegacyToken(token: string): Promise<VerifiedIdentity> {
    // Explicit opt-in for existing HS256 projects: verification is delegated to the trusted Auth server.
    if (this.config.get("SUPABASE_LEGACY_JWT") !== "true")
      return this.verify(token);
    const url = this.config.get<string>("SUPABASE_URL"),
      key = this.config.get<string>("SUPABASE_PUBLISHABLE_KEY");
    if (!url || !key)
      throw new ServiceUnavailableException("Authentication is not configured");
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user?.email || data.user.is_anonymous)
      throw new UnauthorizedException("Invalid access token");
    return {
      sub: data.user.id,
      email: data.user.email,
      fullName:
        typeof data.user.user_metadata.full_name === "string"
          ? data.user.user_metadata.full_name.slice(0, 120)
          : "",
    };
  }
}
