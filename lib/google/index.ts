/**
 * Google Workspace integration layer (server-only).
 *
 * - Auth: service account + optional domain-wide delegation (`GOOGLE_WORKSPACE_DELEGATED_USER`).
 * - Best Day DB remains authoritative; store Google ids (folder, file, event) on your rows when needed.
 */

export {
  getDelegatedWorkspaceUser,
  getDriveCustomerParentFolderId,
  getGmailFromAddress,
  GOOGLE_SCOPES,
  isGmailSendConfigured,
  isGoogleServiceAccountConfigured,
} from "./config";
export { loadServiceAccountJson } from "./credentials";
export type { ServiceAccountJson } from "./credentials";
export { getServiceAccountEmail, getWorkspaceJwtClient } from "./auth";

export { sendGmailMessage } from "./gmail";
export type { GmailSendInput, GmailSendResult } from "./gmail";

export {
  driveFileWebLink,
  driveFolderWebLink,
  ensureCustomerDriveFolder,
} from "./drive";
export type { CustomerDriveFolderResult } from "./drive";

export {
  createCalendarEventPlaceholder,
  getCalendarEventReference,
} from "./calendar";
export type { CalendarEventSummary, CalendarGetEventResult } from "./calendar";

export { docsIntegrationStatus } from "./docs";

export { appendRowsToSpreadsheet, createSpreadsheet, writeSheetValues } from "./sheets";
export type { AppendRowsResult, CreateSpreadsheetResult } from "./sheets";

export {
  exportOperationalData,
  operationalRowsToCsv,
} from "./export-operational";
export type {
  OperationalExportMode,
  OperationalExportResult,
  OperationalRow,
} from "./export-operational";
