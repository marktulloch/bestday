"use client";

import { useState } from "react";

import type { OpsExportKind } from "@/lib/admin/ops-export-kinds";

type Params = Record<string, string>;

function buildQuery(kind: OpsExportKind, format: "csv" | "sheet", params: Params): string {
  const sp = new URLSearchParams();
  sp.set("kind", kind);
  sp.set("format", format);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, v);
  }
  return sp.toString();
}

export function AdminOpsExportControls(props: { kind: OpsExportKind; params?: Params }) {
  const { kind, params = {} } = props;
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [sheetLoading, setSheetLoading] = useState(false);

  const csvHref = `/api/admin/exports?${buildQuery(kind, "csv", params)}`;

  async function createGoogleSheet() {
    setSheetError(null);
    setSheetLoading(true);
    try {
      const r = await fetch(`/api/admin/exports?${buildQuery(kind, "sheet", params)}`, {
        method: "GET",
        credentials: "same-origin",
      });
      const j = (await r.json()) as { url?: string | null; error?: string };
      if (!r.ok) {
        setSheetError(j.error ?? "Could not create spreadsheet.");
        return;
      }
      if (j.url) {
        window.open(j.url, "_blank", "noopener,noreferrer");
      } else {
        setSheetError("Spreadsheet was created but no URL was returned.");
      }
    } catch {
      setSheetError("Network error while creating spreadsheet.");
    } finally {
      setSheetLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <a
          href={csvHref}
          className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50"
        >
          Export CSV
        </a>
        <button
          type="button"
          disabled={sheetLoading}
          onClick={() => void createGoogleSheet()}
          className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {sheetLoading ? "Creating…" : "Open in Google Sheets"}
        </button>
      </div>
      {sheetError ? <p className="text-xs text-red-600 text-right max-w-xs">{sheetError}</p> : null}
    </div>
  );
}
