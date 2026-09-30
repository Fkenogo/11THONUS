/**
 * `grantTrial` (`WP-COM-03`; design §9, §15 #2; `DEC-SUB-014` / `FD-COM-001`).
 *
 * Grants ONE explicit initial trial allowance. The administrator must choose
 * `units` from the governed range 3..5 inclusive: there is NO default, NO
 * automatic grant, and no plan/tier concept. The range applies to each single
 * grant; it is NOT a lifetime cap and a Business may have more than one grant
 * (each a separate, attributable, audited, idempotent act). To guard against an
 * accidental repeat the result returns the Business's prior grants; this
 * informs the administrator and never blocks (design §9).
 *
 * The credit goes through the canonical ledger flow only
 * (`postCommercialLedgerEntry`, `trial_grant`, trial bucket); the grant row is
 * provenance backed by that entry (database-enforced). Baselines are read under
 * the account lock.
 *
 * `DEC-SUB-013` stays open: a grant is the launch onboarding allowance, not a
 * complimentary arrangement. Reason AND reference are mandatory and audit-visible.
 */

import { randomUUID } from "node:crypto";
import {
  TRIAL_INITIAL_GRANT_MAX_UNITS,
  TRIAL_INITIAL_GRANT_MIN_UNITS,
} from "../models/commercialAdministration";
import {
  CommercialDomainError,
  commercialAccountNotFoundError,
  commercialValidationError,
} from "../models/commercialErrors";
import { lockCommercialAccount } from "../repositories/commercialAccountRepository";
import { appendCommercialAuditEvent } from "../repositories/commercialAuditRepository";
import { insertTrialGrant, listTrialGrants } from "../repositories/commercialProvenanceRepository";
import {
  runAdministratorCommand,
  type CommercialCommandContext,
  type CommercialCommandDeps,
  type CommercialCommandResponse,
} from "./commercialAdministratorCommand";
import { requireBusinessId, requireText } from "./commercialCommandInput";
import { postCommercialLedgerEntry } from "./postCommercialLedgerEntry";

export type GrantTrialInput = {
  readonly businessId: string;
  /** REQUIRED, no default: a whole number from 3 to 5 inclusive. */
  readonly units: number;
  readonly reasonText: string;
  readonly reference: string;
};

export type GrantTrialResult = {
  readonly grantId: string;
  readonly businessId: string;
  readonly units: number;
  readonly ledgerEntryId: string;
  readonly ledgerAccountVersion: number;
  readonly trialRemainingAfter: number;
  /** Informational only (never a block): grants that already existed before this one. */
  readonly priorGrants: readonly {
    readonly grantId: string;
    readonly units: number;
    readonly grantedAt: string;
  }[];
  readonly auditEventId: string | null;
};

export async function grantTrial(
  deps: CommercialCommandDeps,
  context: CommercialCommandContext,
  input: GrantTrialInput,
): Promise<CommercialCommandResponse<GrantTrialResult>> {
  return runAdministratorCommand<GrantTrialResult>(
    deps,
    context,
    {
      commandType: "grantTrial",
      payload: {
        businessId: input.businessId,
        units: input.units,
        reasonText: input.reasonText,
        reference: input.reference,
      },
      rejectionAudit: {
        actionType: "trial_granted",
        businessId: typeof input.businessId === "string" ? input.businessId : "",
        targetType: "trial_grant",
        targetId: typeof input.businessId === "string" ? input.businessId : "",
        auditedCategories: ["IDEMPOTENCY_CONFLICT", "INVALID_STATE_TRANSITION"],
      },
    },
    async (tx, actor) => {
      const businessId = requireBusinessId(input.businessId);
      const reasonText = requireText("reasonText", input.reasonText);
      const reference = requireText("reference", input.reference);
      const units = input.units;
      if (
        typeof units !== "number" ||
        !Number.isInteger(units) ||
        units < TRIAL_INITIAL_GRANT_MIN_UNITS ||
        units > TRIAL_INITIAL_GRANT_MAX_UNITS
      ) {
        throw commercialValidationError(
          `An initial trial grant must be chosen explicitly as a whole number from ${TRIAL_INITIAL_GRANT_MIN_UNITS} to ${TRIAL_INITIAL_GRANT_MAX_UNITS} units; there is no default.`,
        );
      }

      const before = await lockCommercialAccount(tx, businessId);
      if (before === null) throw commercialAccountNotFoundError(businessId);
      const prior = await listTrialGrants(tx, businessId);

      const grantId = randomUUID();
      const posted = await postCommercialLedgerEntry(tx, {
        businessId,
        entryType: "trial_grant",
        bucket: "trial",
        unitsDelta: units,
        sourceReference: { type: "trial_grant", id: grantId },
        reasonCode: "initial_trial_grant",
        reasonText,
        idempotencyScopeKey: `cmd:${context.idempotencyKey}:trial_grant`,
        createdBy: actor.id,
        correlationId: context.correlationId,
      });
      if (posted.outcome !== "posted") {
        throw new CommercialDomainError(
          "INVALID_STATE_TRANSITION",
          "A ledger entry already exists for this grant command; refusing to grant twice.",
        );
      }
      const grant = await insertTrialGrant(tx, {
        id: grantId,
        businessId,
        units,
        grantedBy: actor.id,
        reasonText,
        reference,
        ledgerEntryId: posted.entry.id,
        idempotencyKey: context.idempotencyKey,
        correlationId: context.correlationId,
      });

      const audit = await appendCommercialAuditEvent(tx, {
        actor,
        actionType: "trial_granted",
        targetType: "trial_grant",
        targetId: grant.id,
        businessId,
        reasonCode: "initial_trial_grant",
        reasonText,
        reference,
        correlationId: context.correlationId,
        idempotencyKey: context.idempotencyKey,
        result: "succeeded",
        beforeSnapshot: {
          trialRemainingUnits: before.trialRemainingUnits,
          accountVersion: before.version,
          priorGrantCount: prior.length,
        },
        afterSnapshot: {
          trialRemainingUnits: posted.entry.trialAfter,
          accountVersion: posted.entry.accountVersion,
          grantedUnits: units,
        },
        ledgerEntryId: posted.entry.id,
      });
      return {
        result: {
          grantId: grant.id,
          businessId,
          units,
          ledgerEntryId: posted.entry.id,
          ledgerAccountVersion: posted.entry.accountVersion,
          trialRemainingAfter: posted.entry.trialAfter,
          priorGrants: prior.map((g) => ({
            grantId: g.id,
            units: g.units,
            grantedAt: g.grantedAt.toISOString(),
          })),
          auditEventId: audit?.id ?? null,
        },
        resultReference: grant.id,
      };
    },
  );
}
