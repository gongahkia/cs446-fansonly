import Link from "next/link";
import SiteFrame from "@/components/SiteFrame";

export default function HomePage() {
  return (
    <SiteFrame>
      <section className="banner">
        <strong>Legacy storefront notice.</strong> This current site is scheduled for retirement because
        it still runs on <span className="mono">react@19.1.0</span> and <span className="mono">next@15.1.0</span>.
        Please move to the <Link href="/new-site">new site</Link> as soon as possible.
      </section>

      <section className="hero">
        <div className="card">
          <p className="muted">FansOnly</p>
          <h1>Cooling every floor, warehouse, and workshop.</h1>
          <p>
            Browse ceiling fans, standing fans, industrial blowers, and smart circulation kits
            still used by our wholesale partners during the migration period.
          </p>
          <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
            <Link className="button" href="/legacy-preview">Open legacy action preview</Link>
            <Link className="button secondary" href="/tools/webhook-test">Try webhook diagnostics</Link>
          </div>
        </div>
        <div className="card">
          <h2>Operations notes</h2>
          <p>
            The legacy system still powers dealer exports, backup indexing, and analyst workflows
            while the replacement portal is under construction.
          </p>
          <ul>
            <li>Bulk customer exports remain on the legacy host.</li>
            <li>Webhook verification remains enabled for analysts.</li>
            <li>Some internal routes are blocked from indexing, but still routable.</li>
          </ul>
        </div>
      </section>

      <section className="grid" style={{ marginTop: "1.2rem" }}>
        <article className="card">
          <h3>Dealer catalog sync</h3>
          <p>Preview old App Router actions still used by select B2B dealers during migration.</p>
          <Link href="/legacy-preview">Open preview</Link>
        </article>
        <article className="card">
          <h3>Webhook help</h3>
          <p>Test where sample events land before an analyst account goes live.</p>
          <Link href="/docs/webhook">Read docs</Link>
        </article>
        <article className="card">
          <h3>Analyst onboarding</h3>
          <p>Redeem an internal bootstrap token and create a review account.</p>
          <Link href="/account/analyst-signup">Create analyst account</Link>
        </article>
      </section>
    </SiteFrame>
  );
}
