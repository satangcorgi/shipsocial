"use client";

import { useEffect, useState } from "react";

type Stats = {
  drafts?: number;
  scheduled?: number;
  published7d?: number;
  pillars?: number;
  windows?: number;
};

export default function DashboardOverview() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({});

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/db/stats", { cache: "no-store" });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || "Failed to load stats");
      setStats(j.stats || {});
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const cards: Array<{ label: string; value: number; href: string }> = [
    { label: "Drafts", value: stats.drafts ?? 0, href: "/posts" },
    { label: "Scheduled", value: stats.scheduled ?? 0, href: "/posts" },
    { label: "Published (7d)", value: stats.published7d ?? 0, href: "/exports" },
    { label: "Pillars", value: stats.pillars ?? 0, href: "/pillars" },
    { label: "Windows", value: stats.windows ?? 0, href: "/schedule" },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Overview</h1>
          <p className="text-gray-600">
            Quick snapshot of your content pipeline. Use the shortcuts to act.
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/dashboard/week" className="rounded border px-3 py-2 text-sm">Week view</a>
          <button onClick={load} className="rounded border px-3 py-2 text-sm" disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </header>

      {err && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <a
            key={c.label}
            href={c.href}
            className="rounded-lg border bg-white p-5 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <div className="text-sm text-gray-600">{c.label}</div>
            <div className="mt-2 text-3xl font-semibold">{c.value}</div>
          </a>
        ))}
      </section>

      <section className="rounded-lg border bg-white p-5">
        <h2 className="text-lg font-medium">Next step</h2>
        <p className="mt-1 text-sm text-gray-600">
          Generate a draft on <a className="underline" href="/posts">/posts</a>, or update your windows on{" "}
          <a className="underline" href="/schedule">/schedule</a>. Export recent posts from{" "}
          <a className="underline" href="/exports">/exports</a>.
        </p>
      </section>
    </div>
  );
}