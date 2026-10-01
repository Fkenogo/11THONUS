/**
 * Failure classification for the held-Purchase processor (`WP-COM-06a`).
 *
 * One Purchase's failure must never abort its Business pass, and one Business's failure must
 * never abort a recovery run. This module decides what a thrown error MEANS for the pass:
 *
 *   concurrent_winner -- another worker/path already moved this Purchase. NOT a failure: the
 *       work is done. The processor CONFIRMS this with a fresh read (the Purchase is no longer
 *       `pending_admission`); if it is still pending the state error is an invariant breach and
 *       is reclassified `permanent`.
 *   transient         -- contention or infrastructure that a retry can clear: deadlock,
 *       serialization failure, lock timeout, statement timeout, connection loss, connection
 *       exhaustion, an admission key still held by another transaction. Retried once in-run,
 *       then left `pending_admission` for the next run.
 *   permanent         -- retrying the same Purchase cannot succeed until a person or a code fix
 *       intervenes: constraint/invariant violations, invalid persistent data, any error that is
 *       not recognised. Not retried in-run, logged at error severity, counted, and the pass
 *       moves on. (The Purchase is still re-examined by later runs, since it stays held.)
 *
 * Unrecognised errors are `permanent` on purpose: fail loud, never silently treated as benign.
 */

import { PurchaseDomainError } from "../models/purchaseErrors";

export type AdmissionFailureClass = "concurrent_winner" | "transient" | "permanent";

export type ClassifiedAdmissionFailure = {
  readonly failureClass: AdmissionFailureClass;
  /** Stable, secret-free code for logs and counters. */
  readonly code: string;
};

/** PostgreSQL SQLSTATEs a retry can clear. */
const TRANSIENT_SQLSTATES: ReadonlyMap<string, string> = new Map([
  ["40001", "SERIALIZATION_FAILURE"],
  ["40P01", "DEADLOCK_DETECTED"],
  ["55P03", "LOCK_NOT_AVAILABLE"],
  ["57014", "STATEMENT_TIMEOUT"],
  ["53300", "TOO_MANY_CONNECTIONS"],
  ["57P01", "ADMIN_SHUTDOWN"],
  ["57P03", "CANNOT_CONNECT_NOW"],
]);

const TRANSIENT_NODE_CODES: ReadonlySet<string> = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EPIPE",
]);

export function classifyAdmissionFailure(error: unknown): ClassifiedAdmissionFailure {
  if (error instanceof PurchaseDomainError) {
    if (error.category === "INVALID_STATE_TRANSITION") {
      return { failureClass: "concurrent_winner", code: "CONCURRENT_STATE_CHANGE" };
    }
    if (error.category === "TEMPORARY_UNAVAILABLE") {
      return { failureClass: "transient", code: "ADMISSION_KEY_IN_PROGRESS" };
    }
    return { failureClass: "permanent", code: error.category };
  }
  const code = (error as { code?: unknown } | null)?.code;
  if (typeof code === "string") {
    const transient = TRANSIENT_SQLSTATES.get(code);
    if (transient !== undefined) return { failureClass: "transient", code: transient };
    if (code.startsWith("08") || TRANSIENT_NODE_CODES.has(code)) {
      return { failureClass: "transient", code: "CONNECTION_FAILURE" };
    }
    if (code.startsWith("23")) {
      return { failureClass: "permanent", code: `CONSTRAINT_${code}` };
    }
    return { failureClass: "permanent", code: `DB_${code}` };
  }
  const message = error instanceof Error ? error.message : "";
  if (/timeout exceeded when trying to connect|Connection terminated/i.test(message)) {
    return { failureClass: "transient", code: "CONNECTION_FAILURE" };
  }
  return { failureClass: "permanent", code: "UNCLASSIFIED" };
}
