/**
 * StudyForge keep-alive pinger.
 *
 * Render's free web service sleeps after ~15 minutes without traffic, and the
 * cold start that follows costs the next visitor the better part of a minute.
 * This Worker hits the app's health endpoint on a cron so the instance stays
 * warm.
 *
 * It deliberately does no retry-until-success loop: if the app is genuinely
 * down, hammering it does not help, and the next tick is only ten minutes away.
 * A single retry covers the common case where the request itself woke a
 * sleeping instance and timed out doing so.
 */

interface Env {
  PING_URL: string;
  DEEP_CHECK?: string;
}

interface PingResult {
  ok: boolean;
  status: number | null;
  durationMs: number;
  attempts: number;
  error?: string;
}

/** A sleeping instance can take ~50s to wake, so allow generous headroom. */
const TIMEOUT_MS = 60_000;
const MAX_ATTEMPTS = 2;

async function ping(env: Env): Promise<PingResult> {
  const url = env.DEEP_CHECK === "true"
    ? `${env.PING_URL}${env.PING_URL.includes("?") ? "&" : "?"}deep=1`
    : env.PING_URL;

  const startedAt = Date.now();
  let lastError = "";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { "user-agent": "studyforge-pinger/1.0 (+cloudflare-worker)" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      // Any response at all means the instance is awake, which is the point.
      // A 503 from the deep check is still a successful wake-up.
      return {
        ok: response.ok,
        status: response.status,
        durationMs: Date.now() - startedAt,
        attempts: attempt,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      // The first failure is usually the request that woke the instance
      // timing out. Give it one more go before reporting down.
    }
  }

  return {
    ok: false,
    status: null,
    durationMs: Date.now() - startedAt,
    attempts: MAX_ATTEMPTS,
    error: lastError,
  };
}

export default {
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    // waitUntil keeps the invocation alive for the full fetch, which can
    // outlast the scheduled handler's synchronous return.
    ctx.waitUntil(
      ping(env).then((result) => {
        // Structured so Workers Logs can be filtered on `ok`.
        console.log(JSON.stringify({ event: "ping", ...result }));
      })
    );
  },

  /** Manual trigger, for verifying the Worker without waiting for the cron. */
  async fetch(_request: Request, env: Env): Promise<Response> {
    const result = await ping(env);
    return Response.json(result, { status: result.ok ? 200 : 502 });
  },
};
