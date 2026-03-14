import Link from "next/link";
import SiteFrame from "@/components/SiteFrame";

export default function WebhookDocsPage() {
  return (
    <SiteFrame>
      <div className="card">
        <p className="muted">Analyst onboarding docs</p>
        <h1>Webhook verification</h1>
        <p>
          We send a sample event to the URL you provide and show you the response.
          Our backend will ping your server to verify connectivity.
        </p>
        <p>
          Once verification passes, analysts can redeem an internal bootstrap token and create a review account.
        </p>
        <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
          <Link className="button" href="/tools/webhook-test">Open tester</Link>
          <Link className="button secondary" href="/account/analyst-signup">Analyst signup</Link>
        </div>
      </div>
    </SiteFrame>
  );
}
