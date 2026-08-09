/**
 * Real transport adapter for the AUTH-03 `authenticate` callable (AUTH-04).
 *
 * Binds `httpsCallable(functions, "authenticate")` and normalizes any thrown
 * `FirebaseError` into a mapped, enumeration-resistant `AuthenticateError` —
 * never surfacing the server message. The normalization is factored into
 * `toCallAuthenticate` (which takes an already-bound callable) so it is unit
 * testable without the Functions runtime; `makeCallAuthenticate` supplies the
 * production seam.
 */

import { httpsCallable, type Functions } from "firebase/functions";
import {
  AuthenticateError,
  mapCallableErrorCode,
  type AuthenticateOutcome,
  type AuthenticatePayload,
  type CallAuthenticate,
} from "./authenticateClient";

/** A bound callable: the shape `httpsCallable(...)` returns (`{ data }`). */
type BoundCallable = (payload: AuthenticatePayload) => Promise<{ data: AuthenticateOutcome }>;

export function toCallAuthenticate(callable: BoundCallable): CallAuthenticate {
  return async (payload) => {
    try {
      const result = await callable(payload);
      return result.data;
    } catch (error) {
      const code = (error as { code?: unknown } | undefined)?.code;
      throw new AuthenticateError(
        mapCallableErrorCode(typeof code === "string" ? code : undefined),
      );
    }
  };
}

export function makeCallAuthenticate(functions: Functions): CallAuthenticate {
  return toCallAuthenticate(
    httpsCallable<AuthenticatePayload, AuthenticateOutcome>(functions, "authenticate"),
  );
}
