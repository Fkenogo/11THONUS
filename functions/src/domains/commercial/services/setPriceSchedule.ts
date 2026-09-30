/**
 * `setPriceSchedule` (`WP-COM-02`; design §13/§14, §15 #11).
 *
 * Platform-Administrator-only command that appends one effective-dated local
 * unit-price schedule for a launch market. The price is whatever the
 * administrator supplies: this module has NO default price, NO seed and NO FX
 * source, and it makes no claim that the local price tracks a live rate --
 * `usdEquivalentMinor` is the governed USD 2 basis label (200), nothing more.
 *
 * Rules (each enforced here; the database independently enforces the
 * market/currency pair, whole positive prices, and strictly-forward,
 * non-overlapping, immutable history):
 *  - market in {BI, RW} and currency == that market's own (BI->BIF, RW->RWF);
 *  - `localUnitPriceMinor` a positive whole integer; USD basis == 200;
 *  - `effectiveFrom` required, strictly after the market's latest schedule,
 *    and NOT in the past. The design only requires "not before latest"; the
 *    additional no-backdating rule keeps `lookup(t)` for every past `t`
 *    stable, so pricing history can never be rewritten by a later command
 *    (recorded as a WP-COM-02 hardening in the report);
 *  - a non-blank reason is mandatory; a reference is optional;
 *  - one `price_schedule_set` audit row, atomic with the insert.
 * Existing schedule rows are never touched.
 */

import {
  COMMERCIAL_UNIT_USD_EQUIVALENT_MINOR,
  MARKET_CURRENCY,
  isCommercialMarket,
} from "../models/commercialFoundation";
import { platformMarketAuditScope } from "../models/commercialSettlement";
import { commercialValidationError } from "../models/commercialErrors";
import { appendCommercialAuditEvent } from "../repositories/commercialAuditRepository";
import { insertPriceSchedule, listPriceSchedules } from "../repositories/commercialPriceRepository";
import {
  runAdministratorCommand,
  type CommercialCommandContext,
  type CommercialCommandDeps,
  type CommercialCommandResponse,
} from "./commercialAdministratorCommand";

export type SetPriceScheduleInput = {
  readonly market: string;
  readonly currency: string;
  /** Whole local units (BIF/RWF have no minor unit). Supplied by the administrator; never defaulted. */
  readonly localUnitPriceMinor: number;
  /** Governed USD basis; when supplied it must equal 200. Optional. */
  readonly usdEquivalentMinor?: number;
  readonly effectiveFrom: Date;
  readonly rateNote?: string;
  readonly reasonText: string;
  readonly reference?: string;
};

/** JSON-safe (it is stored as the idempotent response snapshot). */
export type SetPriceScheduleResult = {
  readonly priceScheduleId: string;
  readonly market: string;
  readonly currency: string;
  readonly usdEquivalentMinor: number;
  readonly localUnitPriceMinor: number;
  readonly effectiveFrom: string;
  readonly createdBy: string;
  readonly auditEventId: string | null;
};

export async function setPriceSchedule(
  deps: CommercialCommandDeps,
  context: CommercialCommandContext,
  input: SetPriceScheduleInput,
): Promise<CommercialCommandResponse<SetPriceScheduleResult>> {
  return runAdministratorCommand<SetPriceScheduleResult>(
    deps,
    context,
    {
      commandType: "setPriceSchedule",
      payload: {
        market: input.market,
        currency: input.currency,
        localUnitPriceMinor: input.localUnitPriceMinor,
        usdEquivalentMinor: input.usdEquivalentMinor,
        effectiveFrom: input.effectiveFrom,
        rateNote: input.rateNote,
        reasonText: input.reasonText,
        reference: input.reference,
      },
    },
    async (tx, actor) => {
      const market = input.market;
      if (!isCommercialMarket(market)) {
        throw commercialValidationError(`Unsupported Commercial market "${String(market)}".`);
      }
      if (input.currency !== MARKET_CURRENCY[market]) {
        throw commercialValidationError(
          `Market "${market}" prices in ${MARKET_CURRENCY[market]}; "${String(input.currency)}" is not accepted.`,
        );
      }
      if (typeof input.reasonText !== "string" || input.reasonText.trim().length === 0) {
        throw commercialValidationError("A reason is required to set a price schedule.");
      }
      if (!(input.effectiveFrom instanceof Date) || Number.isNaN(input.effectiveFrom.getTime())) {
        throw commercialValidationError("effectiveFrom is required and must be a valid date.");
      }
      if (input.reference !== undefined && input.reference.trim().length === 0) {
        throw commercialValidationError("reference, when supplied, must not be blank.");
      }
      const now = (deps.now ?? (() => new Date()))();
      if (input.effectiveFrom.getTime() < now.getTime()) {
        throw commercialValidationError(
          "effectiveFrom must not be in the past: a price schedule can only take effect from now onward, so pricing history is never rewritten.",
        );
      }
      const existing = await listPriceSchedules(tx, market);
      const latest = existing.length === 0 ? null : existing[existing.length - 1];
      if (latest !== null && input.effectiveFrom.getTime() <= latest.effectiveFrom.getTime()) {
        throw commercialValidationError(
          `effectiveFrom must be strictly after the latest ${market} schedule (${latest.effectiveFrom.toISOString()}); a correction is a new schedule with a later effectiveFrom.`,
        );
      }

      const schedule = await insertPriceSchedule(tx, {
        market,
        localUnitPriceMinor: input.localUnitPriceMinor,
        usdEquivalentMinor: input.usdEquivalentMinor,
        effectiveFrom: input.effectiveFrom,
        rateNote: input.rateNote,
        createdBy: actor.id,
        reasonText: input.reasonText,
        correlationId: context.correlationId,
      });

      const audit = await appendCommercialAuditEvent(tx, {
        actor,
        actionType: "price_schedule_set",
        targetType: "price_schedule",
        targetId: schedule.id,
        businessId: platformMarketAuditScope(market),
        reasonText: input.reasonText,
        reference: input.reference,
        correlationId: context.correlationId,
        idempotencyKey: context.idempotencyKey,
        result: "succeeded",
        beforeSnapshot: latest === null ? null : snapshot(latest),
        afterSnapshot: snapshot(schedule),
        priceScheduleId: schedule.id,
      });

      return {
        result: {
          priceScheduleId: schedule.id,
          market: schedule.market,
          currency: schedule.currency,
          usdEquivalentMinor: schedule.usdEquivalentMinor,
          localUnitPriceMinor: schedule.localUnitPriceMinor,
          effectiveFrom: schedule.effectiveFrom.toISOString(),
          createdBy: schedule.createdBy,
          auditEventId: audit?.id ?? null,
        },
        resultReference: schedule.id,
      };
    },
  );
}

function snapshot(s: {
  id: string;
  market: string;
  currency: string;
  usdEquivalentMinor: number;
  localUnitPriceMinor: number;
  effectiveFrom: Date;
}) {
  return {
    priceScheduleId: s.id,
    market: s.market,
    currency: s.currency,
    usdEquivalentMinor: s.usdEquivalentMinor,
    localUnitPriceMinor: s.localUnitPriceMinor,
    effectiveFrom: s.effectiveFrom.toISOString(),
    canonicalBasisUsdMinor: COMMERCIAL_UNIT_USD_EQUIVALENT_MINOR,
  };
}
