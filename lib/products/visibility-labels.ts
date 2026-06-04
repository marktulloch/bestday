import type { ProductPortalVisibility, ProductRow } from "@/lib/database.types";

const portalLabels: Record<ProductPortalVisibility, string> = {
  none: "Not in patient portal",
  eligible_only: "Portal: eligible patients only",
  approved_only: "Portal: doctor-approved only",
  eligible_or_approved: "Portal: eligible or approved",
};

export function portalVisibilityLabel(v: ProductPortalVisibility): string {
  return portalLabels[v] ?? v;
}

/** Short badges for cards (patient-facing). */
export function productAccessHint(product: Pick<ProductRow, "requires_doctor_approval" | "portal_visibility">): string {
  if (product.portal_visibility === "none") {
    return product.requires_doctor_approval ? "Prescriber guidance required" : "Ask your clinician";
  }
  if (product.requires_doctor_approval) {
    return "Your care team may need to confirm suitability";
  }
  return "Available in your care plan when eligible";
}
