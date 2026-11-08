"use client";
import { useState } from "react";
import { Button, ButtonLink, DemoNotice, Input } from "../ui/Primitives";
import { validate, focusError, type FormErrors } from "@/lib/validation";
export function AuthForm({ create = false }: { create?: boolean }) {
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("");
  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const field = (key: keyof typeof values, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setStatus("");
    setErrors((current) => ({ ...current, [key]: "" }));
  };
  return (
    <div className="auth-layout">
      <div className="auth-statement">
        <p className="eyebrow">YOUR NEXT CHAPTER</p>
        <h2>
          WELCOME
          <br />
          TO YOUR
          <br />
          UNIVERSE.
        </h2>
        <p>A home for the characters you love.</p>
      </div>
      <div className="auth-form">
        <p className="eyebrow">HIMATU ACCOUNT / LOCAL PREVIEW</p>
        <h1>{create ? "CREATE ACCOUNT" : "SIGN IN"}</h1>
        <DemoNotice>
          Try form validation locally. Authentication is not connected. Use
          example details only; nothing is submitted or saved.
        </DemoNotice>
        <form
          noValidate
          aria-busy={pending}
          onSubmit={async (e) => {
            e.preventDefault();
            const next = validate(values, {
              ...(create
                ? { name: { label: "First name", required: true } }
                : {}),
              email: { label: "Email", required: true, kind: "email" },
              password: { label: "Password", required: true, kind: "password" },
            });
            setErrors(next);
            setStatus("");
            if (Object.keys(next).length) {
              focusError(next);
              return;
            }
            setPending(true);
            await new Promise((resolve) => setTimeout(resolve, 250));
            setPending(false);
            setStatus(
              "Form checked locally. Authentication is unavailable. No account was created and you have not been signed in.",
            );
          }}
        >
          {create && (
            <Input
              id="name"
              label="First name"
              autoComplete="given-name"
              value={values.name}
              onChange={(e) => field("name", e.target.value)}
              error={errors.name}
            />
          )}
          <Input
            id="email"
            label="Email address"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(e) => field("email", e.target.value)}
            error={errors.email}
          />
          <div className="password-field">
            <Input
              id="password"
              label="Password"
              type={show ? "text" : "password"}
              autoComplete={create ? "new-password" : "current-password"}
              value={values.password}
              onChange={(e) => field("password", e.target.value)}
              error={errors.password}
            />
            <button
              className="password-toggle"
              type="button"
              aria-label={show ? "Hide password" : "Show password"}
              aria-pressed={show}
              onClick={() => setShow(!show)}
            >
              {show ? "HIDE" : "SHOW"}
            </button>
          </div>
          <Button disabled={pending}>
            {pending
              ? "CHECKING FORM…"
              : create
                ? "CHECK ACCOUNT FORM · DEMO"
                : "CHECK SIGN IN FORM · DEMO"}
          </Button>
          {Object.values(errors).some(Boolean) && (
            <p className="feedback" role="alert">
              Check the highlighted fields.
            </p>
          )}
          {status && (
            <p role="status" className="feedback">
              {status}
            </p>
          )}
        </form>
        <p>{create ? "Already part of the universe?" : "New to HIMATU?"}</p>
        <ButtonLink
          variant="outline"
          href={create ? "/sign-in" : "/create-account"}
        >
          {create ? "SIGN IN" : "CREATE ACCOUNT"}
        </ButtonLink>
      </div>
    </div>
  );
}
export { CheckoutForm } from "./CheckoutForm";
