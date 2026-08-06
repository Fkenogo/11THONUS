/**
 * `recoveryProofReferences` collection Firestore document type and
 * write-side builder (ENG-P2-ARCH-CORR-001, correcting `ENG-P2-001-07`
 * finding F1).
 *
 * Document ID is the proof reference value itself (mirrors
 * `loyaltyNumbers`'s doc-ID-as-key uniqueness pattern) — this is what
 * makes reuse detection a single `transaction.get()` on this exact path.
 * One document per consumed recovery proof, ever; never updated after
 * creation (`identityLifecycleRepository.ts` only ever `.set()`s this
 * document once, guarded by an existence check that already rejects any
 * second attempt).
 *
 * Write-side only: nothing in this codebase reads this document's fields
 * back (only `.exists()` is ever checked), so no `from...` converter is
 * defined here — one would be unused code, the exact defect already
 * flagged for `customerProfileDocument.ts`'s unused converter.
 */

import type { BaseMetadata } from "../../../shared/metadata/baseMetadata";
import { stampCreate } from "../../../shared/metadata/baseMetadata";

export type RecoveryProofReferenceDocument = BaseMetadata & {
  proofReference: string;
  customerIdentityId: string;
};

export function toRecoveryProofReferenceDocument(
  proofReference: string,
  customerIdentityId: string,
  actorId: string | null,
): RecoveryProofReferenceDocument {
  const stamp = stampCreate(actorId);
  return {
    id: proofReference,
    schemaVersion: 1,
    status: "active",
    proofReference,
    customerIdentityId,
    createdAt: stamp.createdAt as never,
    createdBy: stamp.createdBy,
    updatedAt: stamp.updatedAt as never,
    updatedBy: stamp.updatedBy,
  };
}
