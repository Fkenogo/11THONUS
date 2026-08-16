/**
 * Authorization-boundary integration service (`ENG-P2-004D`).
 *
 * The stable gate a protected command uses to compose: a trusted 004B
 * evaluation, a 004C sensitive-decision audit write, and its own
 * protected-state mutation — all inside one Firestore transaction, with
 * no evaluate-then-mutate gap (design §10.8/§6.13, TOCTOU) and no client-
 * controlled authorization result.
 *
 * **Trusted-decision boundary (Phase D).** This module's public API
 * (`AuthorizeAndExecuteParams`) has no field of type `AuthorizationDecision`,
 * `role`, `reasonCode`, or any decision-shaped value — the only decision
 * that ever exists in a call is the one `evaluatePermissionWithContext`
 * computes internally, inside the transaction, from trusted `(userId,
 * businessId, permission)` inputs. A caller cannot submit `allow: true`
 * (or any other decision field) and have it treated as authority; there
 * is no parameter through which to do so. `mutation.apply` *receives*
 * the computed decision (read-only, for the caller's own use, e.g. to
 * stamp `role` on an audit-adjacent field) but cannot influence it.
 *
 * **Reads-before-writes (Phase C correction, Founder-approved).** Firestore
 * requires every transaction read to precede every transaction write.
 * The sequence below is strict:
 *   1. authorization reads + evaluation (`evaluatePermissionWithContext`);
 *   2. protected-resource reads/preparation (`mutation.prepare`), only
 *      when the decision allows — skipped entirely on deny, so a denied
 *      request never touches protected-resource state;
 *   3. audit idempotency read + conditional write
 *      (`recordSensitiveDecision` — itself does a read then a write,
 *      always the last read and, for a sensitive permission, the first
 *      write);
 *   4. protected mutation write(s) (`mutation.apply`), write-only —
 *      `apply` receives a `TransactionWriter`, not the full
 *      `Transaction`, so it has no `.get` to accidentally call after
 *      `recordSensitiveDecision` has started writing.
 *
 * **Sensitive DENY (Phase L).** `recordSensitiveDecision` is called
 * unconditionally (it no-ops for non-sensitive/unaccountable decisions
 * internally — 004C's own documented contract, not re-implemented
 * here). On deny, `mutation.apply` is never invoked, so a sensitive-deny
 * transaction commits an audit-only entry (payload `result: "deny"`,
 * 004C) with no protected mutation, never both.
 *
 * **Client-retry idempotency.** Wraps the whole transaction with the
 * shared `checkAndReserveIdempotencyKey`/`completeIdempotencyKey`/
 * `failIdempotencyKey` pattern — the same shape
 * `identityLifecycleRepository.transitionCustomerIdentityStatus`
 * already uses, reused unchanged. Firestore's own transaction retry (on
 * write contention) is separate and orthogonal — the transaction body
 * re-runs deterministically from the same trusted reads regardless.
 */

import type { Firestore, Transaction } from "firebase-admin/firestore";
import {
  checkAndReserveIdempotencyKey,
  completeIdempotencyKey,
  failIdempotencyKey,
} from "../../../shared/idempotency/idempotencyService";
import { evaluatePermissionWithContext } from "./evaluatePermissionService";
import { recordSensitiveDecision } from "./permissionAuditService";
import type { AuthorizationDecision, AuthorizationRequest } from "../evaluator/types";

/** A write-only view of a `Transaction` — the only capability `mutation.apply` is given. */
export type TransactionWriter = Pick<Transaction, "set" | "update" | "delete" | "create">;

export type ProtectedMutation<TPrepared, TResult> = {
  /** Read-only phase. Runs only when the decision allows; never for a denied request. */
  prepare(
    transaction: Transaction,
    decision: AuthorizationDecision,
    membershipId: string | undefined,
  ): Promise<TPrepared> | TPrepared;
  /** Write-only phase. Runs only when the decision allows, strictly after the audit write. */
  apply(
    writer: TransactionWriter,
    prepared: TPrepared,
    decision: AuthorizationDecision,
    membershipId: string | undefined,
  ): TResult;
};

export type AuthorizeAndExecuteParams<TPrepared, TResult> = {
  readonly request: AuthorizationRequest;
  readonly idempotencyKey: string;
  readonly requestHash: string;
  readonly correlationId: string;
  readonly actorId: string;
  readonly mutation: ProtectedMutation<TPrepared, TResult>;
};

export type AuthorizeAndExecuteResult<TResult> =
  | {
      readonly outcome: "executed";
      readonly decision: AuthorizationDecision;
      readonly result: TResult;
    }
  | { readonly outcome: "denied"; readonly decision: AuthorizationDecision }
  | { readonly outcome: "duplicate" }
  | { readonly outcome: "in_progress" };

const OPERATION_TYPE_PREFIX = "permissions.authorizeAndExecute";

export async function authorizeAndExecute<TPrepared, TResult>(
  db: Firestore,
  params: AuthorizeAndExecuteParams<TPrepared, TResult>,
): Promise<AuthorizeAndExecuteResult<TResult>> {
  const reservation = await checkAndReserveIdempotencyKey(db, {
    idempotencyKey: params.idempotencyKey,
    operationType: `${OPERATION_TYPE_PREFIX}:${params.request.permission}`,
    actorId: params.actorId,
    requestHash: params.requestHash,
    correlationId: params.correlationId,
    businessId: params.request.businessId,
  });

  if (reservation.outcome === "duplicate") {
    return { outcome: "duplicate" };
  }
  if (reservation.outcome === "in_progress") {
    return { outcome: "in_progress" };
  }
  if (reservation.outcome === "conflict") {
    throw new AuthorizeAndExecuteError(reservation.error.code, reservation.error.messageKey);
  }

  try {
    const result = await db.runTransaction(async (transaction) => {
      // Phase 1 — authorization reads + evaluation (read-only, transaction-bound).
      const { decision, membership } = await evaluatePermissionWithContext(
        db,
        params.request,
        transaction,
      );
      const membershipId = membership.kind === "found" ? membership.membership.id : undefined;

      // Phase 2 — protected-resource reads/preparation (read-only), only when allowed.
      const prepared = decision.allowed
        ? await params.mutation.prepare(transaction, decision, membershipId)
        : undefined;

      // Phase 3 — audit idempotency read + conditional write. No-ops internally
      // for a non-sensitive permission or an unaccountable decision (004C).
      // Always the last read; for a sensitive permission, always the first write.
      await recordSensitiveDecision(
        transaction,
        db,
        {
          decision,
          request: params.request,
          membershipId,
          idempotencyKey: params.idempotencyKey,
        },
        new Date(),
      );

      // Phase 4 — protected mutation write(s), write-only, only when allowed.
      if (decision.allowed) {
        const writer: TransactionWriter = transaction;
        const mutationResult = params.mutation.apply(
          writer,
          prepared as TPrepared,
          decision,
          membershipId,
        );
        return { outcome: "executed" as const, decision, result: mutationResult };
      }
      return { outcome: "denied" as const, decision };
    });

    await completeIdempotencyKey(db, params.idempotencyKey);
    return result;
  } catch (error) {
    await failIdempotencyKey(db, params.idempotencyKey);
    throw error;
  }
}

export class AuthorizeAndExecuteError extends Error {
  constructor(
    readonly category: string,
    message: string,
  ) {
    super(message);
    this.name = "AuthorizeAndExecuteError";
  }
}
