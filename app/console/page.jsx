import Terminal from "@/components/Terminal";
import { getShellSession } from "@/lib/challenge-state";

export default async function ConsolePage({ searchParams }) {
  const params = await searchParams;
  const session = params.session || "";
  const shellSession = getShellSession(session);

  if (!shellSession) {
    return (
      <div className="fullscreen-terminal">
        <pre className="mono" style={{ color: "#c8ffdd", padding: "1rem" }}>Unknown or expired session token.</pre>
      </div>
    );
  }

  const actor = shellSession.actor;
  const cwd = actor === "www-data" ? "/var/www/fan-store" : actor === "devops" ? "/home/devops" : "/root";

  return (
    <div className="fullscreen-terminal">
      <Terminal
        session={session}
        actor={actor}
        cwd={cwd}
        prompt={`${actor}@fansonly:${cwd}$`}
      />
    </div>
  );
}
