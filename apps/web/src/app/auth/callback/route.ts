import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { EmailOtpType } from "@supabase/supabase-js";
import {
  serverAuth,
  authConfigured,
  appOrigin,
  synchronizeCustomerProfile,
} from "@/lib/server-auth";
import { sanitizeRedirectPath } from "@/lib/auth-redirect";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const token_hash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const rawNext = request.nextUrl.searchParams.get("next");
  const safeNext = sanitizeRedirectPath(rawNext, "/", {
    allowRecovery: true,
  });
  const isRecoveryDestination =
    safeNext.startsWith("/reset-password") ||
    safeNext.startsWith("/update-password");

  if (authConfigured()) {
    // 1. PKCE Code Exchange Flow
    if (code) {
      try {
        const supabase = await serverAuth();
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error && data.session && data.user) {
          const jar = await cookies();
          if (isRecoveryDestination) {
            jar.set("himatu-recovery", "1", {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
              maxAge: 60 * 15,
            });
            return NextResponse.redirect(
              new URL("/reset-password?step=password", appOrigin(request)),
            );
          }
          if (data.user.email_confirmed_at) {
            jar.delete("himatu-pending-email");
            jar.delete("himatu-recovery");
            await synchronizeCustomerProfile(data.session.access_token);
            return NextResponse.redirect(new URL(safeNext, appOrigin(request)));
          }
        }
      } catch {
        /* Fail through to client hash check */
      }
    }

    // 2. Token Hash Flow (Email Link)
    if (token_hash) {
      try {
        const supabase = await serverAuth();
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type || "email",
        });
        if (!error && data.session && data.user) {
          const jar = await cookies();
          jar.delete("himatu-pending-email");
          jar.delete("himatu-recovery");
          await synchronizeCustomerProfile(data.session.access_token);
          return NextResponse.redirect(new URL(safeNext, appOrigin(request)));
        }
      } catch {
        /* Fail through to client hash check */
      }
    }
  }

  // 3. Client-Side Hash Fallback (Supabase implicit hash redirect: #access_token=...&type=signup)
  const clientHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verifying HIMATU Member Account…</title>
  <script>
    (function() {
      try {
        var hash = window.location.hash.substring(1);
        if (!hash) {
          window.location.href = "/sign-in?error=verification";
          return;
        }
        var params = new URLSearchParams(hash);
        var accessToken = params.get("access_token");
        var refreshToken = params.get("refresh_token");
        var type = params.get("type");
        var error = params.get("error");

        if (error || !accessToken) {
          window.location.href = "/sign-in?error=verification";
          return;
        }

        fetch("/api/auth/set-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-himatu-request": "1"
          },
          body: JSON.stringify({
            access_token: accessToken,
            refresh_token: refreshToken,
            type: type,
            next: ${JSON.stringify(safeNext)}
          })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
          if (data && data.ok) {
            window.location.href = data.redirectTo || ${JSON.stringify(safeNext)};
          } else {
            window.location.href = "/sign-in?error=verification";
          }
        })
        .catch(function() {
          window.location.href = "/sign-in?error=verification";
        });
      } catch (e) {
        window.location.href = "/sign-in?error=verification";
      }
    })();
  </script>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #000; color: #fff;">
  <div style="text-align: center;">
    <h1 style="font-size: 24px; font-weight: 900; letter-spacing: 0.1em; margin-bottom: 8px;">HIMATU</h1>
    <p style="font-size: 14px; color: #a1a1aa; letter-spacing: 0.05em;">CONFIRMING COLLECTOR CREDENTIALS…</p>
  </div>
</body>
</html>`;

  return new NextResponse(clientHtml, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
