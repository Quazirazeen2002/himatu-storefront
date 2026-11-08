"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ArrowUpRight, LoaderCircle, CheckCircle2 } from "lucide-react";
import { Button, Input } from "@/components/ui/Primitives";
import { AssetImage } from "@/components/products/AssetImage";
import { figurePhotos } from "@/lib/assets";
import { authService } from "@/lib/auth-service";
import { validate, focusError, type FormErrors } from "@/lib/validation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const stepParam = searchParams.get("step");

  // Step 1: verify-otp, Step 2: new-password
  const [step, setStep] = useState<"otp" | "password">(
    stepParam === "password" ? "password" : "otp",
  );
  const [email, setEmail] = useState(emailParam);
  const [isEditingEmail, setIsEditingEmail] = useState(!emailParam);
  const [digits, setDigits] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [cooldown, setCooldown] = useState(0);

  // New password form state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const otpFieldsetId = useId();

  // If page loaded with step=password, check if recovery session is valid
  useEffect(() => {
    let active = true;
    authService.getRecoveryStatus().then((res) => {
      if (!active) return;
      if (res.readyForPassword) {
        setStep("password");
        if (res.email) setEmail(res.email);
      } else if (stepParam === "password") {
        setStep("otp");
        setStatus("Your recovery session expired. Please verify a new recovery code.");
      }
    });
    return () => {
      active = false;
    };
  }, [stepParam]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleDigitChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, "");
    if (!cleaned) {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }

    if (cleaned.length > 1) {
      const next = [...digits];
      const slice = cleaned.slice(0, 8 - index);
      for (let i = 0; i < slice.length; i++) {
        next[index + i] = slice[i];
      }
      setDigits(next);
      setStatus("");
      const targetFocus = Math.min(index + slice.length, 7);
      inputsRef.current[targetFocus]?.focus();
      return;
    }

    const char = cleaned.slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setStatus("");

    if (index < 7) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 8);
    if (!pasted) return;

    const next = ["", "", "", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i] || "";
    }
    setDigits(next);
    setStatus("");

    const targetFocus = Math.min(pasted.length, 7);
    inputsRef.current[targetFocus]?.focus();
  };

  const code = digits.join("");

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setStatus("Please enter your account email address.");
      return;
    }
    if (code.length < 6 || code.length > 8) {
      setStatus("Please enter your 6 to 8-digit recovery code.");
      return;
    }

    setPending(true);
    setStatus("");

    try {
      const res = await authService.verifyOtp({
        email: email.trim(),
        token: code,
        type: "recovery",
      });

      if (res.ok) {
        setStep("password");
        setStatus("Code verified. Please set your new password.");
      } else {
        setStatus(res.message);
      }
    } catch {
      setStatus("Unable to verify recovery code. Please try again.");
    } finally {
      setPending(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || pending) return;
    if (!email.trim()) {
      setStatus("Please enter an email address to resend the recovery code.");
      return;
    }

    setPending(true);
    setStatus("");

    try {
      const res = await authService.resendOtp({
        email: email.trim(),
        type: "recovery",
      });

      setStatus(res.message || "If an account matches, a recovery code has been sent.");
      if (res.ok) {
        setCooldown(res.retryAfterSeconds || 60);
      } else if (res.code === "resend_cooldown" && res.retryAfterSeconds) {
        setCooldown(res.retryAfterSeconds);
      }
    } catch {
      setStatus("Could not send recovery code. Try again later.");
    } finally {
      setPending(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validate(
      { password, confirmPassword },
      {
        password: {
          label: "New password",
          required: true,
          kind: "password",
          max: 128,
        },
        confirmPassword: {
          label: "Confirm password",
          required: true,
          max: 128,
        },
      },
    );

    if (password && confirmPassword && password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);
    setStatus("");

    if (Object.keys(nextErrors).length) {
      focusError(nextErrors);
      return;
    }

    setPending(true);
    try {
      const res = await authService.updatePassword(password);
      if (res.ok) {
        setIsSuccess(true);
        setStatus("Your password has been reset. Redirecting to sign in…");
        setTimeout(() => {
          router.push(res.redirectTo || "/sign-in?reset=success");
        }, 1200);
      } else {
        setStatus(res.message);
        if (res.code === "recovery_session_expired") {
          setStep("otp");
        }
      }
    } catch {
      setStatus("Could not update password. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="customer-auth">
      <section className="customer-auth-panel" aria-labelledby="reset-heading">
        <div className="customer-auth-content">
          <Link
            className="wordmark auth-wordmark"
            href="/"
            aria-label="HIMATU home"
          >
            HIMATU
          </Link>
          <p className="eyebrow auth-mode">ACCOUNT RECOVERY</p>
          <h1 id="reset-heading">
            {step === "otp" ? "ENTER RECOVERY CODE." : "SET NEW PASSWORD."}
          </h1>
          <p className="auth-introduction">
            {step === "otp"
              ? "Enter the verification code sent to your email to reset your password."
              : "Choose a strong password with at least 8 characters, including a letter and a number."}
          </p>

          <div className="auth-connection-note">
            <span className="red-mark" />
            <span>
              OTP verification protects your collection from unauthorized password changes.
              <br />
              Supports 6 to 8-digit codes with automatic paste.
            </span>
          </div>

          {isSuccess ? (
            <div className="auth-banner auth-banner--success" role="status">
              <CheckCircle2 size={18} style={{ display: "inline", marginRight: "8px" }} />
              <strong>Password updated!</strong> Redirecting to sign in…
            </div>
          ) : step === "otp" ? (
            <form noValidate onSubmit={handleVerifyOtp}>
              {isEditingEmail ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label htmlFor="reset-email-input" style={{ fontSize: "12px", fontWeight: 600 }}>
                    Account email
                  </label>
                  <input
                    id="reset-email-input"
                    type="email"
                    className="otp-digit"
                    style={{
                      height: "48px",
                      textAlign: "left",
                      padding: "0 14px",
                      fontSize: "14px",
                      fontFamily: "var(--font-ui)",
                    }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    disabled={pending}
                    required
                  />
                  {emailParam && (
                    <button
                      type="button"
                      className="auth-text-action"
                      style={{ alignSelf: "flex-start", marginTop: "4px" }}
                      onClick={() => {
                        setEmail(emailParam);
                        setIsEditingEmail(false);
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ) : (
                <div className="auth-email-pill">
                  <span>
                    Sent to: <strong>{email}</strong>
                  </span>
                  <button
                    type="button"
                    className="auth-text-action"
                    onClick={() => setIsEditingEmail(true)}
                    disabled={pending}
                  >
                    Change
                  </button>
                </div>
              )}

              {/* 6 to 8-digit OTP Inputs */}
              <fieldset className="otp-fieldset" aria-labelledby={otpFieldsetId}>
                <div className="otp-label-row">
                  <legend id={otpFieldsetId}>Verification code</legend>
                  <span>Supports paste</span>
                </div>
                <div className="otp-grid">
                  {digits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        inputsRef.current[idx] = el;
                      }}
                      id={`recovery-otp-digit-${idx}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      className="otp-digit"
                      aria-label={`Digit ${idx + 1} of 8`}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      onPaste={handlePaste}
                      disabled={pending}
                      autoFocus={idx === 0 && !emailParam}
                    />
                  ))}
                </div>
              </fieldset>

              <div className="auth-inline-actions">
                <button
                  type="button"
                  className="auth-text-action"
                  onClick={handleResend}
                  disabled={cooldown > 0 || pending}
                >
                  {cooldown > 0
                    ? `Resend code in ${cooldown}s`
                    : "Resend recovery code"}
                </button>
              </div>

              <Button
                type="submit"
                disabled={pending || code.length < 6 || code.length > 8}
              >
                {pending ? (
                  <>
                    <LoaderCircle className="auth-spinner" size={16} />
                    VERIFYING…
                  </>
                ) : (
                  "VERIFY CODE"
                )}
                {!pending && <ArrowUpRight size={16} />}
              </Button>

              {status && (
                <p className="feedback auth-response" role="status">
                  {status}
                </p>
              )}
            </form>
          ) : (
            <form noValidate onSubmit={handleUpdatePassword}>
              <div className="auth-password">
                <Input
                  id="new-password"
                  label="New password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setStatus("");
                    setErrors((prev) => ({ ...prev, password: "" }));
                  }}
                  error={errors.password}
                  disabled={pending}
                  maxLength={128}
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-controls="new-password"
                  aria-pressed={showPassword}
                  disabled={pending}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <p className="auth-password-hint">
                Use at least 8 characters with at least one letter and one number.
              </p>

              <div className="auth-password">
                <Input
                  id="confirm-new-password"
                  label="Confirm new password"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setStatus("");
                    setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                  }}
                  error={errors.confirmPassword}
                  disabled={pending}
                  maxLength={128}
                  required
                />
                <button
                  type="button"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  aria-controls="confirm-new-password"
                  aria-pressed={showConfirm}
                  disabled={pending}
                  onClick={() => setShowConfirm((v) => !v)}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <Button type="submit" disabled={pending}>
                {pending ? (
                  <>
                    <LoaderCircle className="auth-spinner" size={16} />
                    UPDATING…
                  </>
                ) : (
                  "UPDATE PASSWORD"
                )}
                {!pending && <ArrowUpRight size={16} />}
              </Button>

              {status && (
                <p className="feedback auth-response" role="status">
                  {status}
                </p>
              )}
            </form>
          )}

          <p className="auth-switch">
            Remembered your password?{" "}
            <Link href="/sign-in">
              Sign in <ArrowUpRight size={14} />
            </Link>
          </p>
        </div>
      </section>

      <aside className="customer-auth-editorial" aria-label="HIMATU collection">
        <div className="auth-editorial-heading">
          <p className="eyebrow">REGAIN ACCESS</p>
          <h2>
            YOUR SHELF
            <br />
            IS WAITING.
          </h2>
        </div>
        <div className="auth-photograph">
          <AssetImage
            asset={figurePhotos["ace-chibi"]}
            sizes="(max-width:767px) 85vw, 48vw"
          />
        </div>
        <div className="auth-editorial-caption">
          <span>PORTGAS D. ACE / HIMATU PHOTOGRAPHY</span>
          <Link href="/collections/one-piece">
            Explore the collection <ArrowUpRight size={16} />
          </Link>
        </div>
      </aside>
    </div>
  );
}
