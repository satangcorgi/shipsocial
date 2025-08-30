"use client";

import { useEffect, useState } from "react";
import { DAILY_LIMIT, etaString, readCredits } from "@/lib/credits";

export default function CreditsBadge() {
  const [left, setLeft] = useState<number>(DAILY_LIMIT);
  const [resetAt, setResetAt] = useState<number>(0);

  useEffect(() => {
    function pull() {
      const s = readCredits();
      setLeft(s.left);
      setResetAt(s.resetAt);
    }
    pull();
    const id = setInterval(pull, 30_000); // refresh every 30s
    return () => clearInterval(id);
  }, []);

  return (
    <span
      title={`Resets in ${etaString(resetAt) || "—"}`}
      className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs"
    >
      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
      <span className="font-medium">{left}</span>
      <span className="opacity-60">/ {DAILY_LIMIT} credits</span>
    </span>
  );
}