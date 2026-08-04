/**
 * Concrete `LoyaltyNumberCandidateGenerator` (ENG-P2-001-05).
 *
 * The persistence-layer implementation the port's own doc comment
 * (`loyaltyNumberGenerator.ts`) says belongs to this task. Draws
 * uniformly from the approved codespace (3 letters A-Z excluding I/O, 3
 * digits 2-9) using Node's `crypto.randomInt` (a CSPRNG, not `Math.random`)
 * — appropriate here since Loyalty Numbers are customer-facing lookup
 * identifiers, not secrets, but still benefit from an unbiased,
 * non-predictable draw over the codespace.
 */

import { randomInt } from "node:crypto";
import type { LoyaltyNumberCandidateGenerator } from "./loyaltyNumberGenerator";

const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";

export class RandomLoyaltyNumberCandidateGenerator implements LoyaltyNumberCandidateGenerator {
  generateCandidate(): string {
    let candidate = "";
    for (let i = 0; i < 3; i++) {
      candidate += LETTERS[randomInt(LETTERS.length)];
    }
    for (let i = 0; i < 3; i++) {
      candidate += DIGITS[randomInt(DIGITS.length)];
    }
    return candidate;
  }
}
