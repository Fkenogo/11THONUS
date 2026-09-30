/**
 * Small input validators shared by the WP-COM-03 administration commands.
 * They throw the Commercial validation error (`VALIDATION_FAILED`) and never
 * coerce: a value is accepted exactly as supplied or rejected.
 */

import { COMMERCIAL_INT32_MAX, COMMERCIAL_INT32_MIN } from "../models/commercialAdministration";
import { commercialValidationError } from "../models/commercialErrors";

export function requireBusinessId(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw commercialValidationError("businessId is required.");
  }
  return value;
}

/** A mandatory human text (reason or reference): a non-blank string. */
export function requireText(name: string, value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw commercialValidationError(`${name} is required.`);
  }
  return value;
}

/** An optional reference: absent, or a non-blank string. */
export function optionalText(name: string, value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.trim().length === 0) {
    throw commercialValidationError(`${name}, when supplied, must not be blank.`);
  }
  return value;
}

/** A signed, non-zero whole number that fits the counter storage width. */
export function requireSignedUnits(name: string, value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value === 0 ||
    value < COMMERCIAL_INT32_MIN ||
    value > COMMERCIAL_INT32_MAX
  ) {
    throw commercialValidationError(`${name} must be a non-zero whole number of units.`);
  }
  return value;
}

/** Guards the resulting counter against the 32-bit storage width (technical bound, not a policy limit). */
export function assertCounterInRange(name: string, value: number): void {
  if (value < COMMERCIAL_INT32_MIN || value > COMMERCIAL_INT32_MAX) {
    throw commercialValidationError(
      `${name} would leave the supported whole-number range of the Commercial counters.`,
    );
  }
}
