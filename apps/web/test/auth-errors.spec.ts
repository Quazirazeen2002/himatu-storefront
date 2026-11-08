import { authFailure } from "../src/lib/auth-errors";
describe("Actionable auth failures", () => {
  it("explains the email delivery restriction", () => {
    const result = authFailure(
      { code: "email_address_not_authorized", status: 403 },
      "register",
    );
    expect(result.status).toBe(503);
    expect(result.body.code).toBe("email_delivery_unavailable");
    expect(result.body.message).toContain("email sending setup");
  });
  it("distinguishes unverified email from incorrect credentials", () => {
    expect(
      authFailure({ code: "email_not_confirmed" }, "sign-in").body.code,
    ).toBe("email_not_confirmed");
    expect(
      authFailure({ code: "invalid_credentials" }, "sign-in").body.code,
    ).toBe("invalid_credentials");
  });
  it("preserves throttling and provider outages", () => {
    expect(authFailure({ status: 429 }, "register").status).toBe(429);
    expect(authFailure({ status: 500 }, "register").status).toBe(503);
  });
  it("distinguishes email quota from sign-in throttling", () => {
    const quota = authFailure(
      { code: "over_email_send_rate_limit", status: 429 },
      "register",
    );
    expect(quota.body.code).toBe("email_rate_limited");
    expect(quota.body.message).toContain(
      "Existing verified accounts can still sign in",
    );
    const signIn = authFailure(
      { code: "over_request_rate_limit", status: 429 },
      "sign-in",
    );
    expect(signIn.body.code).toBe("rate_limited");
    expect(signIn.body.message).toContain("sign-in requests");
  });
  it("maps invalid addresses without echoing user input", () => {
    expect(
      authFailure({ code: "email_address_invalid" }, "register").body.message,
    ).toBe("Enter a valid email address that can receive account emails.");
  });
});
