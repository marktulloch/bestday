/**
 * PostgREST often returns "Could not find the table … in the schema cache" when migrations
 * have not been applied to the linked Supabase project.
 */
export function mapPrescreeningPostgrestError(raw: string): string {
  if (/prescreening_responses|schema cache|does not exist/i.test(raw)) {
    return "Pre-screening could not be saved because the screening database table is missing on this project. Apply migrations from the repo (for example run `npx supabase db push` in the project root), then reload this page.";
  }
  return raw;
}
