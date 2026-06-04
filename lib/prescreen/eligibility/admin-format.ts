import type { Json } from "@/lib/database.types";

import type { DecisionLogEntry } from "./types";
import { labelReasonCode } from "./reason-codes";

function isDecisionLogEntry(x: unknown): x is DecisionLogEntry {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.ruleId === "string" &&
    (o.outcome === "pass" || o.outcome === "require_review" || o.outcome === "reject") &&
    typeof o.message === "string"
  );
}

/** Parse JSONB from DB into typed log lines (invalid rows dropped). */
export function parseDecisionLogFromDb(raw: Json | null | undefined): DecisionLogEntry[] {
  if (!raw || !Array.isArray(raw)) return [];
  const out: DecisionLogEntry[] = [];
  for (const item of raw) {
    if (isDecisionLogEntry(item)) {
      out.push({
        ruleId: item.ruleId,
        outcome: item.outcome,
        message: item.message,
        ...(typeof item.code === "string" ? { code: item.code } : {}),
      });
    }
  }
  return out;
}

/** Human-readable lines for staff UI. */
export function formatDecisionLogForAdmin(log: DecisionLogEntry[]): string[] {
  return log.map((e) => {
    const code = e.code ? ` [${labelReasonCode(e.code)}]` : "";
    return `${e.ruleId} (${e.outcome})${code}: ${e.message}`;
  });
}
