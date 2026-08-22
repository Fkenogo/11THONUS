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
 *
 * **`ENG-P2-004D` additive seam:** an optional trailing `transaction`
 * reads the same query via `transaction.get(query)` instead of a plain
 * `.get()` — Firestore transactions support query reads, not only
 * single-document reads. Omitted, behavior is byte-identical to before.
 */

import type { Firestore, Transaction } from "firebase-admin/firestore";
import { fromBusinessMembershipDocument } from "../models/businessMembershipDocument";
import type { EvaluationBusinessMembership, MembershipReadResult } from "../evaluator/types";

const COLLECTION = "businessMemberships";

export async function getBusinessMembershipByUserAndBusiness(
  db: Firestore,
  userId: string,
  businessId: string,
  transaction?: Transaction,
): Promise<MembershipReadResult> {
  let snapshot;
  try {
    const query = db
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .where("businessId", "==", businessId)
      .limit(2);
    snapshot = await (transaction ? transaction.get(query) : query.get());
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

/**
 * Resolves a specific membership by its own document id (`ENG-P2-003C`,
 * additive — every function above this one is unmodified). A target
 * membership for a lifecycle/role-change command is addressed by
 * `membershipId`, not `(userId, businessId)` — the actor's own membership
 * is what `getBusinessMembershipByUserAndBusiness` resolves for
 * authorization; the *target* of the command is a different membership
 * document, looked up directly. Always a live Firestore read — no caching,
 * matching the read-only repository's existing discipline above.
 */
/**
 * `ENG-P3-002A` addendum (design §39): the missing "list by business"
 * membership query — a single equality filter on `businessId`, bounded
 * (no pagination, no sort — a Business's roster at onboarding time is
 * small, §39). Callers must independently re-verify the requesting
 * caller's own authority over `businessId` (this function performs no
 * authorization itself, matching every other read-only repository
 * function in this file). Filters out any document that fails to parse
 * (fail closed, mirrors `listKnowledgeNodeChildren`'s established
 * precedent) — a malformed persisted membership is silently excluded
 * from the roster, never surfaced as if it were a well-formed one, and
 * never crashes the caller.
 */
export async function listMembershipsByBusiness(
  db: Firestore,
  businessId: string,
): Promise<EvaluationBusinessMembership[]> {
  const snapshot = await db.collection(COLLECTION).where("businessId", "==", businessId).get();
  const memberships: EvaluationBusinessMembership[] = [];
  for (const doc of snapshot.docs) {
    const membership = fromBusinessMembershipDocument(doc.id, doc.data());
    if (membership) memberships.push(membership);
  }
  return memberships;
}

export async function getBusinessMembershipById(
  db: Firestore,
  membershipId: string,
  transaction?: Transaction,
): Promise<MembershipReadResult> {
  let snapshot;
  try {
    const ref = db.collection(COLLECTION).doc(membershipId);
    snapshot = await (transaction ? transaction.get(ref) : ref.get());
  } catch {
    return { kind: "transient_failure" };
  }

  if (!snapshot.exists) {
    return { kind: "not_found" };
  }

  const membership = fromBusinessMembershipDocument(snapshot.id, snapshot.data());
  if (!membership) {
    return { kind: "malformed" };
  }

  return { kind: "found", membership };
}
