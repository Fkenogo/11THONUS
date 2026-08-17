/**
 * `businessCode` candidate generator port (`ENG-P2-002A`).
 *
 * Provider-neutral randomness/candidate-generation abstraction, mirroring
 * `functions/src/domains/loyaltyNumber/services/loyaltyNumberGenerator.ts`'s
 * own precedent exactly: the domain layer never depends on Firebase
 * directly, and a caller injects a concrete implementation.
 *
 * The generator is trusted to draw candidates from the approved codespace
 * (§24 FD-3's `BIZ` + 6-symbol format), but any real assignment path
 * still validates every candidate through `createBusinessCode` (defense
 * in depth). This port produces *candidates* only — it has no concept of
 * uniqueness; transactional reservation and collision-retry execution
 * against Firestore belong to `ENG-P2-002B`, per this task's explicit
 * boundary (Phase G).
 */

export interface BusinessCodeCandidateGenerator {
  generateCandidate(): string;
}
