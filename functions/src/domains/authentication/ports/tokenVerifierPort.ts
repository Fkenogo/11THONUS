/**
 * Token verifier port (AUTH-01, per AUTH-BP §3).
 *
 * The provider-neutral **contract** for turning a raw provider credential
 * into a verified `AuthenticatedCredential`. This is an interface only — the
 * Firebase Admin ID-token verification adapter that implements it is AUTH-02;
 * per-provider logic is AUTH-04. No Firebase import, no implementation here.
 *
 * Pure domain port — no Firebase import.
 */

import type { AuthenticatedCredential } from "../models/authenticatedCredential";
import type { AuthenticationReferenceType } from "../../identity/models/authenticationReference";

/**
 * The opaque, provider-neutral input a verifier receives. `rawToken` is the
 * provider credential to verify (e.g. a Firebase ID token) — it is consumed
 * by the adapter and never persisted (TRD10 §10.6.1).
 */
export type RawProviderCredential = {
  referenceType: AuthenticationReferenceType;
  rawToken: string;
};

export interface TokenVerifierPort {
  verify(raw: RawProviderCredential): Promise<AuthenticatedCredential>;
}
