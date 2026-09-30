/**
 * `openCommercialAccount` (`WP-COM-03`; design §15 #1, §14).
 *
 * DECISION -- an explicit command IS required. Nothing else creates a
 * Commercial account: every other command (and the ledger posting primitive)
 * fails with "no account" until one exists, and the account's settlement
 * market must be seeded from the Business's country at opening and then
 * frozen (design §14). An implicit open inside the first grant/settlement
 * would have to smuggle a market into unrelated commands.
 *
 * What it does: creates the ZERO-state account (version 0, no trial, no paid
 * credit, no restriction, not activated) for a Business that exists and
 * trades in a launch market, records the `account_opened` standing event and
 * audit row. What it deliberately does NOT do: grant trial or paid capacity,
 * set or read any price, activate paid service, or restrict.
 *
 * The Business lookup is a Firestore read owned by another domain, so it is
 * injected (`resolveBusinessCountry`) rather than imported: Commercial keeps
 * no import path into the Business/Loyalty domains. `commercial_effective_from`
 * is the opening instant, so Rewards made available before it are never billed
 * retroactively (design §11).
 */

import {
  COMMERCIAL_MARKETS,
  isCommercialMarket,
  type CommercialMarket,
} from "../models/commercialFoundation";
import {
  commercialBusinessNotFoundError,
  commercialAccountAlreadyExistsError,
  commercialValidationError,
} from "../models/commercialErrors";
import { insertCommercialAccount } from "../repositories/commercialAccountRepository";
import { appendCommercialAuditEvent } from "../repositories/commercialAuditRepository";
import { insertStandingEvent } from "../repositories/commercialStandingRepository";
import {
  runAdministratorCommand,
  type CommercialCommandContext,
  type CommercialCommandDeps,
  type CommercialCommandResponse,
} from "./commercialAdministratorCommand";
import { requireBusinessId, requireText } from "./commercialCommandInput";

export type OpenCommercialAccountDeps = CommercialCommandDeps & {
  /** Returns the Business's `countryCode`, or `null` when the Business does not exist. */
  readonly resolveBusinessCountry: (businessId: string) => Promise<string | null>;
};

export type OpenCommercialAccountInput = {
  readonly businessId: string;
  readonly reasonText: string;
};

export type OpenCommercialAccountResult = {
  readonly businessId: string;
  readonly settlementMarket: CommercialMarket;
  readonly commercialEffectiveFrom: string;
  readonly version: number;
  readonly auditEventId: string | null;
};

export async function openCommercialAccount(
  deps: OpenCommercialAccountDeps,
  context: CommercialCommandContext,
  input: OpenCommercialAccountInput,
): Promise<CommercialCommandResponse<OpenCommercialAccountResult>> {
  return runAdministratorCommand<OpenCommercialAccountResult>(
    deps,
    context,
    {
      commandType: "openCommercialAccount",
      payload: { businessId: input.businessId, reasonText: input.reasonText },
      rejectionAudit: {
        actionType: "account_opened",
        businessId: typeof input.businessId === "string" ? input.businessId : "",
        targetType: "commercial_account",
        targetId: typeof input.businessId === "string" ? input.businessId : "",
        auditedCategories: ["IDEMPOTENCY_CONFLICT", "INVALID_STATE_TRANSITION"],
      },
    },
    async (tx, actor) => {
      const businessId = requireBusinessId(input.businessId);
      const reasonText = requireText("reasonText", input.reasonText);

      const country = await deps.resolveBusinessCountry(businessId);
      if (country === null) throw commercialBusinessNotFoundError(businessId);
      if (!isCommercialMarket(country)) {
        throw commercialValidationError(
          `Business "${businessId}" trades in "${String(country)}"; Commercial accounts exist only for the launch markets ${COMMERCIAL_MARKETS.join(" and ")}.`,
        );
      }
      const now = (deps.now ?? (() => new Date()))();

      const account = await insertCommercialAccount(tx, {
        businessId,
        settlementMarket: country,
        commercialEffectiveFrom: now,
        correlationId: context.correlationId,
      });
      if (account === null) throw commercialAccountAlreadyExistsError(businessId);

      await insertStandingEvent(tx, {
        businessId,
        eventType: "account_opened",
        actorId: actor.id,
        reasonText,
        idempotencyScopeKey: `cmd:${context.idempotencyKey}:account_opened`,
        correlationId: context.correlationId,
      });
      const audit = await appendCommercialAuditEvent(tx, {
        actor,
        actionType: "account_opened",
        targetType: "commercial_account",
        targetId: businessId,
        businessId,
        reasonText,
        correlationId: context.correlationId,
        idempotencyKey: context.idempotencyKey,
        result: "succeeded",
        beforeSnapshot: null,
        afterSnapshot: {
          settlementMarket: account.settlementMarket,
          commercialEffectiveFrom: account.commercialEffectiveFrom.toISOString(),
          trialRemainingUnits: 0,
          paidBalanceUnits: 0,
          serviceRestriction: account.serviceRestriction,
          version: account.version,
        },
      });
      return {
        result: {
          businessId,
          settlementMarket: account.settlementMarket,
          commercialEffectiveFrom: account.commercialEffectiveFrom.toISOString(),
          version: account.version,
          auditEventId: audit?.id ?? null,
        },
        resultReference: businessId,
      };
    },
  );
}
