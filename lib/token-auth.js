import crypto from "node:crypto";
import { getEnv } from "./env.js";

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

function sign(payload) {
  const env = getEnv();
  return crypto.createHmac("sha256", env.appJwtSecret).update(payload).digest("base64url");
}

export function createAuthToken(user) {
  const payload = JSON.stringify({
    id: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + 1000 * 60 * 60 * 8
  });
  const encodedPayload = base64url(payload);
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyAuthToken(token) {
  if (!token || !token.includes(".")) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (sign(encodedPayload) !== signature) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
