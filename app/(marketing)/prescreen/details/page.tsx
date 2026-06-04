import { redirect } from "next/navigation";

/** Legacy two-step funnel removed; MC pre-screen is a single form at `/prescreen`. */
export default function PrescreenDetailsPage() {
  redirect("/prescreen");
}
