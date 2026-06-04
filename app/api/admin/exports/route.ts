import { loadOpsExportData } from "@/lib/admin/ops-export-data";
import { OPS_EXPORT_KINDS, type OpsExportKind } from "@/lib/admin/ops-export-kinds";
import { requireAdminExportAuth } from "@/lib/admin/ops-export-auth";
import { AUDIT_ACTION } from "@/lib/audit/actions";
import { logAuditEvent } from "@/lib/audit/server";
import { exportOperationalData, operationalRowsToCsv } from "@/lib/google/export-operational";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isOpsExportKind(s: string | null): s is OpsExportKind {
  return s !== null && (OPS_EXPORT_KINDS as readonly string[]).includes(s);
}

function csvFilename(kind: OpsExportKind): string {
  const d = new Date().toISOString().slice(0, 10);
  return `bestday-${kind}-${d}.csv`;
}

export async function GET(request: Request) {
  const auth = await requireAdminExportAuth();
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const kindRaw = url.searchParams.get("kind");
  const format = url.searchParams.get("format") ?? "csv";

  if (!isOpsExportKind(kindRaw)) {
    return Response.json({ error: "Invalid or missing kind parameter." }, { status: 400 });
  }

  const kind = kindRaw;
  const data = await loadOpsExportData(kind, url.searchParams, { staffUserId: auth.userId });

  if ("error" in data) {
    return Response.json({ error: data.error }, { status: 400 });
  }

  const headers = [...data.headers];

  if (format === "sheet") {
    const result = await exportOperationalData({
      title: data.title,
      headers,
      rows: data.rows,
      mode: "google_sheet",
    });

    if (result.mode === "error") {
      return Response.json(
        { error: result.error, code: "GOOGLE_SHEET_FAILED" },
        { status: 502 },
      );
    }

    if (result.mode !== "google_sheet") {
      return Response.json({ error: "Unexpected export result." }, { status: 500 });
    }

    await logAuditEvent({
      actorId: auth.userId,
      action: AUDIT_ACTION.ops_export,
      entityType: "ops_export",
      entityId: null,
      metadata: {
        kind,
        format: "google_sheet",
        row_count: result.rowCount,
        spreadsheet_id: result.spreadsheetId,
      },
    });

    return Response.json({
      spreadsheetId: result.spreadsheetId,
      url: result.spreadsheetUrl,
      rowCount: result.rowCount,
    });
  }

  if (format !== "csv") {
    return Response.json({ error: "Unsupported format. Use csv or sheet." }, { status: 400 });
  }

  const csvBody = operationalRowsToCsv(headers, data.rows);
  const bom = "\ufeff";
  const body = bom + csvBody;

  await logAuditEvent({
    actorId: auth.userId,
    action: AUDIT_ACTION.ops_export,
    entityType: "ops_export",
    entityId: null,
    metadata: {
      kind,
      format: "csv",
      row_count: data.rows.length,
    },
  });

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${csvFilename(kind)}"`,
      "Cache-Control": "no-store",
    },
  });
}
