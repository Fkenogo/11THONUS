/**
 * Commercial authority seam (`WP-COM-01`; design §15, §25).
 *
 * Commercial mutations are Platform-Administrator-only. The Founder is the
 * sole Platform Administrator at launch and `DEC-GOV-007` (administrator
 * RBAC) remains OPEN, so this seam invents NO role, NO permission and NO
 * per-administrator override: it is exactly the `FD-BUS-ACT-001` precedent
 * (`activateBusinessAfterVerification`) -- an ACTIVE `platformAdministrators`
 * record plus genuinely verified MFA -- reusing the existing record parser
 * (`fromPlatformAdministratorDocument`) and collection name, with a single,
 * enumeration-resistant denial reason for every failure cause.
 *
 * There is NO Business-side commercial mutation authority here: nothing in
 * this module accepts a Business membership or role.
 *
 * The record read is a Firestore read performed BEFORE the PostgreSQL
 * transaction opens (design §21: two stores, no cross-store transaction; the
 * residual revocation window is the accepted two-store limitation).
 * `verifiedMfaSatisfied` must come from `deriveVerifiedMfaSatisfied` applied
 * to the already-resolved credential -- never from a client-supplied flag.
 */

import type { Firestore } from "firebase-admin/firestore";
import { fromPlatformAdministratorDocument } from "../../platformAdministration/repositories/platformAdministratorDocument";
import { PLATFORM_ADMINISTRATORS_COLLECTION } from "../../platformAdministration/repositories/platformAdministratorRepository";
import type { CommercialActor } from "../models/commercialFoundation";

/** Reads the raw `platformAdministrators/{userId}` document data, or `undefined` when absent. */
export type PlatformAdministratorRecordReader = (userId: string) => Promise<unknown | undefined>;

export function firestorePlatformAdministratorRecordReader(
  db: Firestore,
): PlatformAdministratorRecordReader {
  return async (userId) => {
    const snapshot = await db.collection(PLATFORM_ADMINISTRATORS_COLLECTION).doc(userId).get();
    return snapshot.exists ? snapshot.data() : undefined;
  };
}

/** Single, enumeration-resistant denial reason for every authorization failure cause. */
export type CommercialAuthorityDenyReason = "NOT_PLATFORM_ADMINISTRATOR";

export type CommercialAuthorityDecision =
  | { readonly authorized: true; readonly actor: CommercialActor }
  | { readonly authorized: false; readonly reason: CommercialAuthorityDenyReason };

const DENIED: CommercialAuthorityDecision = {
  authorized: false,
  reason: "NOT_PLATFORM_ADMINISTRATOR",
};

export async function authorizeCommercialAdministrator(
  readRecord: PlatformAdministratorRecordReader,
  input: { readonly adminUserId: string; readonly verifiedMfaSatisfied: boolean },
): Promise<CommercialAuthorityDecision> {
  if (typeof input.adminUserId !== "string" || input.adminUserId.trim().length === 0) {
    return DENIED;
  }
  const raw = await readRecord(input.adminUserId);
  if (raw === undefined) return DENIED;
  // Malformed / unrecognised-role documents parse to null and deny (fail closed).
  const administrator = fromPlatformAdministratorDocument(input.adminUserId, raw);
  if (administrator === null) return DENIED;
  if (administrator.status !== "active") return DENIED;
  if (input.verifiedMfaSatisfied !== true) return DENIED;
  return {
    authorized: true,
    actor: { type: "platform_administrator", id: input.adminUserId },
  };
}
