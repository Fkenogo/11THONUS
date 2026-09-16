/**
 * The Purchase Record `purchaseDate` field is a business-asserted
 * COMMERCIAL CALENDAR DATE, not a precise event timestamp (design:
 * `purchase_date TIMESTAMPTZ NOT NULL` — "business-asserted commercial
 * date, sanity-bounded, not future"; `docs/05-implementation/reports/
 * PLATFORM-BASELINE-006-purchase-verification-entry-technical-design-
 * 2026-09-14.md`). It is stored as an instant only because PostgreSQL has
 * no bare "local date" concept suited to a multi-timezone platform, and
 * the server rejects any instant later than `Date.now()`
 * (`recordPurchaseCommand.ts`).
 *
 * A single fixed time-of-day anchor is safe for any calendar date that
 * has already fully elapsed in the caller's own timezone, but is unsafe
 * for TODAY: anchoring to noon UTC, for example, is 2pm in a UTC+2
 * business's own timezone, so an operator recording today's purchase
 * before 2pm local time would have their own "today" rejected as a
 * future date — purely from the anchor choice, not from any genuine
 * future-dating. `resolvePurchaseDateInstant` fixes this by sending the
 * real current instant when the selected date is the caller's own
 * today (which can never be ahead of the server's own clock) and only
 * anchoring non-today dates, where any reasonable fixed anchor is
 * always safely in the past — or, for a genuinely future calendar date,
 * correctly still resolves to a future instant and is rejected
 * server-side, exactly as before (`E` in CORR-003's requirements: the
 * server remains the sole future-date authority; this module only
 * decides what instant to attempt to submit for a given calendar-date
 * selection, on the caller's own ambient timezone).
 */

/** The date-input (`YYYY-MM-DD`) value for "today" in the caller's own (ambient) timezone. */
export function todayDateInputValue(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Resolves a `YYYY-MM-DD` purchase-date field value to the ISO instant to
 * submit. Never produces a future instant for a date the caller's own
 * calendar considers "today," regardless of the actual time of day —
 * see module doc. A non-today date is anchored to local noon of that
 * calendar date.
 */
export function resolvePurchaseDateInstant(dateInputValue: string, now: Date = new Date()): string {
  if (dateInputValue === todayDateInputValue(now)) {
    return now.toISOString();
  }
  const [year, month, day] = dateInputValue.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0).toISOString();
}
