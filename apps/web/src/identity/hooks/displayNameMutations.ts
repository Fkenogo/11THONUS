import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import type { Auth } from "firebase/auth";
import type { Functions } from "firebase/functions";
import { useAuthenticatedActor } from "./useAuthenticatedActor";
import { makeCallSetDisplayName } from "../api/displayName";
import { isRetryableIdentityErrorCode, type IdentityApiError } from "../api/identityCallableClient";
import { createIdempotencyKeyHolder } from "../api/idempotencyKeyHolder";
import { identityQueryKeys } from "./queryKeys";

function settleKeyOnError(holder: ReturnType<typeof createIdempotencyKeyHolder>, error: unknown) {
  const code = (error as IdentityApiError | undefined)?.code;
  if (!code || !isRetryableIdentityErrorCode(code)) {
    holder.clear();
  }
}

/**
 * Writes the caller's own Display Name through the governed self-write
 * (`setDisplayName`). On success, invalidates the Display Name query so the
 * UI re-reads the backend-authoritative value rather than trusting local
 * form state (Phase H) — the mutation's own returned value is not treated
 * as final on its own.
 */
export function useSetDisplayNameMutation(platform: { auth: Auth; functions: Functions }) {
  const actorState = useAuthenticatedActor(platform.auth);
  const queryClient = useQueryClient();
  const holderRef = useRef(createIdempotencyKeyHolder());

  return useMutation({
    mutationFn: (displayName: string) => {
      if (actorState.status !== "ready") {
        throw new Error("actor not ready");
      }
      return makeCallSetDisplayName(platform.functions)(actorState.actor, {
        displayName,
        idempotencyKey: holderRef.current.getKey(),
      });
    },
    onSuccess: () => {
      holderRef.current.clear();
      queryClient.invalidateQueries({ queryKey: identityQueryKeys.myDisplayName() });
    },
    onError: (error) => settleKeyOnError(holderRef.current, error),
  });
}
