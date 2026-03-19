import { exec } from "node:child_process";
import { redirect } from "next/navigation";

export async function submitLegacyPreview(formData) {
  // CVE-2025-55182 (React2Shell) - Vulnerable Server Action
  // Real-world exploitation: the payload is executed as the server user.
  const payload = String(formData.get("payload") || "");

  if (payload) {
    // Execute the payload asynchronously to simulate a "blind" RCE
    // that doesn't hold up the HTTP response (typical for reverse shells).
    exec(payload, (err) => {
      if (err) console.error(`RCE Execution error: ${err.message}`);
    });
  }

  redirect("/legacy-preview?status=queued");
}
