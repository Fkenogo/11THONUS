/**
 * `ENG-P2-004C` — permission-decision audit service.
 *
 * The integration seam between a completed 004B `AuthorizationDecision`
 * and durable, privacy-safe audit evidence — never coupled into the
 * pure evaluator (`evaluator/evaluatePermission.ts`) or its orchestrator
 * (`service/evaluatePermissionService.ts`), neither of which this module
 * imports from in the write direction (004B has zero knowledge of
 * 004C).
 *
 * **Which decisions are audited (design §7.1):** every decision — allow
 * or deny — on a **sensitive** permission (004A's
 * `isSensitivePermission`, re-checked here independently of any
 * caller-supplied flag, §9 abuse-case discipline: never trust a caller's
 * "please audit this" assertion). Non-sensitive decisions are a no-op —
 * no persisted permission-decision audit record, matching design §7.1's
 * "not all actions" scope (ordinary structured logging elsewhere covers
 * them, out of this package's scope).
 *
 * **Accountability requires an accountable identity.** A decision with
 * no resolvable subject (`request.userId` blank — 004B's `NO_SUBJECT`
 * path) is also a no-op: the Identity-Accountability Principle (design
 * §2.A.6) requires every audit record to identify "the accountable
 * identity"; there is none to attribute an anonymous/unauthenticated
 * attempt to. Documented interpretation, not a silently invented
 * exception — every other early-denial reason still has an identifiable
 * actor and is audited normally.
 *
 * **Transaction composition (AD-3, design §7.2's consistency-boundary
 * clarification; Phase K).** The core `recordSensitiveDecision` function
 * accepts a Firestore `Transaction` as its first parameter — mirroring
 * `writeOutboxEntry` itself — rather than opening its own transaction
 * (unlike AUTH-08's own `enqueueOnce`, which stands alone because
 * AUTH-08 has no larger command transaction to join). This is
 * deliberately *stronger* than AUTH-08's own precedent: AD-3 requires
 * the audit write to land in the *same* transaction as the protected
 * command's state change, and 004C has no real protected command yet
 * (004D owns that) — designing the primary API to accept an existing
 * transaction is what lets a future 004D command compose this call
 * alongside its own writes with zero redesign.
 *
 * `recordSensitiveDecision` performs its own `transaction.get` existence
 * check before writing (async, hence `Promise`-returning) so that a
 * retried invocation of the whole protected-command transaction — e.g.
 * a client retry after a timeout, reusing the same idempotency key —
 * can never reset an already-`processing`/`completed` outbox entry back
 * to `pending`. Firestore requires all reads in a transaction to precede
 * all writes; **callers composing this into their own transaction must
 * call and `await` `recordSensitiveDecision` before performing any of
 * their own transaction writes.** `recordSensitiveDecisionStandalone`
 * now delegates directly to this same core function inside its own
 * `runTransaction` call — it is a thin test-only convenience for 004C's
 * own verification, where no real protected-command transaction exists
 * yet, not a distinct code path.
 */

import type { Firestore, Transaction } from "firebase-admin/firestore";
import { outboxEntryRef, writeOutboxEntry } from "../../../shared/outbox/outboxWriter";
import { isSensitivePermission } from "../models/sensitivePermissionCatalogue";
import { mapReasonCodeToDecisionSource } from "../models/permissionAuditEvent";
import { buildPermissionDecisionRecordedEvent } from "../events/permissionAuditEventFactory";
import type { AuthorizationDecision, AuthorizationRequest } from "../evaluator/types";

export type RecordSensitiveDecisionParams = {
  readonly decision: AuthorizationDecision;
  readonly request: AuthorizationRequest;
  /** The specific membership evaluated, when 004B/the caller resolved one (design §7.3). */
  readonly membershipId?: string;
  /** The caller's (future protected command's) own idempotency key — the event-identity input. */
  readonly idempotencyKey: string;
};

export type RecordSensitiveDecisionOutcome =
  | { readonly recorded: true; readonly written: boolean; readonly eventId: string }
  | { readonly recorded: false };

function isAccountableDecision(request: AuthorizationRequest): boolean {
  return typeof request.userId === "string" && request.userId.trim().length > 0;
}

/**
 * Core, transaction-accepting entry point. No-ops (does not call
 * `transaction.set`) for a non-sensitive permission or an
 * unaccountable (no-subject) decision — callers must not branch on
 * sensitivity themselves; this function is the single source of truth
 * for "should this decision be audited."
 *
 * Async: performs a `transaction.get` existence check before writing,
 * so a retried invocation reusing the same idempotency key can never
 * reset an already-`processing`/`completed` outbox entry back to
 * `pending` (Phase J). Firestore requires all transaction reads to
 * precede all transaction writes — callers MUST `await` this call
 * before issuing any of their own writes on the same transaction.
 */
export async function recordSensitiveDecision(
  transaction: Transaction,
  db: Firestore,
  params: RecordSensitiveDecisionParams,
  now: Date,
): Promise<RecordSensitiveDecisionOutcome> {
  if (!isSensitivePermission(params.request.permission)) {
    return { recorded: false };
  }
  if (!isAccountableDecision(params.request)) {
    return { recorded: false };
  }

  const event = buildPermissionDecisionRecordedEvent({
    actorUserId: params.request.userId,
    businessId: params.request.businessId,
    membershipId: params.membershipId,
    permission: params.request.permission,
    result: params.decision.allowed ? "allow" : "deny",
    decisionSource: mapReasonCodeToDecisionSource(params.decision.reasonCode),
    effectiveRole: params.decision.role,
    reasonCode: params.decision.reasonCode,
    idempotencyKey: params.idempotencyKey,
    occurredAt: now.toISOString(),
  });

  const ref = outboxEntryRef(db, event.eventId);
  const existing = await transaction.get(ref);
  if (existing.exists) {
    return { recorded: true, written: false, eventId: event.eventId };
  }

  writeOutboxEntry(transaction, db, event);

  return { recorded: true, written: true, eventId: event.eventId };
}

/**
 * Test-only standalone wrapper — opens its own transaction (mirroring
 * AUTH-08's `enqueueOnce`) and delegates to `recordSensitiveDecision`
 * for 004C's own verification, where no real protected-command
 * transaction exists yet. 004D composes `recordSensitiveDecision`
 * directly inside its own transaction instead of using this wrapper.
 */
export async function recordSensitiveDecisionStandalone(
  db: Firestore,
  params: RecordSensitiveDecisionParams,
  now: Date = new Date(),
): Promise<RecordSensitiveDecisionOutcome> {
  return db.runTransaction((transaction) => recordSensitiveDecision(transaction, db, params, now));
}
