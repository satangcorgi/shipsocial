"use client";

import { useEffect, useState } from "react";

type DbPost = {
  id: string;
  platform: "LINKEDIN" | "INSTAGRAM" | "X" | "FACEBOOK";
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED";
  title?: string | null;
  body: string;
  altText?: string | null;
  scheduledAt?: string | null;
};

function fmtPlatform(p?: DbPost["platform"]) {
  if (!p) return "—";
  return p === "X" ? "X" : p[0] + p.slice(1).toLowerCase();
}
function fmtLocal(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}
function assetUrl(p: DbPost) {
  // default square if unknown
  const sizes: Record<DbPost["platform"], { w: number; h: number }> = {
    LINKEDIN: { w: 1200, h: 628 },
    INSTAGRAM: { w: 1080, h: 1080 },
    X: { w: 1600, h: 900 },
    FACEBOOK: { w: 1200, h: 630 },
  };
  const s = sizes[p.platform] || { w: 1080, h: 1080 };
  const qs = new URLSearchParams({ postId: p.id, w: String(s.w), h: String(s.h) });
  return `/api/db/asset?${qs.toString()}`;
}

export default function ExportsPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<DbPost[]>([]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      // Pull scheduled posts; preview the most imminent 10
      const r = await fetch("/api/db/posts?status=SCHEDULED&limit=100", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Failed to load scheduled posts");
      const arr: DbPost[] = Array.isArray(j.posts) ? j.posts : [];
      arr.sort((a, b) => {
        const ta = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
        const tb = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
        return ta - tb;
      });
      setRows(arr.slice(0, 10));
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const csvAllScheduledHref = "/api/db/export?status=SCHEDULED&limit=500";

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Exports</h1>
          <p className="text-gray-600">
            Download a CSV for Buffer / Meta Planner, including UTM links and alt text. Assets are SVG per platform size.
          </p>
        </div>
        <button onClick={load} className="rounded border px-3 py-2 text-sm" disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      {err && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-4">
          <h2 className="text-lg font-medium">Scheduled → CSV</h2>
          <p className="mt-1 text-sm text-gray-600">
            Exports all <span className="font-medium">scheduled</span> posts (up to 500). Use this for Buffer or Meta Planner.
          </p>
          <a
            href={csvAllScheduledHref}
            className="mt-3 inline-block rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white"
          >
            Download CSV (Scheduled)
          </a>
          <p className="mt-2 text-xs text-gray-500">
            Want a subset? Select items on <a className="underline" href="/posts">/posts</a> and click <em>Download CSV</em>.
          </p>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h2 className="text-lg font-medium">How assets work</h2>
          <ul className="mt-1 list-disc pl-5 text-sm text-gray-600 space-y-1">
            <li>Each row includes an SVG URL sized to the platform (e.g., 1200×628 for LinkedIn).</li>
            <li>You can open an asset from Posts or paste the URL in your scheduler.</li>
            <li>Alt text is included to support accessibility.</li>
          </ul>
          <div className="mt-3 text-xs text-gray-500">
            Later: ZIP export and direct n8n handoff.
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-white">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h3 className="text-base font-medium">Preview (next 10 scheduled)</h3>
          <a href="/posts" className="text-sm underline">Open Posts</a>
        </div>
        {loading ? (
          <div className="px-4 py-6 text-sm text-gray-500">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500">No scheduled posts yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-gray-600">
                  <th className="px-4 py-2">When</th>
                  <th className="px-4 py-2">Platform</th>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Asset</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-b last:border-b-0">
                    <td className="px-4 py-2">{fmtLocal(p.scheduledAt)}</td>
                    <td className="px-4 py-2">{fmtPlatform(p.platform)}</td>
                    <td className="px-4 py-2">
                      {p.title ? <span className="font-medium">{p.title}</span> : <span className="text-gray-500">—</span>}
                    </td>
                    <td className="px-4 py-2">
                      <a
                        href={assetUrl(p)}
                        target="_blank"
                        rel="noreferrer"
                        className="underline text-gray-700"
                        title="Open SVG asset"
                      >
                        Open SVG
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}