/**
 * `businessTermsAcceptances` persistence (`ENG-P3-002A`, design §37.3/§37.7).
 *
 * Write-once by construction: `businessTermsAcceptanceId(businessId,
 * acceptingCustomerIdentityId, termsVersion)` is deterministic, so a
 * repeated acceptance of the *same* version by the *same* authorized actor
 * for the *same* Business always resolves to the same document id. This
 * repository's write path is a transactional get-then-set: if the
 * document already exists, the existing record is returned unchanged
 * (idempotent no-op, never a duplicate, never overwritten) — the record
 * itself has no update path anywhere in this module.
 */

import type { Firestore, Transaction } from "firebase-admin/firestore";
import {
  businessTermsAcceptanceId,
  createBusinessTermsAcceptance,
  fromBusinessTermsAcceptanceDocument,
  toBusinessTermsAcceptanceDocumentFields,
  type BusinessTermsAcceptance,
  type CreateBusinessTermsAcceptanceParams,
} from "../models/businessTermsAcceptance";
import type { TransactionWriter } from "../../permissions/service/authorizeAndExecute";

export const BUSINESS_TERMS_ACCEPTANCES_COLLECTION = "businessTermsAcceptances";

/**
 * `ENG-P3-002A` independent review correction (Phase J). Previously, any
 * document found at the deterministic id that merely *parsed* structurally
 * (`fromBusinessTermsAcceptanceDocument` returning non-null) was returned
 * and trusted as valid acceptance evidence for the requested
 * `(businessId, acceptingCustomerIdentityId, termsVersion)` tuple — without
 * ever checking that the document's own persisted fields actually *match*
 * that tuple. A corrupted or mismatching document written directly at the
 * expected id (bypassing this repository — e.g. a manual data fix gone
 * wrong, a migration bug, or a hypothetical future write path) would
 * therefore have been silently accepted as if it were genuine legal
 * evidence. This function fails closed instead: a structurally valid but
 * tuple-mismatching document is treated identically to a malformed one.
 */
function verifyTupleMatch(
  acceptance: BusinessTermsAcceptance,
  expected: { businessId: string; acceptingCustomerIdentityId: string; termsVersion: string },
): boolean {
  return (
    acceptance.businessId === expected.businessId &&
    acceptance.acceptingCustomerIdentityId === expected.acceptingCustomerIdentityId &&
    acceptance.termsVersion === expected.termsVersion
  );
}

/**
 * Transactional get-or-create: reads the deterministic-id document inside
 * `transaction` first; if it already exists, returns the existing,
 * previously-persisted record unchanged (idempotent replay, §37 Phase S) —
 * never re-validates or re-writes it. Only writes a new document when none
 * exists yet for this exact `(businessId, acceptingCustomerIdentityId,
 * termsVersion)` tuple. The caller supplies the write-only
 * `TransactionWriter` separately (mirrors `writeBusinessUpdate`'s split
 * read/write seam) so this function can be composed into a larger
 * transaction (e.g. `acceptBusinessTerms`'s own `authorizeAndExecute`
 * boundary) without opening its own transaction.
 */
export async function getOrCreateBusinessTermsAcceptanceInTransaction(
  transaction: Transaction,
  writer: TransactionWriter,
  db: Firestore,
  params: CreateBusinessTermsAcceptanceParams,
): Promise<{ acceptance: BusinessTermsAcceptance; created: boolean }> {
  const id = businessTermsAcceptanceId(
    params.businessId,
    params.acceptingCustomerIdentityId,
    params.termsVersion,
  );
  const ref = db.collection(BUSINESS_TERMS_ACCEPTANCES_COLLECTION).doc(id);
  const snapshot = await transaction.get(ref);

  if (snapshot.exists) {
    const existing = fromBusinessTermsAcceptanceDocument(id, snapshot.data());
    if (
      existing &&
      verifyTupleMatch(existing, {
        businessId: params.businessId,
        acceptingCustomerIdentityId: params.acceptingCustomerIdentityId,
        termsVersion: params.termsVersion,
      })
    ) {
      return { acceptance: existing, created: false };
    }
    // Malformed, OR structurally valid but tuple-mismatching, existing
    // document at the deterministic id — fail closed rather than silently
    // overwriting, or silently trusting, corrupted evidence.
    throw new Error(`Malformed or tuple-mismatching BusinessTermsAcceptance document at "${id}".`);
  }

  const acceptance = createBusinessTermsAcceptance({ ...params, id });
  writer.set(ref, toBusinessTermsAcceptanceDocumentFields(acceptance));
  return { acceptance, created: true };
}

/**
 * Transactional read-only lookup for the `submitBusinessForVerification`
 * precondition (§37.4/§37.9/§40) and for the `getBusinessContext`
 * `termsAcceptance` DTO projection (§37.7) — participates in the same
 * atomic boundary as whatever the caller is validating (TOCTOU safety,
 * §37 Phase V), never a separate, out-of-band read.
 */
export async function readBusinessTermsAcceptanceInTransaction(
  transaction: Transaction,
  db: Firestore,
  businessId: string,
  acceptingCustomerIdentityId: string,
  termsVersion: string,
): Promise<BusinessTermsAcceptance | null> {
  const id = businessTermsAcceptanceId(businessId, acceptingCustomerIdentityId, termsVersion);
  const snapshot = await transaction.get(
    db.collection(BUSINESS_TERMS_ACCEPTANCES_COLLECTION).doc(id),
  );
  if (!snapshot.exists) return null;
  const acceptance = fromBusinessTermsAcceptanceDocument(id, snapshot.data());
  if (!acceptance) return null;
  // Phase J: a structurally valid but tuple-mismatching document at the
  // expected id must never be returned as valid acceptance evidence — this
  // read's callers all treat `null` as "not accepted," which is already
  // the correct fail-closed outcome for this case.
  if (!verifyTupleMatch(acceptance, { businessId, acceptingCustomerIdentityId, termsVersion })) {
    return null;
  }
  return acceptance;
}

/** Non-transactional variant — used by the read-only `getBusinessContext` hydration path (§9/§37.7), which does not need a write-capable transaction. */
export async function readBusinessTermsAcceptance(
  db: Firestore,
  businessId: string,
  acceptingCustomerIdentityId: string,
  termsVersion: string,
): Promise<BusinessTermsAcceptance | null> {
  const id = businessTermsAcceptanceId(businessId, acceptingCustomerIdentityId, termsVersion);
  const snapshot = await db.collection(BUSINESS_TERMS_ACCEPTANCES_COLLECTION).doc(id).get();
  if (!snapshot.exists) return null;
  const acceptance = fromBusinessTermsAcceptanceDocument(id, snapshot.data());
  if (!acceptance) return null;
  if (!verifyTupleMatch(acceptance, { businessId, acceptingCustomerIdentityId, termsVersion })) {
    return null;
  }
  return acceptance;
}
