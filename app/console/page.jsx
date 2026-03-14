import SiteFrame from "@/components/SiteFrame";
import Terminal from "@/components/Terminal";
import { getShellSession } from "@/lib/challenge-state";

export default async function ConsolePage({ searchParams }) {
  const params = await searchParams;
  const session = params.session || "";
  const shellSession = getShellSession(session);

  return (
    <SiteFrame>
      <div className="card">
        <p className="muted">Operator console</p>
        <h1>Interactive session</h1>
        {!shellSession ? (
          <p>Unknown or expired session token.</p>
        ) : (
          <Terminal
            session={session}
            actor={shellSession.actor}
            cwd={shellSession.actor === "www-data" ? "/var/www/fan-store" : shellSession.actor === "devops" ? "/home/devops" : "/root"}
            prompt={`${shellSession.actor}@fansonly:${shellSession.actor === "www-data" ? "/var/www/fan-store" : shellSession.actor === "devops" ? "/home/devops" : "/root"}$`}
          />
        )}
      </div>
    </SiteFrame>
  );
}
