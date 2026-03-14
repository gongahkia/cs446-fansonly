import SiteFrame from "@/components/SiteFrame";

export default function BackupPage() {
  return (
    <SiteFrame>
      <div className="card">
        <h1>Backup Index</h1>
        <p className="muted">Legacy archive summaries only. Detailed restore tooling is not available from this page.</p>
      </div>
    </SiteFrame>
  );
}
