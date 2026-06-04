/**
 * Dev/staging: create four fixed test accounts and set `profiles.role`.
 * Idempotent: safe to re-run (updates password + role).
 *
 * Usage (from repo root):
 *   npm run seed:test-users
 *
 * Requires .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional:
 *   SEED_TEST_USERS_PASSWORD  (defaults to shared local test password below)
 */

import { createClient } from "@supabase/supabase-js";

import { SEEDED_TEST_ACCOUNTS } from "../lib/auth/seeded-test-accounts";
import type { Database } from "../lib/database.types";

const DEFAULT_TEST_PASSWORD = "BestDayTest123!";

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

async function ensureUser(
  admin: ReturnType<typeof createClient<Database>>,
  email: string,
  password: string,
): Promise<string | null> {
  const emailNorm = email.trim().toLowerCase();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: emailNorm,
    password,
    email_confirm: true,
  });

  if (!createError && created.user?.id) {
    return created.user.id;
  }

  const msg = createError?.message.toLowerCase() ?? "";
  if (!msg.includes("already") && !msg.includes("registered")) {
    console.error(`createUser (${emailNorm}):`, createError?.message);
    return null;
  }

  const userId = await findUserIdByEmail(admin, emailNorm);
  if (!userId) {
    console.error(`User exists but not found in listUsers: ${emailNorm}`);
    return null;
  }

  const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
  });
  if (updErr) {
    console.error(`updateUserById (${emailNorm}):`, updErr.message);
    return null;
  }

  return userId;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const password =
    process.env.SEED_TEST_USERS_PASSWORD?.trim() || DEFAULT_TEST_PASSWORD;

  if (!url || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
    process.exit(1);
  }

  const admin = createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("Seeding test users (password from SEED_TEST_USERS_PASSWORD or default)…");

  for (const { email, role } of SEEDED_TEST_ACCOUNTS) {
    const userId = await ensureUser(admin, email, password);
    if (!userId) {
      process.exit(1);
    }

    const emailNorm = email.trim().toLowerCase();
    const now = new Date().toISOString();
    const { error: profileError } = await admin.from("profiles").upsert(
      { id: userId, email: emailNorm, role, updated_at: now },
      { onConflict: "id" },
    );

    if (profileError) {
      console.error(`profiles upsert (${emailNorm}):`, profileError.message);
      process.exit(1);
    }

    const { data: existingRa } = await admin
      .from("role_assignments")
      .select("id")
      .eq("user_id", userId)
      .eq("role", role)
      .limit(1)
      .maybeSingle();

    if (!existingRa) {
      const { error: raErr } = await admin.from("role_assignments").insert({
        user_id: userId,
        role,
        granted_by: userId,
        reason: "scripts/seed-test-users.ts",
      });
      if (raErr) {
        console.warn(`role_assignments (${emailNorm}):`, raErr.message);
      }
    }

    console.log(`  OK  ${emailNorm} → ${role}`);
  }

  console.log("\nDone. Sign in at /login with any email above.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
