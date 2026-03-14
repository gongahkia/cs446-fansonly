import { cookies } from "next/headers";
import { getUserById } from "./db.js";
import { verifyAuthToken } from "./token-auth.js";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("fansonly_session")?.value;
  const payload = verifyAuthToken(token);
  if (!payload) {
    return null;
  }
  return getUserById(payload.id);
}

export async function getCurrentSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get("fansonly_session")?.value || null;
}
