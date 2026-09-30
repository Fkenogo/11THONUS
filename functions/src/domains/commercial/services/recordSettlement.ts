/**
 * `recordSettlement` (`WP-COM-02`; design §10.1, §15 #4) -- step 1 of 2.
 *
 * Records EVIDENCE that commercial payment was received outside any automated
 * provider integration. It creates a `recorded` settlement and grants NO
 * credit: the ledger and the account are not touched (only `confirmSettlement`
 * can finalise the effect). A recorded settlement doubles as the "manual
 * payment awaiting action" queue.
 *
 * Transition table
 *   initial state : (none)                 -- a settlement is born `recorded`
 *   resulting     : recorded
 *   actor         : active Platform Administrator with verified MFA
 *   reference     : mandatory `(method, externalReference)`, unique -- one piece
 *                   of manual evidence can be recorded once
 *   idempotency   : client key (bound to command + actor + payload); a
 *                   different key for the same reference is rejected, not a replay
 *   audit         : `settlement_recorded`, atomic with the insert
 *   repeat        : same key+payload replays the stored result; anything else
 *                   for the same reference is refused
 *
 * Pricing provenance: the schedule in force at `receivedAt` is looked up (no
 * schedule => explicit failure, no fallback, no FX) and its id and values are
 * snapshotted on the settlement together with the expected amount
 * (`units * local unit price`) and the variance (`amount - expected`).
 * Variance is recorded, never blocking (design §10.2); no tolerance is invented.
 */

import {
  MARKET_CURRENCY,
  type CommercialCurrency,
  type CommercialMarket,
} from "../models/commercialFoundation";
import {
  COMMERCIAL_MAX_SETTLEMENT_UNITS,
  COMMERCIAL_SETTLEMENT_METHOD_PATTERN,
  COMMERCIAL_SETTLEMENT_REFERENCE_MAX_LENGTH,
} from "../models/commercialSettlement";
import {
  commercialAccountNotFoundError,
  commercialSettlementReferenceConflictError,
  commercialValidationError,
} from "../models/commercialErrors";
import { lockCommercialAccount } from "../repositories/commercialAccountRepository";
import { appendCommercialAuditEvent } from "../repositories/commercialAuditRepository";
import { lockPriceScheduleMarket } from "../repositories/commercialPriceRepository";
import { insertSettlement } from "../repositories/commercialSettlementRepository";
import {
  runAdministratorCommand,
  type CommercialCommandContext,
  type CommercialCommandDeps,
  type CommercialCommandResponse,
} from "./commercialAdministratorCommand";
import { lookupCommercialPrice } from "./commercialPriceLookup";

export type RecordSettlementInput = {
  readonly businessId: string;
  /** Operator label for how the money arrived, e.g. `bank_transfer`. Shape-checked only. */
  readonly method: string;
  /** Receipt / transfer / mobile-money reference. Mandatory, unique per method. */
  readonly externalReference: string;
  readonly currency: string;
  /** Whole local currency units received. */
  readonly amountMinor: number;
  readonly unitsPurchased: number;
  readonly receivedAt: Date;
  readonly reasonText: string;
};

/** JSON-safe (it is stored as the idempotent response snapshot). */
export type RecordSettlementResult = {
  readonly settlementId: string;
  readonly businessId: string;
  readonly status: "recorded";
  readonly method: string;
  readonly externalReference: string;
  readonly market: CommercialMarket;
  readonly currency: CommercialCurrency;
  readonly amountMinor: number;
  readonly unitsPurchased: number;
  readonly receivedAt: string;
  readonly priceScheduleId: string;
  readonly unitPriceUsdMinor: number;
  readonly localUnitPriceMinor: number;
  readonly priceEffectiveFrom: string;
  readonly expectedAmountMinor: number;
  readonly varianceMinor: number;
  readonly auditEventId: string | null;
};

export async function recordSettlement(
  deps: CommercialCommandDeps,
  context: CommercialCommandContext,
  input: RecordSettlementInput,
): Promise<CommercialCommandResponse<RecordSettlementResult>> {
  const reference = typeof input.externalReference === "string" ? input.externalReference : "";
  return runAdministratorCommand<RecordSettlementResult>(
    deps,
    context,
    {
      commandType: "recordSettlement",
      payload: {
        businessId: input.businessId,
        method: input.method,
        externalReference: input.externalReference,
        currency: input.currency,
        amountMinor: input.amountMinor,
        unitsPurchased: input.unitsPurchased,
        receivedAt: input.receivedAt,
        reasonText: input.reasonText,
      },
      rejectionAudit: {
        actionType: "settlement_recorded",
        businessId: typeof input.businessId === "string" ? input.businessId : "",
        targetType: "settlement",
        targetId: `${String(input.method)}:${reference}`,
        reference,
        auditedCategories: ["IDEMPOTENCY_CONFLICT", "INVALID_STATE_TRANSITION"],
      },
    },
    async (tx, actor) => {
      validateInput(input);
      const now = (deps.now ?? (() => new Date()))();
      if (input.receivedAt.getTime() > now.getTime()) {
        throw commercialValidationError("receivedAt cannot be in the future.");
      }

      // The per-Business account lock also serialises this command against a
      // concurrent confirmation for the same Business.
      const account = await lockCommercialAccount(tx, input.businessId);
      if (account === null) throw commercialAccountNotFoundError(input.businessId);

      const market = account.settlementMarket;
      if (input.currency !== MARKET_CURRENCY[market]) {
        throw commercialValidationError(
          `Business "${input.businessId}" settles in market ${market} (${MARKET_CURRENCY[market]}); "${input.currency}" is not accepted.`,
        );
      }

      // Serialise with schedule writers BEFORE selecting the price in force, so a concurrent
      // uncommitted schedule insert cannot be missed.
      await lockPriceScheduleMarket(tx, market);

      // Explicit failure when no schedule applies; never a guessed/FX fallback.
      const price = await lookupCommercialPrice(tx, {
        market,
        currency: input.currency,
        at: input.receivedAt,
      });

      const expectedAmountMinor = input.unitsPurchased * price.localUnitPriceMinor;
      if (!Number.isSafeInteger(expectedAmountMinor)) {
        throw commercialValidationError("The expected settlement amount is out of range.");
      }
      const varianceMinor = input.amountMinor - expectedAmountMinor;

      const settlement = await insertSettlement(tx, {
        businessId: input.businessId,
        method: input.method,
        externalReference: input.externalReference,
        market,
        currency: price.currency,
        amountMinor: input.amountMinor,
        unitsPurchased: input.unitsPurchased,
        receivedAt: input.receivedAt,
        priceScheduleId: price.id,
        unitPriceUsdMinor: price.usdEquivalentMinor,
        localUnitPriceMinor: price.localUnitPriceMinor,
        priceEffectiveFrom: price.effectiveFrom,
        expectedAmountMinor,
        varianceMinor,
        recordedBy: actor.id,
        recordReasonText: input.reasonText,
        recordIdempotencyKey: context.idempotencyKey,
        correlationId: context.correlationId,
      });
      if (settlement === null) throw commercialSettlementReferenceConflictError();

      const audit = await appendCommercialAuditEvent(tx, {
        actor,
        actionType: "settlement_recorded",
        targetType: "settlement",
        targetId: settlement.id,
        businessId: settlement.businessId,
        reasonText: input.reasonText,
        reference: settlement.externalReference,
        correlationId: context.correlationId,
        idempotencyKey: context.idempotencyKey,
        result: "succeeded",
        afterSnapshot: {
          settlementId: settlement.id,
          status: settlement.status,
          method: settlement.method,
          market: settlement.market,
          currency: settlement.currency,
          amountMinor: settlement.amountMinor,
          unitsPurchased: settlement.unitsPurchased,
          receivedAt: settlement.receivedAt.toISOString(),
          priceScheduleId: settlement.priceScheduleId,
          unitPriceUsdMinor: settlement.unitPriceUsdMinor,
          localUnitPriceMinor: settlement.localUnitPriceMinor,
          priceEffectiveFrom: settlement.priceEffectiveFrom.toISOString(),
          expectedAmountMinor: settlement.expectedAmountMinor,
          varianceMinor: settlement.varianceMinor,
        },
        priceScheduleId: settlement.priceScheduleId,
      });

      return {
        result: {
          settlementId: settlement.id,
          businessId: settlement.businessId,
          status: "recorded",
          method: settlement.method,
          externalReference: settlement.externalReference,
          market: settlement.market,
          currency: settlement.currency,
          amountMinor: settlement.amountMinor,
          unitsPurchased: settlement.unitsPurchased,
          receivedAt: settlement.receivedAt.toISOString(),
          priceScheduleId: settlement.priceScheduleId,
          unitPriceUsdMinor: settlement.unitPriceUsdMinor,
          localUnitPriceMinor: settlement.localUnitPriceMinor,
          priceEffectiveFrom: settlement.priceEffectiveFrom.toISOString(),
          expectedAmountMinor: settlement.expectedAmountMinor,
          varianceMinor: settlement.varianceMinor,
          auditEventId: audit?.id ?? null,
        },
        resultReference: settlement.id,
      };
    },
  );
}

function validateInput(input: RecordSettlementInput): void {
  if (typeof input.businessId !== "string" || input.businessId.trim().length === 0) {
    throw commercialValidationError("businessId is required.");
  }
  if (
    typeof input.method !== "string" ||
    !COMMERCIAL_SETTLEMENT_METHOD_PATTERN.test(input.method)
  ) {
    throw commercialValidationError(
      "method must be a lower-case label of letters, digits and underscores (starting with a letter).",
    );
  }
  const ref = input.externalReference;
  if (
    typeof ref !== "string" ||
    ref.length === 0 ||
    ref !== ref.trim() ||
    ref.length > COMMERCIAL_SETTLEMENT_REFERENCE_MAX_LENGTH
  ) {
    throw commercialValidationError(
      `externalReference is mandatory: 1-${COMMERCIAL_SETTLEMENT_REFERENCE_MAX_LENGTH} characters with no leading/trailing whitespace.`,
    );
  }
  if (typeof input.reasonText !== "string" || input.reasonText.trim().length === 0) {
    throw commercialValidationError("A reason/note is required to record a settlement.");
  }
  if (!Number.isSafeInteger(input.amountMinor) || input.amountMinor <= 0) {
    throw commercialValidationError("amountMinor must be a positive whole number of local units.");
  }
  if (
    !Number.isSafeInteger(input.unitsPurchased) ||
    input.unitsPurchased <= 0 ||
    input.unitsPurchased > COMMERCIAL_MAX_SETTLEMENT_UNITS
  ) {
    throw commercialValidationError("unitsPurchased must be a positive whole number of units.");
  }
  if (!(input.receivedAt instanceof Date) || Number.isNaN(input.receivedAt.getTime())) {
    throw commercialValidationError("receivedAt is required and must be a valid date.");
  }
}
