const loopback = new Set(["localhost", "127.0.0.1", "[::1]"]);
/** Trust configured origins; optional local aliases must match the request's actual host. */
export function allowedAuthOrigin({
  origin,
  host,
  configuredOrigin,
  additionalOrigins = [],
  allowLocal = false,
}: {
  origin: string | null;
  host: string | null;
  configuredOrigin: string;
  additionalOrigins?: string[];
  allowLocal?: boolean;
}) {
  if (!origin || origin === "null") return false;
  try {
    const supplied = new URL(origin);
    if (
      !["http:", "https:"].includes(supplied.protocol) ||
      supplied.origin !== origin
    )
      return false;
    const configured = new URL(configuredOrigin);
    if (origin === configured.origin) return true;
    if (additionalOrigins.some((value) => new URL(value).origin === origin))
      return true;
    if (!allowLocal || !host || !loopback.has(configured.hostname))
      return false;
    if (
      !loopback.has(supplied.hostname) ||
      supplied.protocol !== configured.protocol
    )
      return false;
    const target = new URL(`${supplied.protocol}//${host}`);
    return target.host === supplied.host;
  } catch {
    return false;
  }
}
