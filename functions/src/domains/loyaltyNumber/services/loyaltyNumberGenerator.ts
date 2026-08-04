/**
 * Loyalty Number candidate generator port (ENG-P2-001-03).
 *
 * Provider-neutral randomness/candidate-generation abstraction. The
 * domain layer never depends on Firebase, Node's `crypto`, browser APIs,
 * or any external library directly — a caller injects a concrete
 * implementation (e.g. a `crypto.randomInt`-backed one, or a fully
 * deterministic fixed-sequence fake for tests).
 *
 * The generator is trusted to draw candidates from the approved
 * codespace (3 letters A-Z excluding I/O, 3 digits 2-9), but the
 * issuance service still validates every candidate through
 * `createLoyaltyNumber` (defense in depth — a malformed candidate from a
 * buggy generator implementation is rejected, not silently accepted).
 */

export interface LoyaltyNumberCandidateGenerator {
  generateCandidate(): string;
}
