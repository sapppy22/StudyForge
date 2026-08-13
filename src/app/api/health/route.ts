import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

/**
 * Liveness endpoint.
 *
 * The shallow check deliberately touches nothing: it exists so the Cloudflare
 * cron pinger can keep Render's free instance from idling out without opening a
 * database connection every ten minutes.
 *
 * `?deep=1` additionally round-trips the database, for use by an uptime monitor
 * that should actually page when Postgres is unreachable.
 */

// Never cached — a cached 200 would make the health check meaningless.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const deep = new URL(request.url).searchParams.get("deep") === "1";

  if (!deep) {
    return NextResponse.json({
      status: "ok",
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  }

  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      database: { reachable: true, latencyMs: Date.now() - startedAt },
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "degraded",
        database: {
          reachable: false,
          error: error instanceof Error ? error.message : "unknown",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

/** Uptime monitors often probe with HEAD; answer it without a body. */
export async function HEAD() {
  return new Response(null, { status: 200 });
}
