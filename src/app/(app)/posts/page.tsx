"use client";

import { useEffect, useMemo, useState } from "react";
import { DAILY_LIMIT, readCredits, refund, tryConsume } from "@/lib/credits";

type Pillar = { id: string; name: string; desc: string };
type DbPost = {
  id: string;
  platform: "LINKEDIN" | "INSTAGRAM" | "X" | "FACEBOOK";
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED";
  title?: string | null;
  body: string;
  whyNote?: string | null;
  framework?: string | null;
  hashtags?: string[];
  altText?: string | null;
  pillarId?: string | null;
  scheduledAt?: string | null;
  createdAt?: string | null;
};

const PLATFORMS: Array<{ value: "linkedin" | "instagram" | "x" | "facebook"; label: string }> = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "instagram", label: "Instagram" },
  { value: "x", label: "X (Twitter)" },
  { value: "facebook", label: "Facebook" },
];

function fmtPlatform(p: DbPost["platform"]) {
  if (p === "X") return "X";
  return p[0] + p.slice(1).toLowerCase();
}

function isoToLocal(iso?: string | null) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

// platform-smart SVG size
function assetUrl(p: DbPost) {
  const sizes: Record<DbPost["platform"], { w: number; h: number }> = {
    LINKEDIN: { w: 1200, h: 628 },
    INSTAGRAM: { w: 1080, h: 1080 },
    X: { w: 1600, h: 900 },
    FACEBOOK: { w: 1200, h: 630 },
  };
  const s = sizes[p.platform] || { w: 1080, h: 1080 };
  const params = new URLSearchParams({ postId: p.id, w: String(s.w), h: String(s.h) });
  return `/api/db/asset?${params.toString()}`;
}

// clipboard helpers
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}
function buildText(p: DbPost, withTags = false) {
  const parts: string[] = [];
  if (p.title && p.title.trim()) parts.push(p.title.trim());
  parts.push(p.body.trim());
  if (withTags && p.hashtags && p.hashtags.length) {
    const tags = p.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ");
    if (tags.trim()) parts.push(tags.trim());
  }
  return parts.join("\n\n");
}

export default function PostsPage() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // form
  const [platform, setPlatform] = useState<"linkedin" | "instagram" | "x" | "facebook">("linkedin");
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [pillarId, setPillarId] = useState<string>("");

  // data
  const [drafts, setDrafts] = useState<DbPost[]>([]);
  const [scheduled, setScheduled] = useState<DbPost[]>([]);

  // selection for export / bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const isSelected = (id: string) => selectedIds.includes(id);
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const clearSelection = () => setSelectedIds([]);
  const exportUrl = () =>
    selectedIds.length
      ? `/api/db/export?ids=${encodeURIComponent(selectedIds.join(","))}`
      : `/api/db/export?status=SCHEDULED&limit=50`;

  // credits (display only)
  const [creditsLeft, setCreditsLeft] = useState<number>(DAILY_LIMIT);
  function syncCredits() {
    const s = readCredits();
    setCreditsLeft(s.left);
  }

  // inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editAlt, setEditAlt] = useState("");

  function beginEdit(p: DbPost) {
    setEditingId(p.id);
    setEditTitle(p.title || "");
    setEditBody(p.body || "");
    setEditAlt(p.altText || "");
    setErr(null);
    setOk(null);
  }
  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditBody("");
    setEditAlt("");
  }

  async function saveEdit() {
    if (!editingId) return;
    setLoading(true);
    setErr(null);
    setOk(null);
    try {
      const res = await fetch("/api/db/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: editingId, title: editTitle, body: editBody, altText: editAlt }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Update failed");
      setOk("Draft updated.");
      cancelEdit();
      await loadAll();
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function loadAll() {
    setLoading(true);
    setErr(null);
    setOk(null);
    try {
      const pr = fetch("/api/db/pillars", { cache: "no-store" })
        .then((r) => r.json())
        .then((j) => (j.ok ? (j.pillars as Pillar[]) : []))
        .catch(() => []);
      const dr = fetch("/api/db/posts?status=DRAFT&limit=50", { cache: "no-store" })
        .then((r) => r.json())
        .then((j) => (Array.isArray(j.posts) ? (j.posts as DbPost[]) : []))
        .catch(() => []);
      const sr = fetch("/api/db/posts?status=SCHEDULED&limit=50", { cache: "no-store" })
        .then((r) => r.json())
        .then((j) => (Array.isArray(j.posts) ? (j.posts as DbPost[]) : []))
        .catch(() => []);

      const [pillarsRes, draftsRes, schedRes] = await Promise.all([pr, dr, sr]);
      setPillars(pillarsRes);
      setDrafts(draftsRes);
      setScheduled(schedRes);
      if (pillarsRes.length && !pillarsRes.find((p) => p.id === pillarId)) {
        setPillarId("");
      }
      syncCredits();
    } catch (e: any) {
      setErr(e?.message || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function generate() {
    setLoading(true);
    setErr(null);
    setOk(null);
    const consume = tryConsume(1);
    if (!consume.ok) {
      setLoading(false);
      setErr("No credits left today. Please wait until midnight local time.");
      syncCredits();
      return;
    }
    syncCredits();

    try {
      const body: any = { platform };
      if (pillarId) body.pillarId = pillarId;
      const res = await fetch("/api/db/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Generate failed");
      setOk("Draft created.");
      await loadAll();
    } catch (e: any) {
      refund(1);
      syncCredits();
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function regenerate(postId: string) {
    setLoading(true);
    setErr(null);
    setOk(null);
    const consume = tryConsume(1);
    if (!consume.ok) {
      setLoading(false);
      setErr("No credits left today. Please wait until midnight local time.");
      syncCredits();
      return;
    }
    syncCredits();

    try {
      const res = await fetch("/api/db/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Regenerate failed");
      setOk("Draft regenerated.");
      await loadAll();
    } catch (e: any) {
      refund(1);
      syncCredits();
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function schedule(postId: string) {
    setLoading(true);
    setErr(null);
    setOk(null);
    try {
      const res = await fetch("/api/db/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Schedule failed");
      setOk("Post scheduled.");
      await loadAll();
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function publishNow(postId: string) {
    setLoading(true);
    setErr(null);
    setOk(null);
    try {
      const res = await fetch("/api/db/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Publish failed");
      setOk("Post marked as Published.");
      await loadAll();
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function deletePost(postId: string) {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    setLoading(true);
    setErr(null);
    setOk(null);
    try {
      const res = await fetch("/api/db/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Delete failed");
      setOk("Post deleted.");
      await loadAll();
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function scheduleSelected() {
    if (selectedIds.length === 0) return;
    setLoading(true);
    setErr(null);
    setOk(null);
    try {
      let okCount = 0;
      for (const id of selectedIds) {
        try {
          const res = await fetch("/api/db/schedule", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId: id }),
          });
          const j = await res.json();
          if (res.ok && j.ok) okCount++;
        } catch {}
      }
      setOk(`Scheduled ${okCount}/${selectedIds.length} selected.`);
      setSelectedIds([]);
      await loadAll();
    } catch (e: any) {
      setErr(e?.message || "Batch schedule failed");
    } finally {
      setLoading(false);
    }
  }

  async function unschedule(postId: string) {
    setLoading(true);
    setErr(null);
    setOk(null);
    try {
      const res = await fetch("/api/db/unschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Unschedule failed");
      setOk("Post moved back to Draft.");
      await loadAll();
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  const pillarById = useMemo(() => {
    const map = new Map<string, Pillar>();
    pillars.forEach((p) => map.set(p.id, p));
    return map;
  }, [pillars]);

  // small toast helper
  function toast(msg: string) {
    setOk(msg);
    setTimeout(() => setOk(null), 1500);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Posts</h1>
          <p className="text-gray-600">
            Generate drafts from your DB <span className="font-medium">voice</span> &{" "}
            <span className="font-medium">pillars</span>. Then schedule into platform windows.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadAll}
            className="rounded border px-3 py-2 text-sm disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </header>

      {/* Selection toolbar */}
      {selectedIds.length > 0 && (
        <div className="rounded-lg border bg-white p-3 flex items-center justify-between">
          <div className="text-sm">
            <span className="font-medium">{selectedIds.length}</span> selected
          </div>
          <div className="flex gap-2">
            <a
              href={exportUrl()}
              className="rounded bg-gray-900 text-white px-3 py-2 text-xs"
              title="Download CSV of selected posts"
            >
              Download CSV
            </a>
            <button
              onClick={scheduleSelected}
              className="rounded bg-indigo-600 text-white px-3 py-2 text-xs disabled:opacity-50"
              disabled={loading || selectedIds.length === 0}
              title="Schedule all selected drafts into their platform windows"
            >
              Schedule selected
            </button>
            <button onClick={clearSelection} className="rounded border px-3 py-2 text-xs">
              Clear selection
            </button>
          </div>
        </div>
      )}

      {err && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>
      )}
      {ok && (
        <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {ok}
        </div>
      )}

      {/* Generate */}
      <section className="rounded-lg border bg-white p-4 grid gap-3">
        <h2 className="text-lg font-medium">Generate a draft</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm">
            <div className="text-gray-600">Platform</div>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as any)}
              className="mt-1 w-full rounded border px-3 py-2"
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm md:col-span-2">
            <div className="text-gray-600">Pillar (optional)</div>
            <select
              value={pillarId}
              onChange={(e) => setPillarId(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
            >
              <option value="">Auto-pick</option>
              {pillars.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <div className="mt-1 text-xs text-gray-500">
              Tip: Add or edit pillars on <a className="underline" href="/pillars">/pillars</a>.
            </div>
          </label>
        </div>
        <div>
          <button
            onClick={generate}
            className="rounded bg-gray-900 text-white px-3 py-2 text-sm disabled:opacity-50"
            disabled={loading || creditsLeft <= 0}
            title={creditsLeft <= 0 ? "No credits left today" : "Generate a new draft (uses 1 credit)"}
          >
            {loading ? "Generating…" : creditsLeft > 0 ? "Generate draft (−1)" : "Out of credits"}
          </button>
          <div className="mt-2 text-xs text-gray-500">
            Credits left today: <span className="font-medium">{creditsLeft}</span> / {DAILY_LIMIT}
          </div>
        </div>
      </section>

      {/* Drafts */}
      <section className="rounded-lg border bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
          <h3 className="text-lg font-medium">Drafts</h3>
          <span className="text-xs text-gray-500">{drafts.length} items</span>
        </div>
        {drafts.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500">No drafts yet. Generate one above.</div>
        ) : (
          drafts.map((p) => {
            const isEditing = editingId === p.id;
            return (
              <article key={p.id} className="border-b last:border-b-0 px-4 py-3 grid gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <input
                      type="checkbox"
                      checked={isSelected(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      aria-label="Select post"
                    />
                    <span>
                      <span className="font-medium">{fmtPlatform(p.platform)}</span> · {p.status}
                      {p.pillarId && pillarById.get(p.pillarId) ? (
                        <> · Pillar: <span className="font-medium">{pillarById.get(p.pillarId)!.name}</span></>
                      ) : null}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {!isEditing && (
                      <button
                        onClick={() => beginEdit(p)}
                        className="rounded border px-3 py-1.5 text-xs"
                        disabled={loading}
                        title="Edit this draft's text"
                      >
                        Edit
                      </button>
                    )}
                    {isEditing ? (
                      <>
                        <button
                          onClick={saveEdit}
                          className="rounded bg-emerald-600 text-white px-3 py-1.5 text-xs disabled:opacity-50"
                          disabled={loading}
                          title="Save changes"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="rounded border px-3 py-1.5 text-xs"
                          disabled={loading}
                          title="Discard changes"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Graphic + Download */}
                        <a
                          href={assetUrl(p)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded border px-3 py-1.5 text-xs"
                          title="Open a platform-sized SVG graphic for this post"
                        >
                          Graphic
                        </a>
                        <a
                          href={`${assetUrl(p)}&download=1`}
                          className="rounded border px-3 py-1.5 text-xs"
                          title="Download SVG"
                        >
                          Download SVG
                        </a>
                        {/* Copy actions */}
                        <button
                          onClick={async () => {
                            const ok = await copyToClipboard(buildText(p, false));
                            toast(ok ? "Copied text" : "Copy failed");
                          }}
                          className="rounded border px-3 py-1.5 text-xs"
                          title="Copy title + body to clipboard"
                        >
                          Copy text
                        </button>
                        <button
                          onClick={async () => {
                            const ok = await copyToClipboard(buildText(p, true));
                            toast(ok ? "Copied text + hashtags" : "Copy failed");
                          }}
                          className="rounded border px-3 py-1.5 text-xs"
                          title="Copy title + body + hashtags to clipboard"
                        >
                          Copy + hashtags
                        </button>

                        <button
                          onClick={() => regenerate(p.id)}
                          className="rounded bg-gray-700 text-white px-3 py-1.5 text-xs disabled:opacity-50"
                          disabled={loading || creditsLeft <= 0}
                          title={creditsLeft <= 0 ? "No credits left today" : "Regenerate this draft (uses 1 credit)"}
                        >
                          Regenerate (−1)
                        </button>
                        <button
                          onClick={() => schedule(p.id)}
                          className="rounded bg-indigo-600 text-white px-3 py-1.5 text-xs disabled:opacity-50"
                          disabled={loading}
                          title="Schedules this draft for tomorrow within the platform window"
                        >
                          Schedule
                        </button>
                        <button
                          onClick={() => deletePost(p.id)}
                          className="rounded bg-red-600 text-white px-3 py-1.5 text-xs disabled:opacity-50"
                          disabled={loading}
                          title="Delete this draft"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="grid gap-2">
                    <input
                      className="rounded border px-3 py-2 text-sm"
                      placeholder="Optional title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                    <textarea
                      className="rounded border px-3 py-2 text-sm h-40"
                      placeholder="Post body…"
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                    />
                    <textarea
                      className="rounded border px-3 py-2 text-sm h-24"
                      placeholder="Alt text for your graphic…"
                      value={editAlt}
                      onChange={(e) => setEditAlt(e.target.value)}
                    />
                    <div className="text-xs text-gray-500">
                      Alt text helps with accessibility and clarity when exporting to Buffer/Planner.
                    </div>
                  </div>
                ) : (
                  <>
                    {p.title && <h4 className="font-medium">{p.title}</h4>}
                    <pre className="whitespace-pre-wrap text-sm text-gray-800">{p.body}</pre>
                    <div className="text-xs text-gray-500">
                      {p.framework ? <>Framework: <span className="font-medium">{p.framework}</span> · </> : null}
                      {p.whyNote ? <>{p.whyNote}</> : null}
                    </div>
                    {p.altText ? <div className="text-xs text-gray-500 mt-1">Alt: <span className="italic">{p.altText}</span></div> : null}
                  </>
                )}
              </article>
            );
          })
        )}
      </section>

      {/* Scheduled */}
      <section className="rounded-lg border bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
          <h3 className="text-lg font-medium">Scheduled</h3>
          <span className="text-xs text-gray-500">{scheduled.length} items</span>
        </div>
        {scheduled.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500">Nothing scheduled yet.</div>
        ) : (
          <div className="divide-y">
            {scheduled.map((p) => (
              <div key={p.id} className="px-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-700">
                    <input
                      type="checkbox"
                      checked={isSelected(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      aria-label="Select post"
                    />
                    <span>
                      <span className="font-medium">{fmtPlatform(p.platform)}</span> · {p.status} ·{" "}
                      <span className="font-medium">{isoToLocal(p.scheduledAt)}</span>
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {/* Graphic + Download */}
                    <a
                      href={assetUrl(p)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded border px-3 py-1.5 text-xs"
                      title="Open a platform-sized SVG graphic for this post"
                    >
                      Graphic
                    </a>
                    <a
                      href={`${assetUrl(p)}&download=1`}
                      className="rounded border px-3 py-1.5 text-xs"
                      title="Download SVG"
                    >
                      Download SVG
                    </a>
                    {/* Copy actions */}
                    <button
                      onClick={async () => {
                        const ok = await copyToClipboard(buildText(p, false));
                        toast(ok ? "Copied text" : "Copy failed");
                      }}
                      className="rounded border px-3 py-1.5 text-xs"
                      title="Copy title + body to clipboard"
                    >
                      Copy text
                    </button>
                    <button
                      onClick={async () => {
                        const ok = await copyToClipboard(buildText(p, true));
                        toast(ok ? "Copied text + hashtags" : "Copy failed");
                      }}
                      className="rounded border px-3 py-1.5 text-xs"
                      title="Copy title + body + hashtags to clipboard"
                    >
                      Copy + hashtags
                    </button>

                    <button
                      onClick={() => unschedule(p.id)}
                      className="rounded border px-3 py-1.5 text-xs disabled:opacity-50"
                      disabled={loading}
                      title="Move back to Draft"
                    >
                      Unschedule
                    </button>
                    <button
                      onClick={() => publishNow(p.id)}
                      className="rounded bg-emerald-600 text-white px-3 py-1.5 text-xs disabled:opacity-50"
                      disabled={loading}
                      title="Mark as Published now (for manual posting/handoff)"
                    >
                      Publish now
                    </button>
                    <button
                      onClick={() => deletePost(p.id)}
                      className="rounded bg-red-600 text-white px-3 py-1.5 text-xs disabled:opacity-50"
                      disabled={loading}
                      title="Delete this scheduled post"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {p.title && <div className="mt-1 font-medium">{p.title}</div>}
                <div className="text-gray-600 line-clamp-3">{p.body}</div>
                {p.altText ? <div className="text-xs text-gray-500 mt-1">Alt: <span className="italic">{p.altText}</span></div> : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}