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

type MembershipUpdateWriter = { update: (ref: DocumentReference, data: unknown) => unknown };

/**
 * `ENG-P2-003C` additive update paths — every function above this one is
 * unmodified. These use `.update()`, not `.set()` — a partial field patch
 * on the existing document (Phase P: mutate the existing membership record
 * transactionally, never create a replacement document). No status
 * transition here mints a new membership id.
 */

/**
 * SUSPEND/REACTIVATE: mutates `status` (and `updatedAt`) only. Never sets
 * `endedAt` — that field is exclusively REMOVE's (design §6's field table).
 */
export function writeMembershipLifecycleTransition(
  writer: MembershipUpdateWriter,
  db: Firestore,
  membershipId: string,
  status: "active" | "suspended",
  updatedAt: Date,
): void {
  writer.update(businessMembershipRef(db, membershipId), {
    status,
    updatedAt,
  });
}

/**
 * REMOVE: transitions to the terminal `removed` status and sets `endedAt`
 * (design §6's field table) exactly once — the historical record itself
 * (the document) is never deleted (TRD10 Membership Rule 3, Phase G/P).
 */
export function writeMembershipRemoval(
  writer: MembershipUpdateWriter,
  db: Firestore,
  membershipId: string,
  endedAt: Date,
): void {
  writer.update(businessMembershipRef(db, membershipId), {
    status: "removed",
    endedAt,
    updatedAt: endedAt,
  });
}

/**
 * Role change: mutates `role` (and `updatedAt`) only. Never touches
 * `permissions` (the `PermissionOverride` array) — Phase N/O's explicit
 * boundary: role change must not rewrite permission-override history.
 */
export function writeMembershipRoleChange(
  writer: MembershipUpdateWriter,
  db: Firestore,
  membershipId: string,
  role: "manager" | "staff",
  updatedAt: Date,
): void {
  writer.update(businessMembershipRef(db, membershipId), {
    role,
    updatedAt,
  });
}
