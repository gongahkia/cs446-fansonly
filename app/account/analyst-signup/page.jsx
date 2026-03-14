import SiteFrame from "@/components/SiteFrame";
import { signupAnalyst } from "@/app/account/analyst-signup/actions";

export default async function AnalystSignupPage({ searchParams }) {
  const params = await searchParams;

  return (
    <SiteFrame>
      <div className="card">
        <p className="muted">Restricted onboarding</p>
        <h1>Create analyst account</h1>
        {params.error === "invalid" ? <p className="banner">A valid bootstrap token is required.</p> : null}
        <form action={signupAnalyst}>
          <label>
            Email
            <input type="email" name="email" required />
          </label>
          <label>
            Password
            <input type="password" name="password" required />
          </label>
          <label>
            Bootstrap token
            <input name="bootstrapToken" required />
          </label>
          <button type="submit">Create account</button>
        </form>
      </div>
    </SiteFrame>
  );
}
