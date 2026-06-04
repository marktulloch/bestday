import { createHmac } from "node:crypto";

async function main() {
  const signingKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY?.trim() ?? "";
  if (!signingKey) {
    throw new Error("CALENDLY_WEBHOOK_SIGNING_KEY is missing");
  }

  const ts = Math.floor(Date.now() / 1000).toString();
  const inviteeUri = `https://api.calendly.com/scheduled_events/live-webhook-test-${ts}/invitees/live-webhook-test-${ts}`;
  const eventUri = `https://api.calendly.com/scheduled_events/live-webhook-test-${ts}`;

  const body = {
    event: "invitee.created",
    payload: {
      uri: inviteeUri,
      email: "mark@bootit.co.nz",
      name: "Mark Bootit",
      scheduled_event: {
        uri: eventUri,
        start_time: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + (36 * 60 + 30) * 60 * 1000).toISOString(),
        timezone: "Pacific/Auckland",
        event_type: {
          uri: "https://api.calendly.com/event_types/test-initial",
          name: "Initial consultation",
        },
        location: {
          type: "custom",
          join_url: "https://meet.example.com/live-signature-test",
        },
      },
    },
  };

  const raw = JSON.stringify(body);
  const sig = createHmac("sha256", signingKey).update(`${ts}.${raw}`).digest("hex");

  const response = await fetch("http://localhost:3000/api/webhooks/calendly", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Calendly-Webhook-Signature": `t=${ts},v1=${sig}`,
    },
    body: raw,
  });

  const payload = await response.text();
  console.log(
    JSON.stringify({
      status: response.status,
      response: payload,
      inviteeUri,
      eventUri,
    }),
  );
}

main();
