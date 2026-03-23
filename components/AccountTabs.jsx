"use client";

import { useState } from "react";

export default function AccountTabs({ user, sessionToken, dbCredentials }) {
  const isAdmin = user.role === "admin" && dbCredentials;
  const isAnalyst = user.role === "analyst";
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <>
      {isAnalyst ? (
        <div className="banner" style={{ marginBottom: "1rem" }}>
          <strong>Initial access vector confirmed.</strong> <span className="mono">flag{"{initial-access-path-b-analyst}"}</span>
          {" "}Use this analyst session token from a host-level context to POST to{" "}
          <span className="mono">http://127.0.0.1:4000/users/{user.id}/role</span> with{" "}
          <span className="mono">{'{"role":"admin"}'}</span>.
        </div>
      ) : null}

      {isAdmin ? (
        <div className="banner" style={{ marginBottom: "1rem" }}>
          <strong>Horizontal escalation path confirmed.</strong> <span className="mono">flag{"{horizontal-escalation-2-analyst-to-admin}"}</span>
          {" "}Internal DB credentials and the next root hint are now visible in the DB Credentials tab.
        </div>
      ) : null}

      <div className="tabs" role="tablist" aria-label="Account views">
        <button
          type="button"
          className={`tab ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
          aria-selected={activeTab === "profile"}
        >
          Profile
        </button>
        {isAdmin ? (
          <button
            type="button"
            className={`tab ${activeTab === "db" ? "active" : ""}`}
            onClick={() => setActiveTab("db")}
            aria-selected={activeTab === "db"}
          >
            DB Credentials
          </button>
        ) : null}
      </div>

      {activeTab === "profile" ? (
        <>
          <p><strong>User ID:</strong> {user.id}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <p style={{ wordBreak: "break-all" }}>
            <strong>Session token:</strong> <span className="mono">{sessionToken}</span>
          </p>
          {isAnalyst ? (
            <div className="callout">
              <p style={{ marginTop: 0 }}><strong>Next step</strong></p>
              <pre className="mono" style={{ whiteSpace: "pre-wrap", margin: 0 }}>
{`curl -X POST http://127.0.0.1:4000/users/${user.id}/role \\
  -H 'Authorization: Bearer ${sessionToken}' \\
  -d '{"role":"admin"}'`}
              </pre>
            </div>
          ) : null}
          <p className="muted">
            Analysts can review webhook data. Administrators can manage catalog and analyst roles.
          </p>
        </>
      ) : null}

      {activeTab === "db" && isAdmin ? (
        <section>
          <div className="callout" style={{ marginBottom: "1rem" }}>
            <p style={{ margin: 0 }}>
              <strong>Admin training marker:</strong> <span className="mono">flag{"{horizontal-escalation-2-admin-web}"}</span>
            </p>
          </div>
          <p className="muted" style={{ marginTop: 0 }}>
            Simulated internal reporting database credentials. This view is an admin-only training
            indicator and is not required for root escalation.
          </p>
          <div className="secret-grid">
            <div className="secret-row">
              <span className="muted">Host</span>
              <span className="mono">{dbCredentials.host}</span>
            </div>
            <div className="secret-row">
              <span className="muted">Port</span>
              <span className="mono">{dbCredentials.port}</span>
            </div>
            <div className="secret-row">
              <span className="muted">Database</span>
              <span className="mono">{dbCredentials.database}</span>
            </div>
            <div className="secret-row">
              <span className="muted">Username</span>
              <span className="mono">{dbCredentials.username}</span>
            </div>
            <div className="secret-row">
              <span className="muted">Password</span>
              <span className="mono">{dbCredentials.password}</span>
            </div>
            <div className="secret-row">
              <span className="muted">SSL mode</span>
              <span className="mono">{dbCredentials.sslMode}</span>
            </div>
          </div>
          <p className="muted" style={{ marginBottom: 0 }}>
            {dbCredentials.note}
          </p>
          <div className="callout" style={{ marginTop: "1rem" }}>
            <p style={{ marginTop: 0 }}>
              <strong>Next root hint</strong>
            </p>
            <p style={{ marginBottom: 0 }}>
              Inspect <span className="mono">/usr/local/sbin/fansonly-maintenance.sh</span>. The
              privileged script relies on a PATH that checks <span className="mono">/home/devops/.local/bin</span> first.
            </p>
          </div>
        </section>
      ) : null}
    </>
  );
}
