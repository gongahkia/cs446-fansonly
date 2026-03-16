import Link from "next/link";
import SiteFrame from "@/components/SiteFrame";

export default function WebhookDocsPage() {
  return (
    <SiteFrame>
      <div className="card">
        <p className="muted">Analyst onboarding docs &middot; Updated 2026-03-14</p>
        <h1>Webhook verification</h1>
        <p>
          We send a sample event to the URL you provide and show you the response.
          Our backend will ping your server to verify connectivity.
        </p>
        <p>
          Once verification passes, analysts can redeem an internal bootstrap token and create a review account.
        </p>
        <h2>Sample event types</h2>
        <p className="muted">
          The verifier sends one of the following event payloads depending on the target path.
          Your endpoint must return a 2xx status for the check to pass.
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "0.5rem 0.75rem" }}>Event</th>
                <th style={{ padding: "0.5rem 0.75rem" }}>Path hint</th>
                <th style={{ padding: "0.5rem 0.75rem" }}>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "0.5rem 0.75rem" }} className="mono">catalog.sync</td>
                <td style={{ padding: "0.5rem 0.75rem" }} className="mono">/webhooks/catalog</td>
                <td style={{ padding: "0.5rem 0.75rem" }}>Fires when a dealer catalog is refreshed from the wholesale feed.</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "0.5rem 0.75rem" }} className="mono">order.fulfilled</td>
                <td style={{ padding: "0.5rem 0.75rem" }} className="mono">/webhooks/orders</td>
                <td style={{ padding: "0.5rem 0.75rem" }}>Sent after a wholesale order ships. Includes tracking metadata.</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "0.5rem 0.75rem" }} className="mono">inventory.low</td>
                <td style={{ padding: "0.5rem 0.75rem" }} className="mono">/webhooks/inventory</td>
                <td style={{ padding: "0.5rem 0.75rem" }}>Triggered when warehouse stock drops below the reorder threshold.</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "0.5rem 0.75rem" }} className="mono">dealer.onboard</td>
                <td style={{ padding: "0.5rem 0.75rem" }} className="mono">/webhooks/dealers</td>
                <td style={{ padding: "0.5rem 0.75rem" }}>Emitted when a new dealer account completes KYC verification.</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "0.5rem 0.75rem" }} className="mono">return.approved</td>
                <td style={{ padding: "0.5rem 0.75rem" }} className="mono">/webhooks/returns</td>
                <td style={{ padding: "0.5rem 0.75rem" }}>Posted when a return request clears the inspection queue.</td>
              </tr>
              <tr>
                <td style={{ padding: "0.5rem 0.75rem" }} className="mono">audit.export</td>
                <td style={{ padding: "0.5rem 0.75rem" }} className="mono">/webhooks/audit</td>
                <td style={{ padding: "0.5rem 0.75rem" }}>Scheduled nightly. Delivers a signed digest of all day&apos;s mutations.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <h2>Testing your endpoint</h2>
        <p>
          Use the webhook tester to point at your server. The verifier will POST a sample
          event payload and display the raw response. External URLs are stubbed in the
          classroom build &mdash; only loopback targets receive a live fetch.
        </p>
        <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
          <Link className="button" href="/tools/webhook-test">Open tester</Link>
          <Link className="button secondary" href="/account/analyst-signup">Analyst signup</Link>
        </div>
      </div>
    </SiteFrame>
  );
}
