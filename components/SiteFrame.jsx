import Link from "next/link";

export default function SiteFrame({ children }) {
  return (
    <main className="page">
      <nav className="topnav">
        <Link href="/">Home</Link>
        <Link href="/new-site">New Site</Link>
        <Link href="/backup">Backup</Link>
        <Link href="/admin">Admin</Link>
        <Link href="/docs/webhook">Webhook Docs</Link>
        <Link href="/tools/webhook-test">Webhook Tester</Link>
        <Link href="/legacy-preview">Legacy Preview</Link>
        <Link href="/account/login">Login</Link>
      </nav>
      {children}
    </main>
  );
}
