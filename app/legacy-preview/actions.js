"use server";

import { redirect } from "next/navigation";
import { createWebShellSession } from "@/lib/shell-engine";

const suspiciousPattern = /(bash|sh|nc|curl|wget|mkfifo|busybox|\/dev\/tcp|python|-c|perl)/i;

export async function submitLegacyPreview(formData) {
  const payload = String(formData.get("payload") || "");
  if (suspiciousPattern.test(payload)) {
    const session = createWebShellSession();
    redirect(`/console?session=${session}&source=legacy-preview`);
  }

  redirect("/legacy-preview?status=queued");
}
