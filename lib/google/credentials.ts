import "server-only";

import { readFileSync } from "node:fs";

export type ServiceAccountJson = {
  type?: string;
  project_id?: string;
  private_key: string;
  client_email: string;
};

function normalizePrivateKey(key: string): string {
  return key.includes("\\n") ? key.replace(/\\n/g, "\n") : key;
}

/**
 * Load a Google Cloud service account JSON from env or file.
 * Priority: GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 → GOOGLE_SERVICE_ACCOUNT_JSON → GOOGLE_APPLICATION_CREDENTIALS
 */
export function loadServiceAccountJson(): ServiceAccountJson | null {
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64?.trim();
  if (b64) {
    try {
      const raw = Buffer.from(b64, "base64").toString("utf8");
      const parsed = JSON.parse(raw) as ServiceAccountJson;
      if (parsed.client_email && parsed.private_key) {
        return { ...parsed, private_key: normalizePrivateKey(parsed.private_key) };
      }
    } catch {
      return null;
    }
  }

  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (inline) {
    try {
      const parsed = JSON.parse(inline) as ServiceAccountJson;
      if (parsed.client_email && parsed.private_key) {
        return { ...parsed, private_key: normalizePrivateKey(parsed.private_key) };
      }
    } catch {
      return null;
    }
  }

  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (path) {
    try {
      const parsed = JSON.parse(readFileSync(path, "utf8")) as ServiceAccountJson;
      if (parsed.client_email && parsed.private_key) {
        return { ...parsed, private_key: normalizePrivateKey(parsed.private_key) };
      }
    } catch {
      return null;
    }
  }

  return null;
}
