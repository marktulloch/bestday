import type { Profile360Visibility } from "./visibility";

export type ProfileLinkContext = "portal" | "admin" | "doctor";

export type PrescreenProfileEntry = {
  id: string;
  workflow_status: string;
  created_at: string;
  patientLabel: string;
  patientDetail: string;
  payloadSummaryLines?: string[];
  decisionSummaryAdmin?: string | null;
  reasonCodes?: string[];
  decisionLogLines?: string[];
};

/** Medicinal-cannabis questionnaire (`prescreening_responses`), distinct from legacy prescreens. */
export type McQuestionnaireProfileEntry = {
  id: string;
  created_at: string;
  eligible: boolean;
  ineligible_reason: string | null;
  summaryLines: string[];
};

export type NotificationProfileEntry = {
  id: string;
  template_key: string;
  subject: string;
  status: string;
  channel: string;
  sent_at: string | null;
  scheduled_for: string;
  bodyPreview?: string;
};

export type ProductApprovalProfileEntry = {
  id: string;
  product_id: string;
  product_name: string;
  product_slug: string | null;
  status: string;
  approved_at: string | null;
};

export type PurchaseOrderProfileEntry = {
  id: string;
  status: string;
  total_cents: number;
  currency: string;
  placed_at: string | null;
  created_at: string;
  lineCount: number;
  delivery_status: string | null;
  tracking_number: string | null;
  courier: string | null;
};

export type ProfileTimelineEvent = {
  sortKey: string;
  icon:
    | "prescreen"
    | "booking"
    | "order"
    | "ticket"
    | "note"
    | "notification"
    | "document"
    | "delivery"
    | "product_line"
    | "recommendation";
  title: string;
  subtitle?: string;
  href?: string;
};

export type CustomerProfile360ViewModel = {
  customerId: string;
  userId: string;
  visibility: Profile360Visibility;
  linkContext: ProfileLinkContext;
  profile: { email: string | null; full_name: string | null };
  customer: {
    status: string;
    phone: string | null;
    region: string | null;
    created_at: string;
  };
  prescreens: PrescreenProfileEntry[];
  mcQuestionnaires: McQuestionnaireProfileEntry[];
  appointments: {
    id: string;
    status: string;
    start_time: string | null;
    end_time: string | null;
    timezone: string | null;
  }[];
  consultationNotes: { id: string; body: string; created_at: string; appointment_id: string | null }[];
  recommendations: {
    id: string;
    title: string;
    detail: string;
    outcome: string;
    created_at: string;
  }[];
  customerOrders: {
    id: string;
    product_name: string;
    status: string;
    created_at: string;
  }[];
  productApprovals: ProductApprovalProfileEntry[];
  purchaseOrders: PurchaseOrderProfileEntry[];
  tickets: {
    id: string;
    subject: string;
    status: string;
    priority: string;
    category: string;
    created_at: string;
  }[];
  notifications: NotificationProfileEntry[];
  documents: {
    id: string;
    title: string;
    kind: string;
    external_url: string | null;
    created_at: string;
  }[];
  timeline: ProfileTimelineEvent[];
};
