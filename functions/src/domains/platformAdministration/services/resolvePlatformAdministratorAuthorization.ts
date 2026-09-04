/**
 * Platform-administrator authorization resolution (`ENG-P3-003A`).
 *
 * The server-side enforcement primitive `ENG-P3-003-DESIGN-001` §10/§17
 * (`ENG-P3-003D`) names as the thing future Knowledge Studio commands call
 * — reads the caller's `platformAdministrators/{userId}` record, runs the
 * pure `evaluateKnowledgePlatformPermission` decision, and writes an audit
 * record, all inside one Firestore transaction (read before write, no
 * evaluate-then-audit gap). No protected mutation is composed here — that
 * composition (`ProtectedMutation`-shaped, `authorizeAndExecute`-style)
 * belongs to a future `ENG-P3-003C`/`D` command that has an actual mutation
 * to run; this package is authorization infrastructure only.
 *
 * **Every decision is audited — allow and deny alike.** `ENG-P3-003A` has no
 * real caller yet (no command is wired to invoke this), so there is no
 * volume concern to trade against the conservative choice of auditing
 * everything; a future package may narrow this once real traffic exists.
 *
 * **Caller identity is never trusted from `input` alone.** `callerUserId`
 * must be the value a verified authentication step already produced (e.g.
 * `resolveAuthenticatedCredential`'s `referenceId`/Firebase `uid`) — this
 * function does no token verification itself, mirroring
 * `evaluatePermissionWithContext`'s own division of labor (authentication is
 * a separate, earlier step; this function starts from an already-resolved
 * identity). A missing/invalid authentication upstream must never reach
 * this function with a fabricated `callerUserId` — that is the caller's
 * responsibility, exactly as it is for the Business evaluator.
 */

import { randomUUID } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import type { KnowledgePermissionId } from "../models/knowledgePermissionId";
import {
  evaluateKnowledgePlatformPermission,
  type KnowledgePlatformAuthorizationDecision,
  type PlatformAdministratorSnapshot,
} from "../evaluator/evaluateKnowledgePlatformPermission";
import { fromPlatformAdministratorDocument } from "../repositories/platformAdministratorDocument";
import { PLATFORM_ADMINISTRATORS_COLLECTION } from "../repositories/platformAdministratorRepository";
import { recordPlatformAdministrationAuditEntry } from "../repositories/platformAdministrationAuditRepository";
import { createPlatformAdministrationAuditRecord } from "../models/platformAdministrationAuditRecord";
import { platformAdministratorConfigMalformedError } from "../models/platformAdministrationErrors";

export type ResolvePlatformAdministratorAuthorizationInput = {
  readonly callerUserId: string;
  readonly permission: KnowledgePermissionId;
  /** See `evaluateKnowledgePlatformPermission.ts`'s header — must be genuinely verified, never a persisted flag. */
  readonly verifiedMfaSatisfied: boolean;
  readonly correlationId: string;
  readonly now: Date;
};

export async function resolvePlatformAdministratorAuthorization(
  db: Firestore,
  input: ResolvePlatformAdministratorAuthorizationInput,
): Promise<KnowledgePlatformAuthorizationDecision> {
  const ref = db.collection(PLATFORM_ADMINISTRATORS_COLLECTION).doc(input.callerUserId);

  return db.runTransaction(async (transaction) => {
    // Read phase.
    const snapshot = await transaction.get(ref);
    let administratorSnapshot: PlatformAdministratorSnapshot | null = null;
    if (snapshot.exists) {
      const administrator = fromPlatformAdministratorDocument(input.callerUserId, snapshot.data());
      if (administrator === null) {
        throw platformAdministratorConfigMalformedError();
      }
      administratorSnapshot = { status: administrator.status, roles: administrator.roles };
    }

    const decision = evaluateKnowledgePlatformPermission({
      administrator: administratorSnapshot,
      permission: input.permission,
      verifiedMfaSatisfied: input.verifiedMfaSatisfied,
    });

    // Write phase — audit, unconditionally.
    recordPlatformAdministrationAuditEntry(
      db,
      transaction,
      createPlatformAdministrationAuditRecord({
        id: randomUUID(),
        actionType: "knowledge_permission_evaluated",
        actorReference: input.callerUserId,
        targetId: input.callerUserId,
        outcome: decision.allowed ? "allow" : "deny",
        ...(decision.allowed ? {} : { reasonCode: decision.reason }),
        correlationId: input.correlationId,
        occurredAt: input.now,
      }),
    );

    return decision;
  });
}
