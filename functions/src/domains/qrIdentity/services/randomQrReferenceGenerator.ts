/**
 * Concrete `QrReferenceGenerator` (ENG-P2-001-05).
 *
 * The persistence-layer implementation the port's own doc comment
 * (`qrReferenceGenerator.ts`) says belongs to this task. Uses Node's
 * `crypto.randomUUID` — a CSPRNG-backed opaque token, matching
 * `DEC-DATA-007`'s "plain opaque reference" contract (not derived from,
 * or reversible to, the loyalty number or customer identity).
 */

import { randomUUID } from "node:crypto";
import type { QrReferenceGenerator } from "./qrReferenceGenerator";

export class RandomQrReferenceGenerator implements QrReferenceGenerator {
  generateReference(): string {
    return randomUUID();
  }
}
