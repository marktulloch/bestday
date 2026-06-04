import type { Json } from "@/lib/database.types";

/** Stored on `products.metadata` so no extra DB column is required. */
export const PRODUCT_IMAGE_URLS_METADATA_KEY = "image_urls" as const;

const MAX_IMAGES = 20;
const MAX_URL_LEN = 2048;

function isAllowedImageUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Trimmed non-empty URLs from repeated `image_urls` form fields. */
export function imageUrlsFromFormData(formData: FormData): string[] {
  const out: string[] = [];
  for (const v of formData.getAll("image_urls")) {
    if (typeof v !== "string") continue;
    const t = v.trim();
    if (t) out.push(t);
  }
  return out;
}

export function validateProductImageUrls(urls: string[]): string | null {
  if (urls.length > MAX_IMAGES) {
    return `At most ${MAX_IMAGES} images allowed.`;
  }
  for (const s of urls) {
    if (s.length > MAX_URL_LEN) return "Each image URL must be at most 2048 characters.";
    if (!isAllowedImageUrl(s)) return "Each image must be a valid http(s) URL.";
  }
  return null;
}

export function imageUrlsFromProductMetadata(metadata: Json): string[] {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return [];
  const raw = (metadata as Record<string, unknown>)[PRODUCT_IMAGE_URLS_METADATA_KEY];
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function primaryProductImageUrl(product: { metadata: Json }): string | null {
  const urls = imageUrlsFromProductMetadata(product.metadata);
  return urls[0] ?? null;
}
