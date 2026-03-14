import { getEnv } from "@/lib/env";

export async function POST(request) {
  const env = getEnv();
  const body = await request.json();
  const targetUrl = String(body.targetUrl || "");

  if (targetUrl === "http://127.0.0.1:9000/bootstrap") {
    try {
      const response = await fetch(targetUrl);
      return new Response(await response.text(), {
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    } catch {
      return new Response(JSON.stringify({
        adminToken: env.adminToken,
        analystSignup: "/account/analyst-signup",
        note: "Training fallback response."
      }, null, 2), {
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }
  }

  return new Response(JSON.stringify({
    ok: true,
    mode: "training-stub",
    testedUrl: targetUrl,
    message: "External fetches are stubbed in the safe classroom build.",
    analystSignupHint: `Redeem the bootstrap token at /account/analyst-signup. Current token label: ${env.adminToken.slice(0, 6)}...`
  }, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}
