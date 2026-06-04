export const OPS_EXPORT_KINDS = [
  "customers",
  "prescreens",
  "appointments",
  "orders",
  "tickets",
] as const;

export type OpsExportKind = (typeof OPS_EXPORT_KINDS)[number];
