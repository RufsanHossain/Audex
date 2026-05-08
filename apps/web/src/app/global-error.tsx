"use client";

// Next.js routes uncaught client-side errors at the top of the tree to
// this file. We forward the error to Sentry and render a minimal recovery
// UI — the surrounding `<html>` / `<body>` are required because this
// replaces the entire document.

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
