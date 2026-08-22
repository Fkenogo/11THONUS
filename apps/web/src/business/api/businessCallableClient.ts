/**
 * Shared transport seam for every Business/Commerce-Knowledge/Staff callable
 * (`ENG-P3-002B`). Every one of these callables requires `rawToken` +
 * `referenceType` in its payload (`functions/src/index.ts`'s
 * `parseActorRequest`) exactly like AUTH-03's `authenticate` — there is no
 * ambient `request.auth` reliance. This module factors that actor-attachment
 * plus the shared HTTPS-code → client-code error mapping (identical taxonomy
 * to `authenticateClient.ts`'s `mapCallableErrorCode`, reused rather than
 * duplicated) out of the ~13 per-callable adapter files, mirroring
 * `toCallAuthenticate`'s "bound callable in, normalized function out" shape
 * so each is still independently unit-testable without the Functions runtime.
 */

import { AuthenticateError, mapCallableErrorCode } from "../../authentication/authenticateClient";
import type { AuthProviderId } from "../../authentication/providerConfig";

/** Re-exported under a domain-neutral name — the taxonomy is shared, not auth-specific. */
export class BusinessApiError extends AuthenticateError {}

/**
 * Same retryable set `authenticateClient.ts` uses — transient/ambiguous
 * transport failures only. Callers (mutation hooks) use this to decide
 * whether to keep an `IdempotencyKeyHolder`'s key alive for a retry
 * (retryable) or `clear()` it because the outcome is now definitively known
 * (everything else, including a denied/validation failure).
 */
export function isRetryableBusinessErrorCode(code: string): boolean {
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
 * into a `BusinessApiError` — never surfacing the raw server message.
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
      throw new BusinessApiError(mapCallableErrorCode(typeof code === "string" ? code : undefined));
    }
  };
}
