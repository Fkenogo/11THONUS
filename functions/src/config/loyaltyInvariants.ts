/**
 * Platform-fixed loyalty invariants (PLATFORM-BASELINE-001).
 *
 * The single source of truth for the two MVP loyalty rules that no
 * Business, Platform Administrator, or other actor may change at runtime.
 * Per `PLATFORM-BASELINE-DESIGN-001-CORR-001` §10 ("Platform Rule
 * Authority"): a database configuration table for these two values would
 * duplicate an authority that already has exactly one home — this module —
 * with no legitimate party authorized to write a different value. Mirrors
 * `functions/src/config/region.ts`'s existing convention (a single
 * exported constant with a short doc comment naming its governing
 * decision) rather than introducing a new configuration pattern.
 *
 * - `REQUIRED_VERIFIED_UNITS_MVP`: the fixed Verified-Units threshold for
 *   every MVP Reward Program (PRD `06-reward-programs-and-loyalty-cycles.md`
 *   §4, "For MVP: Verified Units Required = 10").
 * - `REWARD_QUANTITY_FIXED`: `rewardQuantity` fixed at exactly `1` for every
 *   launch Reward Program (`DEC-LOY-009`, confirmed 2026-09-11 — "no
 *   configurability of `rewardQuantity > 1` at launch").
 *
 * Neither value is read from the environment or any database row. A future
 * governed decision that legitimately needs a value to vary without a code
 * deploy would introduce its own versioned configuration at that time —
 * this module does not pre-build that mechanism for a need that does not
 * yet exist.
 */

export const REQUIRED_VERIFIED_UNITS_MVP = 10;

export const REWARD_QUANTITY_FIXED = 1;
