/**
 * `confirmSettlement` (`WP-COM-02`; design §10.1, §15 #5) -- step 2 of 2.
 *
 * Finalises a `recorded` settlement: in ONE transaction it posts exactly one
 * paid `credit_grant` through the canonical `postCommercialLedgerEntry`
 * (which appends the ledger entry and moves the derived account together, under
 * the account lock), flips the settlement to `confirmed`, and appends the
 * audit row. Nothing here writes the account counters directly. A future
 * payment-provider adapter reuses this same path: it records evidence, then
 * confirms; it never writes the ledger.
 *
 * Transition table
 *   initial state : recorded               (anything else -> INVALID_STATE_TRANSITION)
 *   resulting     : confirmed (+ one credit_grant of `unitsPurchased`, paid bucket)
 *   actor         : active Platform Administrator with verified MFA
 *   reference     : the settlement id; the ledger entry's source reference is
 *                   `settlement:<id>`, its scope key `settlement:<id>:credit_grant`
 *   idempotency   : client key bound to command + actor + payload (businessId,
 *                   settlementId, note). Same key+payload replays the stored
 *                   result (no second credit); a different key on an already
 *                   confirmed settlement is refused
 *   audit         : `settlement_confirmed` with ledger entry id and account
 *                   before/after, atomic with the credit
 *   repeat        : prohibited (state check under the settlement row lock, the
 *                   unique ledger scope key, and the database transition guard)
 *
 * Cross-Business: the settlement must belong to `businessId`; otherwise the
 * outcome is indistinguishable from "not found" and nothing is written.
 */

import {
  CommercialDomainError,
  commercialSettlementNotFoundError,
  commercialSettlementStateError,
  commercialValidationError,
} from "../models/commercialErrors";
import { settlementCreditScopeKey } from "../models/commercialSettlement";
import { getCommercialAccount } from "../repositories/commercialAccountRepository";
import { appendCommercialAuditEvent } from "../repositories/commercialAuditRepository";
import {
  lockSettlement,
  markSettlementConfirmed,
} from "../repositories/commercialSettlementRepository";
import {
  runAdministratorCommand,
  type CommercialCommandContext,
  type CommercialCommandDeps,
  type CommercialCommandResponse,
} from "./commercialAdministratorCommand";
import { postCommercialLedgerEntry } from "./postCommercialLedgerEntry";

export type ConfirmSettlementInput = {
  readonly businessId: string;
  readonly settlementId: string;
  /** Confirmation note (design §15 #5). Mandatory. */
  readonly confirmationNote: string;
};

/** JSON-safe (it is stored as the idempotent response snapshot). */
export type ConfirmSettlementResult = {
  readonly settlementId: string;
  readonly businessId: string;
  readonly status: "confirmed";
  readonly unitsCredited: number;
  readonly ledgerEntryId: string;
  readonly ledgerAccountVersion: number;
  readonly paidBalanceAfter: number;
  readonly priceScheduleId: string;
  readonly varianceMinor: number;
  readonly confirmedAt: string;
  readonly auditEventId: string | null;
};

export async function confirmSettlement(
  deps: CommercialCommandDeps,
  context: CommercialCommandContext,
  input: ConfirmSettlementInput,
): Promise<CommercialCommandResponse<ConfirmSettlementResult>> {
  return runAdministratorCommand<ConfirmSettlementResult>(
    deps,
    context,
    {
      commandType: "confirmSettlement",
      payload: {
        businessId: input.businessId,
        settlementId: input.settlementId,
        confirmationNote: input.confirmationNote,
      },
      rejectionAudit: {
        actionType: "settlement_confirmed",
        businessId: typeof input.businessId === "string" ? input.businessId : "",
        targetType: "settlement",
        targetId: typeof input.settlementId === "string" ? input.settlementId : "",
        auditedCategories: [
          "IDEMPOTENCY_CONFLICT",
          "INVALID_STATE_TRANSITION",
          "RESOURCE_NOT_FOUND",
        ],
      },
    },
    async (tx, actor) => {
      if (typeof input.businessId !== "string" || input.businessId.trim().length === 0) {
        throw commercialValidationError("businessId is required.");
      }
      if (!isUuid(input.settlementId)) {
        throw commercialValidationError("settlementId must be a settlement id.");
      }
      if (
        typeof input.confirmationNote !== "string" ||
        input.confirmationNote.trim().length === 0
      ) {
        throw commercialValidationError("A confirmation note is required.");
      }

      // Serialises concurrent confirmations of this settlement.
      const settlement = await lockSettlement(tx, input.settlementId);
      if (settlement === null || settlement.businessId !== input.businessId) {
        throw commercialSettlementNotFoundError(input.settlementId);
      }
      if (settlement.status !== "recorded") {
        throw commercialSettlementStateError(settlement.id, settlement.status);
      }

      const before = await getCommercialAccount(tx, settlement.businessId);

      const posted = await postCommercialLedgerEntry(tx, {
        businessId: settlement.businessId,
        entryType: "credit_grant",
        bucket: "paid",
        unitsDelta: settlement.unitsPurchased,
        sourceReference: { type: "settlement", id: settlement.id },
        reasonCode: "settlement_confirmed",
        reasonText: input.confirmationNote,
        idempotencyScopeKey: settlementCreditScopeKey(settlement.id),
        createdBy: actor.id,
        correlationId: context.correlationId,
      });
      if (posted.outcome !== "posted") {
        // A credit already exists for a settlement still marked `recorded`: never
        // paper over it -- abort (rolls everything back) so it is investigated.
        throw new CommercialDomainError(
          "INVALID_STATE_TRANSITION",
          `A ledger credit already exists for settlement "${settlement.id}"; refusing to credit twice.`,
        );
      }

      const confirmed = await markSettlementConfirmed(tx, {
        settlementId: settlement.id,
        confirmedBy: actor.id,
        confirmationNote: input.confirmationNote,
        confirmIdempotencyKey: context.idempotencyKey,
        correlationId: context.correlationId,
        ledgerEntryId: posted.entry.id,
      });
      if (confirmed === null || confirmed.confirmedAt === null) {
        throw commercialSettlementStateError(settlement.id, "not recorded");
      }

      const audit = await appendCommercialAuditEvent(tx, {
        actor,
        actionType: "settlement_confirmed",
        targetType: "settlement",
        targetId: settlement.id,
        businessId: settlement.businessId,
        reasonText: input.confirmationNote,
        reference: settlement.externalReference,
        correlationId: context.correlationId,
        idempotencyKey: context.idempotencyKey,
        result: "succeeded",
        beforeSnapshot: {
          settlementStatus: "recorded",
          paidBalanceUnits: before?.paidBalanceUnits ?? null,
          accountVersion: before?.version ?? null,
        },
        afterSnapshot: {
          settlementStatus: "confirmed",
          unitsCredited: settlement.unitsPurchased,
          paidBalanceUnits: posted.entry.paidAfter,
          accountVersion: posted.entry.accountVersion,
          amountMinor: settlement.amountMinor,
          currency: settlement.currency,
          priceScheduleId: settlement.priceScheduleId,
          varianceMinor: settlement.varianceMinor,
        },
        ledgerEntryId: posted.entry.id,
        priceScheduleId: settlement.priceScheduleId,
      });

      return {
        result: {
          settlementId: settlement.id,
          businessId: settlement.businessId,
          status: "confirmed",
          unitsCredited: settlement.unitsPurchased,
          ledgerEntryId: posted.entry.id,
          ledgerAccountVersion: posted.entry.accountVersion,
          paidBalanceAfter: posted.entry.paidAfter,
          priceScheduleId: settlement.priceScheduleId,
          varianceMinor: settlement.varianceMinor,
          confirmedAt: confirmed.confirmedAt.toISOString(),
          auditEventId: audit?.id ?? null,
        },
        resultReference: settlement.id,
      };
    },
  );
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}
