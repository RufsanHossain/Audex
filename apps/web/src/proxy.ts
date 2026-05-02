import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

/**
 * Next.js Edge Proxy (renamed from `middleware` in Next 16).
 *
 * Runs on every matched request at the edge.
 * Auth.js session check will be added in later steps.
 * For now, just pass through with security headers.
 */
export function proxy(_request: NextRequest) {
  const response = NextResponse.next();

  // Add request ID for tracing
  const requestId = crypto.randomUUID();
  response.headers.set("x-request-id", requestId);

  return response;
}

export const config = {
  // Match all routes except static files and Next.js internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
