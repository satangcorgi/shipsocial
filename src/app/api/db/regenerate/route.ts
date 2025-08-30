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

/** DB enum unions (mirror Prisma schema) */
type PlatformDb = "LINKEDIN" | "INSTAGRAM" | "X" | "FACEBOOK";
type StatusDb = "DRAFT" | "SCHEDULED" | "PUBLISHED";

/** Deterministic-but-simple text builder for Phase 1 */
function pickFramework(seed: string) {
  const frameworks = [
    { key: "Carnegie", why: "clear empathy and reader-first framing" },
    { key: "Cialdini", why: "credibility and proof increase trust" },
    { key: "SUCCES", why: "simple, concrete, unexpected, and story-driven" },
    { key: "Hormozi", why: "a sharp hook and irresistible value prop" },
    { key: "Atomic Habits", why: "small, actionable step lowers friction" },
    { key: "Lean Startup", why: "test–measure–learn loop compounds" },
  ] as const;
  const idx = Math.abs(hash(seed)) % frameworks.length;
  return frameworks[idx];
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

function buildDraft(pillarName: string, platform: PlatformDb, seed: string) {
  const fw = pickFramework(seed); // <-- typed, not unknown

  const title = `Another ${pillarName} idea to ship today`;
  const base =
    `Lead: A ${pillarName.toLowerCase()} tip tailored for ${platform}.\n\n` +
    `Insight: Include exactly one of — a useful fact, a concrete example, or a step to take today.\n` +
    `Ask: Reply with where you’ll apply this this week.`;
  const whyNote = `Why this works: ${fw.why}.`;
  const framework = fw.key;
  const altText = `${pillarName} card preview for ${platform}.`;
  const hashtags: string[] = [];

  return { title, body: base, whyNote, framework, altText, hashtags };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const postId = String(body.postId || "");

    if (!postId) return json({ ok: false, error: "Missing postId" }, 400);

    // 1) Load the existing post with its pillar
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        platform: true,
        status: true,
        pillarId: true,
        pillar: { select: { name: true } },
      },
    });
    if (!post) return json({ ok: false, error: "Post not found" }, 404);

    const pillarName = post.pillar?.name || "Tutorials";
    const platform = post.platform as PlatformDb;

    // 2) Build a fresh draft deterministically (seed via id + timestamp day)
    const seed = `${post.id}:${new Date().toISOString().slice(0, 10)}`;
    const built = buildDraft(pillarName, platform, seed);

    // 3) Update the post in place, keep as DRAFT
    const updated = await prisma.post.update({
      where: { id: post.id },
      data: {
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
        updatedAt: true,
      },
    });

    return json({ ok: true, post: updated });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Regenerate failed" }, 500);
  }
}