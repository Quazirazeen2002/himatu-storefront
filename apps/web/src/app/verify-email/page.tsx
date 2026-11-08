"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, LoaderCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Primitives";
import { AssetImage } from "@/components/products/AssetImage";
import { figurePhotos } from "@/lib/assets";
import { authService } from "@/lib/auth-service";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const nextTarget = searchParams.get("next") || "";

  const [email, setEmail] = useState(initialEmail);
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
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isEditingEmail, setIsEditingEmail] = useState(!initialEmail);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const otpFieldsetId = useId();

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleDigitChange = (index: number, val: string) => {
    // Only accept numeric input
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

    // Single digit input
    const char = cleaned.slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setStatus("");

    // Auto-advance focus
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setStatus("Please provide your email address.");
      return;
    }
    if (code.length < 6 || code.length > 8) {
      setStatus("Please enter your 6 to 8-digit verification code.");
      return;
    }

    setPending(true);
    setStatus("");

    try {
      const res = await authService.verifyOtp({
        email: email.trim(),
        token: code,
        type: "signup",
        next: nextTarget || undefined,
      });

      if (res.ok) {
        setIsSuccess(true);
        setStatus(res.message || "Email verified! Welcome to HIMATU.");
        setTimeout(() => {
          router.push(res.redirectTo || "/");
          router.refresh();
        }, 1200);
      } else {
        setStatus(res.message);
      }
    } catch {
      setStatus("Unable to verify the code right now. Please try again.");
    } finally {
      setPending(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || pending) return;
    if (!email.trim()) {
      setStatus("Please enter an email address to resend the code.");
      return;
    }

    setPending(true);
    setStatus("");

    try {
      const res = await authService.resendOtp({
        email: email.trim(),
        type: "signup",
      });

      setStatus(res.message || "A new 6-digit code has been sent.");
      if (res.ok) {
        setCooldown(res.retryAfterSeconds || 60);
      } else if (res.code === "resend_cooldown" && res.retryAfterSeconds) {
        setCooldown(res.retryAfterSeconds);
      }
    } catch {
      setStatus("Could not resend the code right now. Try again later.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="customer-auth">
      <section className="customer-auth-panel" aria-labelledby="verify-heading">
        <div className="customer-auth-content">
          <Link
            className="wordmark auth-wordmark"
            href="/"
            aria-label="HIMATU home"
          >
            HIMATU
          </Link>
          <p className="eyebrow auth-mode">EMAIL VERIFICATION</p>
          <h1 id="verify-heading">VERIFY YOUR EMAIL.</h1>
          <p className="auth-introduction">
            Enter the verification code sent to your inbox to activate your account.
          </p>

          <div className="auth-connection-note">
            <span className="red-mark" />
            <span>
              Secure verification ensures only verified collectors gain access.
              <br />
              Supports 6 to 8-digit codes with automatic paste.
            </span>
          </div>

          {isSuccess ? (
            <div className="auth-banner auth-banner--success" role="status">
              <CheckCircle2 size={18} style={{ display: "inline", marginRight: "8px" }} />
              <strong>Verification successful!</strong> Redirecting to your destination…
            </div>
          ) : (
            <form noValidate onSubmit={handleSubmit}>
              {/* Email summary or edit */}
              {isEditingEmail ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label htmlFor="verify-email-input" style={{ fontSize: "12px", fontWeight: 600 }}>
                    Email address
                  </label>
                  <input
                    id="verify-email-input"
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
                  {initialEmail && (
                    <button
                      type="button"
                      className="auth-text-action"
                      style={{ alignSelf: "flex-start", marginTop: "4px" }}
                      onClick={() => {
                        setEmail(initialEmail);
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
                      id={`otp-digit-${idx}`}
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
                      disabled={pending || isSuccess}
                      autoFocus={idx === 0 && !initialEmail}
                    />
                  ))}
                </div>
              </fieldset>

              <div className="auth-inline-actions">
                <button
                  type="button"
                  className="auth-text-action"
                  onClick={handleResend}
                  disabled={cooldown > 0 || pending || isSuccess}
                >
                  {cooldown > 0
                    ? `Resend code in ${cooldown}s`
                    : "Resend verification code"}
                </button>
              </div>

              <Button
                type="submit"
                disabled={
                  pending || isSuccess || code.length < 6 || code.length > 8
                }
              >
                {pending ? (
                  <>
                    <LoaderCircle className="auth-spinner" size={16} />
                    VERIFYING…
                  </>
                ) : (
                  "CONFIRM & CONTINUE"
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
            Need to start over?{" "}
            <Link href="/create-account">
              Create account <ArrowUpRight size={14} />
            </Link>{" "}
            or{" "}
            <Link href="/sign-in">
              Sign in <ArrowUpRight size={14} />
            </Link>
          </p>
        </div>
      </section>

      <aside className="customer-auth-editorial" aria-label="HIMATU collection">
        <div className="auth-editorial-heading">
          <p className="eyebrow">MEMBERS-ONLY EXPERIENCE</p>
          <h2>
            JOIN THE
            <br />
            COMMUNITY.
          </h2>
        </div>
        <div className="auth-photograph">
          <AssetImage
            asset={figurePhotos["straw-hat-captain"]}
            sizes="(max-width:767px) 85vw, 48vw"
          />
        </div>
        <div className="auth-editorial-caption">
          <span>ONE PIECE / HIMATU AUTHENTICITY</span>
          <Link href="/collections/one-piece">
            Explore the collection <ArrowUpRight size={16} />
          </Link>
        </div>
      </aside>
    </div>
  );
}
