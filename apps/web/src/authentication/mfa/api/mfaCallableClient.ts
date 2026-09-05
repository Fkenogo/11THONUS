/**
 * Shared transport seam for the MFA enrollment surface's authenticated
 * callables (`discoverPlatformAdministrator`, `AUTH-MFA-003B`). The callable
 * requires `rawToken` + `referenceType` in its payload exactly like every
 * other authenticated callable in this codebase — no ambient `request.auth`
 * reliance.
 *
 * Deliberately duplicated from `business/api/businessCallableClient.ts` /
 * `identity/api/identityCallableClient.ts` rather than cross-domain imported,
 * mirroring the exact "disclosed duplication" convention the Identity/Business
 * boundary already established — MFA enrollment is an authentication-domain
 * capability and does not reach into the Business or Identity domains for this
 * generic transport seam. The shared error taxonomy (`AuthenticateError` /
 * `mapCallableErrorCode`) is imported from `authentication/authenticateClient`
 * unchanged — that module is this repository's one designated shared authority
 * for callable-error mapping.
 */

import { AuthenticateError, mapCallableErrorCode } from "../../authenticateClient";
import type { AuthProviderId } from "../../providerConfig";

/** Re-exported under a domain-neutral name — the taxonomy is shared, not auth-specific. */
export class MfaApiError extends AuthenticateError {}

/** Same retryable set every other callable-client module uses. */
export function isRetryableMfaErrorCode(code: string): boolean {
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
 * into an `MfaApiError` — never surfacing the raw server message.
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
      throw new MfaApiError(mapCallableErrorCode(typeof code === "string" ? code : undefined));
    }
  };
}
