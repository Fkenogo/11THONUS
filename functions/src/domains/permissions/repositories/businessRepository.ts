/**
 * `businesses` read-only repository (`ENG-P2-004B`).
 *
 * Always a live Firestore read — no caching (design §6.12, AD-2). A
 * thrown Firestore SDK error (network/timeout/unavailable) is caught and
 * mapped to `"transient_failure"` rather than propagated, so the
 * evaluator's fail-closed contract (§11 `TEMPORARY_UNAVAILABLE`) is a
 * plain return value, never an uncaught exception a caller could forget
 * to handle in the caller's favor.
 *
 * **`ENG-P2-004D` additive seam:** an optional trailing `transaction`
 * reads via `transaction.get(ref)` instead of a plain `.get()`, so a
 * protected command can re-verify business state inside its own
 * transaction (design §6.13, TOCTOU) rather than trusting a decision
 * computed outside it. Omitted, behavior is byte-identical to before —
 * no existing caller or test is affected.
 */

import type { Firestore, Transaction } from "firebase-admin/firestore";
import { fromBusinessDocument } from "../models/businessDocument";
import type { BusinessReadResult } from "../evaluator/types";

const COLLECTION = "businesses";

export async function getBusinessById(
  db: Firestore,
  businessId: string,
  transaction?: Transaction,
): Promise<BusinessReadResult> {
  let snapshot;
  try {
    const ref = db.collection(COLLECTION).doc(businessId);
    snapshot = await (transaction ? transaction.get(ref) : ref.get());
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
