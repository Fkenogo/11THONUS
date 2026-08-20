/**
 * Target-membership read for permission-override administration
 * (`ENG-P2-003D`, additive).
 *
 * `businessMembershipRepository.ts`'s `getBusinessMembershipById`
 * (`ENG-P2-003C`, unmodified) resolves the evaluator-shaped
 * `EvaluationBusinessMembership` — sufficient for role/status checks, but
 * its `overrides` deliberately drop `grantedBy`/`grantedAt`
 * (`businessMembershipDocument.ts`'s own documented boundary). A
 * grant/revoke command needs the *full* persisted `permissions[]` shape to
 * perform a read-modify-write that replaces only the current permission's
 * own record while leaving every other permission's original
 * attribution/timestamp untouched (FD-003D-1, `ENG-P2-003-DESIGN-001` §29).
 *
 * This module performs exactly one transaction read of the target document
 * and derives both views from the same snapshot — never a second read of
 * the same document — reusing `fromBusinessMembershipDocument` (unmodified)
 * and the additive `parseRawPermissionOverrideRecords` export, so this can
 * never accept a document either of those would independently reject.
 */

import type { Firestore, Transaction } from "firebase-admin/firestore";
import {
  fromBusinessMembershipDocument,
  parseRawPermissionOverrideRecords,
  type RawPermissionOverrideRecord,
} from "../models/businessMembershipDocument";
import type { EvaluationBusinessMembership } from "../evaluator/types";

const COLLECTION = "businessMemberships";

export type MembershipWithRawOverridesReadResult =
  | { kind: "transient_failure" }
  | { kind: "not_found" }
  | { kind: "malformed" }
  | {
      kind: "found";
      membership: EvaluationBusinessMembership;
      rawOverrides: readonly RawPermissionOverrideRecord[];
    };

/** Always a live, in-transaction Firestore read — no caching, matching every other repository in this domain. */
export async function getBusinessMembershipWithRawOverridesById(
  db: Firestore,
  membershipId: string,
  transaction: Transaction,
): Promise<MembershipWithRawOverridesReadResult> {
  let snapshot;
  try {
    const ref = db.collection(COLLECTION).doc(membershipId);
    snapshot = await transaction.get(ref);
  } catch {
    return { kind: "transient_failure" };
  }

  if (!snapshot.exists) {
    return { kind: "not_found" };
  }

  const data = snapshot.data();
  const membership = fromBusinessMembershipDocument(snapshot.id, data);
  if (!membership) {
    return { kind: "malformed" };
  }

  const rawOverrides = parseRawPermissionOverrideRecords(
    (data as { permissions?: unknown } | undefined)?.permissions,
  );
  if (rawOverrides === null) {
    // Structurally unreachable: `fromBusinessMembershipDocument` already
    // fails the whole document closed on the same malformed condition
    // `parseRawPermissionOverrideRecords` would reject. Kept as an explicit
    // fail-closed branch rather than a non-null assertion — defence in
    // depth if the two parsers' shapes were ever to diverge.
    return { kind: "malformed" };
  }

  return { kind: "found", membership, rawOverrides };
}
