/**
 * `cancelSettlement` (`WP-COM-03A`; closes WP-COM-03 deviation D3;
 * design §10).
 *
 * Withdraws a mistaken `recorded` settlement BEFORE any Commercial credit was
 * granted. The evidence row is kept forever and marked `cancelled` with
 * immutable cancellation provenance; nothing is deleted or rewritten. This is
 * NOT a refund and NOT a void: a cancellation has NO ledger effect -- it posts
 * no ledger entry, moves no account counter and touches no price or Loyalty
 * data. A settlement that already granted credit is corrected only by
 * `voidSettlement` (`confirmed -> voided`, compensating entry).
 *
 * Transition table
 *   initial state : recorded   (confirmed | voided | cancelled ->
 *                               INVALID_STATE_TRANSITION)
 *   resulting     : cancelled  (terminal: it can never confirm, void or cancel again)
 *   actor         : active Platform Administrator, verified MFA
 *   reference     : mandatory reason text AND reference
 *   idempotency   : client key bound to command + actor + payload. Same
 *                   key+payload replays the stored result; a new key on a
 *                   cancelled settlement is refused; another actor, command,
 *                   payload or Business under the same key conflicts
 *   audit         : `settlement_cancelled` with the settlement status and the
 *                   account counters before/after (equal: no account mutation),
 *                   written in the same transaction as the cancellation
 * Lock order matches `confirmSettlement` and `voidSettlement`: settlement row,
 * then account. The row lock serialises cancel/cancel and cancel/confirm, so
 * exactly one terminal transition wins; the database transition guard and the
 * ledger insert guard (migration 0024) back this up independently.
 */

import {
  commercialAccountNotFoundError,
  commercialSettlementNotFoundError,
  commercialStateConflictError,
} from "../models/commercialErrors";
import { lockCommercialAccount } from "../repositories/commercialAccountRepository";
import { appendCommercialAuditEvent } from "../repositories/commercialAuditRepository";
import {
  lockSettlement,
  markSettlementCancelled,
} from "../repositories/commercialSettlementRepository";
import {
  runAdministratorCommand,
  type CommercialCommandContext,
  type CommercialCommandDeps,
  type CommercialCommandResponse,
} from "./commercialAdministratorCommand";
import { requireBusinessId, requireText } from "./commercialCommandInput";

export type CancelSettlementInput = {
  readonly businessId: string;
  readonly settlementId: string;
  readonly reasonText: string;
  readonly reference: string;
};

/** JSON-safe (it is stored as the idempotent response snapshot). */
export type CancelSettlementResult = {
  readonly settlementId: string;
  readonly businessId: string;
  readonly status: "cancelled";
  readonly cancelledAt: string;
  readonly auditEventId: string | null;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function cancelSettlement(
  deps: CommercialCommandDeps,
  context: CommercialCommandContext,
  input: CancelSettlementInput,
): Promise<CommercialCommandResponse<CancelSettlementResult>> {
  return runAdministratorCommand<CancelSettlementResult>(
    deps,
    context,
    {
      commandType: "cancelSettlement",
      payload: {
        businessId: input.businessId,
        settlementId: input.settlementId,
        reasonText: input.reasonText,
        reference: input.reference,
      },
      rejectionAudit: {
        actionType: "settlement_cancelled",
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

      // Serialises concurrent cancels and confirmations of this settlement.
      const settlement = await lockSettlement(tx, input.settlementId);
      if (settlement === null || settlement.businessId !== businessId) {
        throw commercialSettlementNotFoundError(input.settlementId);
      }
      if (settlement.status !== "recorded") {
        throw commercialStateConflictError(
          settlement.status === "cancelled"
            ? `Settlement "${settlement.id}" is already cancelled.`
            : settlement.status === "voided"
              ? `Settlement "${settlement.id}" is voided; a voided settlement cannot be cancelled.`
              : `Settlement "${settlement.id}" is "${settlement.status}"; only a recorded settlement can be cancelled (a confirmed settlement that granted credit is corrected by a void).`,
        );
      }

      // Baseline captured under the settlement row lock (which decides the terminal transition)
      // and the account lock (same order as confirm/void), so the audited account state is exact.
      const before = await lockCommercialAccount(tx, businessId);
      if (before === null) throw commercialAccountNotFoundError(businessId);

      const cancelled = await markSettlementCancelled(tx, {
        settlementId: settlement.id,
        cancelledBy: actor.id,
        cancelReasonText: reasonText,
        cancelReference: reference,
        cancelIdempotencyKey: context.idempotencyKey,
        correlationId: context.correlationId,
      });
      if (cancelled === null || cancelled.cancelledAt === null) {
        throw commercialStateConflictError(`Settlement "${settlement.id}" could not be cancelled.`);
      }

      const audit = await appendCommercialAuditEvent(tx, {
        actor,
        actionType: "settlement_cancelled",
        targetType: "settlement",
        targetId: settlement.id,
        businessId,
        reasonText,
        reference,
        correlationId: context.correlationId,
        idempotencyKey: context.idempotencyKey,
        result: "succeeded",
        beforeSnapshot: {
          settlementStatus: "recorded",
          paidBalanceUnits: before.paidBalanceUnits,
          accountVersion: before.version,
        },
        afterSnapshot: {
          settlementStatus: "cancelled",
          // A cancellation has no ledger effect: the account is exactly as it was.
          paidBalanceUnits: before.paidBalanceUnits,
          accountVersion: before.version,
          unitsPurchased: settlement.unitsPurchased,
          amountMinor: settlement.amountMinor,
          currency: settlement.currency,
          settlementReference: settlement.externalReference,
        },
        priceScheduleId: settlement.priceScheduleId,
      });

      return {
        result: {
          settlementId: settlement.id,
          businessId,
          status: "cancelled",
          cancelledAt: cancelled.cancelledAt.toISOString(),
          auditEventId: audit?.id ?? null,
        },
        resultReference: settlement.id,
      };
    },
  );
}
