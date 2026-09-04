/**
 * Platform-administrator lifecycle state machine (`ENG-P3-003A`).
 *
 * TRD18 §18.10's closed four-value status enum (`invited`/`active`/
 * `suspended`/`removed`), reused unmodified. TRD18 does not itself specify
 * a transition table, so this module derives the minimum one the approved
 * design needs — mirroring `staffMembershipLifecycle.ts`'s existing,
 * governed shape for the identical four-value Business-membership status
 * enum, rather than inventing a different pattern for a structurally
 * analogous problem.
 *
 * `removed` is terminal, exactly as `staffMembershipLifecycle.ts` treats it:
 * a removed administrator is never reactivated by any transition this
 * module exposes. Re-granting access to a previously-removed identity is a
 * fresh bootstrap/invitation decision, not a lifecycle transition.
 */

import { invalidPlatformAdministratorLifecycleTransitionError } from "./platformAdministrationErrors";

export const PLATFORM_ADMINISTRATOR_STATUSES = [
  "invited",
  "active",
  "suspended",
  "removed",
] as const;

export type PlatformAdministratorStatus = (typeof PLATFORM_ADMINISTRATOR_STATUSES)[number];

export function isPlatformAdministratorStatus(value: string): value is PlatformAdministratorStatus {
  return (PLATFORM_ADMINISTRATOR_STATUSES as readonly string[]).includes(value);
}

export const PLATFORM_ADMINISTRATOR_LIFECYCLE_ACTIONS = [
  "activate",
  "suspend",
  "reactivate",
  "remove",
] as const;

export type PlatformAdministratorLifecycleAction =
  (typeof PLATFORM_ADMINISTRATOR_LIFECYCLE_ACTIONS)[number];

const TARGET_STATUS: Readonly<
  Record<PlatformAdministratorLifecycleAction, PlatformAdministratorStatus>
> = {
  activate: "active",
  suspend: "suspended",
  reactivate: "active",
  remove: "removed",
};

const REQUIRED_CURRENT_STATUS: Readonly<
  Record<PlatformAdministratorLifecycleAction, readonly PlatformAdministratorStatus[]>
> = {
  activate: ["invited"],
  suspend: ["active"],
  reactivate: ["suspended"],
  remove: ["invited", "active", "suspended"],
};

/** Pure predicate — no I/O, no authorization check (mirrors `isPermittedLifecycleTransition`). */
export function isPermittedPlatformAdministratorTransition(
  currentStatus: PlatformAdministratorStatus,
  action: PlatformAdministratorLifecycleAction,
): boolean {
  return REQUIRED_CURRENT_STATUS[action].includes(currentStatus);
}

export function targetStatusForPlatformAdministratorAction(
  action: PlatformAdministratorLifecycleAction,
): PlatformAdministratorStatus {
  return TARGET_STATUS[action];
}

/** Throws if the transition is not permitted; otherwise returns the resulting status. */
export function applyPlatformAdministratorTransition(
  currentStatus: PlatformAdministratorStatus,
  action: PlatformAdministratorLifecycleAction,
): PlatformAdministratorStatus {
  if (!isPermittedPlatformAdministratorTransition(currentStatus, action)) {
    throw invalidPlatformAdministratorLifecycleTransitionError(currentStatus, action);
  }
  return targetStatusForPlatformAdministratorAction(action);
}
