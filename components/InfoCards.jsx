"use client";
import { useState } from "react";
import Link from "next/link";

const cards = [
  { id: "dealer", title: "Dealer catalog sync", desc: "Preview old App Router actions still used by select B2B dealers during migration.", href: "/legacy-preview", label: "Open preview" },
  { id: "webhook", title: "Webhook help", desc: "Test where sample events land before an analyst account goes live.", href: "/docs/webhook", label: "Read docs" },
  { id: "analyst", title: "Analyst onboarding", desc: "Redeem an internal bootstrap token and create a review account.", href: "/account/analyst-signup", label: "Create analyst account" },
];

export default function InfoCards() {
  const [hidden, setHidden] = useState([]);
  const visible = cards.filter(c => !hidden.includes(c.id));
  if (!visible.length) return null;
  return (
    <section className="grid" style={{ marginTop: "1.2rem" }}>
      {visible.map(c => (
        <article className="card dismissable" key={c.id}>
          <button className="card-close" onClick={() => setHidden(h => [...h, c.id])} aria-label="Dismiss">&times;</button>
          <h3>{c.title}</h3>
          <p>{c.desc}</p>
          <Link href={c.href}>{c.label}</Link>
        </article>
      ))}
    </section>
  );
}
