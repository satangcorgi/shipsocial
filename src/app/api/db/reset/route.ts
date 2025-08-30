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

export async function POST() {
  try {
    // Wipe in safe order (posts → windows → pillars → brands)
    await prisma.$transaction([
      prisma.post.deleteMany({}),
      prisma.window.deleteMany({}),
      prisma.pillar.deleteMany({}),
      prisma.brand.deleteMany({}),
    ]);

    // Reseed a demo brand with defaults
    const brand = await prisma.brand.create({
      data: {
        name: "ShipSocial Demo",
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
        windows: {
          create: [
            { platform: "LINKEDIN", start: "09:30", end: "11:00", tz: "Asia/Manila" },
            { platform: "INSTAGRAM", start: "16:00", end: "18:00", tz: "Asia/Manila" },
            { platform: "X",         start: "12:00", end: "13:00", tz: "Asia/Manila" },
            { platform: "FACEBOOK",  start: "19:00", end: "20:30", tz: "Asia/Manila" },
          ],
        },
      },
      include: { pillars: true, windows: true },
    });

    const counts = {
      brands: await prisma.brand.count(),
      pillars: await prisma.pillar.count(),
      windows: await prisma.window.count(),
      posts: await prisma.post.count(),
    };

    return json({ ok: true, brand: { id: brand.id, name: brand.name }, counts });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "reset failed" }, 500);
  }
}