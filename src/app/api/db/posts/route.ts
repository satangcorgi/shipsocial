import { prisma } from "@/lib/prisma";

function json(data: any, status = 200) {
  const body = JSON.stringify(
    data,
    (_k, v) => (typeof v === "bigint" ? Number(v) : v)
  );
  return new Response(body, {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

type Status = "DRAFT" | "SCHEDULED" | "PUBLISHED";

async function ensureBrand() {
  const existing = await prisma.brand.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;

  // Seed a demo brand (minimal; windows/pillars created elsewhere as needed)
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
    },
  });
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const statusIn = (url.searchParams.get("status") || "").toUpperCase();
    const limitIn = parseInt(url.searchParams.get("limit") || "20", 10);

    const allowed: Status[] = ["DRAFT", "SCHEDULED", "PUBLISHED"];
    const status: Status | undefined = (allowed as string[]).includes(statusIn)
      ? (statusIn as Status)
      : undefined;

    const take = Math.max(1, Math.min(isFinite(limitIn) ? limitIn : 20, 100));

    const brand = await ensureBrand();

    // sort: scheduled → by scheduledAt asc (then created desc), others → created desc
    const orderBy =
      status === "SCHEDULED"
        ? [{ scheduledAt: "asc" as const }, { createdAt: "desc" as const }]
        : [{ createdAt: "desc" as const }];

    const where: any = { brandId: brand.id };
    if (status) where.status = status;

    const [posts, count] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy,
        take,
        select: {
          id: true,
          platform: true,
          status: true,
          title: true,
          body: true,
          whyNote: true,
          framework: true,
          hashtags: true,
          pillarId: true,
          scheduledAt: true,
          createdAt: true,
        },
      }),
      prisma.post.count({ where }),
    ]);

    return json({ ok: true, count, posts });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "DB list failed" }, 500);
  }
}