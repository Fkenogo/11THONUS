import { useQuery } from "@tanstack/react-query";
import type { Auth } from "firebase/auth";
import type { Functions } from "firebase/functions";
import { useMfaSession } from "./useMfaSession";
import { makeCallDiscoverPlatformAdministrator } from "../api/discoverPlatformAdministrator";
import { mfaQueryKeys } from "./queryKeys";

/**
 * Reads whether the current caller is an active platform administrator through
 * the governed backend surface (`discoverPlatformAdministrator`) — never a
 * local/optimistic value, never a direct `platformAdministrators` collection
 * read. `enabled` only once the session is `"ready"`, mirroring every other
 * authenticated query in this codebase.
 */
export function usePlatformAdministratorDiscoveryQuery(platform: {
  auth: Auth;
  functions: Functions;
}) {
  const session = useMfaSession(platform.auth);
  return useQuery({
    queryKey: mfaQueryKeys.platformAdministratorDiscovery(),
    queryFn: () =>
      makeCallDiscoverPlatformAdministrator(platform.functions)(
        session.status === "ready"
          ? session.actor
          : (() => {
              throw new Error("actor not ready");
            })(),
      ),
    enabled: session.status === "ready",
  });
}
