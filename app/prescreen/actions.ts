"use server";

import { redirect } from "next/navigation";

export async function submitPrescreen() {
  redirect("/home");
}
