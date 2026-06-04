import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifies Calendly webhook HMAC (header format: t=<unix>,v1=<hex>).
 * Signed payload is `${timestamp}.${rawBody}` (raw body bytes as UTF-8 string).
 */
export function verifyCalendlyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  signingKey: string,
): boolean {
  if (!signatureHeader?.trim() || !signingKey) {
    return false;
  }

  const parts: Record<string, string> = {};
  for (const segment of signatureHeader.split(",")) {
    const eq = segment.indexOf("=");
    if (eq === -1) continue;
    const k = segment.slice(0, eq).trim();
    const v = segment.slice(eq + 1).trim();
    parts[k] = v;
  }

  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) {
    return false;
  }

  const signedPayload = `${t}.${rawBody}`;
  const expectedHex = createHmac("sha256", signingKey).update(signedPayload).digest("hex");

  try {
    const a = Buffer.from(expectedHex, "utf8");
    const b = Buffer.from(v1, "utf8");
    if (a.length !== b.length) {
      return false;
    }
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
