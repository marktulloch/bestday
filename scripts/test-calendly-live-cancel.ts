import { createHmac } from "node:crypto";

async function main() {
  const signingKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY?.trim() ?? "";
  if (!signingKey) {
    throw new Error("CALENDLY_WEBHOOK_SIGNING_KEY is missing");
  }

  const inviteeUri = process.argv[2];
  const eventUri = process.argv[3];
  if (!inviteeUri || !eventUri) {
    throw new Error("Usage: tsx test-calendly-live-cancel.ts <inviteeUri> <eventUri>");
  }

  const ts = Math.floor(Date.now() / 1000).toString();
  const body = {
    event: "invitee.canceled",
    payload: {
      uri: inviteeUri,
      email: "mark@bootit.co.nz",
      cancel_reason: "Signed endpoint cancel test",
      canceled_at: new Date().toISOString(),
      rescheduled: false,
      scheduled_event: { uri: eventUri },
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
  console.log(JSON.stringify({ status: response.status, response: payload, inviteeUri, eventUri }));
}

main();
