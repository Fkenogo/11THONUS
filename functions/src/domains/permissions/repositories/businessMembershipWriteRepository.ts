/**
 * `businessMemberships` write-side repository (`ENG-P2-003B`).
 *
 * `businessMembershipRepository.ts` (`ENG-P2-004B`) is explicitly
 * documented as "read-only" and consumed unmodified by this package (§13's
 * cross-business-isolation guarantees, §14's evaluator contract) — this is
 * a **separate, additive** file for the one write path `ENG-P2-003B` owns:
 * creating the membership document ACCEPT produces. It never modifies or
 * re-exports anything from the read-only repository.
 */

import type { DocumentReference, Firestore } from "firebase-admin/firestore";
import type { BusinessMembershipRecord } from "../models/businessMembershipWrite";

const COLLECTION = "businessMemberships";

export function businessMembershipRef(db: Firestore, membershipId: string): DocumentReference {
  return db.collection(COLLECTION).doc(membershipId);
}

/** Mints a fresh membership document id. No I/O — matches the bootstrap "mint ids before the transaction" pattern. */
export function mintBusinessMembershipId(db: Firestore): string {
  return db.collection(COLLECTION).doc().id;
}

export type BusinessMembershipDocumentFields = {
  userId: string;
  businessId: string;
  role: string;
  permissions: readonly [];
  status: "active";
  invitedBy: string;
  invitedAt: Date;
  acceptedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  schemaVersion: number;
};

export function toBusinessMembershipDocumentFields(
  record: BusinessMembershipRecord,
): BusinessMembershipDocumentFields {
  return {
    userId: record.userId,
    businessId: record.businessId,
    role: record.role,
    permissions: record.permissions,
    status: record.status,
    invitedBy: record.invitedBy,
    invitedAt: record.invitedAt,
    acceptedAt: record.acceptedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    schemaVersion: record.schemaVersion,
  };
}

/** Write-only — for use inside a transaction's write phase. */
export function writeNewBusinessMembership(
  writer: { set: (ref: DocumentReference, data: unknown) => unknown },
  db: Firestore,
  record: BusinessMembershipRecord,
): void {
  writer.set(businessMembershipRef(db, record.id), toBusinessMembershipDocumentFields(record));
}
