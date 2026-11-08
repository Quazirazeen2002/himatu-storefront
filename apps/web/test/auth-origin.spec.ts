import { allowedAuthOrigin } from "../src/lib/auth-origin";
const local = { configuredOrigin: "http://localhost:3000", allowLocal: true };
describe("Authentication origin validation", () => {
  it("accepts the configured application origin", () => {
    expect(
      allowedAuthOrigin({
        ...local,
        origin: "http://localhost:3000",
        host: "localhost:3000",
      }),
    ).toBe(true);
  });
  it("accepts same-origin local aliases and alternate local ports", () => {
    for (const host of ["localhost:3001", "127.0.0.1:3000", "[::1]:3000"])
      expect(
        allowedAuthOrigin({ ...local, origin: `http://${host}`, host }),
      ).toBe(true);
  });
  it("rejects cross-site and cross-port requests", () => {
    for (const origin of ["https://attacker.example", "http://localhost:3001"])
      expect(
        allowedAuthOrigin({ ...local, origin, host: "localhost:3000" }),
      ).toBe(false);
  });
  it("rejects missing, null and malformed origins", () => {
    for (const origin of [
      null,
      "null",
      "http://localhost:3000/evil",
      "not a URL",
    ])
      expect(
        allowedAuthOrigin({ ...local, origin, host: "localhost:3000" }),
      ).toBe(false);
  });
  it("does not enable local aliases for a deployed application", () => {
    expect(
      allowedAuthOrigin({
        ...local,
        configuredOrigin: "https://himatu.example",
        origin: "http://localhost:3000",
        host: "localhost:3000",
      }),
    ).toBe(false);
  });
  it("accepts an explicitly configured preview origin", () => {
    expect(
      allowedAuthOrigin({
        configuredOrigin: "https://himatu.example",
        origin: "https://preview.himatu.example",
        host: "preview.himatu.example",
        additionalOrigins: ["https://preview.himatu.example"],
      }),
    ).toBe(true);
  });
  it("requires opt-in for local aliases", () => {
    expect(
      allowedAuthOrigin({
        ...local,
        allowLocal: false,
        origin: "http://127.0.0.1:3000",
        host: "127.0.0.1:3000",
      }),
    ).toBe(false);
  });
});
