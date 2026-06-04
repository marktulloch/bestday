/**
 * Verify seeded test accounts have Auth users + profiles + expected roles (service role; no RLS).
 *
 *   npx tsx --env-file=.env.local scripts/verify-test-profiles.ts
 */

import { createClient } from "@supabase/supabase-js";

import { SEEDED_TEST_ACCOUNTS } from "../lib/auth/seeded-test-accounts";
import type { Database } from "../lib/database.types";

async function findUserIdByEmail(
  admin: ReturnType<typeof createClient<Database>>,
  emailNorm: string,
): Promise<string | null> {
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error("listUsers:", error.message);
      return null;
    }
    const found = data.users.find((u) => u.email?.toLowerCase() === emailNorm);
    if (found?.id) return found.id;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const admin = createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let failed = false;
  for (const { email, role: expectedRole } of SEEDED_TEST_ACCOUNTS) {
    const emailNorm = email.toLowerCase();
    const userId = await findUserIdByEmail(admin, emailNorm);
    if (!userId) {
      console.error(`FAIL  ${emailNorm}: no Auth user`);
      failed = true;
      continue;
    }

    const { data: profile, error } = await admin.from("profiles").select("id, role").eq("id", userId).maybeSingle();

    if (error) {
      console.error(`FAIL  ${emailNorm}: profiles query`, error.message);
      failed = true;
      continue;
    }
    if (!profile) {
      console.error(`FAIL  ${emailNorm}: no profiles row`);
      failed = true;
      continue;
    }
    if (profile.role !== expectedRole) {
      console.error(`FAIL  ${emailNorm}: role is ${profile.role}, expected ${expectedRole}`);
      failed = true;
      continue;
    }

    console.log(`OK    ${emailNorm}  profiles.id=${userId}  role=${profile.role}`);
  }

  if (failed) {
    console.error("\nRun: npm run seed:test-users");
    process.exit(1);
  }
  console.log("\nAll checks passed (data layer). Log in via the app to confirm RLS + redirects.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
