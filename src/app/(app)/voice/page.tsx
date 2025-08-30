"use client";

import { useEffect, useMemo, useState } from "react";

type Brand = {
  id: string;
  name: string;
  website?: string | null;
  palette?: string[] | null;
  voiceCard?: {
    tone?: string[]; do?: string[]; dont?: string[]; phrases?: string[]; banned?: string[]; audience?: string[];
  } | null;
};
type Pillar = { id: string; name: string; desc?: string | null };

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      return true;
    } catch {
      return false;
    }
  }
}

export default function VoicePage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const r = await fetch("/api/db/brand", { cache: "no-store" });
        const j = await r.json();
        if (!r.ok || !j.ok) throw new Error(j?.error || "Failed");
        setBrand(j.brand);
        setPillars(j.pillars || []);
      } catch (e: any) {
        setErr(e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const prompt = useMemo(() => {
    if (!brand) return "";
    const v = brand.voiceCard || {};
    const list = (a?: string[]) => (Array.isArray(a) && a.length ? a.join(", ") : "—");
    const pillarStr = pillars.length ? pillars.map(p => `- ${p.name}`).join("\n") : "- (add pillars)";
    const palette = Array.isArray(brand.palette) && brand.palette.length ? brand.palette.join(", ") : "—";

    return [
      `You are ShipSocial's writing model for the brand "${brand.name}".`,
      brand.website ? `Website: ${brand.website}` : "",
      `Palette: ${palette}`,
      "",
      "VOICE CARD",
      `Tone: ${list(v.tone as string[])}`,
      `Audience: ${list(v.audience as string[])}`,
      `Do: ${list(v.do as string[])}`,
      `Don't: ${list(v.dont as string[])}`,
      `Phrases to use: ${list(v.phrases as string[])}`,
      `Banned: ${list(v.banned as string[])}`,
      "",
      "CONTENT PILLARS",
      pillarStr,
      "",
      "RULES",
      "- Always include exactly ONE of: a useful fact, a specific example, or one step the reader can take today.",
      "- End with a 1-sentence “why this works” citing ONE framework (Carnegie, Cialdini, SUCCES, Hormozi, Atomic, Lean).",
      "- Platform-aware formatting (LinkedIn lead + insight + single ask; IG carousel caption; X concise; FB similar to LI).",
      "- Alt text should be descriptive; hashtags only when they add reach.",
    ].filter(Boolean).join("\n");
  }, [brand, pillars]);

  function show(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1500);
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Voice</h1>
          <p className="text-gray-600">Your brand’s voice card and pillars. Edit anytime via Onboarding.</p>
        </div>
        <div className="flex gap-2">
          <a href="/onboarding" className="rounded border px-3 py-2 text-sm">Edit in Onboarding</a>
        </div>
      </header>

      {err && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}
      {toast && <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">{toast}</div>}

      {loading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : !brand ? (
        <div className="rounded border bg-white p-4 text-sm">
          No brand yet. Go to <a className="underline" href="/onboarding">Onboarding</a> to create one.
        </div>
      ) : (
        <>
          <section className="rounded-lg border bg-white p-4 grid gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium">{brand.name}</h2>
                {brand.website && <div className="text-sm text-gray-600">{brand.website}</div>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => show((await copy(prompt)) ? "Copied system prompt" : "Copy failed")}
                  className="rounded border px-3 py-2 text-sm"
                >
                  Copy system prompt
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-sm font-medium mb-1">Tone</div>
                <ul className="text-sm text-gray-700 list-disc pl-5">
                  {(brand.voiceCard?.tone || []).map((t, i) => <li key={i}>{t}</li>)}
                  {(!brand.voiceCard?.tone || !brand.voiceCard.tone.length) && <li className="text-gray-400">—</li>}
                </ul>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Audience</div>
                <ul className="text-sm text-gray-700 list-disc pl-5">
                  {(brand.voiceCard?.audience || []).map((t, i) => <li key={i}>{t}</li>)}
                  {(!brand.voiceCard?.audience || !brand.voiceCard.audience.length) && <li className="text-gray-400">—</li>}
                </ul>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Palette</div>
                {Array.isArray(brand.palette) && brand.palette.length ? (
                  <div className="flex gap-2">
                    {brand.palette.map((c, i) => (
                      <div key={i} className="h-6 w-10 rounded border" style={{ background: c }} title={c} />
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">—</div>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-sm font-medium mb-1">Do</div>
                <ul className="text-sm text-gray-700 list-disc pl-5">
                  {(brand.voiceCard?.do || []).map((t, i) => <li key={i}>{t}</li>)}
                  {(!brand.voiceCard?.do || !brand.voiceCard.do.length) && <li className="text-gray-400">—</li>}
                </ul>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Don’t</div>
                <ul className="text-sm text-gray-700 list-disc pl-5">
                  {(brand.voiceCard?.dont || []).map((t, i) => <li key={i}>{t}</li>)}
                  {(!brand.voiceCard?.dont || !brand.voiceCard.dont.length) && <li className="text-gray-400">—</li>}
                </ul>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Phrases / Banned</div>
                <div className="text-sm text-gray-700">
                  <div className="mb-1">
                    {(brand.voiceCard?.phrases || []).join(", ") || <span className="text-gray-400">—</span>}
                  </div>
                  <div className="text-gray-500 text-xs">
                    Banned: {(brand.voiceCard?.banned || []).join(", ") || "—"}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border bg-white p-4">
            <h3 className="text-base font-medium mb-2">Content Pillars</h3>
            {pillars.length === 0 ? (
              <div className="text-sm text-gray-500">No pillars yet. Add some on <a className="underline" href="/onboarding">Onboarding</a>.</div>
            ) : (
              <ul className="grid gap-2 md:grid-cols-2">
                {pillars.map(p => (
                  <li key={p.id} className="rounded border px-3 py-2">
                    <div className="font-medium">{p.name}</div>
                    {p.desc ? <div className="text-sm text-gray-600">{p.desc}</div> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border bg-white p-4">
            <h3 className="text-base font-medium mb-2">System Prompt (preview)</h3>
            <pre className="whitespace-pre-wrap text-xs bg-gray-50 border rounded p-3 max-h-72 overflow-auto">{prompt}</pre>
            <div className="mt-2">
              <button
                onClick={async () => (await copy(prompt)) ? setToast("Copied system prompt") : setToast("Copy failed")}
                className="rounded border px-3 py-2 text-sm"
              >
                Copy system prompt
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}