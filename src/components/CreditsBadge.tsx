"use client";

import { useEffect, useState } from "react";
import { DAILY_LIMIT, etaString, readCredits } from "@/lib/credits";

export default function CreditsBadge() {
  const [left, setLeft] = useState<number>(DAILY_LIMIT);
  const [eta, setEta] = useState<string>(etaString());

  useEffect(() => {
    function pull() {
      const s = readCredits();
      setLeft(s.left);
      setEta(etaString());
    }
    pull();
    const id = setInterval(pull, 30_000); // refresh every 30s
    return () => clearInterval(id);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-4 w-4 text-indigo-600"
        fill="currentColor"
      >
        <path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm1 10.59 3.3 3.3-1.41 1.41L11 13V7h2v5.59Z" />
      </svg>
      <span className="font-medium">{left}</span>
      <span className="text-gray-500">/ {DAILY_LIMIT} · resets in {eta}</span>
    </div>
  );
}
