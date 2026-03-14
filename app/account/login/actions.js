"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getUserByEmail } from "@/lib/db";
import { createAuthToken } from "@/lib/token-auth";

export async function loginUser(formData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const user = getUserByEmail(email);

  if (!user || user.password !== password) {
    redirect("/account/login?error=invalid");
  }

  const cookieStore = await cookies();
  cookieStore.set("fansonly_session", createAuthToken(user), {
    httpOnly: false,
    sameSite: "lax",
    path: "/"
  });

  redirect("/account");
}
