/**
 * `businessMembershipInvitations` repository (`ENG-P2-003B`).
 *
 * Phase D invitation-reference strategy: the opaque invitation reference
 * *is* the Firestore document id — minted via `db.collection(...).doc().id`
 * (Firestore's own random push-id generator), the exact "mint ids before
 * the transaction" pattern `businessRepository.bootstrapBusiness` already
 * establishes for `businessId`/`branchId`. This is a deliberate reuse of an
 * existing platform pattern (per the task's own "use existing platform
 * patterns where possible" instruction), not a new token scheme: a
 * Firestore auto-id is a non-sequential, cryptographically random
 * ~120-bit-entropy string that reveals no business/staff sequence, email,
 * phone, or user identity — exactly Phase D's requirements. Looking an
 * invitation up "by reference" is therefore a direct `O(1)` document get on
 * this collection, never a query — the strongest structural
 * enumeration-resistance available (mirrors `recoveryProofReferences`'s
 * doc-ID-as-key precedent, `recoveryProofReferenceDocument.ts`).
 *
 * The one query this repository does perform —
 * `findPendingInvitationForDeliveryTarget` — is scoped to INVITE's own
 * duplicate-pending-invitation check (three equality filters:
 * `businessId`, `status`, `deliveryTarget.value`; Firestore serves
 * equality-only compound queries from automatic single-field indexes, no
 * composite index required, matching `getBusinessMembershipByUserAndBusiness`'s
 * existing two-equality-filter precedent). It is never used to resolve
 * ACCEPT's "reference" — only the direct document-id lookup does that.
 */

import type { Firestore, Transaction } from "firebase-admin/firestore";
import {
  fromBusinessMembershipInvitationDocument,
  type BusinessMembershipInvitation,
} from "../models/businessMembershipInvitation";
import { toBusinessMembershipInvitationDocumentFields } from "./businessMembershipInvitationDocument";

const COLLECTION = "businessMembershipInvitations";

export function invitationRef(db: Firestore, invitationReference: string) {
  return db.collection(COLLECTION).doc(invitationReference);
}

/** Mints a fresh, unguessable invitation reference/document id. No I/O. */
export function mintInvitationReference(db: Firestore): string {
  return db.collection(COLLECTION).doc().id;
}

export type InvitationReadResult =
  { kind: "found"; invitation: BusinessMembershipInvitation } | { kind: "not_found" };

/**
 * Resolves an invitation by its opaque reference. `transaction`, when
 * supplied, makes this a transaction-bound read (required by ACCEPT/REVOKE's
 * read-before-write ordering) — omitted, behavior is a plain `.get()`, same
 * additive-seam convention `businessMembershipRepository.ts` already uses.
 */
export async function getInvitationByReference(
  db: Firestore,
  invitationReference: string,
  transaction?: Transaction,
): Promise<InvitationReadResult> {
  const ref = invitationRef(db, invitationReference);
  const snapshot = await (transaction ? transaction.get(ref) : ref.get());
  if (!snapshot.exists) {
    return { kind: "not_found" };
  }
  const invitation = fromBusinessMembershipInvitationDocument(snapshot.id, snapshot.data());
  if (!invitation) {
    // Malformed stored document — fail closed, identical to "not found"
    // from the caller's perspective (mirrors every other fail-closed
    // reader in this domain, e.g. `businessMembershipRepository.ts`).
    return { kind: "not_found" };
  }
  return { kind: "found", invitation };
}

/**
 * `true` if a `pending` invitation already targets this exact
 * `(businessId, deliveryTarget)` pair — INVITE's `INVITE_ALREADY_PENDING`
 * prerequisite (design §5.2). Deliberately does **not** look up whether the
 * delivery target belongs to an existing Customer Identity or existing
 * membership (Phase G: avoid account-enumeration; that check is not
 * possible at invite time under the approved FD-1-STAFF model anyway,
 * since identity is not yet known).
 */
export async function hasPendingInvitationForDeliveryTarget(
  db: Firestore,
  businessId: string,
  deliveryTarget: { type: string; value: string },
  transaction?: Transaction,
): Promise<boolean> {
  const query = db
    .collection(COLLECTION)
    .where("businessId", "==", businessId)
    .where("status", "==", "pending")
    .where("deliveryTarget.value", "==", deliveryTarget.value)
    .limit(1);
  const snapshot = await (transaction ? transaction.get(query) : query.get());
  return !snapshot.empty;
}

/**
 * `ENG-P3-002A` addendum (design §39): the missing "list by business"
 * invitation query, optionally filtered to one `status` (e.g. `"pending"`
 * for the onboarding review step's "who's still pending" view). Equality-
 * only compound filter when `status` is supplied (mirrors
 * `hasPendingInvitationForDeliveryTarget`'s own two-equality-filter
 * precedent) — no pagination, no sort, bounded to one Business's small
 * onboarding-time invitation set. Callers must independently re-verify
 * authority over `businessId` — this function performs no authorization
 * itself. Filters out any document that fails to parse (fail closed).
 */
export async function listInvitationsByBusiness(
  db: Firestore,
  businessId: string,
  statusFilter?: string,
): Promise<BusinessMembershipInvitation[]> {
  let query = db.collection(COLLECTION).where("businessId", "==", businessId);
  if (statusFilter !== undefined) {
    query = query.where("status", "==", statusFilter);
  }
  const snapshot = await query.get();
  const invitations: BusinessMembershipInvitation[] = [];
  for (const doc of snapshot.docs) {
    const invitation = fromBusinessMembershipInvitationDocument(doc.id, doc.data());
    if (invitation) invitations.push(invitation);
  }
  return invitations;
}

/** Write-only — for use inside `mutation.apply`'s `TransactionWriter`. */
export function writeInvitation(
  writer: { set: (ref: ReturnType<typeof invitationRef>, data: unknown) => unknown },
  db: Firestore,
  invitation: BusinessMembershipInvitation,
): void {
  writer.set(
    invitationRef(db, invitation.id),
    toBusinessMembershipInvitationDocumentFields(invitation),
  );
}
