// Client-side mock credits (Phase 1). No server needed.
// Daily limit, resets at local midnight.

export const DAILY_LIMIT = 20;

type CreditsState = {
  left: number;
  resetAt: number; // epoch ms for next local midnight
};

function nextLocalMidnight(from = new Date()): number {
  const d = new Date(from);
  d.setHours(24, 0, 0, 0); // jump to next local 00:00
  return d.getTime();
}

function readRaw(): CreditsState | null {
  if (typeof window === "undefined") return null;
  try {
    const left = Number(localStorage.getItem("creditsLeft") ?? "");
    const resetAt = Number(localStorage.getItem("creditsResetAt") ?? "");
    if (!isFinite(left) || !isFinite(resetAt) || left < 0) return null;
    return { left, resetAt };
  } catch {
    return null;
  }
}

function writeRaw(s: CreditsState) {
  if (typeof window === "undefined") return;
  localStorage.setItem("creditsLeft", String(Math.max(0, Math.min(DAILY_LIMIT, s.left))));
  localStorage.setItem("creditsResetAt", String(s.resetAt));
}

function init(): CreditsState {
  const base: CreditsState = { left: DAILY_LIMIT, resetAt: nextLocalMidnight() };
  writeRaw(base);
  return base;
}

function maybeReset(): CreditsState {
  const now = Date.now();
  const cur = readRaw() ?? init();
  if (now >= cur.resetAt) {
    const reset: CreditsState = { left: DAILY_LIMIT, resetAt: nextLocalMidnight(new Date(now)) };
    writeRaw(reset);
    return reset;
  }
  return cur;
}

export function readCredits(): { left: number; resetAt: number } {
  if (typeof window === "undefined") return { left: DAILY_LIMIT, resetAt: 0 };
  return maybeReset();
}

export function tryConsume(n = 1): { ok: boolean; left: number; resetAt: number } {
  if (typeof window === "undefined") return { ok: true, left: DAILY_LIMIT, resetAt: 0 };
  const cur = maybeReset();
  if (cur.left >= n) {
    const next = { ...cur, left: cur.left - n };
    writeRaw(next);
    return { ok: true, left: next.left, resetAt: next.resetAt };
  }
  return { ok: false, left: cur.left, resetAt: cur.resetAt };
}

export function refund(n = 1): { left: number; resetAt: number } {
  if (typeof window === "undefined") return { left: DAILY_LIMIT, resetAt: 0 };
  const cur = maybeReset();
  const next = { ...cur, left: Math.min(DAILY_LIMIT, cur.left + n) };
  writeRaw(next);
  return next;
}

export function etaString(resetAt: number): string {
  if (!resetAt) return "";
  const diff = Math.max(0, resetAt - Date.now());
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}