/**
 * Purchase-domain idempotency request hashes (`PLATFORM-BASELINE-006A`,
 * design §17 — mirrors `rewardProgramRequestHash`).
 *
 * Hashes bind actor + scope + target + content fingerprint. Same key +
 * same request replays the stored result; same key + different request
 * conflicts; the reservation lives inside the domain transaction so a
 * rollback erases it (retryable, never stuck).
 */

export function purchaseRequestHash(
  operation:
    | "create"
    | "verify"
    | "reject"
    | "dispute"
    | "business_review_approve"
    | "business_review_reject",
  actorId: string,
  businessId: string,
  targetId: string,
  contentFingerprint: string,
): string {
  return `purchase.${operation}:${actorId}:${businessId}:${targetId}:${contentFingerprint}`;
}

/**
 * Redemption confirmation request hash (`CAPABILITY-6-REDEMPTION-ENGINE-001`,
 * `DEC-LOY-018`). Same actor + scope + target + fingerprint discipline as
 * `purchaseRequestHash`, and deliberately bound to the CONFIRMING MEMBER so
 * two authorised members of the same Business attempting the same Reward
 * under the same key are a genuine conflict rather than a silent replay of
 * one another's confirmation — no shared account, no shared
 * accountability (`DEC-ID-002`).
 */
export function redemptionRequestHash(
  operation: "confirm",
  actorId: string,
  businessId: string,
  rewardId: string,
  contentFingerprint: string,
): string {
  return `redemption.${operation}:${actorId}:${businessId}:${rewardId}:${contentFingerprint}`;
}
