// Simple browser-local daily credits (Phase 1 mock, no server keys)
// Used by Posts & CreditsBadge. Resets at local midnight.

export const DAILY_LIMIT = 20;

type CreditState = {
  date: string;   // YYYY-MM-DD (local)
  used: number;
  left: number;
};

const STORAGE_KEY = "shipsocial:credits:v1";

function todayKey(): string {
  const d = new Date();
  // local YYYY-MM-DD
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function normalize(state: Partial<CreditState> | null): CreditState {
  const key = todayKey();
  if (!state || state.date !== key) {
    return { date: key, used: 0, left: DAILY_LIMIT };
  }
  const used = Math.max(0, Math.min(DAILY_LIMIT, state.used ?? 0));
  const left = Math.max(0, Math.min(DAILY_LIMIT, DAILY_LIMIT - used));
  return { date: key, used, left };
}

function load(): CreditState {
  if (typeof window === "undefined") {
    // SSR safe default
    return { date: todayKey(), used: 0, left: DAILY_LIMIT };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<CreditState>) : null;
    return normalize(parsed);
  } catch {
    return { date: todayKey(), used: 0, left: DAILY_LIMIT };
  }
}

function save(state: CreditState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors for MVP
  }
}

export function readCredits(): CreditState {
  const s = load();
  // write back normalized (handles new day rollover)
  save(s);
  return s;
}

export function tryConsume(n = 1): { ok: boolean; left: number } {
  const s = load();
  if (s.left < n) return { ok: false, left: s.left };
  const used = s.used + n;
  const next: CreditState = { date: s.date, used, left: Math.max(0, DAILY_LIMIT - used) };
  save(next);
  return { ok: true, left: next.left };
}

export function refund(n = 1): { left: number } {
  const s = load();
  const used = Math.max(0, s.used - n);
  const next: CreditState = { date: s.date, used, left: Math.max(0, DAILY_LIMIT - used) };
  save(next);
  return { left: next.left };
}

// NEW: reset for demos
export function resetCredits(): { left: number } {
  const key = todayKey();
  const next: CreditState = { date: key, used: 0, left: DAILY_LIMIT };
  save(next);
  return { left: next.left };
}
