import "server-only";

import { google } from "googleapis";

import { getWorkspaceJwtClient } from "./auth";
import { getDriveCustomerParentFolderId, GOOGLE_SCOPES } from "./config";

export type CustomerDriveFolderResult =
  | {
      ok: true;
      folderId: string;
      webViewLink: string | null;
      /** Store on your `documents` row or `customers.metadata` as system of record. */
      folderResourceKey: string;
    }
  | { ok: false; error: string };

/**
 * Create (or find by appProperties) a Drive folder for a customer.
 * Parent must be shared with the service account email, or delegation must be used
 * so the acting user owns the tree.
 */
const SAFE_ID = /^[a-zA-Z0-9_-]{1,128}$/;

export async function ensureCustomerDriveFolder(input: {
  customerId: string;
  /** Human-readable folder title in Drive UI */
  title: string;
}): Promise<CustomerDriveFolderResult> {
  if (!SAFE_ID.test(input.customerId)) {
    return { ok: false, error: "customerId must be alphanumeric (UUID-safe), max 128 chars." };
  }

  const parentId = getDriveCustomerParentFolderId();
  if (!parentId) {
    return {
      ok: false,
      error:
        "Set GOOGLE_DRIVE_CUSTOMER_PARENT_FOLDER_ID to a folder shared with the service account (or delegated user).",
    };
  }

  const auth = getWorkspaceJwtClient([GOOGLE_SCOPES.driveFile]);
  if (!auth) {
    return { ok: false, error: "Google service account credentials are not configured." };
  }

  const drive = google.drive({ version: "v3", auth });
  const appKey = "bestday_customer_id";
  const appVal = input.customerId;

  try {
    const existing = await drive.files.list({
      q: [
        `mimeType = 'application/vnd.google-apps.folder'`,
        `trashed = false`,
        `'${parentId}' in parents`,
        `appProperties has { key='${appKey}' and value='${appVal}' }`,
      ].join(" and "),
      fields: "files(id, webViewLink)",
      pageSize: 5,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const first = existing.data.files?.[0];
    if (first?.id) {
      return {
        ok: true,
        folderId: first.id,
        webViewLink: first.webViewLink ?? null,
        folderResourceKey: first.id,
      };
    }

    const created = await drive.files.create({
      requestBody: {
        name: input.title,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentId],
        appProperties: { [appKey]: appVal },
      },
      fields: "id, webViewLink",
      supportsAllDrives: true,
    });

    const id = created.data.id;
    if (!id) {
      return { ok: false, error: "Drive API returned no folder id." };
    }

    return {
      ok: true,
      folderId: id,
      webViewLink: created.data.webViewLink ?? null,
      folderResourceKey: id,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/**
 * Link to open a file or folder in the browser (requires recipient access).
 */
export function driveFileWebLink(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

export function driveFolderWebLink(folderId: string): string {
  return `https://drive.google.com/drive/folders/${folderId}`;
}
