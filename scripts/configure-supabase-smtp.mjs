import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiEnvPath = path.resolve(__dirname, "../apps/api/.env");

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      env[key] = val;
    }
  }
  return env;
}

const env = parseEnv(apiEnvPath);
const projectRef = "tqwgmmiljcumomhxwxit";
const token = process.argv[2] || process.env.SUPABASE_ACCESS_TOKEN;

if (!token) {
  console.log(`
========================================================================
HIMATU — SUPABASE EMAIL & SMTP AUTO-CONFIGURATOR
========================================================================

To automatically configure Custom SMTP and Email Templates in Supabase:
Run:
  node scripts/configure-supabase-smtp.mjs <SUPABASE_PERSONAL_ACCESS_TOKEN>

To get a personal access token (takes 10 seconds):
1. Go to: https://supabase.com/dashboard/account/tokens
2. Click "Generate new token" -> Name: "himatu-setup"
3. Copy the token (starts with sbp_...) and run:
   node scripts/configure-supabase-smtp.mjs sbp_xxxxxxxxx

Alternatively, you can manually paste the verified values into:
https://supabase.com/dashboard/project/${projectRef}/settings/auth
========================================================================
`);
  process.exit(0);
}

const payload = {
  smtp_admin_email: env.SMTP_USER || "razeenjubair10@gmail.com",
  smtp_host: env.SMTP_HOST || "smtp.gmail.com",
  smtp_port: String(env.SMTP_PORT || "587"),
  smtp_user: env.SMTP_USER || "razeenjubair10@gmail.com",
  smtp_pass: env.SMTP_PASSWORD,
  smtp_sender_name: env.SMTP_SENDER_NAME || "HIMATU",
  mailer_autoconfirm: false,
  mailer_otp_exp: 900,
  smtp_max_frequency: 60,
  mailer_subjects_confirmation: "Verify your HIMATU account",
  mailer_templates_confirmation_content: `<h2>Welcome to HIMATU</h2><p>Thank you for joining our community of anime collectors.</p><p>Use the following verification code to confirm your email address:</p><p style="font-size: 28px; font-weight: bold; letter-spacing: 6px; font-family: monospace; color: #111;">{{ .Token }}</p><p>This code will expire in 15 minutes.</p><p style="color: #666; font-size: 13px;">If you did not request this account, you can safely ignore this message.</p>`,
  mailer_subjects_recovery: "Reset your HIMATU password",
  mailer_templates_recovery_content: `<h2>Reset your HIMATU password</h2><p>We received a request to reset your HIMATU account password.</p><p>Your 6-digit verification code is:</p><p style="font-size: 28px; font-weight: bold; letter-spacing: 6px; font-family: monospace; color: #111;">{{ .Token }}</p><p>This code will expire in 15 minutes.</p><p style="color: #666; font-size: 13px;">If you did not request this reset, please ignore this message.</p>`
};

console.log(`Connecting to Supabase Management API for project: ${projectRef}...`);

fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
})
  .then(async (res) => {
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Supabase Management API error (${res.status}): ${err}`);
    }
    return res.json();
  })
  .then((data) => {
    console.log("SUCCESS! Supabase Custom SMTP and Email Templates configured successfully!");
    console.log("Configured SMTP Host:", data.smtp_host);
    console.log("Configured Sender:", data.smtp_admin_email);
    console.log("Configured Sender Name:", data.smtp_sender_name);
    console.log("OTP Expiration (sec):", data.mailer_otp_exp);
  })
  .catch((err) => {
    console.error("Configuration failed:", err.message);
    process.exit(1);
  });

