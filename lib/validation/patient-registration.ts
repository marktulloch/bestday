import { z } from "zod";

import { isAgeAtLeastFromIsoDate } from "@/lib/validation/dates";

/** Object shape only (used to merge with MC clinical fields on the pre-screen page). */
export const patientSignupRegistrationBaseSchema = z.object({
  email: z.string().trim().email().max(320),
  confirmEmail: z.string().trim().email().max(320),
  password: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128),
  firstName: z.string().trim().min(1).max(120),
  lastName: z.string().trim().min(1).max(120),
  preferredName: z.string().trim().max(120).optional().nullable(),
  dateOfBirth: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD."),
  gender: z.string().trim().min(1).max(80),
  mobile: z.string().trim().min(8).max(40),
  termsAccepted: z.boolean(),
  privacyAccepted: z.boolean(),
});

export function refinePatientSignupRegistrationBase(
  data: z.infer<typeof patientSignupRegistrationBaseSchema>,
  ctx: z.RefinementCtx,
): void {
  if (data.email.toLowerCase() !== data.confirmEmail.toLowerCase()) {
    ctx.addIssue({
      code: "custom",
      message: "Email addresses do not match.",
      path: ["confirmEmail"],
    });
  }
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: "custom",
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    });
  }
  if (!data.termsAccepted) {
    ctx.addIssue({
      code: "custom",
      message: "You must accept the terms to register.",
      path: ["termsAccepted"],
    });
  }
  if (!data.privacyAccepted) {
    ctx.addIssue({
      code: "custom",
      message: "You must accept the privacy policy to register.",
      path: ["privacyAccepted"],
    });
  }
  if (!isAgeAtLeastFromIsoDate(data.dateOfBirth, 20)) {
    ctx.addIssue({
      code: "custom",
      message: "You must be at least 20 years old to register.",
      path: ["dateOfBirth"],
    });
  }
}

export const patientSignupRegistrationSchema = patientSignupRegistrationBaseSchema.superRefine(
  refinePatientSignupRegistrationBase,
);

export type PatientSignupRegistration = z.infer<typeof patientSignupRegistrationSchema>;
