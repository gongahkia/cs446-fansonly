import SiteFrame from "@/components/SiteFrame";

export default function NewSitePage() {
  return (
    <SiteFrame>
      <div className="card">
        <p className="muted">fansonly-next.internal</p>
        <h1>New site is still under construction.</h1>
        <p>
          Migration is in progress. Dealer dashboards, admin tooling, and exports remain on the legacy storefront for now.
        </p>
      </div>
    </SiteFrame>
  );
}
