import Link from "next/link";
import UseCaseCard from "@/components/UseCaseCard";

function IconDoc() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M9 12h6M9 16h6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 2v4M16 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}
function IconSpark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}
function IconVoice() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}
function IconExport() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 3v12m0 0l-4-4m4 4l4-4" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="4" y="15" width="16" height="6" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}
function IconShield() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 3l7 3v6a9 9 0 0 1-7 8 9 9 0 0 1-7-8V6l7-3z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M9.5 12l2 2 3-4" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

export default function HomePage() {
  return (
    <main>
      {/* Simple hero header (kept minimal) */}
      <section className="px-6 py-16 md:py-20 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900">
            ShipSocial — daily, on-brand posts without the busywork
          </h1>
          <p className="mt-3 max-w-2xl text-gray-600">
            Onboard once, get a living voice card, generate useful posts, and schedule
            across platforms. Value first. Consistency that compounds.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/onboarding" className="rounded bg-gray-900 px-4 py-2 text-white text-sm">
              Get started
            </Link>
            <Link href="/dashboard" className="rounded border px-4 py-2 text-sm">
              View dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* --- Use Cases (11x.ai style) --- */}
      <section aria-labelledby="use-cases-heading" className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <header className="mb-8">
            <h2 id="use-cases-heading" className="text-2xl font-semibold text-gray-900">
              Use Cases
            </h2>
            <p className="mt-1 text-gray-600">
              Six ways teams use ShipSocial to stay consistent and useful.
            </p>
          </header>

          {/* 3 / 2 / 1 columns with uniform gaps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <UseCaseCard
              icon={<IconSpark />}
              title="Daily autoposting"
              body="Queue 30 days of research-backed posts in minutes. We pick times inside your smart windows with gentle randomness."
              href="/posts"
            />
            <UseCaseCard
              icon={<IconVoice />}
              title="Voice cloning"
              body="Onboard with tone, do/don’t, phrases, and proof points. The voice card keeps drafts consistent without sounding generic."
              href="/voice"
            />
            <UseCaseCard
              icon={<IconDoc />}
              title="Pillar planning"
              body="Define 3–5 pillars like Tutorials or Proof Stories. Generators rotate pillars to avoid repetition and keep value high."
              href="/pillars"
            />
            <UseCaseCard
              icon={<IconCalendar />}
              title="Auto-scheduling windows"
              body="Set per-platform windows (e.g., 09:30–11:00) and a timezone. Posts land at varied times with collision-safe jitter."
              href="/schedule"
            />
            <UseCaseCard
              icon={<IconExport />}
              title="Buffer / Planner handoff"
              body="Download a clean CSV with titles, bodies, UTM links, alt text, and platform-sized SVG assets — ready for import."
              href="/exports"
            />
            <UseCaseCard
              icon={<IconShield />}
              title="Review first or go hands-off"
              body="Choose manual review or automatic posting later via n8n. Credits and logs keep control without slowing you down."
              href="/dashboard/week"
            />
          </div>
        </div>
      </section>
    </main>
  );
}