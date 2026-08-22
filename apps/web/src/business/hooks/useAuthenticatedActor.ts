/**
 * Resolves the current Firebase user into an `AuthenticatedActor`
 * (`getIdToken` + `referenceType`) every Business/Staff/Commerce-Knowledge
 * callable requires. Built on the same `onAuthStateChanged` primitive as
 * `RequireAuthenticatedUser` — this hook is what the API hooks layer (§S)
 * actually calls, `RequireAuthenticatedUser` is what routes render behind.
 */

import { useEffect, useState } from "react";
import { onAuthStateChanged, type Auth, type User } from "firebase/auth";
import { resolveAuthReferenceType, UnresolvedAuthReferenceError } from "../api/authReference";
import type { AuthenticatedActor } from "../api/businessCallableClient";

export type UseAuthenticatedActorState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "error"; error: UnresolvedAuthReferenceError }
  | { status: "ready"; actor: AuthenticatedActor };

function resolveActorState(user: User | null): UseAuthenticatedActorState {
  if (!user) return { status: "unauthenticated" };
  try {
    const referenceType = resolveAuthReferenceType(user.providerData[0]?.providerId);
    return { status: "ready", actor: { getIdToken: () => user.getIdToken(), referenceType } };
  } catch (error) {
    if (error instanceof UnresolvedAuthReferenceError) {
      return { status: "error", error };
    }
    throw error;
  }
}

export function useAuthenticatedActor(auth: Auth): UseAuthenticatedActorState {
  const [state, setState] = useState<UseAuthenticatedActorState>({ status: "loading" });

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => setState(resolveActorState(user)));
  }, [auth]);

  return state;
}
