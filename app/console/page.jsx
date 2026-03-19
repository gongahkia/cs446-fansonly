export default function ConsolePage() {
  return (
    <div className="card" style={{ margin: "2rem auto", maxWidth: "40rem" }}>
      <p className="muted">Legacy endpoint retired</p>
      <h1>Browser shell is disabled</h1>
      <p>
        This classroom build no longer exposes interactive shell access through the web UI.
        The legacy preview vector represents a direct reverse-shell drop only.
      </p>
    </div>
  );
}
