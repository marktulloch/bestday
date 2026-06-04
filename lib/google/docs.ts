import "server-only";

/**
 * Google Docs — document generation (letters, intake summaries, etc.).
 *
 * Planned pattern:
 * - Copy a template Doc via Drive `files.copy` with `convert` / template id.
 * - Merge placeholders with Docs API `batchUpdate` (replaceAllText).
 * - Persist `document_id` in Supabase; Google holds the rendered file only.
 *
 * Intentionally minimal until a concrete template workflow exists.
 */
export type GoogleDocsNotConfiguredError = { ok: false; error: string };

export function docsIntegrationStatus():
  | { ok: true; message: string }
  | GoogleDocsNotConfiguredError {
  return {
    ok: false,
    error:
      "Docs generation is not enabled. Add a template workflow and call google.docs({ version: 'v1', auth }) from a server action or job.",
  };
}
