import http from "node:http";
import { getUserById, initDb, updateUserRole } from "../lib/db.js";
import { verifyAuthToken } from "../lib/token-auth.js";

const host = process.env.FANSONLY_ADMIN_HOST || "127.0.0.1";
const port = Number(process.env.FANSONLY_ADMIN_PORT || 4000);

initDb();

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload, null, 2));
}

const server = http.createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    sendJson(response, 200, { ok: true });
    return;
  }

  const roleMatch = request.url?.match(/^\/users\/(\d+)\/role$/);
  if (request.method !== "POST" || !roleMatch) {
    sendJson(response, 404, { error: "Not found" });
    return;
  }

  const authHeader = request.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const identity = verifyAuthToken(token);
  if (!identity) {
    sendJson(response, 401, { error: "Invalid token" });
    return;
  }

  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  let body = {};
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  } catch {
    sendJson(response, 400, { error: "Malformed JSON body" });
    return;
  }

  const targetId = Number(roleMatch[1]);
  const target = getUserById(targetId);
  if (!target) {
    sendJson(response, 404, { error: "User not found" });
    return;
  }

  const nextRole = body.role === "admin" ? "admin" : body.role === "analyst" ? "analyst" : null;
  if (!nextRole) {
    sendJson(response, 400, { error: "Unsupported role" });
    return;
  }

  const updated = updateUserRole(targetId, nextRole);
  sendJson(response, 200, {
    changedBy: identity.email,
    user: {
      id: updated.id,
      email: updated.email,
      role: updated.role
    }
  });
});

server.listen(port, host, () => {
  console.log(`FansOnly admin API listening on http://${host}:${port}`);
});
