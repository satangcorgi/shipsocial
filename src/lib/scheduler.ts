import { getWindows, listPosts, updatePost } from "./mockdb";
import type { Platform, ScheduleWindow } from "./types";
import { prisma } from "@/lib/prisma";

// Utilities (Phase 1, Asia/Manila assumed UTC+08 with no DST)
function parseHHMM(s: string) {
  const [hh, mm] = s.split(":").map((x) => parseInt(x, 10));
  return hh * 60 + mm;
}
function pad(n: number) {
  return n.toString().padStart(2, "0");
}
function minutesToHHMM(m: number) {
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${pad(hh)}:${pad(mm)}`;
}
function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min; // inclusive
}

// Build ISO string with explicit +08:00 offset for Asia/Manila (Phase 1 simplification)
function manilaIsoForToday(minutes: number): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const hhmm = minutesToHHMM(minutes);
  return `${y}-${pad(m)}-${pad(d)}T${hhmm}:00+08:00`;
}

// Avoid exact same minute collisions by pushing +7 minutes if needed (still clamped)
function avoidCollision(targetIso: string, startMin: number, endMin: number): string {
  const posts = listPosts();
  const exists = posts.some((p) => p.scheduledAt === targetIso);
  if (!exists) return targetIso;

  const ts = targetIso.slice(0, 16); // YYYY-MM-DDTHH:MM
  const date = ts.slice(0, 10);
  const hh = parseInt(ts.slice(11, 13), 10);
  const mm = parseInt(ts.slice(14, 16), 10);

  const total = Math.min(hh * 60 + mm + 7, endMin);
  const hh2 = Math.floor(total / 60);
  const mm2 = total % 60;
  return `${date}T${pad(hh2)}:${pad(mm2)}:00+08:00`;
}

export function randomTimeInWindow(win: ScheduleWindow): string {
  const startMin = parseHHMM(win.start);
  const endMin = parseHHMM(win.end);

  const base = randomInt(startMin, Math.max(startMin, endMin));
  const jitter = randomInt(-7, 7);
  const jittered = Math.max(startMin, Math.min(endMin, base + jitter));

  const iso = manilaIsoForToday(jittered);
  return avoidCollision(iso, startMin, endMin);
}

// ---- DB windows (Prisma) with fallback to mock ----
async function getEffectiveWindows(): Promise<ScheduleWindow[]> {
  try {
    const dbWins = await prisma.window.findMany({
      orderBy: { platform: "asc" },
      select: { platform: true, start: true, end: true, tz: true },
    });
    if (dbWins.length > 0) {
      return dbWins.map((w) => ({
        platform:
          w.platform === "LINKEDIN"
            ? ("linkedin" as Platform)
            : w.platform === "INSTAGRAM"
            ? ("instagram" as Platform)
            : w.platform === "X"
            ? ("x" as Platform)
            : ("facebook" as Platform),
        start: w.start,
        end: w.end,
        tz: w.tz,
      }));
    }
  } catch {
    // ignore and fallback
  }
  // fallback to mock store
  return getWindows();
}

// Legacy sync function (kept for reference)
export function schedulePostForPlatform(postId: string, platform: Platform): { scheduledAt: string } {
  const win = getWindows().find((w) => w.platform === platform);
  const window: ScheduleWindow = win || { platform, start: "09:30", end: "11:00", tz: "Asia/Manila" };
  const scheduledAt = randomTimeInWindow(window);
  const updated = updatePost(postId, { status: "scheduled", scheduledAt });
  if (!updated) throw new Error("Post not found");
  return { scheduledAt };
}

// New DB-aware version (async)
export async function schedulePostForPlatformDBAware(
  postId: string,
  platform: Platform
): Promise<{ scheduledAt: string }> {
  const wins = await getEffectiveWindows();
  const win = wins.find((w) => w.platform === platform);
  const window: ScheduleWindow = win || { platform, start: "09:30", end: "11:00", tz: "Asia/Manila" };
  const scheduledAt = randomTimeInWindow(window);
  const updated = updatePost(postId, { status: "scheduled", scheduledAt });
  if (!updated) throw new Error("Post not found");
  return { scheduledAt };
}