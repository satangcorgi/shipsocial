"use client";

import { useEffect, useMemo, useState } from "react";

type DbPost = {
  id: string;
  platform: "LINKEDIN" | "INSTAGRAM" | "X" | "FACEBOOK";
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED";
  title?: string | null;
  body: string;
  scheduledAt?: string | null; // ISO
  pillarId?: string | null;
};

function startOfDayLocal(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}
function fmtDayHeader(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
function fmtTime(iso?: string | null) {
  if (!iso) return "—";
  try {
    const dt = new Date(iso);
    return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}
function platformBadge(p: DbPost["platform"]) {
  const label = p === "X" ? "X" : p[0] + p.slice(1).toLowerCase();
  const color =
    p === "LINKEDIN" ? "bg-blue-600" :
    p === "INSTAGRAM" ? "bg-pink-600" :
    p === "X" ? "bg-black" :
    "bg-indigo-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium text-white ${color}`}>
      {label}
    </span>
  );
}

export default function DashboardWeek() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [posts, setPosts] = useState<DbPost[]>([]);

  const today = startOfDayLocal(new Date());
  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(today, i)), [today]);
  const end = addDays(today, 7);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      // Pull scheduled posts (limit generously), filter to next 7 days in client
      const res = await fetch("/api/db/posts?status=SCHEDULED&limit=200", { cache: "no-store" });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Failed to load");
      const arr: DbPost[] = Array.isArray(j.posts) ? j.posts : [];
      const upcoming = arr.filter((p) => {
        if (!p.scheduledAt) return false;
        const t = new Date(p.scheduledAt);
        return t >= today && t < end;
      });
      // Sort by date/time asc
      upcoming.sort((a, b) => {
        const ta = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
        const tb = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
        return ta - tb;
      });
      setPosts(upcoming);
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, { date: Date; items: DbPost[] }>();
    for (const d of week) map.set(dayKey(d), { date: d, items: [] });
    for (const p of posts) {
      const when = p.scheduledAt ? new Date(p.scheduledAt) : null;
      if (!when) continue;
      // find matching local day bucket
      const bucket = week.find((d) => sameDay(d, when));
      if (!bucket) continue;
      const k = dayKey(bucket);
      map.get(k)!.items.push(p);
    }
    return Array.from(map.values());
  }, [posts, week]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">This week</h1>
          <p className="text-gray-600">
            Scheduled posts for the next 7 days (local time). Manage windows on{" "}
            <a className="underline" href="/schedule">/schedule</a>.
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/dashboard" className="rounded border px-3 py-2 text-sm">Back to Dashboard</a>
          <a href="/posts" className="rounded border px-3 py-2 text-sm">Go to Posts</a>
          <button onClick={load} className="rounded border px-3 py-2 text-sm" disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </header>

      {err && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {grouped.map(({ date, items }) => (
          <div key={dayKey(date)} className="rounded-lg border bg-white overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
              <div className="text-sm font-medium">{fmtDayHeader(date)}</div>
              <div className="text-xs text-gray-500">{items.length} item{items.length === 1 ? "" : "s"}</div>
            </div>
            {items.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-500">No posts scheduled.</div>
            ) : (
              <ul className="divide-y">
                {items.map((p) => (
                  <li key={p.id} className="px-4 py-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {platformBadge(p.platform)}
                        <span className="text-gray-700 font-medium">{fmtTime(p.scheduledAt)}</span>
                      </div>
                      <a className="text-xs underline" href="/posts">Edit</a>
                    </div>
                    {p.title && <div className="mt-1 font-medium">{p.title}</div>}
                    <div className="text-gray-600 line-clamp-3">{p.body}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </section>

      <div className="text-xs text-gray-500">
        Tip: Use <span className="font-medium">Generate</span> on{" "}
        <a className="underline" href="/posts">/posts</a> then <span className="font-medium">Schedule</span> to populate this view.
      </div>
    </div>
  );
}