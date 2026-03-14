import SiteFrame from "@/components/SiteFrame";
import { getCurrentSessionToken, getCurrentUser } from "@/lib/auth";

export default async function AccountPage() {
  const user = await getCurrentUser();
  const sessionToken = await getCurrentSessionToken();

  return (
    <SiteFrame>
      <div className="card">
        <p className="muted">Authenticated profile</p>
        <h1>Account</h1>
        {!user ? (
          <p>No active session.</p>
        ) : (
          <>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>Session token:</strong> <span className="mono">{sessionToken}</span></p>
            <p className="muted">
              Analysts can review webhook data. Administrators can manage catalog and analyst roles.
            </p>
          </>
        )}
      </div>
    </SiteFrame>
  );
}
