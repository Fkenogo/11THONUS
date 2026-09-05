/**
 * Trusted platform-administrator discovery (`AUTH-MFA-003A1`).
 *
 * A read-only routing primitive consumed only by the client access layer
 * ("should this authenticated user be offered the platform-administrator
 * experience?"). It answers a single question — `is this identity a
 * currently-active platform administrator?` — and nothing else.
 *
 * **Trusted identity — never a client field.** The `userId` argument must be
 * the value a verified authentication step already produced (the
 * `userId === customerIdentityId` returned by
 * `resolveAuthenticatedIdentityActor`, `authenticatedIdentityActor.ts`).
 * This function does no token verification itself, mirroring
 * `resolvePlatformAdministratorAuthorization`'s division of labor: it starts
 * from an already-resolved identity, and reads `platformAdministrators/{userId}`
 * — the repository's doc-id-as-key contract (`ENG-P3-003-DESIGN-001` §6:
 * "one administrator record per Customer Identity"). A client-supplied
 * `userId`/`customerIdentityId` is structurally unreachable: the transport
 * parser in `functions/src/index.ts` never reads such keys off `data`.
 *
 * **Lifecycle.** Only `status === "active"` is discoverable. The doc-id-as-key
 * lookup plus this single status predicate mirrors — exactly —
 * `evaluateKnowledgePlatformPermission`'s `NO_ADMINISTRATOR_RECORD` /
 * `ADMINISTRATOR_NOT_ACTIVE` tests: no record, `invited` (recognised-but-
 * not-yet-activated), `suspended`, and `removed` (terminal) all resolve to
 * `false`. Discovery and authorization therefore cannot disagree about who
 * is a functioning administrator, because they derive that fact from the
 * same record and the same status test.
 *
 * **Fail closed.** A structural failure never becomes `false`:
 *  - a `platformAdministrators/{userId}` document that fails
 *    `fromPlatformAdministratorDocument` validation (e.g. an unrecognised
 *    TRD18 role) makes `getPlatformAdministratorById` throw
 *    `platformAdministratorConfigMalformedError` (`AUTH_FORBIDDEN`), which
 *    propagates — the caller is treated as *unknown*, not as *not-an-
 *    administrator*, on an unverifiable record;
 *  - an infrastructure failure (e.g. Firestore unreachable) propagates as a
 *    raw error and is mapped to an internal transport failure by
 *    `toHttpsError` — never silently converted into `{ isPlatformAdministrator:
 *    false }`.
 *
 * **No audit mutation — by design.** This is a read-only *routing* decision
 * for client UX, not an authorization decision. `PLATFORM_ADMINISTRATION_-
 * AUDIT_ACTION_TYPES` is a closed vocabulary with exactly two entries
 * (`platform_administrator_bootstrapped`, `knowledge_permission_evaluated`);
 * discovery performs neither, and no third action type is invented here
 * (`AUTH-MFA-002` §8A.5: "discovery... consumed only by the client routing
 * layer, never by any backend authorization path"). Auditing every
 * background routing probe an authenticated main-thread emergency-access
 * screen issues would create privileged-action audit noise without
 * recording a privileged action. The one write a discovery hit must explain
 * is the consuming access-layer command's own, and if that command is an
 * MFA/privilege-challenge itself it audits through its own governed channel.
 *
 * **Injection.** `deps.getAdministrator` defaults to the governed
 * `getPlatformAdministratorById`; tests inject a stub to exercise lifecycle
 * states without a Firestore dependency.
 */

import type { Firestore } from "firebase-admin/firestore";
import type { PlatformAdministrator } from "../models/platformAdministrator";
import { getPlatformAdministratorById } from "../repositories/platformAdministratorRepository";

export type DiscoverPlatformAdministratorDeps = {
  getAdministrator?: (db: Firestore, userId: string) => Promise<PlatformAdministrator | null>;
};

export type DiscoverPlatformAdministratorResult = {
  readonly isPlatformAdministrator: boolean;
};

export async function discoverPlatformAdministrator(
  db: Firestore,
  userId: string,
  deps: DiscoverPlatformAdministratorDeps = {},
): Promise<DiscoverPlatformAdministratorResult> {
  const getAdministrator = deps.getAdministrator ?? getPlatformAdministratorById;
  const administrator = await getAdministrator(db, userId);
  return { isPlatformAdministrator: administrator?.status === "active" };
}
