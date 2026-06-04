import type { AppRole } from "@/lib/auth/roles";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type LeadStatus = "new" | "contacted" | "converted" | "closed";

export type CustomerStatus = "draft" | "active" | "archived";

export type PrescreenWorkflowStatus =
  | "draft"
  | "submitted"
  | "eligible_for_booking"
  | "needs_manual_review"
  | "ineligible";

export type TicketStatus =
  | "new"
  | "in_progress"
  | "waiting_on_customer"
  | "waiting_on_doctor"
  | "resolved"
  | "closed";

export type TicketCategory =
  | "prescreen_case"
  | "booking_support"
  | "doctor_followup"
  | "order_issue"
  | "delivery_issue"
  | "customer_support"
  | "compliance_review";

export type TicketCommentVisibility = "internal" | "external";

export type TicketPriority = "low" | "normal" | "high" | "urgent";

export type AppointmentStatus =
  | "scheduled"
  | "rescheduled"
  | "cancelled"
  | "completed"
  | "no_show";

export type NotificationChannel = "email" | "sms";

export type NotificationStatus =
  | "pending"
  | "queued"
  | "sending"
  | "sent"
  | "failed"
  | "skipped"
  | "cancelled";

export type ConsultationRecommendationOutcome =
  | "follow_up"
  | "monitoring"
  | "refer_external"
  | "care_complete"
  | "other";

export type CustomerOrderStatus = "pending_review" | "approved" | "rejected" | "cancelled";

export type ProductCatalogueStatus = "draft" | "active" | "archived";

export type ProductPortalVisibility =
  | "none"
  | "eligible_only"
  | "approved_only"
  | "eligible_or_approved";

export type CustomerProductApprovalStatus = "pending" | "approved" | "revoked";

export type PurchaseOrderStatus =
  | "draft"
  | "awaiting_payment"
  | "paid"
  | "awaiting_fulfilment"
  | "packed"
  | "dispatched"
  | "delivered"
  | "cancelled";

/** Parcel-level progress; complements purchase_orders.status for ops and future courier APIs. */
export type PurchaseDeliveryStatus =
  | "pending"
  | "awaiting_pickup"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "exception";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          role: AppRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          role?: AppRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          role?: AppRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      role_assignments: {
        Row: {
          id: string;
          user_id: string;
          role: AppRole;
          granted_by: string | null;
          granted_at: string;
          revoked_at: string | null;
          reason: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: AppRole;
          granted_by?: string | null;
          granted_at?: string;
          revoked_at?: string | null;
          reason?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: AppRole;
          granted_by?: string | null;
          granted_at?: string;
          revoked_at?: string | null;
          reason?: string | null;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          user_id: string;
          status: CustomerStatus;
          phone: string | null;
          region: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: CustomerStatus;
          phone?: string | null;
          region?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          status?: CustomerStatus;
          phone?: string | null;
          region?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          phone: string | null;
          source: string;
          status: LeadStatus;
          notes: string | null;
          converted_user_id: string | null;
          converted_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          phone?: string | null;
          source?: string;
          status?: LeadStatus;
          notes?: string | null;
          converted_user_id?: string | null;
          converted_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          phone?: string | null;
          source?: string;
          status?: LeadStatus;
          notes?: string | null;
          converted_user_id?: string | null;
          converted_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      prescreens: {
        Row: {
          id: string;
          lead_id: string | null;
          user_id: string | null;
          payload: Json;
          workflow_status: PrescreenWorkflowStatus;
          decision_reason_codes: string[];
          decision_log: Json;
          decision_summary_admin: string | null;
          version: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id?: string | null;
          user_id?: string | null;
          payload?: Json;
          workflow_status?: PrescreenWorkflowStatus;
          decision_reason_codes?: string[];
          decision_log?: Json;
          decision_summary_admin?: string | null;
          version?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string | null;
          user_id?: string | null;
          payload?: Json;
          workflow_status?: PrescreenWorkflowStatus;
          decision_reason_codes?: string[];
          decision_log?: Json;
          decision_summary_admin?: string | null;
          version?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      consultation_intake_forms: {
        Row: {
          id: string;
          user_id: string;
          nhi_number: string | null;
          height_cm: number | null;
          weight_kg: number | null;
          gp_name: string;
          gp_practice_name: string;
          gp_practice_email: string;
          gp_practice_phone: string;
          primary_reason: string;
          symptom_duration: string;
          severity_score: number | null;
          treatment_goals: string;
          previous_unsuccessful_medications: string | null;
          medical_history: Json;
          medication_screening: Json;
          general_allergies: string | null;
          current_medications_supplements: string | null;
          occupation_risks: Json;
          previous_cannabis_use: boolean | null;
          previous_cannabis_details: string | null;
          consent_statement_accepted: boolean;
          consent_statement_accepted_at: string | null;
          declaration_accepted: boolean;
          declaration_accepted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nhi_number?: string | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          gp_name: string;
          gp_practice_name: string;
          gp_practice_email: string;
          gp_practice_phone: string;
          primary_reason: string;
          symptom_duration: string;
          severity_score?: number | null;
          treatment_goals: string;
          previous_unsuccessful_medications?: string | null;
          medical_history?: Json;
          medication_screening?: Json;
          general_allergies?: string | null;
          current_medications_supplements?: string | null;
          occupation_risks?: Json;
          previous_cannabis_use?: boolean | null;
          previous_cannabis_details?: string | null;
          consent_statement_accepted?: boolean;
          consent_statement_accepted_at?: string | null;
          declaration_accepted?: boolean;
          declaration_accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nhi_number?: string | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          gp_name?: string;
          gp_practice_name?: string;
          gp_practice_email?: string;
          gp_practice_phone?: string;
          primary_reason?: string;
          symptom_duration?: string;
          severity_score?: number | null;
          treatment_goals?: string;
          previous_unsuccessful_medications?: string | null;
          medical_history?: Json;
          medication_screening?: Json;
          general_allergies?: string | null;
          current_medications_supplements?: string | null;
          occupation_risks?: Json;
          previous_cannabis_use?: boolean | null;
          previous_cannabis_details?: string | null;
          consent_statement_accepted?: boolean;
          consent_statement_accepted_at?: string | null;
          declaration_accepted?: boolean;
          declaration_accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      patient_profiles: {
        Row: {
          id: string;
          user_id: string;
          first_name: string;
          preferred_name: string | null;
          last_name: string;
          date_of_birth: string;
          gender: string;
          email: string;
          mobile: string;
          terms_accepted: boolean;
          terms_accepted_at: string | null;
          privacy_policy_accepted: boolean;
          privacy_policy_accepted_at: string | null;
          selected_consultation_service_id: string | null;
          consultation_appointment_payment_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name: string;
          preferred_name?: string | null;
          last_name: string;
          date_of_birth: string;
          gender: string;
          email: string;
          mobile: string;
          terms_accepted?: boolean;
          terms_accepted_at?: string | null;
          privacy_policy_accepted?: boolean;
          privacy_policy_accepted_at?: string | null;
          selected_consultation_service_id?: string | null;
          consultation_appointment_payment_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          first_name?: string;
          preferred_name?: string | null;
          last_name?: string;
          date_of_birth?: string;
          gender?: string;
          email?: string;
          mobile?: string;
          terms_accepted?: boolean;
          terms_accepted_at?: string | null;
          privacy_policy_accepted?: boolean;
          privacy_policy_accepted_at?: string | null;
          selected_consultation_service_id?: string | null;
          consultation_appointment_payment_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      prescreening_responses: {
        Row: {
          id: string;
          user_id: string | null;
          age_20_or_above: boolean;
          previously_attempted_treatment: boolean;
          pregnant_breastfeeding_or_trying: boolean;
          allergic_cannabinoids_coconut_salicylates: boolean;
          psychosis_schizophrenia_bipolar_history: boolean;
          contraindicated_medications: string[];
          eligible: boolean;
          ineligible_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          age_20_or_above: boolean;
          previously_attempted_treatment: boolean;
          pregnant_breastfeeding_or_trying: boolean;
          allergic_cannabinoids_coconut_salicylates: boolean;
          psychosis_schizophrenia_bipolar_history: boolean;
          contraindicated_medications?: string[];
          eligible?: boolean;
          ineligible_reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          age_20_or_above?: boolean;
          previously_attempted_treatment?: boolean;
          pregnant_breastfeeding_or_trying?: boolean;
          allergic_cannabinoids_coconut_salicylates?: boolean;
          psychosis_schizophrenia_bipolar_history?: boolean;
          contraindicated_medications?: string[];
          eligible?: boolean;
          ineligible_reason?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          customer_id: string | null;
          user_id: string | null;
          prescreen_id: string | null;
          status: AppointmentStatus;
          start_time: string | null;
          end_time: string | null;
          timezone: string | null;
          calendly_event_uri: string | null;
          calendly_invitee_uri: string | null;
          calendly_event_type_uri: string | null;
          calendly_event_type_name: string | null;
          invitee_email: string;
          invitee_name: string | null;
          location_type: string | null;
          location_join_url: string | null;
          rescheduled: boolean;
          rescheduled_from_uri: string | null;
          cancel_reason: string | null;
          cancelled_at: string | null;
          google_calendar_event_id: string | null;
          raw_payload: Json;
          source: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id?: string | null;
          user_id?: string | null;
          prescreen_id?: string | null;
          status?: AppointmentStatus;
          start_time?: string | null;
          end_time?: string | null;
          timezone?: string | null;
          calendly_event_uri?: string | null;
          calendly_invitee_uri?: string | null;
          calendly_event_type_uri?: string | null;
          calendly_event_type_name?: string | null;
          invitee_email: string;
          invitee_name?: string | null;
          location_type?: string | null;
          location_join_url?: string | null;
          rescheduled?: boolean;
          rescheduled_from_uri?: string | null;
          cancel_reason?: string | null;
          cancelled_at?: string | null;
          google_calendar_event_id?: string | null;
          raw_payload?: Json;
          source?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string | null;
          user_id?: string | null;
          prescreen_id?: string | null;
          status?: AppointmentStatus;
          start_time?: string | null;
          end_time?: string | null;
          timezone?: string | null;
          calendly_event_uri?: string | null;
          calendly_invitee_uri?: string | null;
          calendly_event_type_uri?: string | null;
          calendly_event_type_name?: string | null;
          invitee_email?: string;
          invitee_name?: string | null;
          location_type?: string | null;
          location_join_url?: string | null;
          rescheduled?: boolean;
          rescheduled_from_uri?: string | null;
          cancel_reason?: string | null;
          cancelled_at?: string | null;
          google_calendar_event_id?: string | null;
          raw_payload?: Json;
          source?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      appointment_payments: {
        Row: {
          id: string;
          user_id: string;
          consultation_service_id: string;
          stripe_checkout_session_id: string | null;
          stripe_payment_intent_id: string | null;
          amount_cents: number;
          currency: string;
          payment_status: string;
          booking_confirmed_at: string | null;
          external_booking_reference: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          consultation_service_id: string;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          amount_cents: number;
          currency?: string;
          payment_status?: string;
          booking_confirmed_at?: string | null;
          external_booking_reference?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          consultation_service_id?: string;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          amount_cents?: number;
          currency?: string;
          payment_status?: string;
          booking_confirmed_at?: string | null;
          external_booking_reference?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      stripe_processed_webhook_events: {
        Row: {
          stripe_event_id: string;
          event_type: string;
          processed_at: string;
        };
        Insert: {
          stripe_event_id: string;
          event_type: string;
          processed_at?: string;
        };
        Update: {
          stripe_event_id?: string;
          event_type?: string;
          processed_at?: string;
        };
        Relationships: [];
      };
      notification_templates: {
        Row: {
          id: string;
          template_key: string;
          channel: NotificationChannel;
          name: string;
          subject_template: string | null;
          body_html_template: string;
          body_text_template: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          template_key: string;
          channel?: NotificationChannel;
          name: string;
          subject_template?: string | null;
          body_html_template: string;
          body_text_template: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          template_key?: string;
          channel?: NotificationChannel;
          name?: string;
          subject_template?: string | null;
          body_html_template?: string;
          body_text_template?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          appointment_id: string | null;
          customer_id: string | null;
          user_id: string | null;
          template_key: string;
          template_id: string | null;
          channel: NotificationChannel;
          to_address: string;
          subject: string;
          body_html: string;
          body_text: string;
          status: NotificationStatus;
          provider: string | null;
          provider_message_id: string | null;
          error_message: string | null;
          scheduled_for: string;
          sent_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          appointment_id?: string | null;
          customer_id?: string | null;
          user_id?: string | null;
          template_key: string;
          template_id?: string | null;
          channel?: NotificationChannel;
          to_address: string;
          subject: string;
          body_html: string;
          body_text: string;
          status?: NotificationStatus;
          provider?: string | null;
          provider_message_id?: string | null;
          error_message?: string | null;
          scheduled_for: string;
          sent_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          appointment_id?: string | null;
          customer_id?: string | null;
          user_id?: string | null;
          template_key?: string;
          template_id?: string | null;
          channel?: NotificationChannel;
          to_address?: string;
          subject?: string;
          body_html?: string;
          body_text?: string;
          status?: NotificationStatus;
          provider?: string | null;
          provider_message_id?: string | null;
          error_message?: string | null;
          scheduled_for?: string;
          sent_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      doctor_patient_assignments: {
        Row: {
          doctor_user_id: string;
          customer_id: string;
          created_at: string;
        };
        Insert: {
          doctor_user_id: string;
          customer_id: string;
          created_at?: string;
        };
        Update: {
          doctor_user_id?: string;
          customer_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      consultation_notes: {
        Row: {
          id: string;
          customer_id: string;
          author_user_id: string;
          appointment_id: string | null;
          body: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          author_user_id: string;
          appointment_id?: string | null;
          body: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          author_user_id?: string;
          appointment_id?: string | null;
          body?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      consultation_recommendations: {
        Row: {
          id: string;
          customer_id: string;
          author_user_id: string;
          title: string;
          detail: string;
          outcome: ConsultationRecommendationOutcome;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          author_user_id: string;
          title: string;
          detail?: string;
          outcome?: ConsultationRecommendationOutcome;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          author_user_id?: string;
          title?: string;
          detail?: string;
          outcome?: ConsultationRecommendationOutcome;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      consultation_services: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price_cents: number;
          currency: string;
          active: boolean;
          stripe_price_id: string | null;
          stripe_product_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price_cents: number;
          currency?: string;
          active?: boolean;
          stripe_price_id?: string | null;
          stripe_product_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price_cents?: number;
          currency?: string;
          active?: boolean;
          stripe_price_id?: string | null;
          stripe_product_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      customer_orders: {
        Row: {
          id: string;
          customer_id: string;
          product_name: string;
          product_id: string | null;
          status: CustomerOrderStatus;
          notes: string | null;
          created_by_user_id: string | null;
          approved_by_user_id: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          product_name: string;
          product_id?: string | null;
          status?: CustomerOrderStatus;
          notes?: string | null;
          created_by_user_id?: string | null;
          approved_by_user_id?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          product_name?: string;
          product_id?: string | null;
          status?: CustomerOrderStatus;
          notes?: string | null;
          created_by_user_id?: string | null;
          approved_by_user_id?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          category_id: string | null;
          sku: string;
          slug: string;
          name: string;
          short_description: string | null;
          description: string | null;
          dosage_form: string | null;
          strength: string | null;
          usage_instructions: string | null;
          price_cents: number;
          currency: string;
          catalogue_status: ProductCatalogueStatus;
          requires_doctor_approval: boolean;
          public_education: boolean;
          portal_visibility: ProductPortalVisibility;
          track_inventory: boolean;
          stock_quantity: number | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          sku: string;
          slug: string;
          name: string;
          short_description?: string | null;
          description?: string | null;
          dosage_form?: string | null;
          strength?: string | null;
          usage_instructions?: string | null;
          price_cents?: number;
          currency?: string;
          catalogue_status?: ProductCatalogueStatus;
          requires_doctor_approval?: boolean;
          public_education?: boolean;
          portal_visibility?: ProductPortalVisibility;
          track_inventory?: boolean;
          stock_quantity?: number | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          sku?: string;
          slug?: string;
          name?: string;
          short_description?: string | null;
          description?: string | null;
          dosage_form?: string | null;
          strength?: string | null;
          usage_instructions?: string | null;
          price_cents?: number;
          currency?: string;
          catalogue_status?: ProductCatalogueStatus;
          requires_doctor_approval?: boolean;
          public_education?: boolean;
          portal_visibility?: ProductPortalVisibility;
          track_inventory?: boolean;
          stock_quantity?: number | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      customer_product_approvals: {
        Row: {
          id: string;
          customer_id: string;
          product_id: string;
          status: CustomerProductApprovalStatus;
          approved_by_user_id: string | null;
          approved_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          product_id: string;
          status?: CustomerProductApprovalStatus;
          approved_by_user_id?: string | null;
          approved_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          product_id?: string;
          status?: CustomerProductApprovalStatus;
          approved_by_user_id?: string | null;
          approved_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      customer_documents: {
        Row: {
          id: string;
          customer_id: string;
          title: string;
          kind: string;
          external_url: string | null;
          storage_path: string | null;
          mime_type: string | null;
          uploaded_by_user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          title: string;
          kind?: string;
          external_url?: string | null;
          storage_path?: string | null;
          mime_type?: string | null;
          uploaded_by_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          title?: string;
          kind?: string;
          external_url?: string | null;
          storage_path?: string | null;
          mime_type?: string | null;
          uploaded_by_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      purchase_orders: {
        Row: {
          id: string;
          customer_id: string;
          status: PurchaseOrderStatus;
          currency: string;
          subtotal_cents: number;
          total_cents: number;
          delivery_recipient_name: string | null;
          delivery_line1: string | null;
          delivery_line2: string | null;
          delivery_city: string | null;
          delivery_region: string | null;
          delivery_postal_code: string | null;
          delivery_country: string;
          payment_provider: string;
          payment_reference: string | null;
          payment_metadata: Json;
          placed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          status?: PurchaseOrderStatus;
          currency?: string;
          subtotal_cents?: number;
          total_cents?: number;
          delivery_recipient_name?: string | null;
          delivery_line1?: string | null;
          delivery_line2?: string | null;
          delivery_city?: string | null;
          delivery_region?: string | null;
          delivery_postal_code?: string | null;
          delivery_country?: string;
          payment_provider?: string;
          payment_reference?: string | null;
          payment_metadata?: Json;
          placed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          status?: PurchaseOrderStatus;
          currency?: string;
          subtotal_cents?: number;
          total_cents?: number;
          delivery_recipient_name?: string | null;
          delivery_line1?: string | null;
          delivery_line2?: string | null;
          delivery_city?: string | null;
          delivery_region?: string | null;
          delivery_postal_code?: string | null;
          delivery_country?: string;
          payment_provider?: string;
          payment_reference?: string | null;
          payment_metadata?: Json;
          placed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      purchase_order_items: {
        Row: {
          id: string;
          purchase_order_id: string;
          product_id: string;
          quantity: number;
          unit_price_cents: number;
          line_total_cents: number;
          product_name_snapshot: string;
          sku_snapshot: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          purchase_order_id: string;
          product_id: string;
          quantity: number;
          unit_price_cents: number;
          line_total_cents: number;
          product_name_snapshot: string;
          sku_snapshot: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          purchase_order_id?: string;
          product_id?: string;
          quantity?: number;
          unit_price_cents?: number;
          line_total_cents?: number;
          product_name_snapshot?: string;
          sku_snapshot?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      purchase_order_fulfilment: {
        Row: {
          id: string;
          purchase_order_id: string;
          courier: string | null;
          tracking_number: string | null;
          fulfilment_notes: string | null;
          dispatched_at: string | null;
          delivery_status: PurchaseDeliveryStatus;
          courier_metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          purchase_order_id: string;
          courier?: string | null;
          tracking_number?: string | null;
          fulfilment_notes?: string | null;
          dispatched_at?: string | null;
          delivery_status?: PurchaseDeliveryStatus;
          courier_metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          purchase_order_id?: string;
          courier?: string | null;
          tracking_number?: string | null;
          fulfilment_notes?: string | null;
          dispatched_at?: string | null;
          delivery_status?: PurchaseDeliveryStatus;
          courier_metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tickets: {
        Row: {
          id: string;
          prescreen_id: string | null;
          lead_id: string | null;
          customer_id: string | null;
          created_by_user_id: string | null;
          subject: string;
          status: TicketStatus;
          priority: TicketPriority;
          category: TicketCategory;
          assigned_to_user_id: string | null;
          purchase_order_id: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          prescreen_id?: string | null;
          lead_id?: string | null;
          customer_id?: string | null;
          created_by_user_id?: string | null;
          subject: string;
          status?: TicketStatus;
          priority?: TicketPriority;
          category?: TicketCategory;
          assigned_to_user_id?: string | null;
          purchase_order_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          prescreen_id?: string | null;
          lead_id?: string | null;
          customer_id?: string | null;
          created_by_user_id?: string | null;
          subject?: string;
          status?: TicketStatus;
          priority?: TicketPriority;
          category?: TicketCategory;
          assigned_to_user_id?: string | null;
          purchase_order_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ticket_comments: {
        Row: {
          id: string;
          ticket_id: string;
          author_user_id: string;
          body: string;
          visibility: TicketCommentVisibility;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          author_user_id: string;
          body: string;
          visibility?: TicketCommentVisibility;
          created_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          author_user_id?: string;
          body?: string;
          visibility?: TicketCommentVisibility;
          created_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: number;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: number;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: number;
          actor_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      ensure_own_profile: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      set_user_role: {
        Args: {
          target_user_id: string;
          new_role: AppRole;
          change_reason?: string;
        };
        Returns: void;
      };
      customer_can_order_product: {
        Args: {
          p_customer_id: string;
          p_product_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: AppRole;
      lead_status: LeadStatus;
      customer_status: CustomerStatus;
      prescreen_workflow_status: PrescreenWorkflowStatus;
      ticket_status: TicketStatus;
      ticket_category: TicketCategory;
      ticket_comment_visibility: TicketCommentVisibility;
      ticket_priority: TicketPriority;
      notification_channel: NotificationChannel;
      notification_status: NotificationStatus;
      consultation_recommendation_outcome: ConsultationRecommendationOutcome;
      customer_order_status: CustomerOrderStatus;
      product_catalogue_status: ProductCatalogueStatus;
      product_portal_visibility: ProductPortalVisibility;
      customer_product_approval_status: CustomerProductApprovalStatus;
      purchase_delivery_status: PurchaseDeliveryStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type ProfileRow = Tables<"profiles">;
export type CustomerRow = Tables<"customers">;
export type LeadRow = Tables<"leads">;
export type PrescreenRow = Tables<"prescreens">;
export type PrescreeningResponseRow = Tables<"prescreening_responses">;
export type PatientProfileRow = Tables<"patient_profiles">;
export type ConsultationIntakeFormRow = Tables<"consultation_intake_forms">;
export type ConsultationServiceRow = Tables<"consultation_services">;
export type TicketRow = Tables<"tickets">;
export type TicketCommentRow = Tables<"ticket_comments">;
export type AppointmentRow = Tables<"appointments">;
export type AppointmentPaymentRow = Tables<"appointment_payments">;
export type StripeProcessedWebhookEventRow = Tables<"stripe_processed_webhook_events">;
export type NotificationRow = Tables<"notifications">;
export type NotificationTemplateRow = Tables<"notification_templates">;
export type ConsultationNoteRow = Tables<"consultation_notes">;
export type ConsultationRecommendationRow = Tables<"consultation_recommendations">;
export type CustomerOrderRow = Tables<"customer_orders">;
export type ProductCategoryRow = Tables<"product_categories">;
export type ProductRow = Tables<"products">;
export type CustomerProductApprovalRow = Tables<"customer_product_approvals">;
export type CustomerDocumentRow = Tables<"customer_documents">;
export type PurchaseOrderRow = Tables<"purchase_orders">;
export type PurchaseOrderItemRow = Tables<"purchase_order_items">;
export type PurchaseOrderFulfilmentRow = Tables<"purchase_order_fulfilment">;
