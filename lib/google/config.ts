/**
 * Google Workspace integration — configuration only (no network I/O).
 * Best Day remains system of record; Google is operational / sidecar storage.
 */

/** Scopes used by this integration layer (add more in wrappers as features grow). */
export const GOOGLE_SCOPES = {
  gmailSend: "https://www.googleapis.com/auth/gmail.send",
  calendarRead: "https://www.googleapis.com/auth/calendar.readonly",
  calendarEvents: "https://www.googleapis.com/auth/calendar.events",
  driveFile: "https://www.googleapis.com/auth/drive.file",
  driveMetadataReadonly: "https://www.googleapis.com/auth/drive.metadata.readonly",
  documents: "https://www.googleapis.com/auth/documents",
  spreadsheets: "https://www.googleapis.com/auth/spreadsheets",
} as const;

export function getDelegatedWorkspaceUser(): string | undefined {
  const v = process.env.GOOGLE_WORKSPACE_DELEGATED_USER?.trim();
  return v || undefined;
}

export function getGmailFromAddress(): string | undefined {
  const v = process.env.GMAIL_FROM_EMAIL?.trim();
  return v || undefined;
}

/** Parent Drive folder (shared with the service account) for per-customer subfolders. */
export function getDriveCustomerParentFolderId(): string | undefined {
  const v = process.env.GOOGLE_DRIVE_CUSTOMER_PARENT_FOLDER_ID?.trim();
  return v || undefined;
}

export function isGoogleServiceAccountConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() ||
      process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64?.trim() ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim(),
  );
}

export function isGmailSendConfigured(): boolean {
  return isGoogleServiceAccountConfigured() && Boolean(getDelegatedWorkspaceUser());
}
