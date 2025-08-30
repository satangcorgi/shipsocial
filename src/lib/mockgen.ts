import { addPost, getPillars, getVoiceCard, updatePost, listPosts } from "./mockdb";
import type { Platform, Framework, Post } from "./types";

// tiny deterministic hash so results are stable in Phase 1 (no external APIs)
function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
function pick<T>(arr: T[], seed: number) {
  return arr[seed % arr.length];
}

const frameworks: Framework[] = ["carnegie", "cialdini", "succes", "hormozi", "atomic", "lean"];

function platformBody(platform: Platform, kind: "fact" | "example" | "step", pillarName: string, brandName: string) {
  const lead = `On ${pillarName.toLowerCase()}, here’s something useful.`;
  const fact = `Fact: Most founders underestimate how much consistent posting compounds trust over 30–60 days.`;
  const example = `Example: ${brandName} shared a tiny before/after of a workflow fix and earned 12 qualified replies in a week.`;
  const step = `Step: Write one sentence that teaches a single idea, then add one concrete example. Post it today.`;

  const one = kind === "fact" ? fact : kind === "example" ? example : step;

  if (platform === "linkedin") {
    return [
      `${lead}`,
      "",
      one,
      "",
      "Ask: If this helped, follow for more tiny, practical notes."
    ].join("\n");
  }
  if (platform === "instagram") {
    return [
      `Slide 1: ${pillarName} — one thing that actually helps.`,
      `Slide 2: ${one}`,
      "Slide 3: Keep it repeatable. Save to revisit.",
      "CTA: Follow for daily tiny wins."
    ].join("\n");
  }
  if (platform === "x") {
    return `${one} • ${pillarName} • Keep it small, ship it daily.`;
  }
  // facebook
  return `${lead}\n\n${one}\n\nTap Follow for more practical notes.`;
}

export function mockGeneratePost(opts: {
  platform: Platform;
  pillarId?: string;
  brandName?: string;
}): Post {
  const pillars = getPillars();
  if (!pillars.length) throw new Error("No pillars seeded");

  const voice = getVoiceCard();
  const brandName = opts.brandName || "Demo Brand";
  const p = opts.pillarId ? pillars.find(x => x.id === opts.pillarId) || pillars[0] : pillars[0];

  const seedBase = `${opts.platform}-${p.id}-${brandName}`;
  const s = hash(seedBase);
  const kind = pick<"fact" | "example" | "step">(["fact", "example", "step"], s);
  const fw = pick(frameworks, s + 7);

  const body = platformBody(opts.platform, kind, p.name, brandName);
  const hashtags = p.name.toLowerCase().split(/\s+/).slice(0, 2).map(w => `#${w}`).concat(["#shipsocial"]);
  const banned = voice?.banned || [];
  let safeBody = body;
  if (banned.includes("!")) safeBody = safeBody.replace(/!/g, "."); // respect simple ban

  return addPost({
    platform: opts.platform,
    status: "draft",
    title: opts.platform === "linkedin" ? `${p.name}: a tiny note` : undefined,
    body: safeBody,
    altText: `Graphic placeholder for ${p.name} post`,
    hashtags,
    whyNote: fw === "succes"
      ? "Uses SUCCES: simple + concrete + credible example to make it stick."
      : fw === "carnegie"
      ? "Applies Carnegie: clear, empathetic tone; helpful first."
      : fw === "cialdini"
      ? "Applies Cialdini: specific proof/example builds credibility."
      : fw === "hormozi"
      ? "Applies Hormozi: clear problem → practical outcome."
      : fw === "atomic"
      ? "Applies Atomic Habits: make it small and repeatable daily."
      : "Applies Lean: try one small change, measure response, iterate.",
    framework: fw,
    pillarId: p.id,
    assetUrl: undefined,
  });
}

// ---- Regeneration (updates an existing post) ----
function detectKindFromBody(body: string): "fact" | "example" | "step" | null {
  if (/^Fact:/m.test(body)) return "fact";
  if (/^Example:/m.test(body)) return "example";
  if (/^Step:/m.test(body)) return "step";
  return null;
}

function nextKind(k: "fact" | "example" | "step" | null): "fact" | "example" | "step" {
  if (k === "fact") return "example";
  if (k === "example") return "step";
  return "fact"; // from step or unknown
}

export function mockRegeneratePost(postId: string): Post {
  const all = listPosts();
  const post = all.find(p => p.id === postId);
  if (!post) throw new Error("Post not found");

  // Use existing platform & pillar; rotate kind/framework
  const currKind = detectKindFromBody(post.body);
  const newKind = nextKind(currKind);

  const currFwIdx = frameworks.indexOf(post.framework as Framework);
  const nextFw = frameworks[(currFwIdx >= 0 ? currFwIdx + 1 : 0) % frameworks.length];

  // We don't import brand here; we keep generic brandName to avoid circular deps.
  const pillar = getPillars().find(p => p.id === post.pillarId);
  const pillarName = pillar?.name || "Pillar";

  let body = platformBody(post.platform, newKind, pillarName, "Demo Brand");
  const banned = getVoiceCard()?.banned || [];
  if (banned.includes("!")) body = body.replace(/!/g, ".");

  const why =
    nextFw === "succes"
      ? "Uses SUCCES: simple + concrete + credible example to make it stick."
      : nextFw === "carnegie"
      ? "Applies Carnegie: clear, empathetic tone; helpful first."
      : nextFw === "cialdini"
      ? "Applies Cialdini: specific proof/example builds credibility."
      : nextFw === "hormozi"
      ? "Applies Hormozi: clear problem → practical outcome."
      : nextFw === "atomic"
      ? "Applies Atomic Habits: make it small and repeatable daily."
      : "Applies Lean: try one small change, measure response, iterate.";

  const title =
    post.platform === "linkedin" ? `${pillarName}: a tiny note (regen)` : post.title;

  const updated = updatePost(postId, {
    body,
    title,
    whyNote: why,
    framework: nextFw,
    // keep status/scheduledAt as-is; regen is allowed for drafts (and you might allow for scheduled later)
  });

  if (!updated) throw new Error("Update failed");
  return updated;
}