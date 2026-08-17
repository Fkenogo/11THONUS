/**
 * Concrete `BusinessCodeCandidateGenerator` (`ENG-P2-002A`).
 *
 * Draws uniformly from the approved codespace (§24 FD-3: `BIZ` + 6
 * symbols from the 32-character ambiguity-free alphabet,
 * `businessCode.ts`) using Node's `crypto.randomInt` (a CSPRNG, not
 * `Math.random`) — the same choice
 * `functions/src/domains/loyaltyNumber/services/randomLoyaltyNumberCandidateGenerator.ts`
 * made for the analogous reason: `businessCode` is not a secret, but an
 * unbiased, non-predictable draw over the codespace is still the right
 * default (and directly satisfies the "non-sequential" policy property,
 * §24 FD-3).
 *
 * Pure and framework-independent — `node:crypto` only, no Firebase
 * import, no Firestore access. This is the "pure candidate generator"
 * Phase G explicitly permits at this layer; the actual uniqueness
 * reservation against Firestore is `ENG-P2-002B`'s.
 */

import { randomInt } from "node:crypto";
import {
  BUSINESS_CODE_ALPHABET,
  BUSINESS_CODE_PREFIX,
  BUSINESS_CODE_RANDOM_LENGTH,
} from "../models/businessCode";
import type { BusinessCodeCandidateGenerator } from "./businessCodeGenerator";

export class RandomBusinessCodeCandidateGenerator implements BusinessCodeCandidateGenerator {
  generateCandidate(): string {
    let candidate = BUSINESS_CODE_PREFIX;
    for (let i = 0; i < BUSINESS_CODE_RANDOM_LENGTH; i++) {
      candidate += BUSINESS_CODE_ALPHABET[randomInt(BUSINESS_CODE_ALPHABET.length)];
    }
    return candidate;
  }
}
