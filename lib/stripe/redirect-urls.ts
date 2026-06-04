/**
 * Ensures success/cancel URLs stay on the app origin (mitigates open redirects).
 * Uses `NEXT_PUBLIC_SITE_URL` (e.g. https://app.example.com).
 */
export function getSiteOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

export function assertAppRedirectUrl(urlString: string, siteOrigin: string): URL {
  const u = new URL(urlString);
  if (u.origin !== siteOrigin) {
    throw new Error("success_url and cancel_url must use the same origin as NEXT_PUBLIC_SITE_URL");
  }
  return u;
}
