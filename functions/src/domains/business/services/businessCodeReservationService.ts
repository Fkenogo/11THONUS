/**
 * `businessCode` reservation/collision-retry service (`ENG-P2-002B`, Phase G).
 *
 * Pure, framework-independent domain function — mirrors
 * `functions/src/domains/loyaltyNumber/services/loyaltyNumberIssuanceService.ts`
 * exactly for the "bounded collision retry over an injected uniqueness port"
 * shape. No Firestore, no transaction — the real
 * `BusinessCodeUniquenessPort` implementation (a transactional
 * `businessCodeReservations/{candidate}` doc-existence check) and the
 * actual write of the reservation doc are `../repositories/businessRepository.ts`'s
 * concern; this function only decides *which* candidate to reserve.
 *
 * `MAX_BUSINESS_CODE_GENERATION_ATTEMPTS` reuses the exact policy constant
 * `ENG-P2-002A`'s `models/businessCode.ts` already defines (§24 FD-3) rather
 * than redeclaring it.
 *
 * Defense in depth (per `businessCodeGenerator.ts`'s own header): every
 * candidate is still validated through `createBusinessCode` even though the
 * generator is trusted, so a malformed candidate fails closed with
 * `VALIDATION_FAILED` instead of being silently reserved.
 */

import { createBusinessCode, MAX_BUSINESS_CODE_GENERATION_ATTEMPTS } from "../models/businessCode";
import {
  businessCodeGenerationExhaustedError,
  BusinessDomainError,
} from "../models/businessErrors";
import type { BusinessCodeCandidateGenerator } from "./businessCodeGenerator";
import type { BusinessCodeUniquenessPort } from "./businessCodeUniquenessPort";

export { MAX_BUSINESS_CODE_GENERATION_ATTEMPTS };

export type ReserveBusinessCodeParams = {
  generator: BusinessCodeCandidateGenerator;
  uniquenessPort: BusinessCodeUniquenessPort;
};

export type ReserveBusinessCodeResult = {
  businessCode: string;
  attempts: number;
};

export async function reserveBusinessCode(
  params: ReserveBusinessCodeParams,
): Promise<ReserveBusinessCodeResult> {
  for (let attempt = 1; attempt <= MAX_BUSINESS_CODE_GENERATION_ATTEMPTS; attempt++) {
    const raw = params.generator.generateCandidate();
    const candidate = createBusinessCode(raw); // throws BusinessDomainError (VALIDATION_FAILED) on malformed input

    let alreadyReserved: boolean;
    try {
      alreadyReserved = await params.uniquenessPort.isAlreadyReserved(candidate);
    } catch {
      throw new BusinessDomainError(
        "TEMPORARY_UNAVAILABLE",
        `businessCode uniqueness check failed for candidate "${candidate}".`,
      );
    }

    if (!alreadyReserved) {
      return { businessCode: candidate, attempts: attempt };
    }
  }

  throw businessCodeGenerationExhaustedError(MAX_BUSINESS_CODE_GENERATION_ATTEMPTS);
}
