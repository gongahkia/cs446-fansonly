"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createUser, getUserByEmail } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { createAuthToken } from "@/lib/token-auth";

export async function signupAnalyst(formData) {
  const env = getEnv();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const token = String(formData.get("bootstrapToken") || "").trim();

  if (!email || !password || token !== env.adminToken) {
    redirect("/account/analyst-signup?error=invalid");
  }

  let user = getUserByEmail(email);
  if (!user) {
    user = createUser({ email, password, role: "analyst" });
  }

  const cookieStore = await cookies();
  cookieStore.set("fansonly_session", createAuthToken(user), {
    httpOnly: false,
    sameSite: "lax",
    path: "/"
  });

  redirect("/account");
}
