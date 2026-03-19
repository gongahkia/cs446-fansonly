"use server";

import { redirect } from "next/navigation";

const suspiciousPattern = /(bash|sh|nc|curl|wget|mkfifo|busybox|\/dev\/tcp|python|-c|perl)/i;

export async function submitLegacyPreview(formData) {
  const payload = String(formData.get("payload") || "");
  if (suspiciousPattern.test(payload)) {
    redirect("/legacy-preview?status=reverse-shell-dropped");
  }

  redirect("/legacy-preview?status=queued");
}
