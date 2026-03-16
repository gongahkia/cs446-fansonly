import Link from "next/link";
import SiteFrame from "@/components/SiteFrame";
import InfoCards from "@/components/InfoCards";

export default function HomePage() {
  return (
    <SiteFrame>
      <section className="banner">
        <strong>Legacy storefront notice.</strong> This current site is scheduled for retirement because
        it still runs on <span className="mono">react@19.1.0</span> and <span className="mono">next@15.1.0</span>.
        Please move to the <Link href="/new-site">new site</Link> as soon as possible.
      </section>

      <section className="hero" style={{ gridTemplateColumns: "1fr" }}>
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
      </section>

      <InfoCards />
    </SiteFrame>
  );
}
