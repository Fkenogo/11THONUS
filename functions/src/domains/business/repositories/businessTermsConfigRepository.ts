/**
 * Server-authoritative "currently required Business Terms version"
 * configuration (`ENG-P3-002A` correction, design §37.5, task Phase E/F).
 *
 * **Why this exists (replaces `functions/src/config/businessTermsConfig.ts`,
 * ENG-P3-002A independent review finding F3-1).** The original
 * implementation read `process.env.BUSINESS_TERMS_CURRENT_VERSION` *inside*
 * the `acceptBusinessTerms`/`submitBusinessForVerification` Firestore
 * transactions and claimed this participated in TOCTOU-safe optimistic
 * concurrency. It does not: `process.env` is host-process memory, not a
 * Firestore document. A Firestore transaction only detects contention, and
 * therefore only retries, when a document it actually **read via
 * `transaction.get()`** is modified by another committed write before this
 * transaction commits. An environment-variable read has zero relationship
 * to Firestore's snapshot/conflict machinery — a concurrent Terms-version
 * change could never cause a retry, so a transaction could commit
 * `pending_verification`, or a Terms acceptance, against a stale version
 * with no detectable conflict at all. This was verified mechanically (not
 * merely reasoned about) — see `businessTermsConfigRepository.emulator.test.ts`
 * and `submitBusinessForVerification`'s own TOCTOU proof for the real,
 * timing-window-based reproduction.
 *
 * **The fix:** the currently-required version now lives on a
 * server-authoritative Firestore document (`platformConfig/businessTerms`)
 * read with `transaction.get()` inside the *same* transaction as both Terms
 * acceptance and the `submitBusinessForVerification` precondition. Because
 * it is now a real document in the transaction's read set, a concurrent
 * write to this document before commit causes Firestore's own optimistic-
 * concurrency conflict detection to force a retry — the transaction body
 * re-runs from scratch and observes the new value. This is the mechanism
 * that actually delivers the TOCTOU guarantee the original comments merely
 * asserted.
 *
 * **Legal boundary — read before touching this file.** `DEC-LEGAL-002`
 * remains `OPEN_LEGAL`. This module does not invent, approve, or hard-code
 * a production Terms version — no `"v1"`, `"1.0"`, `"2026-08"`, or similar
 * is written here. It defines only the *mechanism*.
 *
 * **No client write path.** Nothing in `functions/src/index.ts` (no
 * callable) writes to `platformConfig/businessTerms` — this module exports
 * readers only. The document is populated exclusively by direct,
 * server-side/ops action (Admin SDK console, a future governed admin
 * tool) or, in tests, by direct emulator seeding — mirroring how every
 * other emulator test in this codebase seeds fixture documents directly
 * rather than through a repository writer. The Admin SDK bypasses
 * `firestore.rules` entirely, so this new collection needs no Rules
 * change (none is made).
 *
 * **Fail-closed contract, unchanged from the original module:** a missing
 * document, or a document with a missing/blank/non-string `currentVersion`
 * field, resolves to `null` — never a fabricated default. Every caller
 * must treat `null` as "Terms acceptance is currently unavailable."
 */

import type { Firestore, Transaction } from "firebase-admin/firestore";

export const BUSINESS_TERMS_CONFIG_COLLECTION = "platformConfig";
export const BUSINESS_TERMS_CONFIG_DOCUMENT_ID = "businessTerms";

function parseCurrentVersion(data: FirebaseFirestore.DocumentData | undefined): string | null {
  if (!data) return null;
  const raw = data["currentVersion"];
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  return trimmed;
}

function configRef(db: Firestore) {
  return db.collection(BUSINESS_TERMS_CONFIG_COLLECTION).doc(BUSINESS_TERMS_CONFIG_DOCUMENT_ID);
}

/**
 * Transactional read — the only variant any TOCTOU-sensitive caller
 * (`acceptBusinessTermsCommand`, `submitBusinessForVerification`'s
 * precondition) may use. Participates in `transaction`'s own read set, so
 * Firestore will force a transaction retry if this document is modified
 * by another committed write before `transaction` commits.
 *
 * `afterReadTestHook` is a **test-only** injection seam (mirrors
 * `bootstrapBusiness`'s existing `generator?` seam) — when supplied, it is
 * awaited immediately after the transactional read completes and before
 * this function returns, giving an emulator test a deterministic window
 * in which to commit a concurrent config change and prove the retry
 * actually happens. Production callers never supply it.
 */
export async function getCurrentlyRequiredBusinessTermsVersionInTransaction(
  transaction: Transaction,
  db: Firestore,
  afterReadTestHook?: () => Promise<void>,
): Promise<string | null> {
  const snapshot = await transaction.get(configRef(db));
  if (afterReadTestHook) {
    await afterReadTestHook();
  }
  return parseCurrentVersion(snapshot.data());
}

/**
 * Non-transactional read — used only by the read-only `getBusinessContext`
 * hydration DTO projection (`businessReadService.ts`), which is not itself
 * a TOCTOU-sensitive mutation boundary (it is a point-in-time read, not a
 * commit decision).
 */
export async function getCurrentlyRequiredBusinessTermsVersion(
  db: Firestore,
): Promise<string | null> {
  const snapshot = await configRef(db).get();
  return parseCurrentVersion(snapshot.data());
}
