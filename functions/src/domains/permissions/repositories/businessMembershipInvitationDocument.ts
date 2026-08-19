/**
 * `businessMembershipInvitations` write-side converter (`ENG-P2-003B`).
 *
 * TRD10 §10.6.4a's persisted shape, already declared by `ENG-P2-003A`. The
 * read side (`fromBusinessMembershipInvitationDocument`) already exists in
 * `../models/businessMembershipInvitation.ts` — this file supplies only the
 * write-side counterpart `ENG-P2-003A` explicitly deferred ("no repository,
 * transaction, or write path is implemented by `ENG-P2-003A`").
 *
 * Mirrors `businessDocument.ts`'s `toBusinessDocumentFields` convention:
 * plain object, native `Date` fields (the Admin SDK converts `Date` →
 * `Timestamp` on write; no `Timestamp` import needed here), `undefined`
 * optional fields dropped so `.set()` never receives an explicit
 * `undefined` (the Admin SDK rejects that).
 */

import type { BusinessMembershipInvitation } from "../models/businessMembershipInvitation";

export type BusinessMembershipInvitationDocumentFields = {
  businessId: string;
  role: string;
  deliveryTarget: { type: string; value: string };
  invitedBy: string;
  status: string;
  invitedAt: Date;
  expiresAt: Date;
  resolvedAt?: Date;
  acceptedMembershipId?: string;
  createdAt: Date;
  updatedAt: Date;
  schemaVersion: number;
};

function stripUndefined<T extends Record<string, unknown>>(value: T): T {
  const result = { ...value };
  for (const key of Object.keys(result)) {
    if (result[key] === undefined) {
      delete result[key];
    }
  }
  return result;
}

export function toBusinessMembershipInvitationDocumentFields(
  invitation: BusinessMembershipInvitation,
): BusinessMembershipInvitationDocumentFields {
  return stripUndefined({
    businessId: invitation.businessId,
    role: invitation.role,
    deliveryTarget: {
      type: invitation.deliveryTarget.type,
      value: invitation.deliveryTarget.value,
    },
    invitedBy: invitation.invitedBy,
    status: invitation.status,
    invitedAt: invitation.invitedAt,
    expiresAt: invitation.expiresAt,
    resolvedAt: invitation.resolvedAt,
    acceptedMembershipId: invitation.acceptedMembershipId,
    createdAt: invitation.createdAt,
    updatedAt: invitation.updatedAt,
    schemaVersion: invitation.schemaVersion,
  });
}
