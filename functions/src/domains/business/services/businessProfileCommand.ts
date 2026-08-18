/**
 * `updateBusinessProfileCommand` (`ENG-P2-002C`, Phase F/G/O).
 *
 * Composes through the existing `ENG-P2-004` `authorizeAndExecute` boundary
 * exactly like `touchPermissionBoundaryFixtureCommand.ts` (the governed
 * `004D` precedent) — no local role/owner/override check, no bespoke
 * transaction, no second idempotency mechanism. `business.updateProfile`
 * is a non-sensitive permission (absent from the Sensitive Permission
 * Catalogue by design — `ENG-P2-002-DESIGN-001` §10.2 explicitly classifies
 * profile updates as "would inherit via role default like any other
 * non-sensitive business-admin action"), so it resolves through the
 * evaluator's ordinary role-default path, never the sensitive-audit path.
 *
 * `businessId` is the authorized context the evaluator checks against; a
 * caller with no membership on that Business is denied before `mutation
 * .prepare` ever runs — the Business document is never even read for a
 * denied request (Phase N tenant isolation, structural).
 */

import type { Firestore } from "firebase-admin/firestore";
import { authorizeAndExecute, type AuthorizeAndExecuteResult } from "../../permissions/service/authorizeAndExecute";
import { writeOutboxEntry } from "../../../shared/outbox/outboxWriter";
import type { EventActor } from "../../../shared/events/domainEvent";
import { updateBusinessProfile, type UpdateBusinessProfileParams } from "../models/business";
import { businessNotFoundError } from "../models/businessErrors";
import { buildBusinessProfileUpdatedEvent } from "../events/businessEvents";
import { readBusinessById, writeBusinessUpdate } from "../repositories/businessRepository";

const PERMISSION = "business.updateProfile";

/** Every field a client may patch — `updatedAt` is server-derived, never client input. */
export type BusinessProfilePatch = Omit<UpdateBusinessProfileParams, "updatedAt">;

export type UpdateBusinessProfileCommandParams = {
  /** Server-resolved Customer Identity id — never client-supplied. */
  userId: string;
  businessId: string;
  patch: BusinessProfilePatch;
  idempotencyKey: string;
  requestHash: string;
  correlationId: string;
  now: Date;
  newId: () => string;
};

export type UpdateBusinessProfileResult = {
  businessId: string;
  updatedAt: string;
};

export async function updateBusinessProfileCommand(
  db: Firestore,
  params: UpdateBusinessProfileCommandParams,
): Promise<AuthorizeAndExecuteResult<UpdateBusinessProfileResult>> {
  const actor: EventActor = { actorType: "user", actorId: params.userId };
  // Only the fields the caller actually supplied — including a field
  // explicitly set to `undefined` to clear it — are recorded as "changed"
  // (never inferred by diffing values, and never logged with the new value).
  const updatedFields = Object.keys(params.patch);

  return authorizeAndExecute(db, {
    request: { userId: params.userId, businessId: params.businessId, permission: PERMISSION },
    idempotencyKey: params.idempotencyKey,
    requestHash: params.requestHash,
    correlationId: params.correlationId,
    actorId: params.userId,
    mutation: {
      prepare: async (transaction) => {
        const business = await readBusinessById(transaction, db, params.businessId);
        if (!business) {
          throw businessNotFoundError(params.businessId);
        }
        return business;
      },
      apply: (writer, business) => {
        const updated = updateBusinessProfile(business, { ...params.patch, updatedAt: params.now });
        writeBusinessUpdate(writer, db, updated);

        const event = buildBusinessProfileUpdatedEvent({
          eventId: params.newId(),
          correlationId: params.correlationId,
          actor,
          occurredAt: params.now.toISOString(),
          businessId: params.businessId,
          updatedFields,
        });
        writeOutboxEntry(writer, db, event);

        return { businessId: updated.id, updatedAt: updated.updatedAt.toISOString() };
      },
    },
  });
}
