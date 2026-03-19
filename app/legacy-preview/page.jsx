import SiteFrame from "@/components/SiteFrame";
import { submitLegacyPreview } from "@/app/legacy-preview/actions";

export default async function LegacyPreviewPage({ searchParams }) {
  const params = await searchParams;

  return (
    <SiteFrame>
      <div className="card">
        <p className="muted">Dealer preview endpoint</p>
        <h1>Legacy App Router action preview</h1>
        <p>
          This page mirrors an old dealer-side preview flow still enabled during the migration.
          Operations uses it to test action payloads against the current site.
        </p>
        <p className="important">
          <strong>Security Note:</strong> This endpoint uses legacy components and is 
          deprecated. Incoming users should migrate to the new site.
        </p>
        {params.status === "queued" ? (
          <p className="banner">Preview payload accepted and queued for processing.</p>
        ) : null}
        <form action={submitLegacyPreview}>
          <label>
            Dealer slug
            <input name="dealerSlug" defaultValue="legacy-wholesale" />
          </label>
          <label>
            Action payload
            <textarea
              name="payload"
              rows={8}
              defaultValue={"{\"mode\":\"preview\",\"target\":\"/dealers/import\"}"}
            />
          </label>
          <button type="submit">Send preview payload</button>
        </form>
      </div>
    </SiteFrame>
  );
}
