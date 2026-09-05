/**
 * Resolves the current Firebase user into both the raw `User` (needed by the
 * TOTP SDK flows) and an `AuthenticatedActor` (needed by the `AUTH-MFA-003A1`
 * discovery callable). Deliberately duplicated from
 * `identity/hooks/useAuthenticatedActor.ts` (and its Business twin) per the
 * repository's disclosed-duplication convention (`AUTH-MFA-003B`), with the
 * addition of exposing the `User` itself — MFA enrollment operates on the
 * `User`, not just the actor.
 */

import { useEffect, useState } from "react";
import { onAuthStateChanged, type Auth, type User } from "firebase/auth";
import { resolveAuthReferenceType, UnresolvedAuthReferenceError } from "../api/authReference";
import type { AuthenticatedActor } from "../api/mfaCallableClient";

export type UseMfaSessionState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "error"; error: UnresolvedAuthReferenceError }
  | { status: "ready"; user: User; actor: AuthenticatedActor };

function resolveSessionState(user: User | null): UseMfaSessionState {
  if (!user) return { status: "unauthenticated" };
  try {
    const referenceType = resolveAuthReferenceType(user.providerData[0]?.providerId);
    return {
      status: "ready",
      user,
      actor: { getIdToken: () => user.getIdToken(), referenceType },
    };
  } catch (error) {
    if (error instanceof UnresolvedAuthReferenceError) {
      return { status: "error", error };
    }
    throw error;
  }
}

export function useMfaSession(auth: Auth): UseMfaSessionState {
  const [state, setState] = useState<UseMfaSessionState>({ status: "loading" });

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => setState(resolveSessionState(user)));
  }, [auth]);

  return state;
}
