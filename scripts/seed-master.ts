/**
 * One-time bootstrap: create (or locate) a user and promote to master.
 *
 * Usage (from repo root, with .env.local loaded):
 *   npx tsx --env-file=.env.local scripts/seed-master.ts
 *
 * Required env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   MASTER_SEED_EMAIL
 *   MASTER_SEED_PASSWORD
 */

import { createClient } from "@supabase/supabase-js";

import type { Database } from "../lib/database.types";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = process.env.MASTER_SEED_EMAIL?.trim().toLowerCase();
  const password = process.env.MASTER_SEED_PASSWORD;

  if (!url || !serviceKey || !email || !password) {
    console.error(
      "Missing env. Need NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MASTER_SEED_EMAIL, MASTER_SEED_PASSWORD.",
    );
    process.exit(1);
  }

  const admin = createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  let userId: string | undefined;

  if (createError) {
    const msg = createError.message.toLowerCase();
    if (!msg.includes("already") && !msg.includes("registered")) {
      console.error("createUser:", createError.message);
      process.exit(1);
    }
    const { data: list, error: listError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (listError) {
      console.error("listUsers:", listError.message);
      process.exit(1);
    }
    const found = list.users.find(
      (u) => u.email?.toLowerCase() === email,
    );
    if (!found) {
      console.error(
        "User may already exist but was not found in the first page of listUsers. Promote manually in Supabase Dashboard.",
      );
      process.exit(1);
    }
    userId = found.id;
  } else {
    userId = created.user?.id;
  }

  if (!userId) {
    console.error("Could not resolve user id.");
    process.exit(1);
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      email,
      role: "master",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (profileError) {
    console.error("profiles upsert:", profileError.message);
    process.exit(1);
  }

  const { data: existingRa } = await admin
    .from("role_assignments")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "master")
    .limit(1)
    .maybeSingle();

  if (!existingRa) {
    const { error: raError } = await admin.from("role_assignments").insert({
      user_id: userId,
      role: "master",
      granted_by: userId,
      reason: "scripts/seed-master.ts",
    });

    if (raError) {
      console.warn("role_assignments insert:", raError.message);
    }
  }

  console.log("Master seed complete for:", email);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
