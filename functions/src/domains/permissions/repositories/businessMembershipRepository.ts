/**
 * `businessMemberships` read-only repository (`ENG-P2-004B`).
 *
 * Resolves the specific membership for `(userId, businessId)` per design
 * §5.4/§5.5/§6.5 — a live query, never a cached client claim and never
 * sourced from Firebase custom claims (TRD12 §12.8). Always a live
 * Firestore read — no caching (§6.12, AD-2). TRD10 §10.6.4's Membership
 * Rules imply at most one `(userId, businessId)` record; more than one
 * match is contradictory stored data and is treated as `"malformed"`
 * (fail-closed, §6.11) rather than silently picking one.
 */

import type { Firestore } from "firebase-admin/firestore";
import { fromBusinessMembershipDocument } from "../models/businessMembershipDocument";
import type { MembershipReadResult } from "../evaluator/types";

const COLLECTION = "businessMemberships";

export async function getBusinessMembershipByUserAndBusiness(
  db: Firestore,
  userId: string,
  businessId: string,
): Promise<MembershipReadResult> {
  let snapshot;
  try {
    snapshot = await db
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .where("businessId", "==", businessId)
      .limit(2)
      .get();
  } catch {
    return { kind: "transient_failure" };
  }

  if (snapshot.empty) {
    return { kind: "not_found" };
  }
  if (snapshot.size > 1) {
    return { kind: "malformed" };
  }

  const doc = snapshot.docs[0];
  const membership = fromBusinessMembershipDocument(doc.id, doc.data());
  if (!membership) {
    return { kind: "malformed" };
  }

  return { kind: "found", membership };
}
