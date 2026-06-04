import type { Json } from "@/lib/database.types";
import { normalizePrescreenPayload } from "@/lib/prescreen/payload";

/** Human-readable lines for doctor review (from stored JSON payload). */
export function formatPrescreenPayloadSummary(payload: Json): string[] {
  const n = normalizePrescreenPayload(payload);
  const lines: string[] = [];
  lines.push(`Email (captured): ${n.step1.email ?? "—"}`);
  lines.push(`Age range: ${n.step1.ageRange || "—"}`);
  lines.push(`NZ resident: ${n.step1.nzResident ? "Yes" : "No"}`);
  if (n.step2) {
    lines.push(`Consultation reason: ${n.step2.consultationReason || "—"}`);
    lines.push(`Has regular GP: ${n.step2.hasGP ? "Yes" : "No"}`);
    lines.push(`Consultation consent: ${n.step2.consentConsultation ? "Yes" : "No"}`);
  } else {
    lines.push("Clinical step: not completed in this record.");
  }
  return lines;
}
