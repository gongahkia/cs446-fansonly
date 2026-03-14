import SiteFrame from "@/components/SiteFrame";
import WebhookTester from "@/components/WebhookTester";

export default function WebhookTestPage() {
  return (
    <SiteFrame>
      <div className="card">
        <p className="muted">Connectivity tool</p>
        <h1>Webhook testing</h1>
        <WebhookTester />
      </div>
    </SiteFrame>
  );
}
