import Link from "next/link";
import React from "react";

/**
 * Reusable marketing card (11x.ai style)
 * Props: { icon, title, body, href? }
 */
export default function UseCaseCard({
  icon,
  title,
  body,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  href?: string;
}) {
  return (
    <article
      className="group relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition
                 hover:-translate-y-0.5 hover:shadow-md focus-within:shadow-md"
    >
      {/* 40px icon row */}
      <div className="mb-4 h-10 w-10 flex items-center justify-center rounded-md bg-gray-50 ring-1 ring-gray-200">
        {/* decorative icon; title provides context for screen readers */}
        <span aria-hidden="true" className="text-gray-700">
          {icon}
        </span>
        <span className="sr-only">Icon for {title}</span>
      </div>

      <h3 className="text-[18px] font-semibold leading-snug text-gray-900">{title}</h3>
      <p className="mt-2 line-clamp-4 text-[13px] leading-5 text-gray-600">{body}</p>

      {href ? (
        <div className="mt-3">
          <Link
            href={href}
            className="text-sm font-medium text-gray-700 underline decoration-gray-300 underline-offset-4
                       hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300
                       rounded"
          >
            Learn more
          </Link>
        </div>
      ) : null}
    </article>
  );
}