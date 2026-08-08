/**
 * Authentication domain event contracts (AUTH-01, per AUTH-BP §10).
 *
 * **Contracts only** — the event *type names* and privacy-safe payload
 * shapes the Authentication domain newly owns. Emission (writing through the
 * shared outbox) is AUTH-08, not this module. Events reuse the shared
 * `DomainEvent<T>` contract (`shared/events/domainEvent`, TRD11 §11.8).
 *
 * The link/unlink/conflict events are **owned by the merged Customer Identity
 * `-08`** and are reused (not redefined) there — they are deliberately not
 * re-declared here. Payloads carry only references, never credential material
 * (TRD10 §10.6.1; TRD21).
 *
 * Pure domain module — no Firebase import.
 */

import type { AuthenticationReferenceType } from "../../identity/models/authenticationReference";

export const AUTHENTICATION_SOURCE_DOMAIN = "authentication" as const;

export const AUTHENTICATION_EVENT_TYPES = [
  "CustomerAuthenticated",
  "AuthenticationRecoveryProofProvided",
] as const;

export type AuthenticationEventType = (typeof AUTHENTICATION_EVENT_TYPES)[number];

export type CustomerAuthenticatedPayload = {
  customerIdentityId: string;
  referenceType: AuthenticationReferenceType;
};

export type AuthenticationRecoveryProofProvidedPayload = {
  customerIdentityId: string;
  referenceType: AuthenticationReferenceType;
  proofMethodCategory: string;
};
