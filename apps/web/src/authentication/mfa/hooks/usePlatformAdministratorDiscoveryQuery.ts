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
 *
 * The query key is scoped to the caller's Firebase `uid` so that a cached
 * result for one user can never be served to a different user within the
 * app-wide singleton `QueryClient`'s retention window (`P1-01` correction:
 * the discovery answer is user-dependent routing data). The server callable
 * remains the authority; there is no persistent client-side administrator
 * state to clear on a user transition — switching to a different uid resolves
 * a fresh callable-backed entry.
 */
export function usePlatformAdministratorDiscoveryQuery(platform: {
  auth: Auth;
  functions: Functions;
}) {
  const session = useMfaSession(platform.auth);
  return useQuery({
    queryKey: mfaQueryKeys.platformAdministratorDiscovery(
      session.status === "ready" ? session.user.uid : "no-session",
    ),
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
