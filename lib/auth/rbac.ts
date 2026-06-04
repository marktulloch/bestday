import type { AppRole } from "@/lib/auth/roles";

/** Route / middleware: admin dashboard */
export function canAccessAdminRoute(role: AppRole | null | undefined): boolean {
  return role === "master" || role === "admin";
}

/** Route / middleware: doctor workspace */
export function canAccessDoctorRoute(role: AppRole | undefined | null): boolean {
  return role === "master" || role === "admin" || role === "doctor";
}

/** Strict patient-only surfaces */
export function isCustomerRole(role: AppRole | null | undefined): boolean {
  return role === "customer";
}

/** Any elevated staff (clinical or operational) */
export function isStaffRole(role: AppRole | null | undefined): boolean {
  return (
    role === "master" || role === "admin" || role === "doctor"
  );
}

export function isMaster(role: AppRole | null | undefined): boolean {
  return role === "master";
}

export function hasAnyRole(
  role: AppRole | null | undefined,
  allowed: readonly AppRole[],
): boolean {
  if (!role) return false;
  return (allowed as readonly string[]).includes(role);
}
