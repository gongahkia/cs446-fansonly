"use client";

import { useEffect, useRef, useState } from "react";

export default function Terminal({ session, actor, cwd, prompt }) {
  const [history, setHistory] = useState([
    { type: "output", text: `Connected to FansOnly training shell as ${actor}.` },
    { type: "output", text: "This shell is simulated. Use it to inspect the challenge environment." }
  ]);
  const [command, setCommand] = useState("");
  const [meta, setMeta] = useState({ actor, cwd, prompt });
  const outputRef = useRef(null);

  useEffect(() => {
    outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight });
  }, [history]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!command.trim()) {
      return;
    }

    const current = command;
    setHistory((existing) => [...existing, { type: "prompt", text: `${meta.prompt} ${current}` }]);
    setCommand("");

    const response = await fetch("/api/shell", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session, command: current })
    });

    const body = await response.json();
    if (!response.ok) {
      setHistory((existing) => [...existing, { type: "output", text: body.error || "Shell error." }]);
      return;
    }

    setMeta({ actor: body.actor, cwd: body.cwd, prompt: body.prompt });
    setHistory((existing) => [
      ...existing,
      ...(body.output ? [{ type: "output", text: body.output }] : []),
      ...(body.actor !== meta.actor ? [{ type: "output", text: `Privilege context switched to ${body.actor}.` }] : [])
    ]);
  }

  return (
    <div className="terminal">
      <div className="terminal-output shell-history" ref={outputRef}>
        {history.map((entry, index) => (
          <pre key={`${entry.type}-${index}`}>{entry.text}</pre>
        ))}
      </div>
      <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
        <label className="mono" htmlFor="command-input">{meta.prompt}</label>
        <input
          id="command-input"
          autoComplete="off"
          spellCheck="false"
          value={command}
          onChange={(event) => setCommand(event.target.value)}
        />
      </form>
    </div>
  );
}
