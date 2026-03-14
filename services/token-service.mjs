import http from "node:http";
import { getEnv } from "../lib/env.js";

const env = getEnv();
const host = process.env.FANSONLY_TOKEN_HOST || "127.0.0.1";
const port = Number(process.env.FANSONLY_TOKEN_PORT || 9000);

const server = http.createServer((request, response) => {
  if (request.method === "GET" && request.url === "/bootstrap") {
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({
      adminToken: env.adminToken,
      analystSignup: "/account/analyst-signup",
      note: "Training-only bootstrap token service."
    }, null, 2));
    return;
  }

  response.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify({ error: "Not found" }));
});

server.listen(port, host, () => {
  console.log(`FansOnly token service listening on http://${host}:${port}`);
});
