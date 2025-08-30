"use client";

import { useState } from "react";

type ApiOut = {
  ok: boolean;
  error?: string;
  brand?: { id: string; name: string };
};

function splitText(s: string) {
  return s
    .split(/[\n,]/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function OnboardingPage() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // basics
  const [name, setName] = useState("ShipSocial Demo");
  const [website, setWebsite] = useState("https://example.com");
  const [pillars, setPillars] = useState("Tutorials\nProof Stories\nBehind the Scenes");
  const [palette, setPalette] = useState("#111827, #6D28D9, #F3F4F6");

  // optional voice card
  const [tone, setTone] = useState("dry, friendly");
  const [doList, setDoList] = useState("use concrete examples\nbe concise\nprefer steps over fluff");
  const [dontList, setDontList] = useState("no hype\navoid jargon\nno exclamation marks");
  const [phrases, setPhrases] = useState("ship daily\ntiny wins compound\nshow your homework");
  const [banned, setBanned] = useState("!");
  const [audience, setAudience] = useState("micro-SaaS founders\nindie hackers");

  function demoFill() {
    setName("ShipSocial Demo");
    setWebsite("https://example.com");
    setPillars("Tutorials\nProof Stories\nBehind the Scenes");
    setPalette("#111827, #6D28D9, #F3F4F6");
    setTone("dry, friendly");
    setDoList("use concrete examples\nbe concise\nprefer steps over fluff");
    setDontList("no hype\navoid jargon\nno exclamation marks");
    setPhrases("ship daily\ntiny wins compound\nshow your homework");
    setBanned("!");
    setAudience("micro-SaaS founders\nindie hackers");
    setErr(null);
    setOk(null);
  }

  async function submit() {
    setLoading(true);
    setErr(null);
    setOk(null);
    try {
      const res = await fetch("/api/db/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          website: website.trim(),
          pillars,
          palette,
          tone,
          do: doList,
          dont: dontList,
          phrases,
          banned,
          audience,
        }),
      });

      // if server returned HTML (wrong route), throw a clear error
      const text = await res.text();
      let data: ApiOut;
      try {
        data = JSON.parse(text) as ApiOut;
      } catch {
        throw new Error("Server returned non-JSON (wrong endpoint).");
      }

      if (!res.ok || !data.ok) throw new Error(data.error || "Onboarding failed");
      setOk("Saved! Voice + pillars + windows updated. Open Voice/Pillars/Schedule to review.");
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
          <h1 className="text-2xl font-semibold">Onboarding</h1>
          <p className="text-gray-600">Start with the basics. Add voice details (optional) in Advanced.</p>
        </div>
        <button onClick={demoFill} className="rounded border px-3 py-2 text-sm">Use demo defaults</button>
      </header>

      {err && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}
      {ok && <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">{ok}</div>}

      <section className="rounded-lg border bg-white p-4 grid gap-4">
        <h2 className="text-lg font-medium">Basics</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            <div className="text-gray-600">Brand name</div>
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
          </label>
          <label className="text-sm">
            <div className="text-gray-600">Website</div>
            <input value={website} onChange={(e) => setWebsite(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
          </label>
        </div>

        <label className="text-sm">
          <div className="text-gray-600">Pillars (one per line, 3–5)</div>
          <textarea value={pillars} onChange={(e) => setPillars(e.target.value)} className="mt-1 w-full rounded border px-3 py-2 h-32" />
        </label>

        <label className="text-sm">
          <div className="text-gray-600">Palette (comma or newline)</div>
          <input value={palette} onChange={(e) => setPalette(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
        </label>
      </section>

      <details className="rounded-lg border bg-white p-4" open={false}>
        <summary className="text-lg font-medium cursor-pointer">Advanced (Voice Card) — optional</summary>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            <div className="text-gray-600">Tone (comma or newline)</div>
            <textarea value={tone} onChange={(e) => setTone(e.target.value)} className="mt-1 h-24 w-full rounded border px-3 py-2" />
          </label>
          <label className="text-sm">
            <div className="text-gray-600">Audience</div>
            <textarea value={audience} onChange={(e) => setAudience(e.target.value)} className="mt-1 h-24 w-full rounded border px-3 py-2" />
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-3 mt-3">
          <label className="text-sm">
            <div className="text-gray-600">Do</div>
            <textarea value={doList} onChange={(e) => setDoList(e.target.value)} className="mt-1 h-28 w-full rounded border px-3 py-2" />
          </label>
          <label className="text-sm">
            <div className="text-gray-600">Don’t</div>
            <textarea value={dontList} onChange={(e) => setDontList(e.target.value)} className="mt-1 h-28 w-full rounded border px-3 py-2" />
          </label>
          <label className="text-sm">
            <div className="text-gray-600">Phrases / Banned</div>
            <textarea value={phrases} onChange={(e) => setPhrases(e.target.value)} className="mt-1 h-28 w-full rounded border px-3 py-2" />
            <input value={banned} onChange={(e) => setBanned(e.target.value)} className="mt-2 w-full rounded border px-3 py-2" placeholder="!" />
          </label>
        </div>
      </details>

      <div className="flex gap-2">
        <button
          onClick={submit}
          className="rounded bg-gray-900 text-white px-4 py-2 text-sm disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Saving…" : "Save & continue"}
        </button>
        <a href="/pillars" className="rounded border px-4 py-2 text-sm">Manage pillars</a>
      </div>

      <p className="text-xs text-gray-500">
        Tip: We’ll ensure default posting windows for LinkedIn, Instagram, X, and Facebook.
      </p>
    </div>
  );
}