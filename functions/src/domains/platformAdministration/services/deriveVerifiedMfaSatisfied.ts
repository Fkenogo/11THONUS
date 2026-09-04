/**
 * `AUTH-MFA-001` — closes `ENG-P3-003A`'s integration gap between a
 * resolved authentication credential and `resolvePlatformAdministratorAuthorization`'s
 * `verifiedMfaSatisfied` input.
 *
 * Before this task, nothing in the repository connected the two — a future
 * caller could only have satisfied the parameter by inventing a boolean
 * (from a client claim, a database field, or a hardcoded value), exactly
 * what `ENG-P3-003A`'s own evaluator header warns against. This function is
 * the one, narrow, correct way to produce it: it accepts an
 * `AuthenticatedCredential` (never a raw boolean, never request/claim data)
 * and returns exactly the fact the authentication adapter already verified.
 *
 * Deliberately trivial — a thin, named seam, not logic, so that any future
 * command wiring this in has exactly one obviously-correct call shape
 * (`deriveVerifiedMfaSatisfied(credential)`) and no path that quietly
 * accepts a caller-fabricated value instead.
 */

import type { AuthenticatedCredential } from "../../authentication/models/authenticatedCredential";

export function deriveVerifiedMfaSatisfied(credential: AuthenticatedCredential): boolean {
  return credential.verifiedSecondFactor;
}
