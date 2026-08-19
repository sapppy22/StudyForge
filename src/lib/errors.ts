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
