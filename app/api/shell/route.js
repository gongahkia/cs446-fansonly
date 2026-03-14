import { runShellCommand } from "@/lib/shell-engine";

export async function POST(request) {
  const body = await request.json();
  const result = await runShellCommand(body.session, body.command || "");
  if (result.error) {
    return Response.json({ error: result.error }, { status: 404 });
  }
  return Response.json(result);
}
