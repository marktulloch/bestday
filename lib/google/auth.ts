import "server-only";

import { JWT } from "google-auth-library";

import { loadServiceAccountJson } from "./credentials";

/**
 * Auth strategy (see docs/google-workspace.md):
 * - **Service account JSON** from env or `GOOGLE_APPLICATION_CREDENTIALS` file.
 * - **Domain-wide delegation**: set `GOOGLE_WORKSPACE_DELEGATED_USER` to a Workspace user
 *   to impersonate (required for Gmail send; optional for Calendar as that user).
 * - Without delegation, APIs that act as the service account itself work if resources
 *   are shared with `client_email` (typical for Drive folders).
 */
export function getWorkspaceJwtClient(scopes: string[]): JWT | null {
  const creds = loadServiceAccountJson();
  if (!creds) return null;

  const subject = process.env.GOOGLE_WORKSPACE_DELEGATED_USER?.trim() || undefined;

  return new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes,
    subject,
  });
}

export function getServiceAccountEmail(): string | null {
  return loadServiceAccountJson()?.client_email ?? null;
}
