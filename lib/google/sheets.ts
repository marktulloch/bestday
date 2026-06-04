import "server-only";

import { google } from "googleapis";

import { getWorkspaceJwtClient } from "./auth";
import { GOOGLE_SCOPES } from "./config";

export type AppendRowsResult =
  | { ok: true; updatedRange: string | null }
  | { ok: false; error: string };

export type CreateSpreadsheetResult =
  | { ok: true; spreadsheetId: string; spreadsheetUrl: string | null }
  | { ok: false; error: string };

/**
 * Append rows to an existing spreadsheet (tab name must exist or use default first sheet).
 */
export async function appendRowsToSpreadsheet(input: {
  spreadsheetId: string;
  rangeA1: string;
  rows: (string | number | boolean | null)[][];
}): Promise<AppendRowsResult> {
  const auth = getWorkspaceJwtClient([GOOGLE_SCOPES.spreadsheets]);
  if (!auth) {
    return { ok: false, error: "Google service account credentials are not configured." };
  }

  const sheets = google.sheets({ version: "v4", auth });

  try {
    const res = await sheets.spreadsheets.values.append({
      spreadsheetId: input.spreadsheetId,
      range: input.rangeA1,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: input.rows },
    });
    return { ok: true, updatedRange: res.data.updates?.updatedRange ?? null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/**
 * Create a new spreadsheet owned by the delegated user or service account (depending on auth).
 */
export async function createSpreadsheet(input: { title: string }): Promise<CreateSpreadsheetResult> {
  const auth = getWorkspaceJwtClient([GOOGLE_SCOPES.spreadsheets]);
  if (!auth) {
    return { ok: false, error: "Google service account credentials are not configured." };
  }

  const sheets = google.sheets({ version: "v4", auth });

  try {
    const res = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: input.title },
        sheets: [{ properties: { title: "Export", gridProperties: { rowCount: 1000, columnCount: 26 } } }],
      },
    });
    const id = res.data.spreadsheetId;
    if (!id) {
      return { ok: false, error: "Sheets API returned no spreadsheet id." };
    }
    return {
      ok: true,
      spreadsheetId: id,
      spreadsheetUrl: res.data.spreadsheetUrl ?? `https://docs.google.com/spreadsheets/d/${id}`,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export async function writeSheetValues(input: {
  spreadsheetId: string;
  rangeA1: string;
  rows: (string | number | boolean | null)[][];
}): Promise<AppendRowsResult> {
  const auth = getWorkspaceJwtClient([GOOGLE_SCOPES.spreadsheets]);
  if (!auth) {
    return { ok: false, error: "Google service account credentials are not configured." };
  }

  const sheets = google.sheets({ version: "v4", auth });

  try {
    const res = await sheets.spreadsheets.values.update({
      spreadsheetId: input.spreadsheetId,
      range: input.rangeA1,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: input.rows },
    });
    return { ok: true, updatedRange: res.data.updatedRange ?? null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
