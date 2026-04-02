-- Reminder / notification system (email first; SMS-ready channel column)

CREATE TYPE public.notification_channel AS ENUM ('email', 'sms');

CREATE TYPE public.notification_status AS ENUM (
  'pending',
  'queued',
  'sending',
  'sent',
  'failed',
  'skipped',
  'cancelled'
);

CREATE TABLE public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL,
  channel public.notification_channel NOT NULL DEFAULT 'email',
  name TEXT NOT NULL,
  subject_template TEXT,
  body_html_template TEXT NOT NULL,
  body_text_template TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT notification_templates_key_channel UNIQUE (template_key, channel)
);

CREATE INDEX notification_templates_key_idx ON public.notification_templates (template_key);
CREATE INDEX notification_templates_active_idx ON public.notification_templates (active) WHERE active = true;

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments (id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers (id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  template_key TEXT NOT NULL,
  template_id UUID REFERENCES public.notification_templates (id) ON DELETE SET NULL,
  channel public.notification_channel NOT NULL DEFAULT 'email',
  to_address TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL,
  status public.notification_status NOT NULL DEFAULT 'pending',
  provider TEXT,
  provider_message_id TEXT,
  error_message TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX notifications_status_scheduled_idx
  ON public.notifications (status, scheduled_for)
  WHERE status IN ('pending', 'queued');

CREATE INDEX notifications_appointment_idx ON public.notifications (appointment_id);
CREATE INDEX notifications_created_idx ON public.notifications (created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_staff"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin', 'doctor')
    )
  );

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_templates_select_staff"
  ON public.notification_templates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles me
      WHERE me.id = (SELECT auth.uid())
        AND me.role IN ('master', 'admin', 'doctor')
    )
  );

COMMENT ON TABLE public.notification_templates IS
  'Editable email/SMS copy; render at schedule time so sends snapshot content.';

COMMENT ON TABLE public.notifications IS
  'Outbound notification log: status, provider id, rendered subject/body at schedule time.';

-- ---------------------------------------------------------------------------
-- Seed default email templates (Best Day tone)
-- ---------------------------------------------------------------------------

INSERT INTO public.notification_templates (template_key, channel, name, subject_template, body_html_template, body_text_template)
VALUES
(
  'booking_confirmation',
  'email',
  'Booking confirmation',
  'Your Best Day consultation is booked — {{appointment_date}}',
  $bd$
<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#1f2937;">Kia ora {{patient_first_name}},</p>
<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#1f2937;">Thank you for choosing <strong>Best Day</strong>. Your consultation is confirmed.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;width:100%;">
  <tr><td style="padding:16px 20px;">
    <p style="margin:0 0 8px;font-size:14px;color:#166534;font-weight:600;">When</p>
    <p style="margin:0;font-size:17px;color:#0f172a;font-weight:600;">{{appointment_datetime}}</p>
    <p style="margin:8px 0 0;font-size:13px;color:#64748b;">{{appointment_timezone}}</p>
  </td></tr>
</table>
<p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#374151;">You can view your upcoming visits anytime in your patient portal.</p>
<p style="margin:0;"><a href="{{portal_url}}" style="display:inline-block;padding:12px 22px;background:#4EDD00;color:#0d2e0d;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;">Open portal</a></p>
<p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#94a3b8;">If you need to reschedule, use the link from your Calendly confirmation or contact our team.</p>
$bd$,
  $bd$
Kia ora {{patient_first_name}},

Your Best Day consultation is booked.

When: {{appointment_datetime}} ({{appointment_timezone}})

Open your portal: {{portal_url}}

If you need to reschedule, use your Calendly link or contact our team.
$bd$
),
(
  'reminder_24h',
  'email',
  '24-hour reminder',
  'Reminder: Best Day consultation tomorrow',
  $bd$
<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#1f2937;">Hi {{patient_first_name}},</p>
<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#1f2937;">This is a friendly reminder that you have a <strong>Best Day</strong> consultation coming up <strong>in about 24 hours</strong>.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;width:100%;">
  <tr><td style="padding:16px 20px;">
    <p style="margin:0;font-size:17px;color:#0f172a;font-weight:600;">{{appointment_datetime}}</p>
    <p style="margin:8px 0 0;font-size:13px;color:#64748b;">{{appointment_timezone}}</p>
  </td></tr>
</table>
<p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#374151;">Please join from a quiet space with a stable connection. If anything has changed and you can no longer attend, reschedule as soon as you can so another patient can use the time.</p>
<p style="margin:0;"><a href="{{portal_url}}" style="display:inline-block;padding:12px 22px;background:#4EDD00;color:#0d2e0d;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;">Patient portal</a></p>
$bd$,
  $bd$
Hi {{patient_first_name}},

Reminder: your Best Day consultation is in about 24 hours.

{{appointment_datetime}} ({{appointment_timezone}})

Patient portal: {{portal_url}}

If you cannot attend, please reschedule promptly.
$bd$
),
(
  'reminder_2h',
  'email',
  '2-hour reminder',
  'Starting soon: your Best Day consultation',
  $bd$
<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#1f2937;">Hi {{patient_first_name}},</p>
<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#1f2937;">Your <strong>Best Day</strong> consultation is coming up <strong>in about 2 hours</strong>.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;width:100%;">
  <tr><td style="padding:16px 20px;">
    <p style="margin:0;font-size:17px;color:#0f172a;font-weight:600;">{{appointment_datetime}}</p>
    <p style="margin:8px 0 0;font-size:13px;color:#64748b;">{{appointment_timezone}}</p>
  </td></tr>
</table>
<p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#374151;">Have your details ready. We look forward to seeing you.</p>
<p style="margin:0;"><a href="{{portal_url}}" style="display:inline-block;padding:12px 22px;background:#4EDD00;color:#0d2e0d;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;">Open portal</a></p>
$bd$,
  $bd$
Hi {{patient_first_name}},

Your Best Day consultation is in about 2 hours.

{{appointment_datetime}} ({{appointment_timezone}})

Portal: {{portal_url}}
$bd$
),
(
  'no_show_followup',
  'email',
  'No-show follow-up',
  'We missed you at your Best Day consultation',
  $bd$
<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#1f2937;">Hi {{patient_first_name}},</p>
<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#1f2937;">We noticed you weren’t able to join your scheduled <strong>Best Day</strong> consultation. If something came up, that’s completely understandable — life happens.</p>
<p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#374151;">If you’d still like care from our team, you’re welcome to book another time that works better for you.</p>
<p style="margin:0;"><a href="{{booking_url}}" style="display:inline-block;padding:12px 22px;background:#4EDD00;color:#0d2e0d;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;">Book again</a></p>
<p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#94a3b8;">Questions? Reply to this email or contact us through your portal.</p>
$bd$,
  $bd$
Hi {{patient_first_name}},

We missed you at your scheduled Best Day consultation. If you'd still like care, you can book again:

{{booking_url}}
$bd$
),
(
  'rebooking_prompt',
  'email',
  'Rebooking prompt after visit',
  'Thanks for visiting Best Day — book your next step',
  $bd$
<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#1f2937;">Hi {{patient_first_name}},</p>
<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#1f2937;">Thank you for your recent <strong>Best Day</strong> consultation. We hope it was helpful.</p>
<p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#374151;">Whenever you’re ready for follow-up or your next appointment, you can book online in a few clicks.</p>
<p style="margin:0;"><a href="{{booking_url}}" style="display:inline-block;padding:12px 22px;background:#4EDD00;color:#0d2e0d;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;">Schedule next visit</a></p>
<p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#94a3b8;">Take care,<br/>The Best Day team</p>
$bd$,
  $bd$
Hi {{patient_first_name}},

Thanks for your recent Best Day consultation. Book your next visit when you're ready:

{{booking_url}}

— The Best Day team
$bd$
);
