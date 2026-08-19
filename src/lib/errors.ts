/**
 * Domain errors shared by the service layer.
 *
 * Services have no business knowing about HTTP, but the difference between
 * "you asked for something that isn't yours" and "we broke" is a domain fact,
 * not a transport one. Throwing these instead of a bare `Error` lets the API
 * layer answer 404 or 400 without matching on message text, and keeps genuine
 * faults falling through to a logged 500.
 */

/** The requested record does not exist, or does not belong to this user. */
export class NotFoundError extends Error {
  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

/** The request is well-formed but cannot be satisfied in the current state. */
export class InvalidStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidStateError";
  }
}

/**
 * Classifying a Prisma failure.
 *
 * The error surface differs by how the database is reached: connecting direct
 * gives a tidy `P1000`/`P1001` code, while going through Supabase's Supavisor
 * pooler reports the same conditions as bare messages with no code attached.
 * Both call sites that care — the API error translator and the guest sign-in
 * action — need the same answer, so the rules live here rather than being
 * written twice and drifting.
 */
function errorParts(error: unknown): { code: string; message: string } {
  const code = (error as { code?: unknown } | null)?.code;
  return {
    code: typeof code === "string" ? code : "",
    message: error instanceof Error ? error.message : "",
  };
}

/** The credentials in DATABASE_URL were rejected. */
export function isDatabaseAuthFailure(error: unknown): boolean {
  const { code, message } = errorParts(error);
  return (
    code === "P1000" ||
    /authentication failed|password authentication|SASL authentication/i.test(message)
  );
}

/** The database could not be reached, or dropped the connection. */
export function isDatabaseUnreachable(error: unknown): boolean {
  const { code, message } = errorParts(error);
  return (
    code === "P1001" ||
    code === "P1002" ||
    code === "P1017" ||
    /can't reach database|connection closed|connection refused|timed out/i.test(message)
  );
}

/** Either of the above — the database is unusable, whatever the reason. */
export function isDatabaseUnavailable(error: unknown): boolean {
  return isDatabaseAuthFailure(error) || isDatabaseUnreachable(error);
}
