/**
 * Internal Customer ID (ENG-P2-001-01).
 *
 * The permanent, immutable, never-publicly-exposed identifier the Identity
 * Aggregate is keyed by (PRD2 §4 Identity 1; `ENG-P2-ARCH-001` §2). This
 * module only validates the *shape* of an already-generated id — it does
 * not generate one. Generation is the persistence layer's own concern
 * (`ENG-P2-001-05`), out of this domain-foundation module's scope.
 */

import { invalidCustomerIdentityIdError } from "./identityErrors";

export type CustomerIdentityId = string;

export function createCustomerIdentityId(value: string): CustomerIdentityId {
  if (value.trim().length === 0) {
    throw invalidCustomerIdentityIdError(value);
  }

  return value;
}
