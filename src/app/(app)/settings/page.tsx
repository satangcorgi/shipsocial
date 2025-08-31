"use client";

import { useState } from "react";
import { DAILY_LIMIT, resetCredits } from "@/lib/credits";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function pingHealth() {
    setLoading(true);
    setOk(null);
    setErr(null);
    try {
      const res = await fetch("/api/db/health", { cache: "no-store" });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Health check failed");
      setOk("Database connection OK.");
    } catch (e: any) {
      setErr(e?.message || "Health check failed");
    } finally {
      setLoading(false);
    }
  }

  function resetLocalCredits() {
    setOk(null);
    setErr(null);
    const { left } = resetCredits();
    setOk(`Local credits reset to ${left}/${DAILY_LIMIT} for today.`);
  }

  async function resetDemo() {
    if (!confirm("Reset demo data? This will recreate the Brand, default Pillars, windows, and clear posts.")) {
      return;
    }
    setLoading(true);
    setOk(null);
    setErr(null);
    try {
      const res = await fetch("/api/db/reset", { method: "POST" });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Reset failed");
      setOk("Demo data reset. Visit /onboarding to tweak, or /posts to generate drafts.");
    } catch (e: any) {
      setErr(e?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-gray-600">Environment checks and demo controls.</p>
        </div>
      </header>

      {err && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}
      {ok && <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">{ok}</div>}

      <section className="rounded-lg border bg-white p-4 grid gap-3">
        <h2 className="text-lg font-medium">Database</h2>
        <p className="text-sm text-gray-600">
          Ensure your <code>DATABASE_URL</code> is configured (pooled URI on Vercel).
        </p>
        <div className="flex gap-2">
          <button
            onClick={pingHealth}
            disabled={loading}
            className="rounded border px-3 py-2 text-sm disabled:opacity-50"
            title="Calls /api/db/health"
          >
            {loading ? "Checking…" : "Check DB health"}
          </button>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-4 grid gap-3">
        <h2 className="text-lg font-medium">Demo helpers</h2>
        <p className="text-sm text-gray-600">
          Local-only actions for smoother demos (no server keys required).
        </p>
        <div className="flex gap-2">
          <button
            onClick={resetLocalCredits}
            className="rounded border px-3 py-2 text-sm"
            title="Resets the browser’s daily credits counter"
          >
            Reset local credits
          </button>
          <button
            onClick={resetDemo}
            disabled={loading}
            className="rounded bg-red-600 text-white px-3 py-2 text-sm disabled:opacity-50"
            title="Calls /api/db/reset"
          >
            {loading ? "Resetting…" : "Reset demo data"}
          </button>
          <a href="/onboarding" className="rounded border px-3 py-2 text-sm">Go to Onboarding</a>
        </div>
        <p className="text-xs text-gray-500">
          Credits are stored in your browser and auto-reset at local midnight.
        </p>
      </section>
    </div>
  );
}
