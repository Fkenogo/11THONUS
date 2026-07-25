/**
 * Request-shape validation — Layer 1 "Transport Validation" (ENG-P1-002).
 *
 * Per TRD11 §11.13's five validation layers, only Layer 1 (transport —
 * is the request well-formed at all?) is generic enough to live in the
 * shared foundation. Layers 2-5 (identity, reference, business-rule,
 * concurrency validation) are domain-specific and remain each future
 * domain's own responsibility — this is not a replacement for them.
 */

export function isValidCommandEnvelopeShape(value: unknown): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate["commandId"] === "string" &&
    typeof candidate["commandType"] === "string" &&
    typeof candidate["commandVersion"] === "number" &&
    typeof candidate["idempotencyKey"] === "string" &&
    typeof candidate["correlationId"] === "string" &&
    typeof candidate["actor"] === "object" &&
    candidate["actor"] !== null &&
    "payload" in candidate
  );
}
