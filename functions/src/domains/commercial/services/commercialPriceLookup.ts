/**
 * Commercial price lookup (`WP-COM-02`; design §13/§14).
 *
 * Answers one question deterministically: which local unit price schedule
 * applies to `(market, currency)` at instant `at`? It is the latest schedule
 * of that market with `effective_from <= at`.
 *
 * - No live FX, no default, no guess: if no schedule applies it FAILS
 *   explicitly (`commercialNoApplicablePriceError`).
 * - No cross-market substitution: the currency must be the market's own
 *   (BI -> BIF, RW -> RWF); a mismatch is a validation failure, never a
 *   lookup against the other market.
 * - Historical-safe: schedule rows are immutable and only ever appended
 *   forward, so the answer for a past `at` never changes.
 *
 * Reusable by settlement now and consumption/admission later.
 */

import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import type { PlatformPostgresTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import {
  MARKET_CURRENCY,
  isCommercialMarket,
  type CommercialCurrency,
  type CommercialPriceSchedule,
} from "../models/commercialFoundation";
import {
  commercialNoApplicablePriceError,
  commercialValidationError,
} from "../models/commercialErrors";
import { getEffectivePriceSchedule } from "../repositories/commercialPriceRepository";

type Queryable = Pick<PlatformPostgresPool, "query"> | PlatformPostgresTransaction;

export type CommercialPriceLookupInput = {
  readonly market: string;
  readonly currency: string;
  readonly at: Date;
};

export async function lookupCommercialPrice(
  db: Queryable,
  input: CommercialPriceLookupInput,
): Promise<CommercialPriceSchedule> {
  if (!isCommercialMarket(input.market)) {
    throw commercialValidationError(`Unsupported Commercial market "${String(input.market)}".`);
  }
  const expected: CommercialCurrency = MARKET_CURRENCY[input.market];
  if (input.currency !== expected) {
    throw commercialValidationError(
      `Market "${input.market}" settles in ${expected}; "${String(input.currency)}" is not accepted.`,
    );
  }
  if (!(input.at instanceof Date) || Number.isNaN(input.at.getTime())) {
    throw commercialValidationError("A valid effective timestamp is required for price lookup.");
  }
  const schedule = await getEffectivePriceSchedule(db, input.market, input.at);
  if (schedule === null) {
    throw commercialNoApplicablePriceError(input.market, input.currency, input.at);
  }
  return schedule;
}
