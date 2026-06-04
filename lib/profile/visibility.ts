import type { AppRole } from "@/lib/auth/roles";

export type Profile360ViewerKind = "customer" | "doctor" | "admin";

/** Who is viewing the profile — drives UI and which fields we attach to the view model. */
export type Profile360Visibility = {
  viewer: Profile360ViewerKind;
  /** Reason codes, admin decision summary, payload breakdown */
  showInternalPrescreen: boolean;
  showConsultationNotes: boolean;
  showRecommendations: boolean;
  /** Full notification body vs subject/status only */
  showNotificationBodies: boolean;
  /** Raw user ids / internal ids in overview */
  showStaffIdentifiers: boolean;
};

export function profileVisibilityForRole(role: AppRole): Profile360Visibility {
  if (role === "customer") {
    return {
      viewer: "customer",
      showInternalPrescreen: false,
      showConsultationNotes: false,
      showRecommendations: false,
      showNotificationBodies: false,
      showStaffIdentifiers: false,
    };
  }
  if (role === "doctor") {
    return {
      viewer: "doctor",
      showInternalPrescreen: true,
      showConsultationNotes: true,
      showRecommendations: true,
      showNotificationBodies: true,
      showStaffIdentifiers: false,
    };
  }
  return {
    viewer: "admin",
    showInternalPrescreen: true,
    showConsultationNotes: true,
    showRecommendations: true,
    showNotificationBodies: true,
    showStaffIdentifiers: true,
  };
}

export function profileLinkContext(
  role: AppRole,
): "portal" | "admin" | "doctor" {
  if (role === "customer") return "portal";
  if (role === "doctor") return "doctor";
  return "admin";
}
