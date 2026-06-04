"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  assertConsultationServiceSelected,
  getPaidAppointmentPaymentForSelectedService,
} from "@/lib/appointment-flow/guards";
import { getAuthContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { looseDb } from "@/lib/supabase/loose-client";

const confirmInputSchema = z.object({
  external_booking_reference: z.string().trim().max(500).optional().nullable(),
});

/**
 * Step 6: confirm the consultation booking only after payment is `paid` for the
 * patient’s currently selected service. Idempotent if already confirmed.
 */
export async function confirmConsultationBookingAfterPayment(
  input: unknown,
): Promise<
  | { ok: true; booking_confirmed_at: string; external_booking_reference: string | null }
  | { ok: false; error: string }
> {
  const parsed = confirmInputSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return { ok: false, error: "Invalid booking confirmation payload." };
  }

  const ctx = await getAuthContext();
  if (!ctx) return { ok: false, error: "You must be signed in." };
  if (ctx.profile.role !== "customer") {
    return { ok: false, error: "Only patient accounts can confirm a booking." };
  }

  const supabase = await createClient();
  const sel = await assertConsultationServiceSelected(supabase, ctx.user.id);
  if (!sel.ok) {
    return { ok: false, error: sel.error };
  }

  const paid = await getPaidAppointmentPaymentForSelectedService(
    supabase,
    ctx.user.id,
    sel.selectedServiceId,
  );
  if (!paid) {
    return {
      ok: false,
      error: "Payment must be completed before you can confirm your appointment.",
    };
  }

  const ext =
    parsed.data.external_booking_reference === undefined ||
    parsed.data.external_booking_reference === null
      ? null
      : parsed.data.external_booking_reference.trim() || null;

  if (paid.booking_confirmed_at) {
    return {
      ok: true,
      booking_confirmed_at: paid.booking_confirmed_at,
      external_booking_reference: paid.external_booking_reference ?? null,
    };
  }

  const now = new Date().toISOString();
  const { data: updated, error } = await looseDb(supabase)
    .from("appointment_payments")
    .update({
      booking_confirmed_at: now,
      external_booking_reference: ext,
      updated_at: now,
    })
    .eq("id", paid.id)
    .eq("user_id", ctx.user.id)
    .eq("payment_status", "paid")
    .is("booking_confirmed_at", null)
    .select("booking_confirmed_at, external_booking_reference")
    .maybeSingle();

  if (error || !updated) {
    const again = await getPaidAppointmentPaymentForSelectedService(
      supabase,
      ctx.user.id,
      sel.selectedServiceId,
    );
    if (again?.booking_confirmed_at) {
      return {
        ok: true,
        booking_confirmed_at: again.booking_confirmed_at,
        external_booking_reference: again.external_booking_reference ?? null,
      };
    }
    return { ok: false, error: error?.message ?? "Could not confirm booking." };
  }

  const row = updated as {
    booking_confirmed_at: string;
    external_booking_reference: string | null;
  };

  revalidatePath("/portal");
  revalidatePath("/portal/booking");
  revalidatePath("/portal/checkout");

  return {
    ok: true,
    booking_confirmed_at: row.booking_confirmed_at,
    external_booking_reference: row.external_booking_reference,
  };
}
