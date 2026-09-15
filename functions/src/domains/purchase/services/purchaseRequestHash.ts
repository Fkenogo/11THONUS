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
  operation: "create" | "verify" | "reject" | "dispute",
  actorId: string,
  businessId: string,
  targetId: string,
  contentFingerprint: string,
): string {
  return `purchase.${operation}:${actorId}:${businessId}:${targetId}:${contentFingerprint}`;
}
