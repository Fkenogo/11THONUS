/**
 * `users/{userId}.displayName` repository (`IDENTITY-PROFILE-A`, per the
 * Founder disposition `FD-IDENTITY-DISPLAY-001`).
 *
 * Deliberately does not round-trip through `toUserDocument`/`fromUserDocument`
 * (`userDocument.ts`) — that converter serializes exactly the `-01`
 * `CustomerIdentity` aggregate's own fields and does not carry `displayName`
 * at all (TRD10 §10.6.1 reserves `displayName` on the same `users` document,
 * but the `-01` aggregate was deliberately scoped narrower). Reusing that
 * full-document round-trip for a single additive field would risk silently
 * dropping `displayName` on any future write that goes through it — this
 * repository instead performs a targeted `transaction.update()` of exactly
 * one field (mirroring `identityLifecycleRepository.ts`'s own
 * `transaction.update(ref, { status, ...stampUpdate(...) })` precedent),
 * and reads it directly off the raw document, never through the narrower
 * domain type.
 *
 * `setDisplayName`'s idempotency + transaction orchestration mirrors this
 * same file family's own `createCustomerIdentity` precedent
 * (`customerIdentityRepository.ts`) rather than `permissions`' Business-scoped
 * `authorizeAndExecute` (`ENG-P2-004`) — that evaluator resolves
 * `(userId, businessId, permission)` Business authority, which does not
 * apply here: this command has no Business context, and its only authority
 * rule ("the caller may only write their own record") is already satisfied
 * by every caller of this module always supplying its own resolved
 * `customerIdentityId` (never a client-supplied target — see
 * `authenticatedIdentityActor.ts`).
 *
 * Fail-closed existence/integrity: reuses `getCustomerIdentityById` (which
 * already throws `RESOURCE_NOT_FOUND` for a missing document and
 * `VALIDATION_FAILED` for a malformed one) as the target-identity check
 * before reading or writing `displayName` — no new integrity logic is
 * invented here.
 */

import type { Firestore } from "firebase-admin/firestore";
import {
  checkAndReserveIdempotencyKey,
  completeIdempotencyKey,
  failIdempotencyKey,
} from "../../../shared/idempotency/idempotencyService";
import { stampUpdate } from "../../../shared/metadata/baseMetadata";
import { normalizeDisplayName } from "../models/displayName";
import { IdentityDomainError } from "../models/identityErrors";
import { getCustomerIdentityById } from "./customerIdentityRepository";

const COLLECTION = "users";
const OPERATION_TYPE = "identity.setDisplayName";

export type DisplayNameReadResult = { displayName?: string };

function extractDisplayName(data: unknown): string | undefined {
  const value = (data as { displayName?: unknown } | undefined)?.displayName;
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/**
 * Reads the caller's own Display Name. Fails closed identically to
 * `getCustomerIdentityById` for a missing or malformed target identity
 * (`RESOURCE_NOT_FOUND`/`VALIDATION_FAILED`) — this function performs no
 * authorization itself; the caller must already know `customerIdentityId`
 * is the authenticated caller's own id.
 */
export async function readDisplayName(
  db: Firestore,
  customerIdentityId: string,
): Promise<DisplayNameReadResult> {
  await getCustomerIdentityById(db, customerIdentityId);
  const snapshot = await db.collection(COLLECTION).doc(customerIdentityId).get();
  return { displayName: extractDisplayName(snapshot.data()) };
}

export type SetDisplayNameParams = {
  /** Server-derived Customer Identity id of the caller — never client-supplied. */
  customerIdentityId: string;
  displayName: string;
  idempotencyKey: string;
  correlationId: string;
};

export type SetDisplayNameResult = { displayName: string };

/**
 * Creates/updates the caller's own Display Name. Validates and normalizes
 * (trim, 1-50 chars, `FD-IDENTITY-DISPLAY-001` §5) before ever reserving
 * the idempotency key, so a request that fails validation never reserves
 * or consumes an idempotency key at all. The write itself is a targeted
 * `transaction.update()` of exactly `displayName`/`updatedAt`/`updatedBy`
 * — never a full-document `.set()`, so no unrelated `users` field
 * (`status`, `authenticationReferences`, `trustReference`, or any other)
 * can be dropped.
 */
export async function setDisplayName(
  db: Firestore,
  params: SetDisplayNameParams,
): Promise<SetDisplayNameResult> {
  const normalized = normalizeDisplayName(params.displayName);
  const requestHash = `${OPERATION_TYPE}:${params.customerIdentityId}:${normalized}`;

  const reservation = await checkAndReserveIdempotencyKey(db, {
    idempotencyKey: params.idempotencyKey,
    operationType: OPERATION_TYPE,
    actorId: params.customerIdentityId,
    requestHash,
    correlationId: params.correlationId,
  });

  if (reservation.outcome === "duplicate") {
    return reservation.record.responseSnapshot as SetDisplayNameResult;
  }
  if (reservation.outcome === "in_progress") {
    throw new IdentityDomainError(
      "IDEMPOTENCY_CONFLICT",
      `Display name update for idempotency key "${params.idempotencyKey}" is already in progress.`,
    );
  }
  if (reservation.outcome === "conflict") {
    throw new IdentityDomainError(
      reservation.error.code,
      reservation.error.messageKey,
      reservation.error.fieldErrors,
    );
  }

  try {
    await db.runTransaction(async (transaction) => {
      // Fail-closed existence/integrity check inside the same transaction
      // that performs the write — mirrors `getCustomerIdentityById`'s own
      // transaction-bound read seam.
      await getCustomerIdentityById(db, params.customerIdentityId, transaction);
      const ref = db.collection(COLLECTION).doc(params.customerIdentityId);
      transaction.update(ref, {
        displayName: normalized,
        ...stampUpdate(params.customerIdentityId),
      });
    });

    const result: SetDisplayNameResult = { displayName: normalized };
    await completeIdempotencyKey(
      db,
      params.idempotencyKey,
      `${COLLECTION}/${params.customerIdentityId}`,
      result,
    );
    return result;
  } catch (error) {
    await failIdempotencyKey(db, params.idempotencyKey);
    throw error;
  }
}
