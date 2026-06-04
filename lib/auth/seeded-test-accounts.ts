import type { AppRole } from "@/lib/auth/roles";

/**
 * Fixed test accounts for staging / local dev (see `scripts/seed-test-users.ts`).
 * Kept in one place so seeds and optional server-side reconcile stay aligned.
 */
export const SEEDED_TEST_ACCOUNTS: readonly { email: string; role: AppRole }[] = [
  { email: "master@test.bestday.nz", role: "master" },
  { email: "admin@test.bestday.nz", role: "admin" },
  { email: "doctor@test.bestday.nz", role: "doctor" },
  { email: "customer@test.bestday.nz", role: "customer" },
] as const;

export const SEEDED_TEST_ACCOUNT_ROLES: ReadonlyMap<string, AppRole> = new Map(
  SEEDED_TEST_ACCOUNTS.map((a) => [a.email.toLowerCase(), a.role]),
);
