import type { Json } from "@/lib/database.types";

/** Current prescreen JSON shape; bump schemaVersion when adding clinical fields. */
export const PRESCREEN_SCHEMA_VERSION = 2;

export type PrescreenPayloadV2 = {
  schemaVersion: typeof PRESCREEN_SCHEMA_VERSION;
  step1: {
    email: string | null;
    ageRange: string;
    nzResident: boolean;
  };
  step2?: {
    consultationReason: string;
    hasGP: boolean;
    consentConsultation: boolean;
    consents?: Record<string, boolean>;
  };
  clinical?: Record<string, Json>;
};

function emptyPayload(): PrescreenPayloadV2 {
  return {
    schemaVersion: PRESCREEN_SCHEMA_VERSION,
    step1: { email: null, ageRange: "", nzResident: false },
  };
}

/**
 * Normalises legacy flat JSONB (v1) and current nested shape (v2).
 */
export function normalizePrescreenPayload(raw: Json | undefined): PrescreenPayloadV2 {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return emptyPayload();
  }
  const o = raw as Record<string, unknown>;

  if (o.schemaVersion === PRESCREEN_SCHEMA_VERSION && o.step1 && typeof o.step1 === "object") {
    const s1 = o.step1 as Record<string, unknown>;
    return {
      schemaVersion: PRESCREEN_SCHEMA_VERSION,
      step1: {
        email: typeof s1.email === "string" ? s1.email : s1.email === null ? null : null,
        ageRange: typeof s1.ageRange === "string" ? s1.ageRange : "",
        nzResident: Boolean(s1.nzResident),
      },
      step2:
        o.step2 && typeof o.step2 === "object"
          ? {
              consultationReason: String(
                (o.step2 as Record<string, unknown>).consultationReason ?? "",
              ),
              hasGP: Boolean((o.step2 as Record<string, unknown>).hasGP),
              consentConsultation: Boolean(
                (o.step2 as Record<string, unknown>).consentConsultation ??
                  (o.step2 as Record<string, unknown>).consent,
              ),
              consents:
                (o.step2 as Record<string, unknown>).consents &&
                typeof (o.step2 as Record<string, unknown>).consents === "object"
                  ? ((o.step2 as Record<string, unknown>).consents as Record<string, boolean>)
                  : undefined,
            }
          : undefined,
      clinical:
        o.clinical && typeof o.clinical === "object" && !Array.isArray(o.clinical)
          ? (o.clinical as Record<string, Json>)
          : undefined,
    };
  }

  if (typeof o.ageRange === "string") {
    return {
      schemaVersion: PRESCREEN_SCHEMA_VERSION,
      step1: {
        email: typeof o.email === "string" ? o.email : null,
        ageRange: o.ageRange,
        nzResident: Boolean(o.nzResident),
      },
      step2: {
        consultationReason: typeof o.consultationReason === "string" ? o.consultationReason : "",
        hasGP: Boolean(o.hasGP),
        consentConsultation: Boolean(o.consent),
      },
    };
  }

  return emptyPayload();
}

export function buildPayloadAfterStep1(input: {
  email: string | null;
  ageRange: string;
  nzResident: boolean;
}): Json {
  const p: PrescreenPayloadV2 = {
    schemaVersion: PRESCREEN_SCHEMA_VERSION,
    step1: {
      email: input.email,
      ageRange: input.ageRange,
      nzResident: input.nzResident,
    },
  };
  return p as unknown as Json;
}

/** Merges step 1 answers into an existing or empty payload (keeps step2/clinical when present). */
export function applyStep1ToPayload(
  existing: Json | undefined,
  input: { email: string | null; ageRange: string; nzResident: boolean },
): Json {
  const base = normalizePrescreenPayload(existing);
  const next: PrescreenPayloadV2 = {
    ...base,
    schemaVersion: PRESCREEN_SCHEMA_VERSION,
    step1: {
      email: input.email,
      ageRange: input.ageRange,
      nzResident: input.nzResident,
    },
  };
  return next as unknown as Json;
}

export function buildPayloadAfterStep2(
  existing: Json | undefined,
  input: {
    consultationReason: string;
    hasGP: boolean;
    consentConsultation: boolean;
  },
): Json {
  const base = normalizePrescreenPayload(existing);
  const next: PrescreenPayloadV2 = {
    ...base,
    schemaVersion: PRESCREEN_SCHEMA_VERSION,
    step2: {
      consultationReason: input.consultationReason,
      hasGP: input.hasGP,
      consentConsultation: input.consentConsultation,
    },
  };
  return next as unknown as Json;
}
