import type { PrescreenWorkflowStatus as PrescreenWorkflowStatusDb } from "@/lib/database.types";

/** Stored prescreen workflow / eligibility status (mirrors DB enum). */
export type PrescreenWorkflowStatus = PrescreenWorkflowStatusDb;

/** How a single rule classified the case (ordering is pass < review < reject). */
export type RuleOutcomeKind = "pass" | "require_review" | "reject";

export type DecisionLogEntry = {
  ruleId: string;
  outcome: RuleOutcomeKind;
  message: string;
  code?: string;
};

/**
 * Result of running the eligibility engine on a complete (submitted) questionnaire.
 */
export type EligibilityEngineDecision = {
  status: PrescreenWorkflowStatus;
  reasonCodes: string[];
  log: DecisionLogEntry[];
  /** One-line triage line for admin UI and ticket subjects. */
  adminSummary: string;
  /** Public complete-page routing (derived from status). */
  completeOutcome: "booking" | "review" | "ineligible";
};

/** Normalised answers the engine consumes (from payload v2). */
export type PrescreenEligibilityAnswers = {
  nzResident: boolean;
  consultationConsent: boolean;
  ageRange: string;
  consultationReason: string;
};
