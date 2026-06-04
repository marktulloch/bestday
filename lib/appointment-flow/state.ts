import "server-only";

import { getLatestMcPrescreeningResponseForUser } from "@/lib/mc-flow/prescreening-queries";
import { looseDb } from "@/lib/supabase/loose-client";

import { getPaidAppointmentPaymentForSelectedService, type AppSupabaseClient } from "./guards";

/** 1–6 match the documented patient journey (prescreen → … → booking). */
export type AppointmentFlowStepNumber = 1 | 2 | 3 | 4 | 5 | 6;

export type AppointmentFlowState = {
  /** Smallest incomplete step; 6 means fully complete through booking confirmation. */
  currentStep: AppointmentFlowStepNumber;
  prescreen: {
    complete: boolean;
    eligible: boolean | null;
  };
  registration: { complete: boolean };
  intake: { complete: boolean };
  service: {
    selectedServiceId: string | null;
    selectedServiceName: string | null;
    price_cents: number | null;
    currency: string | null;
  };
  payment: {
    hasPending: boolean;
    hasPaidForSelection: boolean;
    latestPaidPaymentId: string | null;
  };
  booking: {
    confirmed: boolean;
    externalBookingReference: string | null;
    confirmedAt: string | null;
  };
};

export async function getAppointmentFlowState(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<AppointmentFlowState> {
  const mc = await getLatestMcPrescreeningResponseForUser(userId);
  const prescreenComplete = Boolean(mc);
  const prescreenEligible = mc?.eligible ?? null;

  const { data: profile } = await supabase
    .from("patient_profiles")
    .select("id, selected_consultation_service_id")
    .eq("user_id", userId)
    .maybeSingle();

  const prof = profile as { id: string; selected_consultation_service_id: string | null } | null;
  const registrationComplete = Boolean(prof?.id);

  const { data: intakeRow } = await looseDb(supabase)
    .from("consultation_intake_forms")
    .select("id")
    .eq("user_id", userId)
    .eq("consent_statement_accepted", true)
    .eq("declaration_accepted", true)
    .limit(1)
    .maybeSingle();

  const intakeComplete = Boolean(intakeRow);

  const selectedServiceId = prof?.selected_consultation_service_id ?? null;
  let selectedServiceName: string | null = null;
  let price_cents: number | null = null;
  let currency: string | null = null;

  if (selectedServiceId) {
    const { data: svc } = await looseDb(supabase)
      .from("consultation_services")
      .select("name, price_cents, currency")
      .eq("id", selectedServiceId)
      .eq("active", true)
      .maybeSingle();
    if (svc) {
      const s = svc as { name: string; price_cents: number; currency: string };
      selectedServiceName = s.name;
      price_cents = s.price_cents;
      currency = s.currency;
    }
  }

  let hasPending = false;
  if (selectedServiceId) {
    const { data: pend } = await looseDb(supabase)
      .from("appointment_payments")
      .select("id")
      .eq("user_id", userId)
      .eq("consultation_service_id", selectedServiceId)
      .eq("payment_status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    hasPending = Boolean(pend);
  }

  const paid = selectedServiceId
    ? await getPaidAppointmentPaymentForSelectedService(supabase, userId, selectedServiceId)
    : null;
  const hasPaidForSelection = Boolean(paid);

  const bookingConfirmed = Boolean(paid?.booking_confirmed_at);

  let currentStep: AppointmentFlowStepNumber = 1;
  if (!prescreenComplete || prescreenEligible !== true) {
    currentStep = 1;
  } else if (!registrationComplete) {
    currentStep = 2;
  } else if (!intakeComplete) {
    currentStep = 3;
  } else if (!selectedServiceId) {
    currentStep = 4;
  } else if (!hasPaidForSelection) {
    currentStep = 5;
  } else if (!bookingConfirmed) {
    currentStep = 6;
  } else {
    currentStep = 6;
  }

  return {
    currentStep,
    prescreen: { complete: prescreenComplete, eligible: prescreenEligible },
    registration: { complete: registrationComplete },
    intake: { complete: intakeComplete },
    service: {
      selectedServiceId,
      selectedServiceName,
      price_cents,
      currency,
    },
    payment: {
      hasPending,
      hasPaidForSelection,
      latestPaidPaymentId: paid?.id ?? null,
    },
    booking: {
      confirmed: bookingConfirmed,
      externalBookingReference: paid?.external_booking_reference ?? null,
      confirmedAt: paid?.booking_confirmed_at ?? null,
    },
  };
}
