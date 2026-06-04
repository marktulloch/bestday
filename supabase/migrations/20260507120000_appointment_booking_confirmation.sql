-- Post-payment booking confirmation (Calendly / Google Calendar references later).

ALTER TABLE public.appointment_payments
  ADD COLUMN booking_confirmed_at TIMESTAMPTZ,
  ADD COLUMN external_booking_reference TEXT;

COMMENT ON COLUMN public.appointment_payments.booking_confirmed_at IS
  'Set when the patient confirms their appointment after successful payment.';

COMMENT ON COLUMN public.appointment_payments.external_booking_reference IS
  'External scheduler reference (e.g. Calendly event URI, Google Calendar event id).';
