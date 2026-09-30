/**
 * `adjustCommercialCredit` (`WP-COM-03`; design §10.3, §12, §15 #6).
 *
 * A governed MANUAL paid-credit adjustment, separate from the credit a
 * confirmed settlement produces. Explicit signed non-zero units; reason code
 * from the closed operational vocabulary (correction, settlement_reconciliation,
 * dispute_resolution, error_reversal); reason text AND reference mandatory;
 * audited; idempotent; posted only through the canonical ledger flow
 * (`credit_adjustment`, paid bucket) -- there is no direct balance write.
 *
 * The paid balance may go negative: there is NO floor and NO maximum (the only
 * bound is the 32-bit INTEGER storage width of the counter, a technical limit).
 *
 * It is NOT a complimentary-plan mechanism: no complimentary / pilot / partner /
 * promotional reason code exists, so such an arrangement cannot be expressed
 * here. Whether one may exist is the open `DEC-SUB-013` question; this command
 * does not decide it.
 */

import { randomUUID } from "node:crypto";
import { COMMERCIAL_CREDIT_ADJUSTMENT_REASON_CODES } from "../models/commercialAdministration";
import {
  CommercialDomainError,
  commercialAccountNotFoundError,
  commercialValidationError,
} from "../models/commercialErrors";
import { lockCommercialAccount } from "../repositories/commercialAccountRepository";
import { appendCommercialAuditEvent } from "../repositories/commercialAuditRepository";
import { insertManualAdjustment } from "../repositories/commercialProvenanceRepository";
import {
  runAdministratorCommand,
  type CommercialCommandContext,
  type CommercialCommandDeps,
  type CommercialCommandResponse,
} from "./commercialAdministratorCommand";
import {
  assertCounterInRange,
  requireBusinessId,
  requireSignedUnits,
  requireText,
} from "./commercialCommandInput";
import { postCommercialLedgerEntry } from "./postCommercialLedgerEntry";

export type AdjustCommercialCreditInput = {
  readonly businessId: string;
  /** Signed, non-zero change to the paid balance. */
  readonly unitsDelta: number;
  readonly reasonCode: string;
  readonly reasonText: string;
  readonly reference: string;
};

export type AdjustCommercialCreditResult = {
  readonly adjustmentId: string;
  readonly businessId: string;
  readonly unitsDelta: number;
  readonly ledgerEntryId: string;
  readonly ledgerAccountVersion: number;
  readonly paidBalanceAfter: number;
  readonly auditEventId: string | null;
};

export async function adjustCommercialCredit(
  deps: CommercialCommandDeps,
  context: CommercialCommandContext,
  input: AdjustCommercialCreditInput,
): Promise<CommercialCommandResponse<AdjustCommercialCreditResult>> {
  return runAdministratorCommand<AdjustCommercialCreditResult>(
    deps,
    context,
    {
      commandType: "adjustCommercialCredit",
      payload: {
        businessId: input.businessId,
        unitsDelta: input.unitsDelta,
        reasonCode: input.reasonCode,
        reasonText: input.reasonText,
        reference: input.reference,
      },
      rejectionAudit: {
        actionType: "credit_adjusted",
        businessId: typeof input.businessId === "string" ? input.businessId : "",
        targetType: "credit_adjustment",
        targetId: typeof input.businessId === "string" ? input.businessId : "",
        auditedCategories: ["IDEMPOTENCY_CONFLICT", "INVALID_STATE_TRANSITION"],
      },
    },
    async (tx, actor) => {
      const businessId = requireBusinessId(input.businessId);
      const unitsDelta = requireSignedUnits("unitsDelta", input.unitsDelta);
      const reasonText = requireText("reasonText", input.reasonText);
      const reference = requireText("reference", input.reference);
      if (
        !(COMMERCIAL_CREDIT_ADJUSTMENT_REASON_CODES as readonly string[]).includes(input.reasonCode)
      ) {
        throw commercialValidationError(
          `reasonCode must be one of: ${COMMERCIAL_CREDIT_ADJUSTMENT_REASON_CODES.join(", ")}.`,
        );
      }

      const before = await lockCommercialAccount(tx, businessId);
      if (before === null) throw commercialAccountNotFoundError(businessId);
      assertCounterInRange("Paid balance", before.paidBalanceUnits + unitsDelta);

      const adjustmentId = randomUUID();
      const posted = await postCommercialLedgerEntry(tx, {
        businessId,
        entryType: "credit_adjustment",
        bucket: "paid",
        unitsDelta,
        sourceReference: { type: "manual_adjustment", id: adjustmentId },
        reasonCode: input.reasonCode,
        reasonText,
        idempotencyScopeKey: `cmd:${context.idempotencyKey}:credit_adjustment`,
        createdBy: actor.id,
        correlationId: context.correlationId,
      });
      if (posted.outcome !== "posted") {
        throw new CommercialDomainError(
          "INVALID_STATE_TRANSITION",
          "A ledger entry already exists for this adjustment command; refusing to adjust twice.",
        );
      }
      const adjustment = await insertManualAdjustment(tx, {
        id: adjustmentId,
        businessId,
        bucket: "paid",
        unitsDelta,
        reasonCode: input.reasonCode,
        reasonText,
        reference,
        createdBy: actor.id,
        ledgerEntryId: posted.entry.id,
        idempotencyKey: context.idempotencyKey,
        correlationId: context.correlationId,
      });

      const audit = await appendCommercialAuditEvent(tx, {
        actor,
        actionType: "credit_adjusted",
        targetType: "credit_adjustment",
        targetId: adjustment.id,
        businessId,
        reasonCode: input.reasonCode,
        reasonText,
        reference,
        correlationId: context.correlationId,
        idempotencyKey: context.idempotencyKey,
        result: "succeeded",
        beforeSnapshot: {
          paidBalanceUnits: before.paidBalanceUnits,
          accountVersion: before.version,
        },
        afterSnapshot: {
          paidBalanceUnits: posted.entry.paidAfter,
          accountVersion: posted.entry.accountVersion,
          unitsDelta,
        },
        ledgerEntryId: posted.entry.id,
      });
      return {
        result: {
          adjustmentId: adjustment.id,
          businessId,
          unitsDelta,
          ledgerEntryId: posted.entry.id,
          ledgerAccountVersion: posted.entry.accountVersion,
          paidBalanceAfter: posted.entry.paidAfter,
          auditEventId: audit?.id ?? null,
        },
        resultReference: adjustment.id,
      };
    },
  );
}
