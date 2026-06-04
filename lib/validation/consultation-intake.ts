import { z } from "zod";

import type { Json } from "@/lib/database.types";

const jsonObject = z
  .unknown()
  .optional()
  .transform((v): Json => {
    if (v && typeof v === "object" && !Array.isArray(v)) return v as Json;
    return {};
  });

function optionalPositiveMetric(max: number) {
  return z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? null : v),
    z.coerce.number().positive().max(max).nullable(),
  );
}

export const consultationIntakeSubmissionSchema = z.object({
  nhi_number: z.string().trim().max(20).optional().nullable(),
  height_cm: optionalPositiveMetric(300).optional().nullable(),
  weight_kg: optionalPositiveMetric(500).optional().nullable(),
  gp_name: z.string().trim().min(1).max(200),
  gp_practice_name: z.string().trim().min(1).max(200),
  gp_practice_email: z.string().trim().email().max(320),
  gp_practice_phone: z.string().trim().min(5).max(40),
  primary_reason: z.string().trim().min(1).max(10_000),
  symptom_duration: z.string().trim().min(1).max(2000),
  severity_score: z.coerce.number().int().min(0).max(10),
  treatment_goals: z.string().trim().min(1).max(10_000),
  previous_unsuccessful_medications: z.string().trim().max(20_000).optional().nullable(),
  medical_history: jsonObject,
  medication_screening: jsonObject,
  general_allergies: z.string().trim().max(5000).optional().nullable(),
  current_medications_supplements: z.string().trim().max(20_000).optional().nullable(),
  occupation_risks: jsonObject,
  previous_cannabis_use: z.boolean().optional().nullable(),
  previous_cannabis_details: z.string().trim().max(10_000).optional().nullable(),
  consent_statement_accepted: z.boolean().refine((v) => v === true, {
    message: "You must accept the consent statement before submitting.",
  }),
  declaration_accepted: z.boolean().refine((v) => v === true, {
    message: "You must accept the declaration before submitting.",
  }),
});

export type ConsultationIntakeSubmission = z.infer<typeof consultationIntakeSubmissionSchema>;
