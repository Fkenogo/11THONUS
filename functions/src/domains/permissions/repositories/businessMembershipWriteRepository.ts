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
 * `ENG-P2-003C-CORR-001` — role change + PermissionOverride reconciliation,
 * committed as one `.update()` call. Firestore rejects a second `.update()`
 * on the same document reference within one transaction, so this cannot be
 * a plain role-only write followed by a separate
 * `writeMembershipPermissionOverrides` call — both fields must be part of
 * the same write. `permissions` here is always the caller's already-
 * reconciled CURRENT configuration (FD-003D-1) for the NEW role, never a
 * partial patch. This is the ONLY role-change write path — an earlier,
 * role-only variant that never touched `permissions[]` was removed by this
 * correction; that omission was the security defect `ENG-P2-003E`'s
 * integration validation found, so no role-only write function is kept
 * lying around for a future caller to reach for by mistake.
 */
export function writeMembershipRoleChangeWithOverrideReconciliation(
  writer: MembershipUpdateWriter,
  db: Firestore,
  membershipId: string,
  role: "manager" | "staff",
  permissions: readonly PersistedPermissionOverrideRecordFields[],
  updatedAt: Date,
): void {
  writer.update(businessMembershipRef(db, membershipId), {
    role,
    permissions,
    updatedAt,
  });
}

/**
 * `ENG-P2-003D` — Permission Override Administration. Writes the complete,
 * replaced `permissions[]` array — never a partial/append-only patch. The
 * caller (`staffPermissionOverrideCommand.ts`) is responsible for
 * constructing `permissions` as the correct at-most-one-per-permission
 * result (FD-003D-1, `ENG-P2-003-DESIGN-001` §29); this function performs
 * no override-domain validation itself, matching every other write function
 * in this file (validation happens before the write phase, `prepare`, never
 * in `apply`).
 */
export type PersistedPermissionOverrideRecordFields = {
  permissionId: string;
  direction: "grant" | "revoke";
  grantedBy: string;
  grantedAt: Date;
};

export function writeMembershipPermissionOverrides(
  writer: MembershipUpdateWriter,
  db: Firestore,
  membershipId: string,
  permissions: readonly PersistedPermissionOverrideRecordFields[],
  updatedAt: Date,
): void {
  writer.update(businessMembershipRef(db, membershipId), {
    permissions,
    updatedAt,
  });
}
