export function GET() {
  return new Response("User-agent: *\nDisallow: /backup/\nDisallow: /admin/\nDisallow: /internal/exports/\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
}
