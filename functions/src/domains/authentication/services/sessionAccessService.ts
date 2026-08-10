/**
 * Session / access gating service (AUTH-07, per AUTH-BP §9 / §12).
 *
 * The reusable server-side gates that identity-protected actions consume. It
 * owns no identity state and duplicates none — it *composes* already-merged
 * responsibilities into the two access decisions AUTH-07 is responsible for:
 *
 *   1. **Session establishment + identity-protected-action gate**
 *      (`authorizeIdentityProtectedAction`): resolve a *verified*
 *      `AuthenticatedCredential` to its owning identity (AUTH-02
 *      `resolveAuthenticatedCredential`, consuming the Customer Identity `-09`
 *      lookup), enforce access state (`active` proceeds; `suspended` →
 *      `ACCOUNT_SUSPENDED`; any other non-active → `AUTH_FORBIDDEN`), and
 *      establish the `SessionContext` through the existing AUTH-01
 *      `createSessionContext`. Browsing never calls this (`DEC-PROV-004`
 *      point 5 / AUTH-BP §9); identity-protected actions do.
 *
 *   2. **Privileged re-authentication gate** (`authorizePrivilegedAction`): the
 *      protected-action gate *plus* a server-enforced freshness check on the
 *      trusted `authenticatedAt` (AUTH-BP §9, TRD12 §12.29 — default 5 minutes,
 *      configurable).
 *
 * Boundaries (AUTH-BP §12): AUTH-07 issues/validates the session; it emits **no**
 * domain events — `CustomerAuthenticated` remains AUTH-08 (there is deliberately
 * no outbox/emit seam here). Session state is not persisted: Firebase Auth
 * remains the token authority (TRD10 §10.6.1), so there is no bespoke token
 * store and sign-out holds no server-side session to revoke (that is the
 * frontend's client-session clear). The access-state *policy* mirrors the
 * returning-user gate already applied by AUTH-03/AUTH-05 (same closed taxonomy,
 * same `-06`-owned access-state semantics consumed as data) — it re-applies that
 * policy at the access boundary rather than importing a private helper, matching
 * the existing codebase pattern.
 *
 * Firebase-adapter (services) sub-layer. No credential material is read,
 * written, logged, or returned (TRD10 §10.6.1); only the provider-neutral
 * reference flows through.
 */

import type { Firestore } from "firebase-admin/firestore";
import type { AuthenticatedCredential } from "../models/authenticatedCredential";
import { createSessionContext, type SessionContext } from "../models/sessionContext";
import {
  accountSuspendedForAuthenticationError,
  authenticationForbiddenError,
  authenticationRequiredError,
} from "../models/authenticationErrors";
import {
  DEFAULT_PRIVILEGED_REAUTH_MAX_AGE_MS,
  assertFreshAuthentication,
} from "../models/privilegedReauthentication";
import {
  resolveAuthenticatedCredential,
  type CredentialResolutionEnvelope,
} from "./credentialResolutionService";
import { getCustomerIdentityById } from "../../identity/repositories/customerIdentityRepository";
import type { CustomerIdentity } from "../../identity/models/customerIdentity";

export type SessionAuthorizationEnvelope = CredentialResolutionEnvelope;

/** Injected seams — default to the real, merged implementations. */
export type SessionAccessDeps = {
  resolve?: typeof resolveAuthenticatedCredential;
  getIdentityById?: typeof getCustomerIdentityById;
};

export type SessionAuthorizationOptions = {
  /** Server clock seam — the session issuance instant. */
  now?: () => Date;
};

export type PrivilegedAuthorizationOptions = SessionAuthorizationOptions & {
  /**
   * Maximum authentication age accepted for a privileged action. Defaults to the
   * platform default (5 minutes, TRD12 §12.29) — configurable per action policy.
   */
  maxAgeMs?: number;
};

/**
 * Gate an identity's access state at the session boundary (AUTH-BP §6 step 2 /
 * §9). Only `active` may receive a session; `suspended` → `ACCOUNT_SUSPENDED`;
 * any other non-active state → `AUTH_FORBIDDEN` (fail closed). Access-state
 * *management* remains the Customer Identity `-06` responsibility; this only
 * consumes the current state.
 */
function assertIdentityAccessPermitted(identity: CustomerIdentity): void {
  if (identity.status === "active") {
    return;
  }
  if (identity.status === "suspended") {
    throw accountSuspendedForAuthenticationError(identity.id);
  }
  throw authenticationForbiddenError();
}

/**
 * Establish a session for a **verified** credential performing an
 * identity-protected action: resolve → access-state gate → establish. A
 * credential that resolves to no identity is not a valid session for a
 * protected action and fails closed (`AUTH_REQUIRED`).
 */
export async function authorizeIdentityProtectedAction(
  db: Firestore,
  credential: AuthenticatedCredential,
  envelope: SessionAuthorizationEnvelope,
  deps: SessionAccessDeps = {},
  options: SessionAuthorizationOptions = {},
): Promise<SessionContext> {
  const resolve = deps.resolve ?? resolveAuthenticatedCredential;
  const getIdentityById = deps.getIdentityById ?? getCustomerIdentityById;
  const now = options.now ?? (() => new Date());

  const resolution = await resolve(db, credential, envelope);
  if (resolution.outcome !== "resolved") {
    // No existing identity for this verified credential → no session for a
    // protected action. Enumeration-resistant, closed taxonomy.
    throw authenticationRequiredError();
  }

  const identity = await getIdentityById(db, resolution.customerIdentityId);
  assertIdentityAccessPermitted(identity);

  return createSessionContext({ customerIdentityId: identity.id, credential, issuedAt: now() });
}

/**
 * Establish a session for a **privileged** action: the identity-protected gate
 * *and* a server-enforced privileged re-authentication freshness check on the
 * trusted `authenticatedAt`. The access-state gate runs first (a suspended
 * identity is rejected regardless of freshness); stale or missing authentication
 * evidence then fails closed (`AUTH_REQUIRED`, requiring a fresh proof).
 */
export async function authorizePrivilegedAction(
  db: Firestore,
  credential: AuthenticatedCredential,
  envelope: SessionAuthorizationEnvelope,
  deps: SessionAccessDeps = {},
  options: PrivilegedAuthorizationOptions = {},
): Promise<SessionContext> {
  const now = options.now ?? (() => new Date());
  const maxAgeMs = options.maxAgeMs ?? DEFAULT_PRIVILEGED_REAUTH_MAX_AGE_MS;

  const session = await authorizeIdentityProtectedAction(db, credential, envelope, deps, {
    now,
  });
  assertFreshAuthentication(credential, now(), maxAgeMs);
  return session;
}
