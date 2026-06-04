/**
 * Shared HTML shell for transactional email — calm, clinical-adjacent, Best Day green accents.
 */
export function wrapBestDayEmail(innerBodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Best Day</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f1f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
          <tr>
            <td style="padding:20px 24px;background:linear-gradient(135deg,#ecfccb 0%,#d9f99d 100%);border-bottom:1px solid #bbf7d0;">
              <p style="margin:0;font-size:20px;font-weight:700;color:#0d2e0d;letter-spacing:-0.02em;">Best Day</p>
              <p style="margin:4px 0 0;font-size:13px;color:#365314;">Telehealth, made straightforward.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px 32px;">
              ${innerBodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 24px;border-top:1px solid #f1f5f9;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#94a3b8;text-align:center;">
                This message was sent by Best Day regarding your care.<br />
                Please do not reply with clinical emergencies — contact your local services if urgent.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
