/**
 * Read-only platform-establishment check (PLATFORM-BASELINE-001).
 *
 * Answers exactly one question for the Platform Foundation Readiness
 * contract: "does at least one active Platform Administrator exist?" This
 * is deliberately distinct from `discoverPlatformAdministrator` (which
 * answers "is this specific identity an active administrator?") — this
 * check is identity-agnostic and exists solely for platform-wide readiness
 * reporting. It never creates, seeds, bootstraps, or mutates any record;
 * `bootstrapPlatformAdministrator.ts` (unchanged, already repeatable,
 * explicit, auditable, idempotent, and fail-closed — see the
 * implementation report) remains the only way a Platform Administrator is
 * ever created.
 */

import type { Firestore } from "firebase-admin/firestore";
import { PLATFORM_ADMINISTRATORS_COLLECTION } from "../repositories/platformAdministratorRepository";

export async function checkPlatformAdministratorEstablished(db: Firestore): Promise<boolean> {
  const snapshot = await db
    .collection(PLATFORM_ADMINISTRATORS_COLLECTION)
    .where("status", "==", "active")
    .limit(1)
    .get();
  return !snapshot.empty;
}
