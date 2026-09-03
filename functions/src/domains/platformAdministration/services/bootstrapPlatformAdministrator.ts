/**
 * First-administrator bootstrap (`ENG-P3-003A`, `FD-KS-1`).
 *
 * **This function is deliberately never wired to any `onCall`/`onRequest`
 * export in `functions/src/index.ts`, and never will be by this package.**
 * It is a plain exported function, reachable only by direct Firebase Admin
 * SDK execution (a one-off authenticated operator script or `firebase
 * functions:shell` run with a service account / Application Default
 * Credentials) — the exact same trust boundary `runCommerceKnowledgeSeed`
 * already establishes in this codebase for a different purpose. This is the
 * reused mechanism, not an invented one:
 *
 *  - **No public/self-service creation.** There is no HTTPS/callable path to
 *    this function at all. No authenticated end-user request, however
 *    crafted, can reach it — the absence of a transport binding is the
 *    control, not a permission check that could be misconfigured.
 *  - **No hard-coded Founder UID/email.** `targetUserId` is a required
 *    runtime parameter; nothing in this module names a specific identity.
 *  - **Explicit authorized operational action.** Only a principal with
 *    direct backend/service-account execution rights — the same class of
 *    access already required to run this repository's own seed scripts or
 *    Firebase project provisioning (`ENG-P1-001`'s own precedent: "Founder-
 *    authorized action... not a coding agent's") — can invoke this at all.
 *  - **Auditable.** Writes a `platform_administrator_bootstrapped` audit
 *    record in the same transaction as the administrator record itself.
 *  - **Idempotent/retry-safe.** Delegates to `createPlatformAdministratorPersisted`'s
 *    existence-check-then-create/reject semantics.
 *  - **Fails closed.** A conflicting prior record (different roles, or a
 *    non-`active` status) throws rather than silently overwriting.
 *  - **Cannot silently elevate an arbitrary authenticated user.** There is no
 *    "caller" in the authenticated-request sense at all — this function
 *    takes no Firebase ID token, no session, and performs no authentication
 *    check, because it is never invoked from a context where one exists. Its
 *    authority comes entirely from the Admin SDK's own trusted service
 *    account, identical to the seed loader's trust model.
 *  - **Not a standing, unrestricted permanent privilege.** Because it carries
 *    no client-reachable transport, there is no persistent grant of
 *    elevated *calling* rights to any principal — "who may run this"
 *    is governed entirely by who holds direct backend/service-account
 *    execution access to this codebase's deployment, the same operational
 *    boundary every other privileged one-off script in this repository
 *    already relies on. No new mechanism is introduced to satisfy this.
 */

import { randomUUID } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import {
  createPlatformAdministrator,
  hasSameRoles,
  type PlatformAdministrator,
} from "../models/platformAdministrator";
import {
  fromPlatformAdministratorDocument,
  toPlatformAdministratorDocumentFields,
} from "../repositories/platformAdministratorDocument";
import { PLATFORM_ADMINISTRATORS_COLLECTION } from "../repositories/platformAdministratorRepository";
import { recordPlatformAdministrationAuditEntry } from "../repositories/platformAdministrationAuditRepository";
import { createPlatformAdministrationAuditRecord } from "../models/platformAdministrationAuditRecord";
import { platformAdministratorBootstrapConflictError } from "../models/platformAdministrationErrors";

function stripUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key of Object.keys(value) as Array<keyof T>) {
    if (value[key] !== undefined) {
      result[key] = value[key];
    }
  }
  return result;
}

export type BootstrapPlatformAdministratorParams = {
  targetUserId: string;
  roles: readonly string[];
  /** A human-readable operator reference (e.g. the operator's own email or identifier) — audit-only, never authorization input. */
  operatorReference: string;
  correlationId: string;
  now: Date;
};

export async function bootstrapPlatformAdministrator(
  db: Firestore,
  params: BootstrapPlatformAdministratorParams,
): Promise<PlatformAdministrator> {
  const candidate = createPlatformAdministrator({
    userId: params.targetUserId,
    roles: params.roles,
    invitedBy: params.operatorReference,
    approvedBy: params.operatorReference,
    now: params.now,
  });
  const ref = db.collection(PLATFORM_ADMINISTRATORS_COLLECTION).doc(candidate.userId);

  return db.runTransaction(async (transaction) => {
    // Read phase.
    const existingSnapshot = await transaction.get(ref);

    let result: PlatformAdministrator;
    let isNewRecord: boolean;
    if (!existingSnapshot.exists) {
      result = candidate;
      isNewRecord = true;
    } else {
      const existing = fromPlatformAdministratorDocument(candidate.userId, existingSnapshot.data());
      if (
        existing === null ||
        existing.status !== "active" ||
        !hasSameRoles(existing.roles, candidate.roles)
      ) {
        throw platformAdministratorBootstrapConflictError(candidate.userId);
      }
      result = existing;
      isNewRecord = false;
    }

    // Write phase.
    if (isNewRecord) {
      transaction.set(ref, stripUndefined(toPlatformAdministratorDocumentFields(result)));
    }
    recordPlatformAdministrationAuditEntry(
      db,
      transaction,
      createPlatformAdministrationAuditRecord({
        id: randomUUID(),
        actionType: "platform_administrator_bootstrapped",
        actorReference: params.operatorReference,
        targetId: candidate.userId,
        outcome: "created",
        ...(isNewRecord ? {} : { reasonCode: "ALREADY_BOOTSTRAPPED_IDENTICAL" }),
        correlationId: params.correlationId,
        occurredAt: params.now,
      }),
    );

    return result;
  });
}
