"use client";

import { useEffect, useMemo, useState } from "react";

type DbPost = {
  id: string;
  platform: "LINKEDIN" | "INSTAGRAM" | "X" | "FACEBOOK";
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED";
  title?: string | null;
  body: string;
  scheduledAt?: string | null; // ISO string
};

type WinMap = {
  LINKEDIN?: { start: string; end: string };
  INSTAGRAM?: { start: string; end: string };
  X?: { start: string; end: string };
  FACEBOOK?: { start: string; end: string };
};

const ALL_PLATFORMS: Array<DbPost["platform"]> = ["LINKEDIN", "INSTAGRAM", "X", "FACEBOOK"];
const PLATFORM_STYLE: Record<DbPost["platform"], string> = {
  LINKEDIN: "bg-blue-600 text-white",
  INSTAGRAM: "bg-pink-600 text-white",
  X: "bg-gray-900 text-white",
  FACEBOOK: "bg-indigo-600 text-white",
};

function startOfWeekLocal(d: Date) {
  // Monday as start of week
  const day = d.getDay(); // 0=Sun,1=Mon...
  const diff = (day === 0 ? -6 : 1) - day;
  const res = new Date(d);
  res.setHours(0, 0, 0, 0);
  res.setDate(d.getDate() + diff);
  return res;
}
function addDays(d: Date, n: number) {
  const res = new Date(d);
  res.setDate(d.getDate() + n);
  return res;
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function fmtDayHeader(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
function fmtTime(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}
function isValidHHMM(s: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}

export default function SchedulePage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // posts for the week view
  const [posts, setPosts] = useState<DbPost[]>([]);

  // windows editor state
  const [tz, setTz] = useState<string>("UTC");
  const [wins, setWins] = useState<WinMap>({});

  // timezone options are loaded on the client after mount to avoid SSR/CSR list differences
  const [tzOptions, setTzOptions] = useState<string[]>([]);

  const now = new Date();
  const sow = startOfWeekLocal(now);

  // Load scheduled posts + saved windows
  async function load() {
    setLoading(true);
    setErr(null);
    setOk(null);
    try {
      const [schedRes, winRes] = await Promise.all([
        fetch("/api/db/posts?status=SCHEDULED&limit=200", { cache: "no-store" }),
        fetch("/api/db/windows", { cache: "no-store" }),
      ]);
      const schedJ = await schedRes.json();
      const winJ = await winRes.json();
      if (!schedRes.ok) throw new Error(schedJ?.error || "Failed to load posts");
      if (!winRes.ok || !winJ.ok) throw new Error(winJ?.error || "Failed to load windows");
      setPosts(Array.isArray(schedJ.posts) ? schedJ.posts : []);
      setTz(winJ.tz || "UTC");
      setWins(winJ.windows || {});
    } catch (e: any) {
      setErr(e?.message || "Failed to load schedule");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Populate timezone options on the client after hydration
  useEffect(() => {
    try {
      const list =
        typeof (Intl as any).supportedValuesOf === "function"
          ? ((Intl as any).supportedValuesOf("timeZone") as string[])
          : [];
      const sorted = (list || []).slice().sort((a, b) => a.localeCompare(b));
      setTzOptions(sorted);
    } catch {
      setTzOptions([]); // fallback to single-option rendering
    }
  }, []);

  async function saveWindows() {
    setSaving(true);
    setErr(null);
    setOk(null);
    try {
      // validate client-side
      for (const p of ALL_PLATFORMS) {
        const w = (wins as any)[p];
        if (w) {
          if (!isValidHHMM(w.start) || !isValidHHMM(w.end)) {
            throw new Error(`Invalid time for ${p}. Use HH:MM (24h).`);
          }
        }
      }
      const res = await fetch("/api/db/windows", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tz, windows: wins }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j?.error || "Save failed");
      setOk("Windows saved.");
      setTz(j.tz || tz);
      setWins(j.windows || wins);
    } catch (e: any) {
      setErr(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  // Group posts by day of current week (Mon..Sun).
  const days = useMemo(() => {
    const buckets: Array<{ date: Date; items: DbPost[] }> = Array.from({ length: 7 }).map((_, i) => ({
      date: addDays(sow, i),
      items: [],
    }));
    for (const p of posts) {
      if (!p.scheduledAt) continue;
      const d = new Date(p.scheduledAt);
      const end = addDays(sow, 7);
      if (d >= sow && d < end) {
        const idx = Math.floor((d.getTime() - sow.getTime()) / (24 * 60 * 60 * 1000));
        if (idx >= 0 && idx < 7) buckets[idx].items.push(p);
      }
    }
    // Sort each bucket by time
    buckets.forEach((b) =>
      b.items.sort((a, b2) => {
        const t1 = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
        const t2 = b2.scheduledAt ? new Date(b2.scheduledAt).getTime() : 0;
        return t1 - t2;
      }),
    );
    return buckets;
  }, [posts, sow.getTime()]);

  // IDs for current-week export
  const idsThisWeek = useMemo(() => {
    const ids: string[] = [];
    for (const col of days) for (const p of col.items) ids.push(p.id);
    return ids;
  }, [days]);

  const exportHref =
    idsThisWeek.length > 0
      ? `/api/db/export?ids=${encodeURIComponent(idsThisWeek.join(","))}`
      : `/api/db/export?status=SCHEDULED&limit=50`;

  // helpers for editor inputs
  function getWin(p: DbPost["platform"]) {
    return (wins as any)[p] || { start: "09:30", end: "11:00" };
  }
  function setWin(p: DbPost["platform"], field: "start" | "end", val: string) {
    setWins((prev) => {
      const copy = { ...prev };
      const cur = (copy as any)[p] || { start: "09:30", end: "11:00" };
      (copy as any)[p] = { ...cur, [field]: val };
      return copy;
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Schedule</h1>
          <p className="text-gray-600 text-sm">Week view (Mon–Sun) in your local time.</p>
        </div>
        <div className="flex gap-2">
          {/* Export this week's scheduled posts */}
          <a
            href={exportHref}
            className="rounded bg-gray-900 text-white px-3 py-2 text-sm"
            title="Download CSV of this week's scheduled posts"
          >
            Download CSV (This Week)
          </a>
          <button
            onClick={load}
            className="rounded border px-3 py-2 text-sm disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </header>

      {/* Editor */}
      <section className="rounded-lg border bg-white p-4">
        <h2 className="text-lg font-medium mb-3">Posting windows</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <label className="text-sm">
            <div className="text-gray-600">Timezone</div>
            <select
              value={tz}
              onChange={(e) => setTz(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
            >
              {/* SSR-safe: before hydration, render only the saved tz so server and client match.
                  After mount, tzOptions is populated and we render the full list. */}
              {tzOptions.length === 0 ? (
                <option value={tz}>{tz}</option>
              ) : (
                tzOptions.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))
              )}
            </select>
            <div className="text-[11px] text-gray-500 mt-1">
              All platforms use the same timezone for scheduling. (Times below are interpreted in this TZ.)
            </div>
          </label>

          {/* Platform windows */}
          {ALL_PLATFORMS.map((p) => {
            const w = getWin(p);
            return (
              <div key={p} className="text-sm border rounded p-3">
                <div className="mb-2 font-medium">{p}</div>
                <div className="flex items-center gap-2">
                  <label className="flex-1">
                    <div className="text-gray-600">Start</div>
                    <input
                      value={w.start}
                      onChange={(e) => setWin(p, "start", e.target.value)}
                      placeholder="HH:MM"
                      className="mt-1 w-full rounded border px-3 py-2"
                    />
                  </label>
                  <label className="flex-1">
                    <div className="text-gray-600">End</div>
                    <input
                      value={w.end}
                      onChange={(e) => setWin(p, "end", e.target.value)}
                      placeholder="HH:MM"
                      className="mt-1 w-full rounded border px-3 py-2"
                    />
                  </label>
                </div>
                <div className="text-[11px] text-gray-500 mt-1">24-hour format, e.g., 09:30–11:00.</div>
              </div>
            );
          })}
        </div>
        <div className="mt-3">
          <button
            onClick={saveWindows}
            className="rounded bg-gray-900 text-white px-3 py-2 text-sm disabled:opacity-50"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save windows"}
          </button>
          {err && <span className="ml-3 text-sm text-red-600">{err}</span>}
          {ok && <span className="ml-3 text-sm text-green-700">{ok}</span>}
        </div>
      </section>

      {/* Week grid */}
      <section className="rounded-lg border bg-white overflow-x-auto">
        <div className="min-w-[900px] grid grid-cols-7 divide-x">
          {days.map((col, i) => {
            const isToday = sameDay(col.date, now);
            return (
              <div key={i} className="p-3">
                <div className={`mb-3 pb-2 border-b ${isToday ? "border-gray-900" : "border-gray-200"}`}>
                  <div className="text-xs uppercase tracking-wide text-gray-500">{fmtDayHeader(col.date)}</div>
                  {isToday && <div className="text-[10px] text-gray-700">Today</div>}
                </div>

                {col.items.length === 0 ? (
                  <div className="text-xs text-gray-400">No posts</div>
                ) : (
                  <ul className="space-y-2">
                    {col.items.map((p) => (
                      <li key={p.id} className="rounded border p-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] px-2 py-0.5 rounded ${PLATFORM_STYLE[p.platform]}`} title={p.platform}>
                            {p.platform}
                          </span>
                          <span className="text-xs text-gray-600">{fmtTime(p.scheduledAt)}</span>
                        </div>
                        {p.title ? (
                          <div className="mt-1 text-sm font-medium line-clamp-2">{p.title}</div>
                        ) : (
                          <div className="mt-1 text-sm text-gray-700 line-clamp-3">
                            {p.body.slice(0, 120)}
                            {p.body.length > 120 ? "…" : ""}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="text-xs text-gray-500">
        Times shown are in your device’s local time. Scheduling picks a random time within each platform’s window in the selected timezone.
      </div>
    </div>
  );
}