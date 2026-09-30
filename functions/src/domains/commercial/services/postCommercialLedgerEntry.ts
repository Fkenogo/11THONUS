/**
 * Commercial ledger posting primitive (`WP-COM-01`; design §7, §22.1).
 *
 * The ONLY sanctioned way to change the account's counters: under the
 * per-Business account lock, append one immutable ledger entry and move the
 * materialised account to the counters that entry records, in the caller's
 * transaction. (The database independently refuses, at COMMIT, any account
 * that differs from its latest ledger entry.)
 *
 * This is a primitive, not a command: it performs NO authority check, NO
 * audit write and NO idempotency-key reservation -- future commands compose
 * those around it (`runCommercialCommand`, `commercialAudit`). It implements
 * no capacity gate, reservation policy, consumption projection or admission.
 *
 * Deliberately encodes no limit beyond the governed integrity bounds:
 * paid balance may go negative without floor or maximum, and no trial
 * value has a ceiling.
 */

import type { PlatformPostgresTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import type {
  CommercialBucket,
  CommercialLedgerEntry,
  CommercialLedgerEntryType,
} from "../models/commercialFoundation";
import {
  commercialAccountNotFoundError,
  commercialValidationError,
  CommercialDomainError,
} from "../models/commercialErrors";
import {
  lockCommercialAccount,
  updateAccountCounters,
} from "../repositories/commercialAccountRepository";
import {
  getLedgerEntryByScopeKey,
  insertLedgerEntry,
} from "../repositories/commercialLedgerRepository";

export type PostCommercialLedgerEntryInput = {
  readonly businessId: string;
  readonly entryType: CommercialLedgerEntryType;
  readonly bucket: CommercialBucket;
  readonly unitsDelta: number;
  readonly trialReservedDelta?: number;
  readonly paidReservedDelta?: number;
  readonly sourceReference?: { readonly type: string; readonly id: string };
  readonly reasonCode?: string;
  readonly reasonText?: string;
  /** Idempotent scope, e.g. `cmd:<idempotencyKey>:<n>`. A repeat writes nothing. */
  readonly idempotencyScopeKey: string;
  readonly createdBy: string;
  readonly correlationId: string;
};

export type PostCommercialLedgerEntryResult =
  | { readonly outcome: "posted"; readonly entry: CommercialLedgerEntry }
  | { readonly outcome: "replayed"; readonly entry: CommercialLedgerEntry };

export async function postCommercialLedgerEntry(
  tx: PlatformPostgresTransaction,
  input: PostCommercialLedgerEntryInput,
): Promise<PostCommercialLedgerEntryResult> {
  for (const [name, value] of [
    ["unitsDelta", input.unitsDelta],
    ["trialReservedDelta", input.trialReservedDelta ?? 0],
    ["paidReservedDelta", input.paidReservedDelta ?? 0],
  ] as const) {
    if (!Number.isSafeInteger(value)) {
      throw commercialValidationError(`${name} must be a whole integer.`);
    }
  }

  // Idempotent replay: the scope key already produced an entry. Nothing is
  // written (no account change), and the original entry is returned.
  const existing = await getLedgerEntryByScopeKey(tx, input.idempotencyScopeKey);
  if (existing !== null) {
    if (existing.businessId !== input.businessId) {
      throw commercialValidationError(
        "This ledger idempotency scope already belongs to a different Business.",
      );
    }
    return { outcome: "replayed", entry: existing };
  }

  const account = await lockCommercialAccount(tx, input.businessId);
  if (account === null) {
    throw commercialAccountNotFoundError(input.businessId);
  }

  const trialReservedDelta = input.trialReservedDelta ?? 0;
  const paidReservedDelta = input.paidReservedDelta ?? 0;
  const trialAfter =
    account.trialRemainingUnits + (input.bucket === "trial" ? input.unitsDelta : 0);
  const paidAfter = account.paidBalanceUnits + (input.bucket === "paid" ? input.unitsDelta : 0);
  const trialReservedAfter = account.trialReservedUnits + trialReservedDelta;
  const paidReservedAfter = account.paidReservedUnits + paidReservedDelta;

  // Integrity bounds only (design §20): reserved never negative; trial
  // never below what is reserved against it. NOT a policy ceiling and NOT a
  // paid floor -- paidAfter is deliberately unconstrained.
  if (trialReservedAfter < 0 || paidReservedAfter < 0) {
    throw commercialValidationError("Reserved capacity cannot become negative.");
  }
  if (trialAfter < trialReservedAfter) {
    throw commercialValidationError(
      "Trial capacity cannot fall below the trial capacity already reserved.",
    );
  }

  const nextVersion = account.version + 1;
  const entry = await insertLedgerEntry(tx, {
    businessId: input.businessId,
    accountVersion: nextVersion,
    entryType: input.entryType,
    bucket: input.bucket,
    unitsDelta: input.unitsDelta,
    trialReservedDelta,
    paidReservedDelta,
    trialAfter,
    paidAfter,
    trialReservedAfter,
    paidReservedAfter,
    sourceReference: input.sourceReference,
    reasonCode: input.reasonCode,
    reasonText: input.reasonText,
    idempotencyScopeKey: input.idempotencyScopeKey,
    createdBy: input.createdBy,
    correlationId: input.correlationId,
  });
  if (entry === null) {
    // Lost a race on the scope key to a concurrent committed/in-flight
    // transaction. The account lock is held, so re-reading is safe.
    const winner = await getLedgerEntryByScopeKey(tx, input.idempotencyScopeKey);
    if (winner === null) {
      throw new CommercialDomainError(
        "TEMPORARY_UNAVAILABLE",
        "Ledger scope key contention; retry.",
      );
    }
    return { outcome: "replayed", entry: winner };
  }

  const updated = await updateAccountCounters(tx, input.businessId, account.version, {
    trialRemainingUnits: trialAfter,
    paidBalanceUnits: paidAfter,
    trialReservedUnits: trialReservedAfter,
    paidReservedUnits: paidReservedAfter,
  });
  if (updated === null) {
    throw new CommercialDomainError(
      "TEMPORARY_UNAVAILABLE",
      "Commercial account version changed underneath the account lock; aborting.",
    );
  }
  return { outcome: "posted", entry };
}
