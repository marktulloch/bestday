/** Default inline embed after MC pre-screen + registration (override with env). */
export const DEFAULT_CALENDLY_POST_PRESCREEN_EMBED_URL =
  "https://calendly.com/marktulloch/ai?hide_event_type_details=1";

export function getCalendlyPostPrescreenEmbedUrl(): string {
  return (
    process.env.NEXT_PUBLIC_CALENDLY_POST_PRESCREEN_URL?.trim() ||
    DEFAULT_CALENDLY_POST_PRESCREEN_EMBED_URL
  );
}

/**
 * Builds a Calendly scheduling URL with prefill and Best Day brand colours (no secrets).
 */
export function buildCalendlyEmbedUrl(
  baseUrl: string,
  opts?: { email?: string; name?: string },
): string {
  const trimmed = baseUrl.trim();
  if (!trimmed) return "";

  try {
    const u = new URL(trimmed);
    if (opts?.email) u.searchParams.set("email", opts.email);
    if (opts?.name) u.searchParams.set("name", opts.name);
    u.searchParams.set("primary_color", "4edd00");
    u.searchParams.set("text_color", "0d2e0d");
    return u.toString();
  } catch {
    const q = new URLSearchParams();
    if (opts?.email) q.set("email", opts.email);
    if (opts?.name) q.set("name", opts.name);
    q.set("primary_color", "4edd00");
    q.set("text_color", "0d2e0d");
    const sep = trimmed.includes("?") ? "&" : "?";
    const suffix = q.toString();
    return suffix ? `${trimmed}${sep}${suffix}` : trimmed;
  }
}
