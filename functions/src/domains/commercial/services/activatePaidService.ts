/**
 * `activatePaidService` (`WP-COM-03`; design §10.1 step 3, §11, §15 #7).
 *
 * Follows the canonical design exactly; no rule is invented:
 *  - paid activation is an ADMINISTRATIVE STANDING FACT (`paid_service_activated_at`),
 *    stored, explicit, attributable, audited -- not derived from balance;
 *  - PRECONDITION: at least one CONFIRMED settlement exists for the Business
 *    (a recorded-only or voided settlement does not count);
 *  - it is SET-ONCE: an already-activated account refuses a second activation
 *    (the database also refuses to move the timestamp);
 *  - it depends on no payment provider and changes no ledger entry, balance or
 *    earmark (activation changes no admitted Circle's treatment, design §8.5.1).
 * Once set, the fact is not withdrawn if the qualifying settlement is later
 * voided (set-once); a void changes the balance, not the historical fact.
 *
 * The count and the write happen under the per-Business account lock, so a
 * concurrent settlement void (which also takes that lock) cannot interleave.
 */

import {
  commercialAccountNotFoundError,
  commercialStateConflictError,
} from "../models/commercialErrors";
import {
  lockCommercialAccount,
  updateAccountAdministrativeState,
} from "../repositories/commercialAccountRepository";
import { appendCommercialAuditEvent } from "../repositories/commercialAuditRepository";
import { countConfirmedSettlements } from "../repositories/commercialSettlementRepository";
import { insertStandingEvent } from "../repositories/commercialStandingRepository";
import {
  runAdministratorCommand,
  type CommercialCommandContext,
  type CommercialCommandDeps,
  type CommercialCommandResponse,
} from "./commercialAdministratorCommand";
import { optionalText, requireBusinessId, requireText } from "./commercialCommandInput";

export type ActivatePaidServiceInput = {
  readonly businessId: string;
  readonly reasonText: string;
  readonly reference?: string;
};

export type ActivatePaidServiceResult = {
  readonly businessId: string;
  readonly paidServiceActivatedAt: string;
  readonly confirmedSettlementCount: number;
  readonly auditEventId: string | null;
};

export async function activatePaidService(
  deps: CommercialCommandDeps,
  context: CommercialCommandContext,
  input: ActivatePaidServiceInput,
): Promise<CommercialCommandResponse<ActivatePaidServiceResult>> {
  return runAdministratorCommand<ActivatePaidServiceResult>(
    deps,
    context,
    {
      commandType: "activatePaidService",
      payload: {
        businessId: input.businessId,
        reasonText: input.reasonText,
        reference: input.reference,
      },
      rejectionAudit: {
        actionType: "paid_service_activated",
        businessId: typeof input.businessId === "string" ? input.businessId : "",
        targetType: "commercial_account",
        targetId: typeof input.businessId === "string" ? input.businessId : "",
        auditedCategories: ["IDEMPOTENCY_CONFLICT", "INVALID_STATE_TRANSITION"],
      },
    },
    async (tx, actor) => {
      const businessId = requireBusinessId(input.businessId);
      const reasonText = requireText("reasonText", input.reasonText);
      const reference = optionalText("reference", input.reference);

      const before = await lockCommercialAccount(tx, businessId);
      if (before === null) throw commercialAccountNotFoundError(businessId);
      if (before.paidServiceActivatedAt !== null) {
        throw commercialStateConflictError(
          `Paid service is already activated for Business "${businessId}" (activation is set-once).`,
        );
      }
      const confirmed = await countConfirmedSettlements(tx, businessId);
      if (confirmed < 1) {
        throw commercialStateConflictError(
          "Paid service can be activated only after at least one settlement has been confirmed for the Business.",
        );
      }
      const now = (deps.now ?? (() => new Date()))();
      const after = await updateAccountAdministrativeState(tx, businessId, {
        paidServiceActivatedAt: now,
      });
      if (after === null || after.paidServiceActivatedAt === null) {
        throw commercialAccountNotFoundError(businessId);
      }

      await insertStandingEvent(tx, {
        businessId,
        eventType: "paid_service_activated",
        actorId: actor.id,
        reasonText,
        idempotencyScopeKey: `cmd:${context.idempotencyKey}:paid_service_activated`,
        correlationId: context.correlationId,
      });
      const audit = await appendCommercialAuditEvent(tx, {
        actor,
        actionType: "paid_service_activated",
        targetType: "commercial_account",
        targetId: businessId,
        businessId,
        reasonText,
        reference,
        correlationId: context.correlationId,
        idempotencyKey: context.idempotencyKey,
        result: "succeeded",
        beforeSnapshot: { paidServiceActivatedAt: null, accountVersion: before.version },
        afterSnapshot: {
          paidServiceActivatedAt: after.paidServiceActivatedAt.toISOString(),
          confirmedSettlementCount: confirmed,
          accountVersion: after.version,
        },
      });
      return {
        result: {
          businessId,
          paidServiceActivatedAt: after.paidServiceActivatedAt.toISOString(),
          confirmedSettlementCount: confirmed,
          auditEventId: audit?.id ?? null,
        },
        resultReference: businessId,
      };
    },
  );
}
