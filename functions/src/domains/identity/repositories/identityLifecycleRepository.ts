/**
 * `users` collection lifecycle repository (ENG-P2-001-06).
 *
 * Two transactional, idempotent operations against the `-05` persistence
 * foundation: `transitionCustomerIdentityStatus` (the general status
 * state-machine, reusing `-01`'s existing `transitionIdentityStatus`,
 * now extended to accept `authority`/`reason`) and
 * `recoverCustomerIdentityStatus` (the recovery boundary, reusing this
 * task's own `recoverCustomerIdentity`). Both follow the exact
 * idempotency/transaction pattern `-05`'s `customerIdentityRepository.ts`
 * established — no competing framework.
 *
 * `authority`/`reason` are NOT persisted as fields on `users/{id}`
 * (correction, Founder review of PR #61): a prior version of this file
 * wrote them as untyped raw fields directly on the mutable current-state
 * document, which (a) is not part of `UserDocument`'s typed contract,
 * (b) is invisible to `fromUserDocument`, and (c) would silently retain
 * only the most recent transition's value, discarding every earlier
 * transition's evidence. They are instead carried on the outbox/domain
 * event payload (`transitionIdentityStatus`/`buildIdentityRecoveredEvent`
 * in `customerIdentity.ts`/`identityLifecycleService.ts`) — the
 * append-only, replayable evidence trail TRD11 §11.8/§11.17 already
 * establishes for "what happened and why", with one entry per
 * transition, never overwritten.
 */

import type { Firestore } from "firebase-admin/firestore";
import {
  checkAndReserveIdempotencyKey,
  completeIdempotencyKey,
  failIdempotencyKey,
} from "../../../shared/idempotency/idempotencyService";
import { writeOutboxEntry } from "../../../shared/outbox/outboxWriter";
import { stampUpdate } from "../../../shared/metadata/baseMetadata";
import { toRecoveryProofReferenceDocument } from "./recoveryProofReferenceDocument";
import type { EventActor } from "../../../shared/events/domainEvent";
import { transitionIdentityStatus, type CustomerIdentity } from "../models/customerIdentity";
import type { IdentityStatus } from "../models/identityStatus";
import type { TransitionAuthority } from "../models/transitionAuthority";
import type { TransitionReason } from "../models/transitionReason";
import { validateRecoveryProof, type RecoveryProof } from "../models/recoveryProof";
import {
  IdentityDomainError,
  unknownCustomerIdentityError,
  staleIdentityStatusError,
  recoveryProofAlreadyUsedError,
} from "../models/identityErrors";
import { recoverCustomerIdentity } from "../services/identityLifecycleService";
import { fromUserDocument } from "./userDocument";
import { getCustomerIdentityById } from "./customerIdentityRepository";

const COLLECTION = "users";

export type TransitionCustomerIdentityStatusParams = {
  eventId: string;
  correlationId: string;
  actor: EventActor;
  occurredAt: string;
  customerIdentityId: string;
  toStatus: IdentityStatus;
  expectedCurrentStatus?: IdentityStatus;
  authority: TransitionAuthority;
  reason: TransitionReason;
  updatedAt: Date;
  updatedBy: string | null;
  idempotencyKey: string;
  requestHash: string;
};

export async function transitionCustomerIdentityStatus(
  db: Firestore,
  params: TransitionCustomerIdentityStatusParams,
): Promise<CustomerIdentity> {
  const reservation = await checkAndReserveIdempotencyKey(db, {
    idempotencyKey: params.idempotencyKey,
    operationType: "identity.transitionStatus",
    actorId: params.updatedBy ?? "system",
    requestHash: params.requestHash,
    correlationId: params.correlationId,
  });

  if (reservation.outcome === "duplicate") {
    return getCustomerIdentityById(db, params.customerIdentityId);
  }
  if (reservation.outcome === "in_progress") {
    throw new IdentityDomainError(
      "IDEMPOTENCY_CONFLICT",
      `Status transition for customer identity "${params.customerIdentityId}" is already in progress.`,
    );
  }
  if (reservation.outcome === "conflict") {
    throw new IdentityDomainError(
      reservation.error.code,
      reservation.error.messageKey,
      reservation.error.fieldErrors,
    );
  }

  const ref = db.collection(COLLECTION).doc(params.customerIdentityId);

  try {
    const identity = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) {
        throw unknownCustomerIdentityError(params.customerIdentityId);
      }

      const current = fromUserDocument(snapshot.data());

      if (
        params.expectedCurrentStatus !== undefined &&
        current.status !== params.expectedCurrentStatus
      ) {
        throw staleIdentityStatusError(
          params.customerIdentityId,
          params.expectedCurrentStatus,
          current.status,
        );
      }

      const { identity: updated, event } = transitionIdentityStatus(current, params.toStatus, {
        eventId: params.eventId,
        correlationId: params.correlationId,
        actor: params.actor,
        occurredAt: params.occurredAt,
        updatedAt: params.updatedAt,
        updatedBy: params.updatedBy,
        authority: params.authority,
        reason: params.reason,
      });

      transaction.update(ref, {
        status: updated.status,
        ...stampUpdate(params.updatedBy),
      });

      if (event) {
        writeOutboxEntry(transaction, db, event);
      }

      return updated;
    });

    await completeIdempotencyKey(db, params.idempotencyKey, `${COLLECTION}/${identity.id}`);
    return identity;
  } catch (error) {
    await failIdempotencyKey(db, params.idempotencyKey);
    throw error;
  }
}

const RECOVERY_PROOF_REFERENCES_COLLECTION = "recoveryProofReferences";

export type RecoverCustomerIdentityStatusParams = {
  eventId: string;
  correlationId: string;
  actor: EventActor;
  occurredAt: string;
  customerIdentityId: string;
  recoveryProof: RecoveryProof;
  recoveredAt: Date;
  recoveredBy: string | null;
  idempotencyKey: string;
  requestHash: string;
};

/**
 * Reuses this file's own idempotency conventions to reject *proof reuse*
 * — a distinct concern from *command retry*. An identical idempotency
 * key short-circuits above via `checkAndReserveIdempotencyKey` before
 * this collection is ever consulted, so a legitimate retry of the same
 * command never hits this check; only a genuinely different command
 * presenting an already-consumed proof reference does (ENG-P2-001-07).
 * The reservation document itself is built via
 * `toRecoveryProofReferenceDocument` (`stampCreate`-based, full
 * `BaseMetadata` shape — ENG-P2-ARCH-CORR-001), since this `.set()` only
 * ever executes on a document already confirmed not to exist.
 */
export async function recoverCustomerIdentityStatus(
  db: Firestore,
  params: RecoverCustomerIdentityStatusParams,
): Promise<CustomerIdentity> {
  validateRecoveryProof(params.recoveryProof, params.customerIdentityId, params.recoveredAt);

  const reservation = await checkAndReserveIdempotencyKey(db, {
    idempotencyKey: params.idempotencyKey,
    operationType: "identity.recover",
    actorId: params.recoveredBy ?? "system",
    requestHash: params.requestHash,
    correlationId: params.correlationId,
  });

  if (reservation.outcome === "duplicate") {
    return getCustomerIdentityById(db, params.customerIdentityId);
  }
  if (reservation.outcome === "in_progress") {
    throw new IdentityDomainError(
      "IDEMPOTENCY_CONFLICT",
      `Recovery for customer identity "${params.customerIdentityId}" is already in progress.`,
    );
  }
  if (reservation.outcome === "conflict") {
    throw new IdentityDomainError(
      reservation.error.code,
      reservation.error.messageKey,
      reservation.error.fieldErrors,
    );
  }

  const ref = db.collection(COLLECTION).doc(params.customerIdentityId);
  const proofRef = db
    .collection(RECOVERY_PROOF_REFERENCES_COLLECTION)
    .doc(params.recoveryProof.proofReference);

  try {
    const identity = await db.runTransaction(async (transaction) => {
      const [snapshot, proofSnapshot] = await Promise.all([
        transaction.get(ref),
        transaction.get(proofRef),
      ]);

      if (!snapshot.exists) {
        throw unknownCustomerIdentityError(params.customerIdentityId);
      }
      if (proofSnapshot.exists) {
        throw recoveryProofAlreadyUsedError(params.recoveryProof.proofReference);
      }

      const current = fromUserDocument(snapshot.data());

      const { identity: recovered, event } = recoverCustomerIdentity(current, {
        eventId: params.eventId,
        correlationId: params.correlationId,
        actor: params.actor,
        occurredAt: params.occurredAt,
        recoveredAt: params.recoveredAt,
        recoveredBy: params.recoveredBy,
        authority: params.recoveryProof.authority,
        recoveryProofReference: params.recoveryProof.proofReference,
        proofMethodCategory: params.recoveryProof.methodCategory,
      });

      transaction.update(ref, {
        status: recovered.status,
        ...stampUpdate(params.recoveredBy),
      });

      transaction.set(
        proofRef,
        toRecoveryProofReferenceDocument(
          params.recoveryProof.proofReference,
          params.customerIdentityId,
          params.recoveredBy,
        ),
      );

      writeOutboxEntry(transaction, db, event);

      return recovered;
    });

    await completeIdempotencyKey(db, params.idempotencyKey, `${COLLECTION}/${identity.id}`);
    return identity;
  } catch (error) {
    await failIdempotencyKey(db, params.idempotencyKey);
    throw error;
  }
}
