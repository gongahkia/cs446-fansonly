export async function POST() {
  return Response.json(
    {
      error: "Browser shell access is disabled. This vector only simulates reverse-shell delivery."
    },
    { status: 410 }
  );
}
