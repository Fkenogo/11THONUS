/**
 * Purchase admission gate seam (`WP-COM-05a`).
 *
 * The internal switch between "admit this verified Purchase into Loyalty now"
 * and (in WP-COM-05b) "hold it as `pending_admission` when Commercial
 * admission capacity is unavailable". In WP-COM-05a the ONLY mode is `off`:
 * every eligible Purchase is admitted immediately, exactly as before this
 * package. There is deliberately NO Commercial read, NO capacity decision and
 * NO hold outcome here -- `shadow`/`enforce` do not exist until WP-COM-05b
 * defines them, so any other value fails closed instead of being guessed at.
 *
 * Pure and dependency-free: it must never import the Commercial domain
 * (guarded by the Commercial boundary tests).
 */

export type PurchaseAdmissionGateMode = "off";

export const DEFAULT_PURCHASE_ADMISSION_GATE_MODE: PurchaseAdmissionGateMode = "off";

export type PurchaseAdmissionDecision = { readonly outcome: "admit" };

/** Resolves the effective mode; anything but `off` is unsupported in this package and throws. */
export function resolvePurchaseAdmissionGateMode(requested?: string): PurchaseAdmissionGateMode {
  const mode = requested ?? DEFAULT_PURCHASE_ADMISSION_GATE_MODE;
  if (mode !== "off") {
    throw new Error(
      `Purchase admission gate mode "${mode}" is not supported (WP-COM-05a implements "off" only).`,
    );
  }
  return mode;
}

/** `off` => always admit; no inputs beyond the mode, so no Commercial dependency is possible. */
export function decidePurchaseAdmission(
  mode: PurchaseAdmissionGateMode,
): PurchaseAdmissionDecision {
  void mode;
  return { outcome: "admit" };
}
