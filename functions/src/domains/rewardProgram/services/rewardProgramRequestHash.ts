/**
 * Deterministic, content-derived request hash for Reward Program write
 * commands (`PLATFORM-BASELINE-005A`) -- mirrors `PLATFORM-BASELINE-004A`'s
 * `staffMembershipRequestHash` discipline (same key + same request ->
 * duplicate; same key + different request -> conflict), built server-side
 * so a client can never pin two different operations to one idempotency
 * key.
 */

export function rewardProgramRequestHash(
  operation: "create" | "updateDraft" | "publish" | "createNextVersion",
  actorId: string,
  businessId: string,
  targetId: string,
  contentFingerprint: string,
): string {
  return `rewardProgram.${operation}:${actorId}:${businessId}:${targetId}:${contentFingerprint}`;
}
