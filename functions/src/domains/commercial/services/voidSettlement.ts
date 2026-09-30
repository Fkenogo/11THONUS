/**
 * `voidSettlement` (`WP-COM-03`; design §10.4, §12, §15 #10).
 *
 * Corrects a mistaken CONFIRMED settlement by COMPENSATION, never by rewriting
 * history. In one transaction it appends exactly one `settlement_void_reversal`
 * ledger entry (paid bucket, `-units_purchased`, referencing the settlement)
 * through the canonical ledger flow, and marks the settlement `voided`. The
 * original `credit_grant` and the settlement's confirmation provenance stay
 * verbatim and visible (database-enforced); the account is reconstructable
 * from the ledger (credit then reversal). If the credit was already consumed
 * the paid balance goes negative -- a governed, recoverable outcome (design
 * §12; no floor).
 *
 * Transition table
 *   initial state : confirmed          (recorded -> INVALID_STATE_TRANSITION:
 *                                       the design lifecycle is recorded ->
 *                                       confirmed -> voided; a recorded
 *                                       settlement granted nothing to reverse
 *                                       and its cancellation is not defined
 *                                       by the design, so it is not invented)
 *   resulting     : voided (+ one compensating reversal)
 *   actor         : active Platform Administrator, verified MFA
 *   reference     : mandatory reason text AND reference
 *   idempotency   : same key+payload replays; a new key on a voided settlement
 *                   is refused; the reversal is unique per settlement in the
 *                   ledger regardless of scope key (concurrent voids compensate once)
 *   audit         : `settlement_voided` with both ledger entry ids and the
 *                   account before/after taken under the account lock
 * Lock order matches `confirmSettlement`: settlement row, then account.
 * No refund / payment-provider workflow is implied or invented.
 */

import {
  CommercialDomainError,
  commercialAccountNotFoundError,
  commercialSettlementNotFoundError,
  commercialStateConflictError,
} from "../models/commercialErrors";
import { settlementVoidReversalScopeKey } from "../models/commercialSettlement";
import { lockCommercialAccount } from "../repositories/commercialAccountRepository";
import { appendCommercialAuditEvent } from "../repositories/commercialAuditRepository";
import {
  lockSettlement,
  markSettlementVoided,
} from "../repositories/commercialSettlementRepository";
import {
  runAdministratorCommand,
  type CommercialCommandContext,
  type CommercialCommandDeps,
  type CommercialCommandResponse,
} from "./commercialAdministratorCommand";
import { assertCounterInRange, requireBusinessId, requireText } from "./commercialCommandInput";
import { postCommercialLedgerEntry } from "./postCommercialLedgerEntry";

export type VoidSettlementInput = {
  readonly businessId: string;
  readonly settlementId: string;
  readonly reasonText: string;
  readonly reference: string;
};

export type VoidSettlementResult = {
  readonly settlementId: string;
  readonly businessId: string;
  readonly status: "voided";
  readonly unitsReversed: number;
  readonly originalLedgerEntryId: string;
  readonly reversalLedgerEntryId: string;
  readonly ledgerAccountVersion: number;
  readonly paidBalanceAfter: number;
  readonly voidedAt: string;
  readonly auditEventId: string | null;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function voidSettlement(
  deps: CommercialCommandDeps,
  context: CommercialCommandContext,
  input: VoidSettlementInput,
): Promise<CommercialCommandResponse<VoidSettlementResult>> {
  return runAdministratorCommand<VoidSettlementResult>(
    deps,
    context,
    {
      commandType: "voidSettlement",
      payload: {
        businessId: input.businessId,
        settlementId: input.settlementId,
        reasonText: input.reasonText,
        reference: input.reference,
      },
      rejectionAudit: {
        actionType: "settlement_voided",
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
      const businessId = requireBusinessId(input.businessId);
      const reasonText = requireText("reasonText", input.reasonText);
      const reference = requireText("reference", input.reference);
      if (typeof input.settlementId !== "string" || !UUID_PATTERN.test(input.settlementId)) {
        throw commercialSettlementNotFoundError(String(input.settlementId));
      }

      // Serialises concurrent voids/confirmations of this settlement.
      const settlement = await lockSettlement(tx, input.settlementId);
      if (settlement === null || settlement.businessId !== businessId) {
        throw commercialSettlementNotFoundError(input.settlementId);
      }
      if (settlement.status !== "confirmed" || settlement.ledgerEntryId === null) {
        throw commercialStateConflictError(
          settlement.status === "voided"
            ? `Settlement "${settlement.id}" is already voided.`
            : `Settlement "${settlement.id}" is "${settlement.status}"; only a confirmed settlement can be voided (a recorded settlement granted no credit to reverse).`,
        );
      }

      // Baseline under the account lock (accurate audit chain under concurrency).
      const before = await lockCommercialAccount(tx, businessId);
      if (before === null) throw commercialAccountNotFoundError(businessId);
      assertCounterInRange("Paid balance", before.paidBalanceUnits - settlement.unitsPurchased);

      const posted = await postCommercialLedgerEntry(tx, {
        businessId,
        entryType: "settlement_void_reversal",
        bucket: "paid",
        unitsDelta: -settlement.unitsPurchased,
        sourceReference: { type: "settlement", id: settlement.id },
        reasonCode: "settlement_void",
        reasonText,
        idempotencyScopeKey: settlementVoidReversalScopeKey(settlement.id),
        createdBy: actor.id,
        correlationId: context.correlationId,
      });
      if (posted.outcome !== "posted") {
        throw new CommercialDomainError(
          "INVALID_STATE_TRANSITION",
          `A void reversal already exists for settlement "${settlement.id}"; refusing to compensate twice.`,
        );
      }

      const voided = await markSettlementVoided(tx, {
        settlementId: settlement.id,
        voidedBy: actor.id,
        voidReasonText: reasonText,
        voidReference: reference,
        voidIdempotencyKey: context.idempotencyKey,
        correlationId: context.correlationId,
        voidLedgerEntryId: posted.entry.id,
      });
      if (voided === null || voided.voidedAt === null) {
        throw commercialStateConflictError(`Settlement "${settlement.id}" could not be voided.`);
      }

      const audit = await appendCommercialAuditEvent(tx, {
        actor,
        actionType: "settlement_voided",
        targetType: "settlement",
        targetId: settlement.id,
        businessId,
        reasonText,
        reference,
        correlationId: context.correlationId,
        idempotencyKey: context.idempotencyKey,
        result: "succeeded",
        beforeSnapshot: {
          settlementStatus: "confirmed",
          paidBalanceUnits: before.paidBalanceUnits,
          accountVersion: before.version,
        },
        afterSnapshot: {
          settlementStatus: "voided",
          paidBalanceUnits: posted.entry.paidAfter,
          accountVersion: posted.entry.accountVersion,
          unitsReversed: settlement.unitsPurchased,
          originalLedgerEntryId: settlement.ledgerEntryId,
          reversalLedgerEntryId: posted.entry.id,
        },
        ledgerEntryId: posted.entry.id,
        priceScheduleId: settlement.priceScheduleId,
      });
      return {
        result: {
          settlementId: settlement.id,
          businessId,
          status: "voided",
          unitsReversed: settlement.unitsPurchased,
          originalLedgerEntryId: settlement.ledgerEntryId,
          reversalLedgerEntryId: posted.entry.id,
          ledgerAccountVersion: posted.entry.accountVersion,
          paidBalanceAfter: posted.entry.paidAfter,
          voidedAt: voided.voidedAt.toISOString(),
          auditEventId: audit?.id ?? null,
        },
        resultReference: settlement.id,
      };
    },
  );
}
