/**
 * Adapter for the `AUTH-MFA-003A1` `discoverPlatformAdministrator` callable.
 *
 * The callable resolves the caller's identity server-side and returns exactly
 * `{ isPlatformAdministrator: boolean }` — routing information only. This
 * adapter never sends a target user id nor any identity-selecting field, by
 * construction; discovery can only ever answer "is the currently signed-in,
 * server-verified caller an active platform administrator?".
 */

import { httpsCallable, type Functions } from "firebase/functions";
import { toCallWithActor, type AuthenticatedActor } from "./mfaCallableClient";

export type DiscoverPlatformAdministratorResult = { isPlatformAdministrator: boolean };

type BoundCallable = (
  payload: Record<string, unknown>,
) => Promise<{ data: DiscoverPlatformAdministratorResult }>;

export function toCallDiscoverPlatformAdministrator(
  callable: BoundCallable,
): (actor: AuthenticatedActor) => Promise<DiscoverPlatformAdministratorResult> {
  const call = toCallWithActor<Record<string, never>, DiscoverPlatformAdministratorResult>(
    callable,
  );
  return (actor) => call(actor, {});
}

export function makeCallDiscoverPlatformAdministrator(functions: Functions) {
  return toCallDiscoverPlatformAdministrator(
    httpsCallable(functions, "discoverPlatformAdministrator"),
  );
}
