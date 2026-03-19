export async function POST() {
  return new Response(
    JSON.stringify({
      error: "Browser shell access is disabled. This vector only simulates reverse-shell delivery."
    }),
    { 
      status: 410,
      headers: { "Content-Type": "application/json" }
    }
  );
}
