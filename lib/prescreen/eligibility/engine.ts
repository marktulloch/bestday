import type {
  EligibilityEngineDecision,
  PrescreenEligibilityAnswers,
  PrescreenWorkflowStatus,
  RuleOutcomeKind,
} from "./types";
import { PRESCREEN_REASON_CODES, labelReasonCode } from "./reason-codes";
import { prescreenEligibilityRules } from "./rules";

const rank: Record<RuleOutcomeKind, number> = {
  pass: 0,
  require_review: 1,
  reject: 2,
};

function completeOutcomeFromStatus(
  status: "eligible_for_booking" | "needs_manual_review" | "ineligible",
): "booking" | "review" | "ineligible" {
  switch (status) {
    case "eligible_for_booking":
      return "booking";
    case "needs_manual_review":
      return "review";
    default:
      return "ineligible";
  }
}

function buildAdminSummary(args: {
  status: PrescreenWorkflowStatus;
  log: EligibilityEngineDecision["log"];
  reasonCodes: string[];
}): string {
  const { status, log, reasonCodes } = args;
  const parts: string[] = [];

  if (status === "eligible_for_booking") {
    parts.push("Eligible for booking (automated).");
  } else if (status === "needs_manual_review") {
    parts.push("Needs manual review.");
  } else if (status === "ineligible") {
    parts.push("Not eligible via automated rules.");
  }

  const codesLine = reasonCodes.map((c) => labelReasonCode(c)).join("; ");
  if (codesLine) {
    parts.push(`Reasons: ${codesLine}.`);
  }

  const rejectOrReview = log.filter((e) => e.outcome !== "pass");
  if (rejectOrReview.length > 0) {
    parts.push(
      rejectOrReview.map((e) => `[${e.ruleId}] ${e.message}`).join(" "),
    );
  }

  return parts.join(" ");
}

/**
 * Run the modular rule chain on a fully submitted questionnaire.
 * Extend by appending rules to `prescreenEligibilityRules` (order matters).
 */
export function evaluateSubmittedPrescreen(
  answers: PrescreenEligibilityAnswers,
): EligibilityEngineDecision {
  const log: EligibilityEngineDecision["log"] = [];
  const reasonCodes: string[] = [];

  let worst: RuleOutcomeKind = "pass";

  for (const rule of prescreenEligibilityRules) {
    const result = rule.run(answers);
    log.push({
      ruleId: result.ruleId,
      outcome: result.outcome,
      message: result.message,
      code: result.code,
    });
    if (result.code) {
      reasonCodes.push(result.code);
    }
    if (rank[result.outcome] > rank[worst]) {
      worst = result.outcome;
    }
    if (result.outcome === "reject") {
      break;
    }
  }

  if (worst === "pass") {
    log.push({
      ruleId: "automated_eligible_booking",
      outcome: "pass",
      message: "All automated eligibility checks passed.",
      code: PRESCREEN_REASON_CODES.AUTOMATED_PASS_ELIGIBLE_BOOKING,
    });
    reasonCodes.push(PRESCREEN_REASON_CODES.AUTOMATED_PASS_ELIGIBLE_BOOKING);
  }

  let status: PrescreenWorkflowStatus;
  if (worst === "reject") {
    status = "ineligible";
  } else if (worst === "require_review") {
    status = "needs_manual_review";
  } else {
    status = "eligible_for_booking";
  }

  const adminSummary = buildAdminSummary({ status, log, reasonCodes });

  return {
    status,
    reasonCodes,
    log,
    adminSummary,
    completeOutcome: completeOutcomeFromStatus(
      status as "eligible_for_booking" | "needs_manual_review" | "ineligible",
    ),
  };
}
