/**
 * `adjustTrial` (`WP-COM-03`; design §9, §15 #3; `DEC-SUB-014` §8.2).
 *
 * An explicit, signed, attributable, audited change to the Business's trial
 * allowance, through the canonical ledger flow (`trial_adjustment`, trial
 * bucket). Reason AND reference are mandatory.
 *
 * Integrity floor (a determinism invariant, NOT a policy ceiling): a downward
 * adjustment cannot take trial below the amount already RESERVED against
 * admitted Circles, nor below zero -- that would silently re-classify those
 * Circles from trial to paid. The adjustable quantity is the uncommitted trial
 * (`trial_remaining - trial_reserved`). The floor is checked under the account
 * lock; the ledger primitive and the database enforce it again.
 *
 * No aggregate or lifetime ceiling is governed and NONE is encoded, in either
 * direction. That absence is NOT an authorisation of unlimited adjustment: each
 * adjustment stands or falls as an individually reasoned, audited act, and any
 * ceiling would be a new Founder decision. `DEC-SUB-013` stays open.
 */

import { randomUUID } from "node:crypto";
import { COMMERCIAL_REASON_CODE_PATTERN } from "../models/commercialAdministration";
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

export type AdjustTrialInput = {
  readonly businessId: string;
  /** Signed, non-zero change to the trial allowance. */
  readonly unitsDelta: number;
  readonly reasonText: string;
  readonly reference: string;
  /** Optional shape-checked label; no vocabulary is invented for trial adjustments. */
  readonly reasonCode?: string;
};

export type AdjustTrialResult = {
  readonly adjustmentId: string;
  readonly businessId: string;
  readonly unitsDelta: number;
  readonly ledgerEntryId: string;
  readonly ledgerAccountVersion: number;
  readonly trialRemainingAfter: number;
  readonly auditEventId: string | null;
};

export async function adjustTrial(
  deps: CommercialCommandDeps,
  context: CommercialCommandContext,
  input: AdjustTrialInput,
): Promise<CommercialCommandResponse<AdjustTrialResult>> {
  return runAdministratorCommand<AdjustTrialResult>(
    deps,
    context,
    {
      commandType: "adjustTrial",
      // Only a POSITIVE delta raises capacity; a reduction can never admit anything.
      capacityIncrease: (result) => (result.unitsDelta > 0 ? "trial_adjusted_up" : null),
      payload: {
        businessId: input.businessId,
        unitsDelta: input.unitsDelta,
        reasonText: input.reasonText,
        reference: input.reference,
        reasonCode: input.reasonCode,
      },
      rejectionAudit: {
        actionType: "trial_adjusted",
        businessId: typeof input.businessId === "string" ? input.businessId : "",
        targetType: "trial_adjustment",
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
        input.reasonCode !== undefined &&
        (typeof input.reasonCode !== "string" ||
          !COMMERCIAL_REASON_CODE_PATTERN.test(input.reasonCode))
      ) {
        throw commercialValidationError(
          "reasonCode, when supplied, must be a lower-case label of letters, digits and underscores.",
        );
      }

      const before = await lockCommercialAccount(tx, businessId);
      if (before === null) throw commercialAccountNotFoundError(businessId);

      const uncommitted = before.trialRemainingUnits - before.trialReservedUnits;
      if (unitsDelta < 0 && -unitsDelta > uncommitted) {
        throw commercialValidationError(
          `Trial cannot be reduced by ${-unitsDelta}: only ${uncommitted} uncommitted trial unit(s) can be removed (trial already reserved for admitted Circles is protected, and trial cannot fall below zero).`,
        );
      }
      assertCounterInRange("Trial remaining", before.trialRemainingUnits + unitsDelta);

      const adjustmentId = randomUUID();
      const posted = await postCommercialLedgerEntry(tx, {
        businessId,
        entryType: "trial_adjustment",
        bucket: "trial",
        unitsDelta,
        sourceReference: { type: "manual_adjustment", id: adjustmentId },
        reasonCode: input.reasonCode,
        reasonText,
        idempotencyScopeKey: `cmd:${context.idempotencyKey}:trial_adjustment`,
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
        bucket: "trial",
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
        actionType: "trial_adjusted",
        targetType: "trial_adjustment",
        targetId: adjustment.id,
        businessId,
        reasonCode: input.reasonCode,
        reasonText,
        reference,
        correlationId: context.correlationId,
        idempotencyKey: context.idempotencyKey,
        result: "succeeded",
        beforeSnapshot: {
          trialRemainingUnits: before.trialRemainingUnits,
          trialReservedUnits: before.trialReservedUnits,
          accountVersion: before.version,
        },
        afterSnapshot: {
          trialRemainingUnits: posted.entry.trialAfter,
          trialReservedUnits: posted.entry.trialReservedAfter,
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
          trialRemainingAfter: posted.entry.trialAfter,
          auditEventId: audit?.id ?? null,
        },
        resultReference: adjustment.id,
      };
    },
  );
}
