import SiteFrame from "@/components/SiteFrame";
import AccountTabs from "@/components/AccountTabs";
import { getCurrentSessionToken, getCurrentUser } from "@/lib/auth";
import { getSimulatedAdminDbCredentials } from "@/lib/admin-db-credentials";

export default async function AccountPage() {
  const user = await getCurrentUser();
  const sessionToken = await getCurrentSessionToken();
  const dbCredentials = user?.role === "admin" ? getSimulatedAdminDbCredentials() : null;

  return (
    <SiteFrame>
      <div className="card">
        <p className="muted">Authenticated profile</p>
        <h1>Account</h1>
        {!user ? (
          <p>No active session.</p>
        ) : (
          <AccountTabs
            user={user}
            sessionToken={sessionToken}
            dbCredentials={dbCredentials}
          />
        )}
      </div>
    </SiteFrame>
  );
}
