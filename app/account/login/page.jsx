import SiteFrame from "@/components/SiteFrame";
import { loginUser } from "@/app/account/login/actions";

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;

  return (
    <SiteFrame>
      <div className="card">
        <p className="muted">Account access</p>
        <h1>Login</h1>
        {params.error === "invalid" ? <p className="banner">Invalid email or password.</p> : null}
        <form action={loginUser}>
          <label>
            Email
            <input type="email" name="email" required />
          </label>
          <label>
            Password
            <input type="password" name="password" required />
          </label>
          <button type="submit">Login</button>
        </form>
      </div>
    </SiteFrame>
  );
}
