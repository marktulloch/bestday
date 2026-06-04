import type { PrescreenWorkflowStatus } from "./types";

/** Customer-facing copy only — no reason codes or internal log. */
export function getCustomerPrescreenSummary(status: PrescreenWorkflowStatus): {
  label: string;
  detail: string;
} {
  switch (status) {
    case "draft":
      return {
        label: "In progress",
        detail: "Continue your pre-screen to finish the questionnaire.",
      };
    case "submitted":
      return {
        label: "Received",
        detail: "Your answers are being processed.",
      };
    case "eligible_for_booking":
      return {
        label: "Eligible to book",
        detail: "You can proceed to schedule a consultation when booking opens.",
      };
    case "needs_manual_review":
      return {
        label: "Under review",
        detail: "A clinician or administrator is reviewing your pre-screen.",
      };
    case "ineligible":
      return {
        label: "Not eligible online",
        detail: "Our team may contact you if follow-up is appropriate.",
      };
    default:
      return {
        label: "Status update",
        detail: "Check back soon for your pre-screen status.",
      };
  }
}
