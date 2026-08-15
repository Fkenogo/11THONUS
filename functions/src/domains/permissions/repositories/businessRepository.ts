/**
 * `businesses` read-only repository (`ENG-P2-004B`).
 *
 * Always a live Firestore read — no caching (design §6.12, AD-2). A
 * thrown Firestore SDK error (network/timeout/unavailable) is caught and
 * mapped to `"transient_failure"` rather than propagated, so the
 * evaluator's fail-closed contract (§11 `TEMPORARY_UNAVAILABLE`) is a
 * plain return value, never an uncaught exception a caller could forget
 * to handle in the caller's favor.
 */

import type { Firestore } from "firebase-admin/firestore";
import { fromBusinessDocument } from "../models/businessDocument";
import type { BusinessReadResult } from "../evaluator/types";

const COLLECTION = "businesses";

export async function getBusinessById(
  db: Firestore,
  businessId: string,
): Promise<BusinessReadResult> {
  let snapshot;
  try {
    snapshot = await db.collection(COLLECTION).doc(businessId).get();
  } catch {
    return { kind: "transient_failure" };
  }

  if (!snapshot.exists) {
    return { kind: "not_found" };
  }

  const business = fromBusinessDocument(snapshot.id, snapshot.data());
  if (!business) {
    return { kind: "malformed" };
  }

  return { kind: "found", business };
}
