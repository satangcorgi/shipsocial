// Lightweight JSON helper
function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

// NOTE: Next 15 route handlers should accept two args.
// Using `any` for the 2nd arg avoids TS signature mismatches in dynamic routes.

export async function GET(_req: Request, context: any) {
  const id = context?.params?.id as string | undefined;
  if (!id) return json({ ok: false, error: "Missing id" }, 400);
  // Mock endpoint not used in Phase 1+; keep inert.
  return json({ ok: false, error: "Mock GET disabled for build" }, 404);
}

export async function PATCH(_req: Request, context: any) {
  const id = context?.params?.id as string | undefined;
  if (!id) return json({ ok: false, error: "Missing id" }, 400);
  // Mock endpoint not used; keep inert.
  return json({ ok: false, error: "Mock PATCH disabled for build" }, 404);
}

export async function DELETE(_req: Request, context: any) {
  const id = context?.params?.id as string | undefined;
  if (!id) return json({ ok: false, error: "Missing id" }, 400);
  // Mock endpoint not used; keep inert.
  return json({ ok: false, error: "Mock DELETE disabled for build" }, 404);
}