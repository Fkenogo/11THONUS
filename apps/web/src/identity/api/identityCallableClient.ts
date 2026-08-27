/**
 * Shared transport seam for the Identity-domain platform Display Name
 * callables (`setDisplayName`/`getMyDisplayName`, `IDENTITY-PROFILE-A`).
 * Both callables require `rawToken`+`referenceType` in their payload,
 * exactly like every other authenticated callable in this codebase — no
 * ambient `request.auth` reliance.
 *
 * Deliberately duplicated from `business/api/businessCallableClient.ts`
 * rather than cross-domain imported, mirroring the backend's own
 * "disclosed duplication" convention for this exact Identity/Business
 * boundary. The shared error taxonomy itself (`AuthenticateError`/
 * `mapCallableErrorCode`) is imported from `authentication/authenticateClient`
 * unchanged — that module is this repository's one designated shared
 * authority for callable-error mapping, not a domain-specific one.
 */

import { AuthenticateError, mapCallableErrorCode } from "../../authentication/authenticateClient";
import type { AuthProviderId } from "../../authentication/providerConfig";

/** Re-exported under a domain-neutral name — the taxonomy is shared, not auth-specific. */
export class IdentityApiError extends AuthenticateError {}

/** Same retryable set every other callable-client module uses. */
export function isRetryableIdentityErrorCode(code: string): boolean {
  return code === "unavailable" || code === "timeout";
}

export type AuthenticatedActor = {
  getIdToken: () => Promise<string>;
  referenceType: AuthProviderId;
};

type BoundCallable<TResult> = (payload: Record<string, unknown>) => Promise<{ data: TResult }>;

/**
 * Wraps a bound `httpsCallable` result: attaches `rawToken`/`referenceType`
 * from the current actor to every call, and normalizes thrown `FirebaseError`s
 * into an `IdentityApiError` — never surfacing the raw server message.
 */
export function toCallWithActor<TPayload extends Record<string, unknown>, TResult>(
  callable: BoundCallable<TResult>,
): (actor: AuthenticatedActor, payload: TPayload) => Promise<TResult> {
  return async (actor, payload) => {
    const rawToken = await actor.getIdToken();
    try {
      const result = await callable({
        ...payload,
        rawToken,
        referenceType: actor.referenceType,
      });
      return result.data;
    } catch (error) {
      const code = (error as { code?: unknown } | undefined)?.code;
      throw new IdentityApiError(mapCallableErrorCode(typeof code === "string" ? code : undefined));
    }
  };
}
