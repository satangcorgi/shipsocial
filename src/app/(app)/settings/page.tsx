"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [checking, setChecking] = useState(false);
  const [health, setHealth] = useState<null | { ok: boolean; error?: string }>(null);

  async function checkDb() {
    setChecking(true);
    setHealth(null);
    try {
      const res = await fetch("/api/db/health", { cache: "no-store" });
      const j = await res.json();
      setHealth(j);
    } catch (e: any) {
      setHealth({ ok: false, error: e?.message || "Request failed" });
    } finally {
      setChecking(false);
    }
  }

  async function resetDemo() {
    if (!confirm("Reset demo data? This will wipe posts, pillars, windows, and reseed.")) return;
    const res = await fetch("/api/db/reset", { method: "POST" });
    const j = await res.json();
    alert(j.ok ? "Demo data reset. Revisit Onboarding/Voice to tweak." : j.error || "Reset failed");
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-gray-600">Utilities for your ShipSocial workspace.</p>
      </header>

      {/* DB health */}
      <section className="rounded-lg border bg-white p-4">
        <h2 className="text-lg font-medium">Database health</h2>
        <p className="text-sm text-gray-600">Ping Prisma → Postgres to verify connectivity.</p>
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={checkDb}
            className="rounded bg-gray-900 text-white px-3 py-2 text-sm disabled:opacity-50"
            disabled={checking}
          >
            {checking ? "Checking…" : "Check DB"}
          </button>
          {health && (
            <>
              {health.ok ? (
                <span className="text-sm text-emerald-700">OK</span>
              ) : (
                <span className="text-sm text-red-700">Error: {health.error || "Unknown"}</span>
              )}
            </>
          )}
        </div>
      </section>

      {/* Demo reset */}
      <section className="rounded-lg border bg-white p-4">
        <h2 className="text-lg font-medium">Reset Database (Demo)</h2>
        <p className="text-sm text-gray-600">
          Wipes all DB rows (posts, pillars, windows, brands) and reseeds demo data. Useful for clean demos.
          After resetting, revisit <a className="underline" href="/onboarding">Onboarding</a> and{" "}
          <a className="underline" href="/voice">Voice</a>.
        </p>
        <div className="mt-3">
          <button
            onClick={resetDemo}
            className="rounded border px-3 py-2 text-sm"
          >
            Reset demo data
          </button>
        </div>
      </section>
    </div>
  );
}