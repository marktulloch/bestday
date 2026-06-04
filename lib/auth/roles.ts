export type AppRole = "master" | "admin" | "doctor" | "customer";

export const APP_ROLES: readonly AppRole[] = [
  "master",
  "admin",
  "doctor",
  "customer",
] as const;
