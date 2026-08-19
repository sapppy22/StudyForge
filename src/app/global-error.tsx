"use client";

import { useEffect } from "react";
import "./globals.css";

/**
 * The boundary of last resort.
 *
 * `error.tsx` inside a route group cannot catch a throw from that group's own
 * layout, and nothing above it existed — so a failure in the dashboard layout
 * fell through to Next's built-in page and the user got a blank document with
 * nothing but a title. This replaces the root layout entirely when that
 * happens, which is why it renders its own <html> and <body>.
 *
 * The theme provider is gone at this point too, so `.dark` is never on the
 * document: the palette is re-declared from the OS preference instead of
 * inherited.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        <style>{`
          @media (prefers-color-scheme: dark) {
            :root {
              --background: oklch(0.13 0.012 152);
              --foreground: oklch(0.95 0.012 152);
              --muted-foreground: oklch(0.72 0.03 152);
              --primary: oklch(0.78 0.19 152);
              --primary-foreground: oklch(0.14 0.03 152);
              --border: oklch(0.85 0.15 152 / 14%);
            }
          }
        `}</style>

        <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
          <div
            aria-hidden
            className="flex size-11 items-center justify-center rounded-lg border border-border"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-semibold">StudyForge couldn&apos;t load</h1>
            <p className="text-sm text-muted-foreground">
              Something failed before the page could render. This is usually
              temporary — retrying often works.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Try again
            </button>
            <a
              href="/"
              className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              Go home
            </a>
          </div>

          {error.digest && (
            <p className="font-mono text-xs text-muted-foreground">
              Reference: {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
