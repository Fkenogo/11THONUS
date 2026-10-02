/**
 * `restrictNewStarts` / `restoreCommercialStanding` (`WP-COM-03`; design §11,
 * §15 #8/#9).
 *
 * These record ONE governed administrative fact -- the stored
 * `service_restriction` dimension ('none' | 'restricted') -- plus an immutable
 * standing event and an audit row, atomically. They affect Commercial standing
 * ONLY:
 *  - no purchase, Verified Unit, Circle, Reward or redemption is read or
 *    written (this domain has no import path to them);
 *  - no capacity gate is implemented: nothing consults the flag yet, so it
 *    blocks nothing today (the gate is a later package);
 *  - restoration does not admit anything: no pending-admission state exists,
 *    so there is nothing to re-evaluate (the design's re-evaluation trigger
 *    belongs with the admission package).
 * Commercial standing does not drive `Business.status`.
 *
 * State conflicts (restricting an already restricted account, restoring one
 * that is not restricted) are refused under a new idempotency key and audited
 * `denied`; the same key replays the original result.
 */

import {
  commercialAccountNotFoundError,
  commercialStateConflictError,
} from "../models/commercialErrors";
import type { CommercialAuditActionType } from "../models/commercialFoundation";
import {
  lockCommercialAccount,
  updateAccountAdministrativeState,
} from "../repositories/commercialAccountRepository";
import { appendCommercialAuditEvent } from "../repositories/commercialAuditRepository";
import { insertStandingEvent } from "../repositories/commercialStandingRepository";
import {
  runAdministratorCommand,
  type CommercialCommandContext,
  type CommercialCommandDeps,
  type CommercialCommandResponse,
} from "./commercialAdministratorCommand";
import { optionalText, requireBusinessId, requireText } from "./commercialCommandInput";

export type RestrictNewStartsInput = {
  readonly businessId: string;
  readonly reasonText: string;
  /** Mandatory for restriction (design §15 #8: reason mandatory; brief: reason/reference). */
  readonly reference: string;
};

export type RestoreCommercialStandingInput = {
  readonly businessId: string;
  readonly reasonText: string;
  readonly reference?: string;
};

export type CommercialRestrictionResult = {
  readonly businessId: string;
  readonly serviceRestriction: "none" | "restricted";
  readonly accountVersion: number;
  readonly auditEventId: string | null;
};

export function restrictNewStarts(
  deps: CommercialCommandDeps,
  context: CommercialCommandContext,
  input: RestrictNewStartsInput,
): Promise<CommercialCommandResponse<CommercialRestrictionResult>> {
  return runRestrictionCommand(deps, context, {
    commandType: "restrictNewStarts",
    actionType: "service_restricted",
    standingEvent: "service_restricted",
    target: "restricted",
    businessId: input.businessId,
    reasonText: input.reasonText,
    reference: input.reference,
    referenceRequired: true,
  });
}

export function restoreCommercialStanding(
  deps: CommercialCommandDeps,
  context: CommercialCommandContext,
  input: RestoreCommercialStandingInput,
): Promise<CommercialCommandResponse<CommercialRestrictionResult>> {
  return runRestrictionCommand(deps, context, {
    commandType: "restoreCommercialStanding",
    actionType: "service_restored",
    standingEvent: "service_restored",
    target: "none",
    businessId: input.businessId,
    reasonText: input.reasonText,
    reference: input.reference,
    referenceRequired: false,
  });
}

type RestrictionSpec = {
  readonly commandType: string;
  readonly actionType: CommercialAuditActionType;
  readonly standingEvent: "service_restricted" | "service_restored";
  readonly target: "none" | "restricted";
  readonly businessId: string;
  readonly reasonText: string;
  readonly reference: string | undefined;
  readonly referenceRequired: boolean;
};

function runRestrictionCommand(
  deps: CommercialCommandDeps,
  context: CommercialCommandContext,
  spec: RestrictionSpec,
): Promise<CommercialCommandResponse<CommercialRestrictionResult>> {
  return runAdministratorCommand<CommercialRestrictionResult>(
    deps,
    context,
    {
      commandType: spec.commandType,
      // Restoring (restricted -> none, always a real change: a no-op restore is refused above)
      // lifts the `restricted` hold; restricting can only ever hold MORE, never admit.
      capacityIncrease: (result) =>
        spec.target === "none" && result.serviceRestriction === "none" ? "standing_restored" : null,
      payload: {
        businessId: spec.businessId,
        reasonText: spec.reasonText,
        reference: spec.reference,
      },
      rejectionAudit: {
        actionType: spec.actionType,
        businessId: typeof spec.businessId === "string" ? spec.businessId : "",
        targetType: "commercial_account",
        targetId: typeof spec.businessId === "string" ? spec.businessId : "",
        auditedCategories: ["IDEMPOTENCY_CONFLICT", "INVALID_STATE_TRANSITION"],
      },
    },
    async (tx, actor) => {
      const businessId = requireBusinessId(spec.businessId);
      const reasonText = requireText("reasonText", spec.reasonText);
      const reference = spec.referenceRequired
        ? requireText("reference", spec.reference)
        : optionalText("reference", spec.reference);

      const before = await lockCommercialAccount(tx, businessId);
      if (before === null) throw commercialAccountNotFoundError(businessId);
      if (before.serviceRestriction === spec.target) {
        throw commercialStateConflictError(
          spec.target === "restricted"
            ? `Business "${businessId}" is already restricted.`
            : `Business "${businessId}" is not restricted; there is nothing to restore.`,
        );
      }

      const after = await updateAccountAdministrativeState(tx, businessId, {
        serviceRestriction: spec.target,
      });
      if (after === null) throw commercialAccountNotFoundError(businessId);

      await insertStandingEvent(tx, {
        businessId,
        eventType: spec.standingEvent,
        actorId: actor.id,
        reasonText,
        idempotencyScopeKey: `cmd:${context.idempotencyKey}:${spec.standingEvent}`,
        correlationId: context.correlationId,
      });
      const audit = await appendCommercialAuditEvent(tx, {
        actor,
        actionType: spec.actionType,
        targetType: "commercial_account",
        targetId: businessId,
        businessId,
        reasonText,
        reference,
        correlationId: context.correlationId,
        idempotencyKey: context.idempotencyKey,
        result: "succeeded",
        beforeSnapshot: {
          serviceRestriction: before.serviceRestriction,
          accountVersion: before.version,
        },
        afterSnapshot: {
          serviceRestriction: after.serviceRestriction,
          accountVersion: after.version,
        },
      });
      return {
        result: {
          businessId,
          serviceRestriction: after.serviceRestriction,
          accountVersion: after.version,
          auditEventId: audit?.id ?? null,
        },
        resultReference: businessId,
      };
    },
  );
}
