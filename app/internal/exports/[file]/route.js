import fs from "node:fs";
import path from "node:path";
import { getEnv } from "@/lib/env";

export async function GET(_request, { params }) {
  const env = getEnv();
  const resolved = await params;
  const safeName = path.basename(resolved.file);
  const filePath = path.join(env.exportsDir, safeName);

  if (!fs.existsSync(filePath)) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(fs.readFileSync(filePath), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `inline; filename="${safeName}"`
    }
  });
}
