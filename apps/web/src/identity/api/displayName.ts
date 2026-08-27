/**
 * Adapter for the `IDENTITY-PROFILE-A` `getMyDisplayName`/`setDisplayName`
 * callables. Both callables resolve the caller's identity server-side
 * (`resolveAuthenticatedIdentityActor`) — no target user id is ever part of
 * this adapter's request shape, by construction. Unlike Business mutations,
 * these callables do not use the `authorizeAndExecute`/`MutationOutcome`
 * envelope (Identity has no Business-scoped permission to evaluate), so the
 * plain callable result is returned unwrapped.
 */

import { httpsCallable, type Functions } from "firebase/functions";
import { toCallWithActor, type AuthenticatedActor } from "./identityCallableClient";

export type DisplayNameReadResult = { displayName?: string };
export type DisplayNameWriteResult = { displayName: string };

export type SetDisplayNameRequest = {
  displayName: string;
  idempotencyKey: string;
};

type BoundCallable<TResult> = (payload: Record<string, unknown>) => Promise<{ data: TResult }>;

export function toCallGetMyDisplayName(
  callable: BoundCallable<DisplayNameReadResult>,
): (actor: AuthenticatedActor) => Promise<DisplayNameReadResult> {
  const call = toCallWithActor<Record<string, never>, DisplayNameReadResult>(callable);
  return (actor) => call(actor, {});
}

export function makeCallGetMyDisplayName(
  functions: Functions,
): (actor: AuthenticatedActor) => Promise<DisplayNameReadResult> {
  return toCallGetMyDisplayName(httpsCallable(functions, "getMyDisplayName"));
}

export function toCallSetDisplayName(
  callable: BoundCallable<DisplayNameWriteResult>,
): (actor: AuthenticatedActor, payload: SetDisplayNameRequest) => Promise<DisplayNameWriteResult> {
  return toCallWithActor<SetDisplayNameRequest, DisplayNameWriteResult>(callable);
}

export function makeCallSetDisplayName(
  functions: Functions,
): (actor: AuthenticatedActor, payload: SetDisplayNameRequest) => Promise<DisplayNameWriteResult> {
  return toCallSetDisplayName(httpsCallable(functions, "setDisplayName"));
}
