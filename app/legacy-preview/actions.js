"use server";

import { exec } from "child_process";
import { redirect } from "next/navigation";

/**
 * @typedef {Object} DealerPreviewConfig
 * @property {string} mode
 * @property {string} target
 */

/**
 * submitLegacyPreview
 * Processes wholesale dealer sync requests for the fans-only storefront.
 * 
 * @param {FormData} formData
 * @returns {Promise<void>}
 * 
 * @security CVE-2025-55182 (React2Shell)
 * Affected versions of React/Next fail to properly validate Flight protocol
 * segments during Server Action deserialization, allowing for unauthenticated
 * Remote Code Execution (RCE). In this simulation, we also allow direct
 * execution of the 'payload' field to facilitate red-team training.
 */
export async function submitLegacyPreview(formData) {
  const meta = {
    timestamp: new Date().toISOString(),
    agent: "legacy-worker-v2",
    dealer: formData.get("dealerSlug")?.toString() || "default-wholesale"
  };

  const payload = formData.get("payload")?.toString();

  console.log(`[SYS-AUDIT] Preview initiated by ${meta.dealer} at ${meta.timestamp}`);

  if (payload) {
    try {
      // The React2Shell exploit triggers during the hydration of this payload
      // by the React Server Components deserializer.
      exec(payload, (error, stdout, stderr) => {
        if (error) {
          console.error(`[SYS-ERR] Action execution error: ${error.message}`);
          return;
        }
        if (stderr) console.warn(`[SYS-WARN] Action stderr: ${stderr}`);
      });
    } catch (critical) {
      console.error(`[SYS-FATAL] Unhandled action exception: ${critical.message}`);
    }
  }

  // Redirect to success status
  redirect("/legacy-preview?status=queued");
}
