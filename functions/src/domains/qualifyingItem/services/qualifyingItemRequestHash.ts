/**
 * Deterministic, content-derived request hash for Qualifying Item write
 * commands (`PLATFORM-BASELINE-013A.2`) -- mirrors
 * `rewardProgramRequestHash`'s discipline (same key + same request ->
 * duplicate; same key + different request -> conflict), built server-side
 * so a client can never pin two different operations to one idempotency
 * key.
 */

export function qualifyingItemRequestHash(
  operation: "create" | "update" | "retire",
  actorId: string,
  businessId: string,
  targetId: string,
  contentFingerprint: string,
): string {
  return `qualifyingItem.${operation}:${actorId}:${businessId}:${targetId}:${contentFingerprint}`;
}
