/**
 * Business Membership Invitation domain contract (`ENG-P2-003A`).
 *
 * Implements the minimum framework-independent invitation-domain contract
 * `ENG-P2-003-DESIGN-001` §7.1a/§7.2a governs (Founder-approved FD-1/FD-2/
 * FD-3/FD-4-STAFF, §28) — the pre-acceptance record that exists structurally
 * separate from `businessMembership` (`businessMembershipDocument.ts`,
 * untouched by this file).
 *
 * **This is not a membership.** `businessMembership.userId` remains
 * required/non-nullable — a `BusinessMembershipInvitation` never carries a
 * `userId` field at all; the authoritative Customer Identity is bound only
 * once ACCEPT creates a `businessMembership` (a separate package's
 * responsibility, `ENG-P2-003B`, not implemented here).
 *
 * No runtime transition service, no persistence, no token generation, no
 * invite-sending — this module is pure construction, validation, lifecycle
 * transition (structural only, mirrors `businessStatus.ts`'s pattern), and
 * a Firestore-document *reader* (mirrors `businessMembershipDocument.ts`'s
 * reader pattern — fail-closed, `null` on any malformed shape, no
 * exceptions thrown from the reader).
 *
 * Framework-independent (`eslint.config.js`, `permissions/**` boundary
 * rule) — no `firebase-admin` import; a Firestore `Timestamp` is
 * recognised structurally (duck typing on `.toDate()`), matching
 * `businessMembershipDocument.ts`'s own precedent.
 */

import { createInvitationRole, isInvitationRole, type InvitationRole } from "./invitationRole";
import {
  createInvitationDeliveryTarget,
  isInvitationDeliveryType,
  type InvitationDeliveryTarget,
} from "./invitationDeliveryTarget";
import {
  isInvitationStatus,
  isValidInvitationStatusTransition,
  type InvitationStatus,
} from "./invitationStatus";
import {
  invalidInvitationFieldError,
  invalidInvitationStatusTransitionError,
  invalidInvitationTimestampError,
  invitationExpiryNotAfterIssuedError,
} from "./permissionErrors";

export type BusinessMembershipInvitation = {
  readonly id: string;
  readonly businessId: string;
  readonly role: InvitationRole;
  readonly deliveryTarget: InvitationDeliveryTarget;
  readonly invitedBy: string;
  readonly status: InvitationStatus;
  readonly invitedAt: Date;
  readonly expiresAt: Date;
  readonly resolvedAt?: Date;
  readonly acceptedMembershipId?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly schemaVersion: number;
};

export type CreateBusinessMembershipInvitationParams = {
  id: string;
  businessId: string;
  role: string;
  deliveryTarget: { type: string; value: string };
  invitedBy: string;
  invitedAt: Date;
  expiresAt: Date;
};

function requireNonBlank(field: string, value: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw invalidInvitationFieldError(field, String(value));
  }
  return value;
}

function requireValidDate(field: string, value: Date): Date {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw invalidInvitationTimestampError(field);
  }
  return value;
}

export function createBusinessMembershipInvitation(
  params: CreateBusinessMembershipInvitationParams,
): BusinessMembershipInvitation {
  const id = requireNonBlank("id", params.id);
  const businessId = requireNonBlank("businessId", params.businessId);
  const role = createInvitationRole(params.role);
  const deliveryTarget = createInvitationDeliveryTarget(params.deliveryTarget);
  const invitedBy = requireNonBlank("invitedBy", params.invitedBy);
  const invitedAt = requireValidDate("invitedAt", params.invitedAt);
  const expiresAt = requireValidDate("expiresAt", params.expiresAt);

  if (expiresAt.getTime() <= invitedAt.getTime()) {
    throw invitationExpiryNotAfterIssuedError();
  }

  return {
    id,
    businessId,
    role,
    deliveryTarget,
    invitedBy,
    status: "pending",
    invitedAt,
    expiresAt,
    resolvedAt: undefined,
    acceptedMembershipId: undefined,
    createdAt: invitedAt,
    updatedAt: invitedAt,
    schemaVersion: 1,
  };
}

export type TransitionInvitationStatusParams = {
  resolvedAt: Date;
  /** Only meaningful for the `accepted` target status (§8a's acceptance linkage). */
  acceptedMembershipId?: string;
};

/**
 * Structural lifecycle transition only — mirrors `transitionBusinessStatus`'s
 * precedent (`business.ts`). No authorization, no persistence, no side
 * effects; the caller (a future `ENG-P2-003B` command) supplies
 * `resolvedAt`/`acceptedMembershipId` already resolved server-side.
 */
export function transitionInvitationStatus(
  invitation: BusinessMembershipInvitation,
  toStatus: InvitationStatus,
  params: TransitionInvitationStatusParams,
): BusinessMembershipInvitation {
  if (!isValidInvitationStatusTransition(invitation.status, toStatus)) {
    throw invalidInvitationStatusTransitionError(invitation.status, toStatus);
  }
  const resolvedAt = requireValidDate("resolvedAt", params.resolvedAt);

  return {
    ...invitation,
    status: toStatus,
    resolvedAt,
    acceptedMembershipId:
      toStatus === "accepted" ? params.acceptedMembershipId : invitation.acceptedMembershipId,
    updatedAt: resolvedAt,
  };
}

function isTimestampLike(value: unknown): value is { toDate: () => Date } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  );
}

function parseTimestamp(value: unknown): Date | null {
  if (!isTimestampLike(value)) return null;
  const date = value.toDate();
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  return date;
}

/**
 * Returns `null` (never throws) for a structurally invalid document —
 * mirrors `fromBusinessMembershipDocument`'s fail-closed reader contract.
 */
export function fromBusinessMembershipInvitationDocument(
  id: string,
  raw: unknown,
): BusinessMembershipInvitation | null {
  if (typeof id !== "string" || id.trim().length === 0) return null;

  const data = raw as Partial<{
    businessId: unknown;
    role: unknown;
    deliveryTarget: unknown;
    invitedBy: unknown;
    status: unknown;
    invitedAt: unknown;
    expiresAt: unknown;
    resolvedAt: unknown;
    acceptedMembershipId: unknown;
    createdAt: unknown;
    updatedAt: unknown;
    schemaVersion: unknown;
  }>;

  if (typeof data.businessId !== "string" || data.businessId.trim().length === 0) return null;
  if (typeof data.role !== "string" || !isInvitationRole(data.role)) return null;
  if (typeof data.invitedBy !== "string" || data.invitedBy.trim().length === 0) return null;
  if (!isInvitationStatus(data.status)) return null;
  if (
    typeof data.schemaVersion !== "number" ||
    !Number.isInteger(data.schemaVersion) ||
    data.schemaVersion < 1
  ) {
    return null;
  }

  const deliveryTargetRaw = data.deliveryTarget as
    Partial<{ type: unknown; value: unknown }> | undefined;
  if (
    typeof deliveryTargetRaw !== "object" ||
    deliveryTargetRaw === null ||
    !isInvitationDeliveryType(deliveryTargetRaw.type) ||
    typeof deliveryTargetRaw.value !== "string" ||
    deliveryTargetRaw.value.trim().length === 0
  ) {
    return null;
  }

  const invitedAt = parseTimestamp(data.invitedAt);
  const expiresAt = parseTimestamp(data.expiresAt);
  const createdAt = parseTimestamp(data.createdAt);
  const updatedAt = parseTimestamp(data.updatedAt);
  if (!invitedAt || !expiresAt || !createdAt || !updatedAt) return null;

  let resolvedAt: Date | undefined;
  if (data.resolvedAt !== undefined) {
    const parsed = parseTimestamp(data.resolvedAt);
    if (!parsed) return null;
    resolvedAt = parsed;
  }

  let acceptedMembershipId: string | undefined;
  if (data.acceptedMembershipId !== undefined) {
    if (
      typeof data.acceptedMembershipId !== "string" ||
      data.acceptedMembershipId.trim().length === 0
    ) {
      return null;
    }
    acceptedMembershipId = data.acceptedMembershipId;
  }

  return {
    id,
    businessId: data.businessId,
    role: data.role,
    deliveryTarget: { type: deliveryTargetRaw.type, value: deliveryTargetRaw.value },
    invitedBy: data.invitedBy,
    status: data.status,
    invitedAt,
    expiresAt,
    resolvedAt,
    acceptedMembershipId,
    createdAt,
    updatedAt,
    schemaVersion: data.schemaVersion,
  };
}
