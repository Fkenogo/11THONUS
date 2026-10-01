/**
 * Purchase admission gate mode (`WP-COM-05a` seam; `WP-COM-05b` decision).
 *
 * `off`     -- every eligible Purchase is admitted immediately, exactly as before
 *              the Commercial gate existed: no Commercial read, write or lock, and the
 *              original statement order. This is the DEFAULT, so nothing changes until
 *              the gate is deliberately enabled (design §8.17 rollout safety).
 * `enforce` -- the Commercial admission decision applies (`admitOrHoldPurchase`): a
 *              Purchase that would start a new Circle position without usable capacity
 *              is HELD as `pending_admission`.
 *
 * `shadow` (evaluate-and-record-would-hold) is part of the design's rollout menu but is
 * NOT implemented in this package; any other value fails closed instead of being
 * guessed at. Pure and dependency-free: it never imports the Commercial domain.
 */

export type PurchaseAdmissionGateMode = "off" | "enforce";

export const DEFAULT_PURCHASE_ADMISSION_GATE_MODE: PurchaseAdmissionGateMode = "off";

export type PurchaseAdmissionDecision = { readonly outcome: "admit" };

/** Resolves the effective mode; anything but `off` / `enforce` is unsupported and throws. */
export function resolvePurchaseAdmissionGateMode(requested?: string): PurchaseAdmissionGateMode {
  const mode = requested ?? DEFAULT_PURCHASE_ADMISSION_GATE_MODE;
  if (mode !== "off" && mode !== "enforce") {
    throw new Error(
      `Purchase admission gate mode "${mode}" is not supported (supported: "off", "enforce").`,
    );
  }
  return mode;
}

/** `off` => always admit; no inputs beyond the mode, so no Commercial dependency is possible. */
export function decidePurchaseAdmission(mode: "off"): PurchaseAdmissionDecision {
  void mode;
  return { outcome: "admit" };
}
