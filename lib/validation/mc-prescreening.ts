import type { RefinementCtx } from "zod";
import { z } from "zod";

/** Canonical slug for “no contraindicated medications from this list”. */
export const MC_NONE_OF_THE_ABOVE_MED_SLUG = "none_of_the_above" as const;

export const MC_CONTRAINDICATED_MEDICATION_SLUGS = [
  "clozapine",
  "risperidone",
  "olanzapine",
  "haloperidol",
  "quetiapine_over_50mg",
] as const;

/** UI labels for `contraindicated_medications` values (must match DB trigger slugs). */
export const MC_CONTRAINDICATED_MEDICATION_OPTIONS: readonly { slug: string; label: string }[] = [
  { slug: "clozapine", label: "Clozapine" },
  { slug: "risperidone", label: "Risperidone" },
  { slug: "olanzapine", label: "Olanzapine" },
  { slug: "haloperidol", label: "Haloperidol" },
  { slug: "quetiapine_over_50mg", label: "Quetiapine (more than 50 mg per day)" },
  { slug: MC_NONE_OF_THE_ABOVE_MED_SLUG, label: "None of the above" },
];

/** MC clinical answers without the age checkbox (age comes from registration DOB on combined flow). */
export const mcPrescreeningClinicalFieldsObject = z.object({
  previously_attempted_treatment: z.boolean(),
  pregnant_breastfeeding_or_trying: z.boolean(),
  allergic_cannabinoids_coconut_salicylates: z.boolean(),
  psychosis_schizophrenia_bipolar_history: z.boolean(),
  contraindicated_medications: z.array(z.string()).default([]),
});

export function trimContraindicatedMedications<T extends { contraindicated_medications: string[] }>(
  row: T,
): T {
  return {
    ...row,
    contraindicated_medications: row.contraindicated_medications.map((s) => s.trim()).filter(Boolean),
  };
}

export function refineMcContraindicatedMedications(
  row: { contraindicated_medications: string[] },
  ctx: RefinementCtx,
): void {
  const meds = row.contraindicated_medications.map((s) => s.toLowerCase());
  if (meds.length === 0) {
    ctx.addIssue({
      code: "custom",
      message: "Select at least one option for contraindicated medications.",
      path: ["contraindicated_medications"],
    });
    return;
  }
  const hasNone = meds.includes(MC_NONE_OF_THE_ABOVE_MED_SLUG);
  if (hasNone && meds.length > 1) {
    ctx.addIssue({
      code: "custom",
      message: `"None of the above" cannot be selected together with other medication options.`,
      path: ["contraindicated_medications"],
    });
  }
}

export const mcPrescreeningClinicalWithoutAgeSchema = mcPrescreeningClinicalFieldsObject
  .transform(trimContraindicatedMedications)
  .superRefine(refineMcContraindicatedMedications);

export const mcPrescreeningSubmissionSchema = z
  .object({
    age_20_or_above: z.boolean(),
  })
  .merge(mcPrescreeningClinicalFieldsObject)
  .transform((row) => ({
    ...row,
    contraindicated_medications: row.contraindicated_medications.map((s) => s.trim()).filter(Boolean),
  }))
  .superRefine(refineMcContraindicatedMedications);

export type McPrescreeningSubmission = z.infer<typeof mcPrescreeningSubmissionSchema>;
