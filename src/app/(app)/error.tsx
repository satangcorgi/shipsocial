"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to your monitoring here if you add one later
    // eslint-disable-next-line no-console
    console.error("App error boundary:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl space-y-4 rounded-lg border bg-white p-6">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-gray-600">
        We hit an unexpected error while rendering this page.
        {error?.message ? (
          <>
            <br />
            <span className="text-red-700">Details:</span>{" "}
            <span className="text-gray-800">{error.message}</span>
          </>
        ) : null}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => reset()}
          className="rounded bg-gray-900 px-3 py-2 text-sm text-white"
        >
          Try again
        </button>
        <button
          onClick={() => (location.href = "/dashboard")}
          className="rounded border px-3 py-2 text-sm"
        >
          Go to Dashboard
        </button>
      </div>
      {error?.digest ? (
        <p className="text-xs text-gray-500">Error id: {error.digest}</p>
      ) : null}
    </div>
  );
}