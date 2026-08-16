/**
 * `trustRecords` collection repository (CAP-P2-ITM-B).
 *
 * Doc-ID-keyed by the Internal Customer ID (`ITM-DESIGN-001` §12) — the
 * 1:1 trust-record/identity invariant (§5) is structurally enforced by
 * this key choice alone, no separate uniqueness index needed, mirroring
 * the doc-ID-as-value pattern `ENG-P2-001-05` already uses for Loyalty
 * Number/QR-reference uniqueness.
 *
 * `ingestTrustEvidence` is the single idempotent, transactional write
 * path (§7.1, §12): read-then-write inside one Firestore transaction,
 * reusing the exact "read target first, no-op if already applied"
 * pattern `AUTH-08`'s own emitter (`authenticationEventEmitter.ts`)
 * already established for *producing* an event — applied here to
 * *consuming* one exactly-once-effectively. Firestore's own transaction
 * contention detection (the same mechanism `customerIdentityRepository.ts`
 * relies on for its own existence-check-inside-transaction) is what makes
 * two concurrent first-event deliveries for the same identity converge to
 * exactly one created document rather than a race.
 *
 * `signalState.hasSuccessfulAuthentication` is updated as a monotonic OR
 * (`current || (this event is customer_authenticated)`) — append-only,
 * never unset (§6.6), and independent of delivery order (§7.1's
 * commutativity requirement): the same final value results regardless of
 * how many times, or in what order, the two governed event categories are
 * delivered. `trustLevel` is never recomputed here — it is set to the
 * `unverified` default only at record creation (§13: "ITM must be able to
 * lazily create a default (unverified) trust record on first read/first
 * signal") and left untouched on every subsequent ingestion — progression
 * derivation is ITM-C's responsibility, not this repository's (§15).
 *
 * `verificationState` is deliberately left at its default
 * (`{ phoneVerified: false, emailVerified: false }`) by this package —
 * ITM-A defined the field's shape, but no governed rule in
 * `ITM-DESIGN-001` §6.6 derives a band from it (only `signalState` and
 * account age do), so mapping an `AuthenticationReferenceType` onto it
 * here would be inventing unreviewed semantics no consumer needs yet.
 * Left as a disclosed future item (implementation report), not a
 * silently-dropped requirement.
 */

import type { Firestore } from "firebase-admin/firestore";
import { stampCreate, stampUpdate } from "../../../shared/metadata/baseMetadata";
import { createTrustRecord, type TrustRecord } from "../models/trustRecord";
import type { TrustEvidenceCategory } from "../models/trustEvidenceCategory";
import { fromTrustRecordDocument, toTrustRecordDocument } from "./trustRecordDocument";

const COLLECTION = "trustRecords";

export function trustRecordRef(db: Firestore, customerIdentityId: string) {
  return db.collection(COLLECTION).doc(customerIdentityId);
}

export async function getTrustRecordByCustomerIdentityId(
  db: Firestore,
  customerIdentityId: string,
): Promise<TrustRecord | undefined> {
  const snapshot = await trustRecordRef(db, customerIdentityId).get();
  if (!snapshot.exists) {
    return undefined;
  }
  return fromTrustRecordDocument(customerIdentityId, snapshot.data());
}

export type IngestTrustEvidenceParams = {
  customerIdentityId: string;
  category: TrustEvidenceCategory;
  eventId: string;
  correlationId: string;
  occurredAt: Date;
  actorId: string | null;
};

export type IngestTrustEvidenceOutcome = {
  /** `false` when this call found the event's `eventId` already recorded (idempotent no-op). */
  applied: boolean;
  trustRecord: TrustRecord;
};

export async function ingestTrustEvidence(
  db: Firestore,
  params: IngestTrustEvidenceParams,
): Promise<IngestTrustEvidenceOutcome> {
  const ref = trustRecordRef(db, params.customerIdentityId);

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);

    if (snapshot.exists) {
      const current = fromTrustRecordDocument(params.customerIdentityId, snapshot.data());

      const alreadyApplied = current.reasonReferences.some(
        (reference) => reference.eventId === params.eventId,
      );
      if (alreadyApplied) {
        return { applied: false, trustRecord: current };
      }

      const updated = createTrustRecord({
        trustRecordId: current.trustRecordId,
        customerIdentityId: current.customerIdentityId,
        verificationState: current.verificationState,
        signalState: {
          hasSuccessfulAuthentication:
            current.signalState.hasSuccessfulAuthentication ||
            params.category === "customer_authenticated",
        },
        trustLevel: current.trustLevel,
        version: current.version + 1,
        status: current.status,
        reasonReferences: [
          ...current.reasonReferences,
          {
            category: params.category,
            eventId: params.eventId,
            correlationId: params.correlationId,
            occurredAt: params.occurredAt,
          },
        ],
        createdAt: current.createdAt,
        createdBy: current.createdBy,
        // Discarded below by `stampUpdate`'s `serverTimestamp()` — only
        // needs to satisfy `createTrustRecord`'s own `updatedAt >=
        // createdAt` construction-time validation.
        updatedAt: current.updatedAt,
        updatedBy: params.actorId,
      });

      const document = toTrustRecordDocument(updated);
      transaction.set(ref, {
        ...document,
        ...stampUpdate(params.actorId),
      });

      return { applied: true, trustRecord: updated };
    }

    const created = createTrustRecord({
      trustRecordId: params.customerIdentityId,
      customerIdentityId: params.customerIdentityId,
      verificationState: { phoneVerified: false, emailVerified: false },
      signalState: {
        hasSuccessfulAuthentication: params.category === "customer_authenticated",
      },
      trustLevel: "unverified",
      version: 1,
      status: "active",
      reasonReferences: [
        {
          category: params.category,
          eventId: params.eventId,
          correlationId: params.correlationId,
          occurredAt: params.occurredAt,
        },
      ],
      createdAt: params.occurredAt,
      createdBy: params.actorId,
      updatedAt: params.occurredAt,
      updatedBy: params.actorId,
    });

    const document = toTrustRecordDocument(created);
    transaction.set(ref, {
      ...document,
      ...stampCreate(params.actorId),
      schemaVersion: 1,
    });

    return { applied: true, trustRecord: created };
  });
}
