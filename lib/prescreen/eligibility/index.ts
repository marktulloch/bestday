export type {
  PrescreenWorkflowStatus,
  RuleOutcomeKind,
  DecisionLogEntry,
  EligibilityEngineDecision,
  PrescreenEligibilityAnswers,
} from "./types";

export { PRESCREEN_REASON_CODES, type PrescreenReasonCode, labelReasonCode } from "./reason-codes";
export { prescreenEligibilityRules, type PrescreenRule } from "./rules";
export { evaluateSubmittedPrescreen } from "./engine";
export { getCustomerPrescreenSummary } from "./customer-summary";
export {
  parseDecisionLogFromDb,
  formatDecisionLogForAdmin,
} from "./admin-format";

/** Maps terminal workflow status to URL segment for /prescreen/complete */
export function workflowStatusToQueryParam(
  outcome: "booking" | "review" | "ineligible",
): "booking" | "review" | "ineligible" {
  return outcome;
}
