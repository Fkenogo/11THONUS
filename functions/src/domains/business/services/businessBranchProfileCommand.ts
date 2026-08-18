/**
 * `updateBusinessBranchProfileCommand` (`ENG-P2-002C`, Phase E/F/N/O).
 *
 * Same composition as `businessProfileCommand.ts`. Tenant isolation
 * (Phase N) is enforced structurally in two layers: (1) the evaluator
 * denies before `prepare` ever runs if the caller has no membership on
 * `businessId`; (2) `readBusinessBranchForBusiness` itself returns `null`
 * — indistinguishable from "does not exist" — if the resolved branch's own
 * `businessId` does not match the authorized context, so a caller cannot
 * supply another Business's branch id to escape its own authorized
 * context even while genuinely authorized on `businessId`.
 */

import type { Firestore } from "firebase-admin/firestore";
import {
  authorizeAndExecute,
  type AuthorizeAndExecuteResult,
} from "../../permissions/service/authorizeAndExecute";
import { writeOutboxEntry } from "../../../shared/outbox/outboxWriter";
import type { EventActor } from "../../../shared/events/domainEvent";
import {
  updateBusinessBranchProfile,
  type UpdateBusinessBranchProfileParams,
} from "../models/businessBranch";
import { businessBranchNotFoundError } from "../models/businessErrors";
import { buildBusinessBranchUpdatedEvent } from "../events/businessEvents";
import {
  readBusinessBranchForBusiness,
  writeBusinessBranchUpdate,
} from "../repositories/businessRepository";

const PERMISSION = "businessBranch.updateProfile";

export type BusinessBranchProfilePatch = Omit<UpdateBusinessBranchProfileParams, "updatedAt">;

export type UpdateBusinessBranchProfileCommandParams = {
  userId: string;
  businessId: string;
  branchId: string;
  patch: BusinessBranchProfilePatch;
  idempotencyKey: string;
  requestHash: string;
  correlationId: string;
  now: Date;
  newId: () => string;
};

export type UpdateBusinessBranchProfileResult = {
  branchId: string;
  updatedAt: string;
};

export async function updateBusinessBranchProfileCommand(
  db: Firestore,
  params: UpdateBusinessBranchProfileCommandParams,
): Promise<AuthorizeAndExecuteResult<UpdateBusinessBranchProfileResult>> {
  const actor: EventActor = { actorType: "user", actorId: params.userId };
  const updatedFields = Object.keys(params.patch);

  return authorizeAndExecute(db, {
    request: { userId: params.userId, businessId: params.businessId, permission: PERMISSION },
    idempotencyKey: params.idempotencyKey,
    requestHash: params.requestHash,
    correlationId: params.correlationId,
    actorId: params.userId,
    mutation: {
      prepare: async (transaction) => {
        const branch = await readBusinessBranchForBusiness(
          transaction,
          db,
          params.businessId,
          params.branchId,
        );
        if (!branch) {
          throw businessBranchNotFoundError(params.branchId);
        }
        return branch;
      },
      apply: (writer, branch) => {
        const updated = updateBusinessBranchProfile(branch, {
          ...params.patch,
          updatedAt: params.now,
        });
        writeBusinessBranchUpdate(writer, db, updated);

        const event = buildBusinessBranchUpdatedEvent({
          eventId: params.newId(),
          correlationId: params.correlationId,
          actor,
          occurredAt: params.now.toISOString(),
          businessId: params.businessId,
          branchId: params.branchId,
          updatedFields,
        });
        writeOutboxEntry(writer, db, event);

        return { branchId: updated.id, updatedAt: updated.updatedAt.toISOString() };
      },
    },
  });
}
