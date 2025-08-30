import { prisma } from "@/lib/prisma";

/** Small JSON helper */
function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/** UI input */
type PlatformIn = "linkedin" | "instagram" | "x" | "facebook";

/** DB enum unions (mirror Prisma schema) */
type PlatformDb = "LINKEDIN" | "INSTAGRAM" | "X" | "FACEBOOK";
type StatusDb = "DRAFT" | "SCHEDULED" | "PUBLISHED";

/** Safe map from UI platform → DB enum */
const PLATFORM_MAP: Record<PlatformIn, PlatformDb> = {
  linkedin: "LINKEDIN",
  instagram: "INSTAGRAM",
  x: "X",
  facebook: "FACEBOOK",
};

/** Deterministic draft copy (Phase 1) */
function buildDraft(pillarName: string, platform: PlatformIn) {
  const frameworks = ["Carnegie", "Cialdini", "SUCCES", "Hormozi", "Atomic Habits", "Lean Startup"] as const;
  const framework = frameworks[(pillarName.length + platform.length) % frameworks.length];

  const title = `One ${pillarName} tip to ship today`;
  const body =
    `Lead: A concrete ${pillarName.toLowerCase()} takeaway you can use now.\n\n` +
    `Insight: Show one useful fact, one example, or one step to take today.\n` +
    `Ask: Tell me where you’ll apply this this week.`;
  const whyNote = `Why this works: ${framework} principle applied to a specific, doable action.`;
  const altText = `${pillarName} card summarizing a single actionable idea for ${platform}.`;
  const hashtags: string[] = [];

  return { title, body, whyNote, framework, altText, hashtags };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { platform?: PlatformIn; pillarId?: string };
    const platformIn: PlatformIn = (body.platform ?? "linkedin") as PlatformIn;
    const platformEnum: PlatformDb = PLATFORM_MAP[platformIn];

    // 1) Find or create minimal Brand reference — select only id to keep the type consistent.
    let brand = await prisma.brand.findFirst({ select: { id: true } });
    if (!brand) {
      brand = await prisma.brand.create({
        data: {
          name: "ShipSocial Demo",
          website: "https://example.com",
          palette: ["#111827", "#6D28D9", "#F3F4F6"],
          voiceCard: {
            tone: ["dry", "friendly"],
            do: ["use concrete examples", "be concise", "prefer steps over fluff"],
            dont: ["no hype", "avoid jargon", "no exclamation marks"],
            phrases: ["ship daily", "tiny wins compound", "show your homework"],
            banned: ["!"],
            audience: ["micro-SaaS founders", "indie hackers"],
          },
        },
        select: { id: true },
      });
    }

    // 2) Pillar by id or fallback (select id+name for generator)
    let pillar: { id: string; name: string } | null = null;
    if (body.pillarId) {
      const found = await prisma.pillar.findUnique({
        where: { id: body.pillarId },
        select: { id: true, name: true },
      });
      pillar = found ?? null;
    }
    if (!pillar) {
      pillar =
        (await prisma.pillar.findFirst({
          where: { brandId: brand.id },
          select: { id: true, name: true },
        })) ??
        (await prisma.pillar.create({
          data: { brandId: brand.id, name: "Tutorials", desc: "Short, actionable how-to posts." },
          select: { id: true, name: true },
        }));
    }

    // 3) Build + create post
    const built = buildDraft(pillar.name, platformIn);

    const post = await prisma.post.create({
      data: {
        brandId: brand.id,
        pillarId: pillar.id,
        platform: platformEnum,
        status: "DRAFT" as StatusDb,
        title: built.title,
        body: built.body,
        whyNote: built.whyNote,
        framework: built.framework,
        hashtags: built.hashtags,
        altText: built.altText,
      },
      select: {
        id: true,
        platform: true,
        status: true,
        title: true,
        body: true,
        whyNote: true,
        framework: true,
        hashtags: true,
        altText: true,
        pillarId: true,
        createdAt: true,
      },
    });

    return json({ ok: true, post });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Generate failed" }, 500);
  }
}