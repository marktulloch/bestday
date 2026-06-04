import "server-only";

import { createSpreadsheet, writeSheetValues } from "./sheets";

export type OperationalRow = Record<string, string | number | boolean | null | undefined>;

/**
 * CSV (RFC 4180–style): suitable for downloads, S3 uploads, or manual Sheet import.
 */
export function operationalRowsToCsv(headers: string[], rows: OperationalRow[]): string {
  const esc = (v: string) => {
    if (/[",\r\n]/.test(v)) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  };

  const line = (cells: string[]) => cells.map(esc).join(",");

  const headerLine = line(headers);
  const body = rows.map((r) =>
    line(headers.map((h) => {
      const val = r[h];
      if (val === null || val === undefined) return "";
      return String(val);
    })),
  );

  return [headerLine, ...body].join("\r\n");
}

export type OperationalExportMode = "csv" | "google_sheet";

export type OperationalExportResult =
  | { mode: "csv"; csv: string; rowCount: number }
  | {
      mode: "google_sheet";
      spreadsheetId: string;
      spreadsheetUrl: string | null;
      rowCount: number;
    }
  | { mode: "error"; error: string };

/**
 * Sample export path: always safe to produce CSV; optionally creates a Sheet when mode requests it.
 * Operational reporting should read from Supabase (system of record), then project rows here.
 */
export async function exportOperationalData(input: {
  title: string;
  headers: string[];
  rows: OperationalRow[];
  mode: OperationalExportMode;
}): Promise<OperationalExportResult> {
  const { headers, rows, mode, title } = input;

  if (headers.length === 0) {
    return { mode: "error", error: "At least one column header is required." };
  }

  const table: (string | number | boolean | null)[][] = [
    headers,
    ...rows.map((r) => headers.map((h) => r[h] ?? null)),
  ];

  if (mode === "csv") {
    return {
      mode: "csv",
      csv: operationalRowsToCsv(headers, rows),
      rowCount: rows.length,
    };
  }

  const created = await createSpreadsheet({ title });
  if (!created.ok) {
    return { mode: "error", error: created.error };
  }

  const written = await writeSheetValues({
    spreadsheetId: created.spreadsheetId,
    rangeA1: "Export!A1",
    rows: table,
  });

  if (!written.ok) {
    return { mode: "error", error: written.error };
  }

  return {
    mode: "google_sheet",
    spreadsheetId: created.spreadsheetId,
    spreadsheetUrl: created.spreadsheetUrl,
    rowCount: rows.length,
  };
}
