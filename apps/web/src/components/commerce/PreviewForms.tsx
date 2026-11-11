"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { Eye, EyeOff, ArrowUpRight, LoaderCircle } from "lucide-react";
import { Button, Input } from "../ui/Primitives";
import { LogoAssembly } from "../brand/LogoAssembly";
import { BrandLogo } from "../layout/BrandLogo";
import { authService } from "@/lib/auth-service";
import { validate, focusError, type FormErrors } from "@/lib/validation";

export function AuthForm({
  create = false,
  reset = false,
  verificationError = false,
  resetSuccess = false,
  nextPath = "",
}: {
  create?: boolean;
  reset?: boolean;
  verificationError?: boolean;
  resetSuccess?: boolean;
  nextPath?: string;
}) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const [status, setStatus] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const field = (key: keyof typeof values, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setStatus("");
    setUnverifiedEmail(null);
    setErrors((current) => ({
      ...current,
      [key]: "",
      ...(key === "password" ? { confirmPassword: "" } : {}),
    }));
  };

  const heading = reset
    ? "RESET YOUR PASSWORD."
    : create
      ? "JOIN THE COLLECTION."
      : "WELCOME BACK.";

  return (
    <div className="customer-auth">
      <section className="customer-auth-panel" aria-labelledby="auth-heading">
        <div className="customer-auth-content">
          <Link
            className="wordmark auth-wordmark"
            href="/"
            aria-label="HIMATU home"
          >
            <BrandLogo />
          </Link>
          <p className="eyebrow auth-mode">
            {reset
              ? "ACCOUNT RECOVERY"
              : create
                ? "BECOME PART OF THE COLLECTION"
                : "YOUR HIMATU ACCOUNT"}
          </p>
          <h1 id="auth-heading">{heading}</h1>
          <p className="auth-introduction">
            {reset
              ? "Enter your email to receive a 6-digit password recovery code."
              : create
                ? "Create your HIMATU account and keep your favourite collectibles close."
                : "Your collection is waiting."}
          </p>
          <div className="auth-connection-note">
            <span className="red-mark" />
            <span>
              Your account is protected by email verification.
              <br />
              Browse freely. Sign in when you’re ready to order.
            </span>
          </div>

          {resetSuccess && (
            <div className="auth-banner auth-banner--success" role="status">
              Password updated successfully! Sign in with your new password.
            </div>
          )}

          {verificationError && (
            <p className="field-error" role="alert">
              This verification link was already used or is invalid. Please sign in below or request a new code.
            </p>
          )}

          {unverifiedEmail && (
            <div className="auth-banner auth-banner--verify" role="alert">
              <span>Your email is not verified yet.</span>
              <Link
                href={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}${
                  nextPath ? `&next=${encodeURIComponent(nextPath)}` : ""
                }`}
              >
                Enter your verification code <ArrowUpRight size={14} />
              </Link>
            </div>
          )}

          <form
            noValidate
            aria-busy={pending}
            onSubmit={async (e) => {
              e.preventDefault();
              if (busy.current) return;
              const next = validate(values, {
                ...(create
                  ? { name: { label: "Full name", required: true, max: 120 } }
                  : {}),
                email: {
                  label: "Email address",
                  required: true,
                  kind: "email",
                  max: 254,
                },
                ...(!reset
                  ? {
                      password: {
                        label: "Password",
                        required: true,
                        ...(create ? { kind: "password" as const } : {}),
                        max: 128,
                      },
                    }
                  : {}),
                ...(create
                  ? {
                      confirmPassword: {
                        label: "Confirm password",
                        required: true,
                        max: 128,
                      },
                    }
                  : {}),
              });
              if (
                create &&
                values.confirmPassword &&
                values.password !== values.confirmPassword
              ) {
                next.confirmPassword = "Passwords do not match.";
              }
              setErrors(next);
              setStatus("");
              setUnverifiedEmail(null);
              if (Object.keys(next).length) {
                focusError(next);
                return;
              }
              busy.current = true;
              setPending(true);
              try {
                const result = reset
                  ? await authService.requestPasswordReset(values.email.trim())
                  : create
                    ? await authService.register({
                        fullName: values.name.trim(),
                        email: values.email.trim(),
                        password: values.password,
                        next: nextPath || undefined,
                      })
                    : await authService.signIn({
                        email: values.email.trim(),
                        password: values.password,
                        remember,
                        next: nextPath || undefined,
                      });

                setStatus(result.message || "");

                if (result.ok && result.redirectTo) {
                  router.push(result.redirectTo);
                  router.refresh();
                } else if (!result.ok) {
                  if (result.code === "email_not_confirmed") {
                    setUnverifiedEmail(result.email || values.email.trim());
                  }
                  if (result.redirectTo) {
                    router.push(result.redirectTo);
                  }
                }
              } catch {
                setStatus(
                  "Account services could not be reached. You are still signed out. Try again later.",
                );
              } finally {
                busy.current = false;
                setPending(false);
                setValues((current) => ({
                  ...current,
                  password: "",
                  confirmPassword: "",
                }));
              }
            }}
          >
            {create && (
              <Input
                id="name"
                label="Full name"
                autoComplete="name"
                maxLength={120}
                value={values.name}
                onChange={(e) => field("name", e.target.value)}
                error={errors.name}
                disabled={pending}
                required
              />
            )}
            <Input
              id="email"
              label="Email address"
              type="email"
              autoComplete="email"
              inputMode="email"
              maxLength={254}
              value={values.email}
              onChange={(e) => field("email", e.target.value)}
              error={errors.email}
              disabled={pending}
              required
            />
            {!reset && (
              <div className="auth-password">
                <Input
                  id="password"
                  label="Password"
                  type={show ? "text" : "password"}
                  autoComplete={create ? "new-password" : "current-password"}
                  value={values.password}
                  onChange={(e) => field("password", e.target.value)}
                  error={errors.password}
                  aria-describedby={
                    errors.password
                      ? "password-error"
                      : create
                        ? "password-requirements"
                        : undefined
                  }
                  disabled={pending}
                  maxLength={128}
                  required
                />
                <button
                  type="button"
                  aria-label={show ? "Hide password" : "Show password"}
                  aria-controls="password"
                  aria-pressed={show}
                  disabled={pending}
                  onClick={() => setShow((v) => !v)}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            )}
            {create && (
              <>
                <p id="password-requirements" className="auth-password-hint">
                  Use at least 8 characters with at least one letter and one number.
                </p>
                <div className="auth-password">
                  <Input
                    id="confirmPassword"
                    label="Confirm password"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    value={values.confirmPassword}
                    onChange={(e) => field("confirmPassword", e.target.value)}
                    error={errors.confirmPassword}
                    disabled={pending}
                    maxLength={128}
                    required
                  />
                  <button
                    type="button"
                    aria-label={
                      showConfirm
                        ? "Hide confirmed password"
                        : "Show confirmed password"
                    }
                    aria-controls="confirmPassword"
                    aria-pressed={showConfirm}
                    disabled={pending}
                    onClick={() => setShowConfirm((v) => !v)}
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </>
            )}
            {!create && !reset && (
              <div className="auth-options">
                <label>
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    disabled={pending}
                    aria-describedby="remember-note"
                  />
                  Remember me
                </label>
                <Link href="/forgot-password">Forgot password?</Link>
                <small id="remember-note">
                  Keep me signed in on this device.
                </small>
              </div>
            )}
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <LoaderCircle className="auth-spinner" size={16} />
                  CHECKING…
                </>
              ) : reset ? (
                "SEND RESET CODE"
              ) : create ? (
                "CREATE ACCOUNT"
              ) : (
                "SIGN IN"
              )}
              {!pending && <ArrowUpRight size={16} />}
            </Button>
            {!!Object.values(errors).filter(Boolean).length && (
              <p className="field-error" role="alert">
                Check the highlighted fields before continuing.
              </p>
            )}
            {status && (
              <p className="feedback auth-response" role="status">
                {status}
              </p>
            )}
          </form>
          <p className="auth-switch">
            {create
              ? "Already have an account?"
              : reset
                ? "Remembered your password?"
                : "New to HIMATU?"}{" "}
            <Link
              href={
                create || reset
                  ? nextPath
                    ? `/sign-in?next=${encodeURIComponent(nextPath)}`
                    : "/sign-in"
                  : nextPath
                    ? `/create-account?next=${encodeURIComponent(nextPath)}`
                    : "/create-account"
              }
            >
              {create || reset ? "Sign in" : "Create an account"}{" "}
              <ArrowUpRight size={14} />
            </Link>
          </p>
          <p className="auth-policy">
            Explore our <Link href="/privacy">privacy policy</Link> and{" "}
            <Link href="/terms">terms</Link>.
          </p>
        </div>
      </section>
      <aside className="customer-auth-editorial auth-assembly-panel" aria-label="The HIMATU story">
        <LogoAssembly create={create} />
      </aside>
    </div>
  );
}

export { CheckoutForm } from "./CheckoutForm";
