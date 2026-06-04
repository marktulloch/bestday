import type { PrescreeningResponseRow } from "@/lib/database.types";
import { MC_CONTRAINDICATED_MEDICATION_OPTIONS } from "@/lib/validation/mc-prescreening";

function yn(v: boolean): string {
  return v ? "Yes" : "No";
}

/** Human-readable lines for MC questionnaire answers (portal + staff views). */
export function formatMcPrescreeningResponseLines(row: PrescreeningResponseRow): string[] {
  const medLabels = row.contraindicated_medications.map((slug) => {
    const opt = MC_CONTRAINDICATED_MEDICATION_OPTIONS.find((o) => o.slug === slug);
    return opt?.label ?? slug;
  });

  const lines: string[] = [
    `Age 20 or above: ${yn(row.age_20_or_above)}`,
    `Previously attempted treatment for your condition: ${yn(row.previously_attempted_treatment)}`,
    `Pregnant, breastfeeding, or trying to conceive: ${yn(row.pregnant_breastfeeding_or_trying)}`,
    `Allergic to cannabinoids, coconut, or salicylates: ${yn(row.allergic_cannabinoids_coconut_salicylates)}`,
    `History of psychosis, schizophrenia, or bipolar disorder: ${yn(row.psychosis_schizophrenia_bipolar_history)}`,
    `Medications selected: ${medLabels.join(", ")}`,
  ];

  if (row.eligible) {
    lines.push("Outcome: Eligible based on these answers.");
  } else {
    lines.push(
      `Outcome: Not eligible${row.ineligible_reason ? ` — ${row.ineligible_reason}` : "."}`,
    );
  }

  return lines;
}
