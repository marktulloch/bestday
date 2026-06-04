import type { PrescreenEligibilityAnswers } from "./types";
import type { RuleOutcomeKind } from "./types";
import { PRESCREEN_REASON_CODES } from "./reason-codes";

export type RuleResult = {
  ruleId: string;
  outcome: RuleOutcomeKind;
  message: string;
  code?: string;
};

export type PrescreenRule = {
  id: string;
  describe: string;
  run: (answers: PrescreenEligibilityAnswers) => RuleResult;
};

const ADULT_AUTO_BUCKETS = new Set([
  "18-25",
  "26-35",
  "36-45",
  "46-55",
  "56-65",
  "66+",
]);

/** Ordered chain: first rejecting rule wins for terminal status; else any review → manual review. */
export const prescreenEligibilityRules: PrescreenRule[] = [
  {
    id: "nz_residency",
    describe: "Must be NZ resident for online pathway",
    run: (a) =>
      a.nzResident
        ? {
            ruleId: "nz_residency",
            outcome: "pass",
            message: "Respondent confirmed New Zealand residency.",
          }
        : {
            ruleId: "nz_residency",
            outcome: "reject",
            message: "Respondent is not a New Zealand resident.",
            code: PRESCREEN_REASON_CODES.NZ_RESIDENCY_NOT_CONFIRMED,
          },
  },
  {
    id: "consultation_consent",
    describe: "Consultation pathway consent required",
    run: (a) =>
      a.consultationConsent
        ? {
            ruleId: "consultation_consent",
            outcome: "pass",
            message: "Consultation consent confirmed.",
          }
        : {
            ruleId: "consultation_consent",
            outcome: "reject",
            message: "Consultation consent not provided.",
            code: PRESCREEN_REASON_CODES.CONSENT_CONSULTATION_NOT_GIVEN,
          },
  },
  {
    id: "adult_age_bucket",
    describe: "Known adult age buckets auto-approve; others need review",
    run: (a) =>
      ADULT_AUTO_BUCKETS.has(a.ageRange)
        ? {
            ruleId: "adult_age_bucket",
            outcome: "pass",
            message: `Age bucket "${a.ageRange}" is within automated booking range.`,
          }
        : {
            ruleId: "adult_age_bucket",
            outcome: "require_review",
            message: `Age bucket "${a.ageRange}" is outside automated booking range.`,
            code: PRESCREEN_REASON_CODES.AGE_BUCKET_OUTSIDE_AUTO_APPROVAL,
          },
  },
  {
    id: "consultation_reason",
    describe: "Some reasons always need human triage",
    run: (a) => {
      if (a.consultationReason === "prescription" || a.consultationReason === "other") {
        return {
          ruleId: "consultation_reason",
          outcome: "require_review",
          message: `Consultation reason "${a.consultationReason}" requires manual review.`,
          code: PRESCREEN_REASON_CODES.CONSULTATION_REASON_FLAGGED_FOR_REVIEW,
        };
      }
      return {
        ruleId: "consultation_reason",
        outcome: "pass",
        message: `Consultation reason "${a.consultationReason}" is acceptable for automated booking.`,
      };
    },
  },
];
