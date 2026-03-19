"use server";

import { redirect } from "next/navigation";

export async function submitLegacyPreview(formData) {
  // CVE-2025-55182 (React RCE) - Vulnerable Server Action
  // This action accepts payload objects that can be exploited in vulnerable React versions.
  // Pattern-based filtering has been removed to allow for "naked" RCE exploitation.
  const payload = formData.get("payload");

  // In a real exploit, the RCE happens before/during this function call due to React logic.
  // For training, we simulate a successful "queue" if the exploit doesn't crash the server.
  redirect("/legacy-preview?status=queued");
}
