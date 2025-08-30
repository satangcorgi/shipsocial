"use client";

import { useEffect, useState } from "react";

type Pillar = { id: string; name: string; desc: string; createdAt?: string; updatedAt?: string };

export default function PillarsPage() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  async function load() {
    setLoading(true);
    setErr(null);
    setOk(null);
    try {
      const res = await fetch("/api/db/pillars", { cache: "no-store" });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Failed to load pillars");
      setPillars(Array.isArray(j.pillars) ? j.pillars : []);
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addPillar() {
    setLoading(true);
    setErr(null);
    setOk(null);
    try {
      const res = await fetch("/api/db/pillars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), desc: newDesc.trim() }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Create failed");
      setOk("Pillar created.");
      setNewName("");
      setNewDesc("");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(p: Pillar) {
    setEditingId(p.id);
    setEditName(p.name);
    setEditDesc(p.desc || "");
    setOk(null);
    setErr(null);
  }

  async function saveEdit() {
    if (!editingId) return;
    setLoading(true);
    setErr(null);
    setOk(null);
    try {
      const res = await fetch("/api/db/pillars", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, name: editName.trim(), desc: editDesc.trim() }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Update failed");
      setOk("Pillar saved.");
      setEditingId(null);
      await load();
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditDesc("");
  }

  async function remove(id: string) {
    if (!confirm("Delete this pillar? Posts will keep pillarId = null.")) return;
    setLoading(true);
    setErr(null);
    setOk(null);
    try {
      const res = await fetch("/api/db/pillars", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Delete failed");
      setOk("Pillar deleted.");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pillars</h1>
          <p className="text-gray-600">
            Create 3–5 content pillars to guide daily posts.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="rounded border px-3 py-2 text-sm disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <a href="/posts" className="rounded border px-3 py-2 text-sm">Go to Posts</a>
        </div>
      </header>

      {err && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}
      {ok && <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">{ok}</div>}

      {/* Add */}
      <section className="rounded-lg border bg-white p-4 grid gap-3">
        <h2 className="text-lg font-medium">Add pillar</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm md:col-span-1">
            <div className="text-gray-600">Name</div>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              placeholder="Tutorials"
            />
          </label>
          <label className="text-sm md:col-span-2">
            <div className="text-gray-600">Description</div>
            <input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              placeholder="Short, do-this-now walkthroughs."
            />
          </label>
        </div>
        <div>
          <button
            onClick={addPillar}
            className="rounded bg-gray-900 text-white px-3 py-2 text-sm disabled:opacity-50"
            disabled={loading || !newName.trim()}
          >
            {loading ? "Adding…" : "Add pillar"}
          </button>
        </div>
      </section>

      {/* List */}
      <section className="rounded-lg border bg-white overflow-hidden">
        <div className="grid grid-cols-[1fr_2fr_180px] gap-3 px-4 py-2 text-xs text-gray-600 border-b bg-gray-50">
          <div>Name</div>
          <div>Description</div>
          <div className="text-right">Actions</div>
        </div>
        {pillars.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500">No pillars yet. Add one above.</div>
        ) : (
          pillars.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-[1fr_2fr_180px] gap-3 px-4 py-3 items-center border-b last:border-b-0"
            >
              {editingId === p.id ? (
                <>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="rounded border px-3 py-2 text-sm"
                  />
                  <input
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="rounded border px-3 py-2 text-sm"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={saveEdit}
                      className="rounded bg-gray-900 text-white px-3 py-2 text-xs disabled:opacity-50"
                      disabled={loading || !editName.trim()}
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="rounded border px-3 py-2 text-xs"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-gray-700">{p.desc}</div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => startEdit(p)}
                      className="rounded border px-3 py-2 text-xs"
                      disabled={loading}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(p.id)}
                      className="rounded bg-red-600 text-white px-3 py-2 text-xs disabled:opacity-50"
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </section>

      <p className="text-xs text-gray-500">
        Tip: Pillar names must be unique per brand (case-insensitive). Posts keep their content if a pillar is deleted; the link is just cleared.
      </p>
    </div>
  );
}