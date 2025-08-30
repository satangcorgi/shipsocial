"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import CreditsBadge from "@/components/CreditsBadge";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/week", label: "Week" },
  { href: "/onboarding", label: "Onboarding" },
  { href: "/voice", label: "Voice" },
  { href: "/pillars", label: "Pillars" },
  { href: "/posts", label: "Posts" },
  { href: "/schedule", label: "Schedule" },
  { href: "/exports", label: "Exports" },
  { href: "/settings", label: "Settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Active when exact match OR the URL starts with "<href>/" (prevents /dashboard from matching /dashboard/week)
  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + "/");

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 antialiased">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden md:flex md:w-60 shrink-0 border-r bg-white flex-col">
          <div className="p-4 border-b">
            <Link href="/" className="block text-lg font-semibold">
              ShipSocial
            </Link>
            <div className="mt-2 text-xs text-gray-500">Consistency engine</div>
          </div>
          <nav className="p-2">
            <ul className="space-y-1">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={[
                      "block rounded px-3 py-2 text-sm",
                      isActive(item.href)
                        ? "bg-gray-900 text-white"
                        : "hover:bg-gray-100 text-gray-700",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-auto p-4 border-t">
            <CreditsBadge />
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-x-hidden">
          {/* Top bar (mobile) */}
          <div className="md:hidden sticky top-0 z-10 border-b bg-white px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-base font-semibold">
              ShipSocial
            </Link>
            <CreditsBadge />
          </div>

          {/* Global page padding + centered container + generous bottom space */}
          <div className="p-4 md:p-6">
            <div className="mx-auto max-w-6xl pb-24">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}