# Google Workspace integration

Best Day’s **database and Supabase Auth** remain the system of record. Google Workspace is an **operational layer**: sending mail, referencing calendar events, storing or linking customer files, and optional exports.

Implementation lives under `lib/google/` using the official [`googleapis`](https://github.com/googleapis/google-api-nodejs-client) client and a **service account** (JSON). Some APIs require **domain-wide delegation** so the service account can act as a real Workspace user (required for Gmail).

---

## Authentication strategy

### 1. Service account (recommended baseline)

1. In [Google Cloud Console](https://console.cloud.google.com/), create a project (or reuse one).
2. Enable APIs: **Gmail**, **Google Calendar**, **Google Drive**, **Google Docs**, **Google Sheets** (enable only what you use).
3. Create a **service account**, download the JSON key.
4. Store credentials using **one** of:
   - `GOOGLE_SERVICE_ACCOUNT_JSON` — full JSON as a single line (escape newlines in `private_key` as `\n`), **or**
   - `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64` — base64-encoded JSON (easier for some hosts), **or**
   - `GOOGLE_APPLICATION_CREDENTIALS` — absolute path to the JSON file (typical for local dev).

Never expose these variables to the browser; only server code under `lib/google` (and `import "server-only"`) should load them.

### 2. Domain-wide delegation (Gmail and “as user” Calendar)

Gmail send uses `users.messages.send` with `userId: "me"`, which requires impersonating a Workspace mailbox:

1. In the service account, enable **domain-wide delegation**.
2. In Google Workspace Admin → Security → API controls → Domain-wide delegation, add the client id with OAuth scopes your app needs (e.g. `https://www.googleapis.com/auth/gmail.send`, calendar scopes).
3. Set:

```bash
GOOGLE_WORKSPACE_DELEGATED_USER=notifications@yourdomain.com
```

4. Set a visible **From** header (must be allowed for that mailbox / send-as):

```bash
GMAIL_FROM_EMAIL="Best Day <notifications@yourdomain.com>"
```

If `GMAIL_FROM_EMAIL` is omitted, the delegated user’s primary address is used.

### 3. OAuth (alternative, not implemented in code)

For **per-doctor** Calendar or Drive, you may later add OAuth refresh tokens per user. The current layer is intentionally service-account–centric; add a parallel `getUserOAuthClient` when product requirements justify it.

### 4. Drive without delegation

Share a **parent folder** with the service account email (`client_email` from the JSON). Set:

```bash
GOOGLE_DRIVE_CUSTOMER_PARENT_FOLDER_ID=<folder_id>
```

Subfolders are created with `appProperties` keyed by `bestday_customer_id` so reruns are idempotent.

---

## Environment variables

| Variable | Required for | Description |
|----------|----------------|-------------|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | All Google calls | Inline JSON string for the service account. |
| `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64` | Alternative to inline JSON | Base64 of the same JSON. |
| `GOOGLE_APPLICATION_CREDENTIALS` | Local / VM file path | Path to the JSON key file. |
| `GOOGLE_WORKSPACE_DELEGATED_USER` | Gmail; optional Calendar as user | Workspace user to impersonate (delegation). |
| `GMAIL_FROM_EMAIL` | Gmail (recommended) | RFC5322 From for outbound mail. |
| `GOOGLE_DRIVE_CUSTOMER_PARENT_FOLDER_ID` | Per-customer Drive folders | Shared parent folder id. |
| `GMAIL_API_MAILER` | Use Gmail in `mailer.ts` | Set to `true` to select `GmailApiMailer` (see `.env.example`). |

---

## Module map

| Module | Role |
|--------|------|
| `config.ts` | Scopes, env helpers, “is configured” checks. |
| `credentials.ts` | Load service account JSON from env / file. |
| `auth.ts` | JWT client with optional delegated `subject`. |
| `gmail.ts` | `sendGmailMessage`. |
| `calendar.ts` | `getCalendarEventReference` (read-only sample). |
| `drive.ts` | `ensureCustomerDriveFolder`, link helpers. |
| `docs.ts` | Stub / status for future Doc generation. |
| `sheets.ts` | Create spreadsheet, append/update values. |
| `export-operational.ts` | CSV + optional new Sheet from row data. |
| `index.ts` | Public exports. |

---

## Samples wired in code

- **Email:** `sendGmailMessage` + `GmailApiMailer` in `lib/notifications/mailer.ts` when `GMAIL_API_MAILER=true`.
- **Drive:** `ensureCustomerDriveFolder({ customerId, title })` returns ids/links to store on your side.
- **Export:** `exportOperationalData({ title, headers, rows, mode: 'csv' | 'google_sheet' })` — CSV always works without Google; Sheet mode creates a new spreadsheet.

---

## Operational notes

- **Idempotency:** Drive folders use `appProperties`; re-running for the same `customerId` returns the existing folder.
- **Calendly:** `appointments.google_calendar_event_id` can be passed into `getCalendarEventReference` when you know the calendar id (often `primary` for the delegated user).
- **Docs:** Use Drive copy + Docs `batchUpdate` when templates exist; see `docs.ts` comment block.
