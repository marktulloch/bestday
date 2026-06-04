import { z } from "zod";

import {
  mcPrescreeningClinicalFieldsObject,
  refineMcContraindicatedMedications,
  trimContraindicatedMedications,
} from "@/lib/validation/mc-prescreening";
import {
  patientSignupRegistrationBaseSchema,
  refinePatientSignupRegistrationBase,
} from "@/lib/validation/patient-registration";

/**
 * Pre-screen clinical answers + patient account fields in one step (anonymous visitors).
 * Age for the clinical record is derived server-side from `dateOfBirth` (must pass registration rules).
 */
export const mcPrescreenWithRegistrationSchema = patientSignupRegistrationBaseSchema
  .merge(mcPrescreeningClinicalFieldsObject)
  .transform((row) => trimContraindicatedMedications(row))
  .superRefine((data, ctx) => {
    refinePatientSignupRegistrationBase(data, ctx);
    refineMcContraindicatedMedications(data, ctx);
  });

export type McPrescreenWithRegistration = z.infer<typeof mcPrescreenWithRegistrationSchema>;
