/**
 * Recovery identity-lookup boundary (ENG-P2-001-07).
 *
 * Resolves a bounded recovery lookup reference (Customer Identity ID,
 * Loyalty Number, or current QR reference) to exactly one existing
 * Customer Identity ID, then delegates the actual recovery to `-06`'s
 * `recoverCustomerIdentityStatus` unchanged in spirit — this module adds
 * no competing transaction/persistence pattern, only the reference
 * resolution step ahead of it.
 *
 * Every lookup route reads an already-merged, doc-ID-keyed, immutable
 * mapping (`loyaltyNumbers/{value}` and `-04`'s `getActiveQrIdentityByReference`,
 * which already fails closed on unknown/invalidated references) — never a
 * fuzzy or enumerable search. Authentication-subject-reference and
 * support-managed-reference lookup routes are deliberately not implemented
 * here: no reverse index from an authentication subject or support-case
 * reference to a Customer Identity ID exists yet without new schema, which
 * is out of this Foundation package's bounded scope (ENG-P2-001-06
 * implementation report analysis, carried into this task's own Stage B
 * pre-edit analysis).
 *
 * A lookup miss NEVER creates an identity — it fails closed with the same
 * `unknownCustomerIdentityError` `-05` already uses, whether the reference
 * itself is unknown or belongs to no identity.
 */

import type { Firestore } from "firebase-admin/firestore";
import type { CustomerIdentity } from "../models/customerIdentity";
import type { RecoveryProof } from "../models/recoveryProof";
import { unknownCustomerIdentityError } from "../models/identityErrors";
import { fromLoyaltyNumberDocument } from "../../loyaltyNumber/repositories/loyaltyNumberDocument";
import { getActiveQrIdentityByReference } from "../../qrIdentity/repositories/qrIdentityRepository";
import { QrIdentityDomainError } from "../../qrIdentity/models/qrIdentityErrors";
import type { EventActor } from "../../../shared/events/domainEvent";
import {
  recoverCustomerIdentityStatus,
  type RecoverCustomerIdentityStatusParams,
} from "./identityLifecycleRepository";

const LOYALTY_NUMBERS_COLLECTION = "loyaltyNumbers";

export type RecoveryLookupReference =
  | { type: "customer_identity_id"; value: string }
  | { type: "loyalty_number"; value: string }
  | { type: "qr_reference"; value: string };

export type RecoverCustomerIdentityByReferenceParams = {
  eventId: string;
  correlationId: string;
  actor: EventActor;
  occurredAt: string;
  targetReference: RecoveryLookupReference;
  recoveryProof: RecoveryProof;
  recoveredAt: Date;
  recoveredBy: string | null;
  idempotencyKey: string;
  requestHash: string;
};

async function resolveRecoveryTargetIdentityId(
  db: Firestore,
  reference: RecoveryLookupReference,
): Promise<string> {
  if (reference.type === "customer_identity_id") {
    return reference.value;
  }

  if (reference.type === "loyalty_number") {
    const snapshot = await db.collection(LOYALTY_NUMBERS_COLLECTION).doc(reference.value).get();
    if (!snapshot.exists) {
      throw unknownCustomerIdentityError(reference.value);
    }
    return fromLoyaltyNumberDocument(snapshot.data()).customerIdentityId;
  }

  try {
    const association = await getActiveQrIdentityByReference(db, reference.value);
    return association.customerIdentityId;
  } catch (error) {
    if (error instanceof QrIdentityDomainError) {
      throw unknownCustomerIdentityError(reference.value);
    }
    throw error;
  }
}

export async function recoverCustomerIdentityByReference(
  db: Firestore,
  params: RecoverCustomerIdentityByReferenceParams,
): Promise<CustomerIdentity> {
  const customerIdentityId = await resolveRecoveryTargetIdentityId(db, params.targetReference);

  const statusParams: RecoverCustomerIdentityStatusParams = {
    eventId: params.eventId,
    correlationId: params.correlationId,
    actor: params.actor,
    occurredAt: params.occurredAt,
    customerIdentityId,
    recoveryProof: params.recoveryProof,
    recoveredAt: params.recoveredAt,
    recoveredBy: params.recoveredBy,
    idempotencyKey: params.idempotencyKey,
    requestHash: params.requestHash,
  };

  return recoverCustomerIdentityStatus(db, statusParams);
}
