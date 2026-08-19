import { NextResponse } from "next/server";
import * as z from "zod";
import type { User } from "@supabase/supabase-js";
import { getApiUser } from "@/lib/session";
import {
  InvalidStateError,
  NotFoundError,
  isDatabaseUnavailable,
} from "@/lib/errors";

/**
 * Shared plumbing for Route Handlers.
 *
 * Every handler used to repeat the same three lines of auth, return its own
 * ad-hoc `{ error }` shape, and — in most cases — let anything thrown escape as
 * an unhandled rejection, which Next turns into a bare 500 with no log and no
 * usable body. `withUser` centralises that: authenticate once, run the handler,
 * and translate whatever comes back (or is thrown) into one response shape.
 *
 * Handlers return plain data and it gets JSON-encoded, or they return a
 * `Response` directly when they need control (streaming, redirects, a custom
 * status). To fail with a specific status they throw `ApiError`, which is the
 * only error kind reported to the client verbatim — everything else is logged
 * server-side and answered with a generic message, so internals and stack
 * traces never reach the network.
 */

/** An error whose message is safe to show the caller. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const badRequest = (message: string) => new ApiError(400, message);
export const forbidden = (message = "Forbidden") => new ApiError(403, message);
export const notFound = (message = "Not found") => new ApiError(404, message);
export const conflict = (message: string) => new ApiError(409, message);

/** The single error shape every route answers with. */
function errorResponse(message: string, status: number, extra?: object) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/**
 * Maps a thrown value onto a status and a client-safe message.
 *
 * Database configuration failures are called out specifically: they are by far
 * the most common cause of a 500 here and are indistinguishable from a code bug
 * unless named. They answer 503 because they are transient from the caller's
 * point of view.
 */
function translateError(error: unknown): { status: number; message: string; extra?: object } {
  if (error instanceof ApiError) {
    return { status: error.status, message: error.message };
  }

  // Domain errors carry a message written for the user, so they pass through.
  if (error instanceof NotFoundError) {
    return { status: 404, message: error.message };
  }
  if (error instanceof InvalidStateError) {
    return { status: 400, message: error.message };
  }

  if (error instanceof z.ZodError) {
    return {
      status: 400,
      message: "Invalid request body.",
      extra: { issues: z.flattenError(error).fieldErrors },
    };
  }

  const code = (error as { code?: unknown } | null)?.code;

  // Prisma's known request errors. P2025 is "record not found", P2002 a unique
  // constraint, P2003 a foreign key — all caller-visible conditions rather than
  // server faults.
  if (code === "P2025") return { status: 404, message: "Not found." };
  if (code === "P2002") return { status: 409, message: "That already exists." };
  if (code === "P2003") {
    return { status: 409, message: "That references something which no longer exists." };
  }

  if (isDatabaseUnavailable(error)) {
    return { status: 503, message: "The database is unavailable. Try again shortly." };
  }

  return { status: 500, message: "Something went wrong. Try again." };
}

interface HandlerContext<TParams> {
  user: User;
  request: Request;
  params: TParams;
}

type Handler<TParams> = (context: HandlerContext<TParams>) => Promise<unknown>;

/**
 * Wraps a Route Handler with authentication and error translation.
 *
 * The returned function keeps the `(request, context)` signature Next expects,
 * including the promised `params` of a dynamic segment, so it drops straight
 * into an existing `export async function GET = ...` position.
 */
export function withUser<TParams = Record<string, never>>(handler: Handler<TParams>) {
  return async function handle(
    request: Request,
    context?: { params: Promise<TParams> }
  ): Promise<Response> {
    try {
      const user = await getApiUser();
      if (!user) return errorResponse("Unauthorized", 401);

      const params = ((await context?.params) ?? {}) as TParams;
      const result = await handler({ user, request, params });

      // A handler that built its own Response gets out of the way untouched.
      if (result instanceof Response) return result;
      return NextResponse.json(result ?? { ok: true });
    } catch (error) {
      const { status, message, extra } = translateError(error);
      // 4xx is the caller's problem and already described by the response; 5xx
      // is ours and is the only thing worth the log noise.
      if (status >= 500) {
        console.error(`[api] ${request.method} ${new URL(request.url).pathname}`, error);
      }
      return errorResponse(message, status, extra);
    }
  };
}

/**
 * Parses and validates a JSON request body, throwing `ApiError(400)` when the
 * body is not JSON at all and letting `ZodError` through for schema failures so
 * the caller gets per-field messages.
 */
export async function readJson<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw badRequest("Expected a JSON body.");
  }
  return schema.parse(body);
}

/** Validates `?query=params` against a schema, reporting failures as 400s. */
export function readQuery<T>(request: Request, schema: z.ZodType<T>): T {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  return schema.parse(params);
}
