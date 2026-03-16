"use client";

import { useState } from "react";

export default function WebhookTester() {
  const [targetUrl, setTargetUrl] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setResult("");
    const response = await fetch("/api/webhook/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUrl })
    });
    const body = await response.text();
    setResult(body);
    setLoading(false);
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <label>
          Target URL
          <input value={targetUrl} onChange={(event) => setTargetUrl(event.target.value)} placeholder="https://your-server.example.com/webhook" />
        </label>
        <button type="submit" disabled={loading}>{loading ? "Testing..." : "Send sample event"}</button>
      </form>
      {result ? (
        <div className="card" style={{ marginTop: "1rem" }}>
          <h3>Verifier response</h3>
          <pre className="mono" style={{ whiteSpace: "pre-wrap", margin: 0 }}>{result}</pre>
        </div>
      ) : null}
    </>
  );
}
