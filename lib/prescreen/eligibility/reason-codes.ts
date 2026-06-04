/**
 * Stable reason codes for analytics, tickets, and admin filters.
 * Add new codes when you add rules — do not rename existing values.
 */
export const PRESCREEN_REASON_CODES = {
  NZ_RESIDENCY_NOT_CONFIRMED: "NZ_RESIDENCY_NOT_CONFIRMED",
  CONSENT_CONSULTATION_NOT_GIVEN: "CONSENT_CONSULTATION_NOT_GIVEN",
  AGE_BUCKET_OUTSIDE_AUTO_APPROVAL: "AGE_BUCKET_OUTSIDE_AUTO_APPROVAL",
  CONSULTATION_REASON_FLAGGED_FOR_REVIEW: "CONSULTATION_REASON_FLAGGED_FOR_REVIEW",
  AUTOMATED_PASS_ELIGIBLE_BOOKING: "AUTOMATED_PASS_ELIGIBLE_BOOKING",
} as const;

export type PrescreenReasonCode = (typeof PRESCREEN_REASON_CODES)[keyof typeof PRESCREEN_REASON_CODES];

/** Short labels for staff-facing tables. */
export const REASON_CODE_LABELS: Record<PrescreenReasonCode, string> = {
  [PRESCREEN_REASON_CODES.NZ_RESIDENCY_NOT_CONFIRMED]: "NZ residency not confirmed",
  [PRESCREEN_REASON_CODES.CONSENT_CONSULTATION_NOT_GIVEN]: "Consultation consent not given",
  [PRESCREEN_REASON_CODES.AGE_BUCKET_OUTSIDE_AUTO_APPROVAL]: "Age bucket needs manual review",
  [PRESCREEN_REASON_CODES.CONSULTATION_REASON_FLAGGED_FOR_REVIEW]: "Consultation reason flagged",
  [PRESCREEN_REASON_CODES.AUTOMATED_PASS_ELIGIBLE_BOOKING]: "Passed automated booking rules",
};

export function labelReasonCode(code: string): string {
  return REASON_CODE_LABELS[code as PrescreenReasonCode] ?? code;
}
