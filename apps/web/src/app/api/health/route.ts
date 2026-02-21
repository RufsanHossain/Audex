import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface HealthResponse {
  status: "ok" | "degraded";
  timestamp: string;
  version: string;
  uptime: number;
}

export function GET(): NextResponse<HealthResponse> {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env["npm_package_version"] ?? "0.0.0",
    uptime: process.uptime(),
  });
}
