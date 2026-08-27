import { useQuery } from "@tanstack/react-query";
import type { Auth } from "firebase/auth";
import type { Functions } from "firebase/functions";
import { useAuthenticatedActor } from "./useAuthenticatedActor";
import { makeCallGetMyDisplayName } from "../api/displayName";
import { identityQueryKeys } from "./queryKeys";

/**
 * Reads the caller's own Display Name through the governed backend surface
 * (`getMyDisplayName`) — never a local/optimistic value. `enabled` only
 * once the actor is `"ready"`, mirroring every other authenticated query in
 * this codebase (`business/hooks/businessQueries.ts`).
 */
export function useMyDisplayNameQuery(platform: { auth: Auth; functions: Functions }) {
  const actorState = useAuthenticatedActor(platform.auth);
  return useQuery({
    queryKey: identityQueryKeys.myDisplayName(),
    queryFn: () =>
      makeCallGetMyDisplayName(platform.functions)(
        actorState.status === "ready"
          ? actorState.actor
          : (() => {
              throw new Error("actor not ready");
            })(),
      ),
    enabled: actorState.status === "ready",
  });
}
