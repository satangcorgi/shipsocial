import { prisma } from "@/lib/prisma";

// ---------- helpers ----------
function json(data: any, status = 200) {
  const body = JSON.stringify(data, (_k, v) => (typeof v === "bigint" ? Number(v) : v));
  return new Response(body, {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

async function ensureBrand() {
  const existing = await prisma.brand.findFirst({ orderBy: { createdAt: "asc" } });
  if (existing) return existing;
  // minimal seed
  return prisma.brand.create({
    data: {
      name: "DB Demo Brand",
      website: "https://example.com",
      palette: ["#111827", "#6D28D9", "#F3F4F6"],
      voiceCard: {
        brandSummary: "We help small SaaS ship tiny improvements that compound.",
        audience: ["micro-SaaS founders", "indie hackers"],
        do: ["use concrete examples", "be concise", "prefer steps over fluff"],
        dont: ["no hype", "avoid jargon", "no exclamation marks"],
        tone: ["dry", "friendly"],
        phrases: ["ship daily", "tiny wins compound", "show your homework"],
        banned: ["!"],
      },
      pillars: {
        create: [
          { name: "Tutorials", desc: "Short, do-this-now walkthroughs." },
          { name: "Proof Notes", desc: "Mini case studies and wins." },
          { name: "Founder Notes", desc: "Behind-the-scenes decisions." },
        ],
      },
    },
  });
}

// ---------- GET /api/db/pillars ----------
export async function GET() {
  try {
    const brand = await ensureBrand();
    const pillars = await prisma.pillar.findMany({
      where: { brandId: brand.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, desc: true, createdAt: true, updatedAt: true },
    });
    const count = await prisma.pillar.count({ where: { brandId: brand.id } });
    return json({ ok: true, count, pillars });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "DB error" }, 500);
  }
}

// ---------- POST /api/db/pillars  { name: string, desc?: string } ----------
export async function POST(req: Request) {
  try {
    const brand = await ensureBrand();
    const body = await req.json().catch(() => ({} as any));
    const name = String(body?.name || "").trim();
    const desc = String(body?.desc || "").trim() || "—";

    if (!name) return json({ ok: false, error: "name is required" }, 400);
    if (name.length > 60) return json({ ok: false, error: "name too long" }, 400);

    // prevent duplicates (case-insensitive) at app-level; DB also has unique(brandId,name)
    const existing = await prisma.pillar.findFirst({
      where: { brandId: brand.id, name: { equals: name, mode: "insensitive" as any } },
      select: { id: true },
    });
    if (existing) return json({ ok: false, error: "pillar with that name already exists" }, 409);

    const created = await prisma.pillar.create({
      data: { brandId: brand.id, name, desc },
      select: { id: true, name: true, desc: true, createdAt: true },
    });
    return json({ ok: true, pillar: created });
  } catch (e: any) {
    // Prisma unique constraint, etc.
    const msg = typeof e?.message === "string" ? e.message : "DB error";
    return json({ ok: false, error: msg }, 500);
  }
}

// ---------- PATCH /api/db/pillars  { id: string, name?: string, desc?: string } ----------
export async function PATCH(req: Request) {
  try {
    const brand = await ensureBrand();
    const body = await req.json().catch(() => ({} as any));
    const id = String(body?.id || "").trim();
    const name = body?.name !== undefined ? String(body.name).trim() : undefined;
    const desc = body?.desc !== undefined ? String(body.desc).trim() : undefined;

    if (!id) return json({ ok: false, error: "id is required" }, 400);
    if (name !== undefined && name.length === 0) return json({ ok: false, error: "name cannot be empty" }, 400);

    if (name) {
      const dupe = await prisma.pillar.findFirst({
        where: {
          brandId: brand.id,
          id: { not: id },
          name: { equals: name, mode: "insensitive" as any },
        },
        select: { id: true },
      });
      if (dupe) return json({ ok: false, error: "another pillar already has that name" }, 409);
    }

    const updated = await prisma.pillar.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(desc !== undefined ? { desc: desc || "—" } : {}),
      },
      select: { id: true, name: true, desc: true, updatedAt: true },
    });
    return json({ ok: true, pillar: updated });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "DB error" }, 500);
  }
}

// ---------- DELETE /api/db/pillars  { id: string } ----------
export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const id = String(body?.id || "").trim();
    if (!id) return json({ ok: false, error: "id is required" }, 400);

    // safe delete: posts referencing this pillar will keep pillarId = null (ON DELETE SET NULL)
    await prisma.pillar.delete({ where: { id } });
    return json({ ok: true });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "DB error" }, 500);
  }
}