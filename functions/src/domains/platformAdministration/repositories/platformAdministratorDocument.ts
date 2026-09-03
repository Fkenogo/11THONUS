/**
 * `platformAdministrators` collection reader/writer (`ENG-P3-003A`).
 *
 * Pure parsing/serialization, mirroring `knowledgeTagDocument.ts`'s
 * fail-closed convention exactly. **Critical structural guarantee**: a raw
 * document whose `roles` array contains any value outside the two
 * `FD-KS-1`-approved roles (`knowledge_editor`/`knowledge_approver`) — e.g.
 * `platform_super_administrator` or any other TRD18 role — fails closed
 * (`fromPlatformAdministratorDocument` returns `null`, never silently drops
 * the unrecognised role and grants the rest). This is what makes "do not
 * enable the other nine TRD18 roles" a structural property of every read,
 * not merely a policy the write path is trusted to have followed.
 */

import { isPlatformAdministratorRole } from "../models/platformAdministratorRole";
import { isPlatformAdministratorStatus } from "../models/platformAdministratorStatus";
import type { PlatformAdministrator } from "../models/platformAdministrator";

function isTimestampLike(value: unknown): value is { toDate: () => Date } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  );
}

function isValidInteger(value: unknown, minimum: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= minimum;
}

/** Returns `null` (never throws) for a structurally invalid or unrecognized-role document. */
export function fromPlatformAdministratorDocument(
  userId: string,
  raw: unknown,
): PlatformAdministrator | null {
  if (typeof raw !== "object" || raw === null) return null;

  const data = raw as Partial<{
    roles: unknown;
    status: unknown;
    mfaRequired: unknown;
    invitedBy: unknown;
    approvedBy: unknown;
    activatedAt: unknown;
    suspendedAt: unknown;
    removedAt: unknown;
    createdAt: unknown;
    updatedAt: unknown;
    schemaVersion: unknown;
  }>;

  if (!Array.isArray(data.roles) || data.roles.length === 0) return null;
  const roles: PlatformAdministrator["roles"][number][] = [];
  for (const role of data.roles) {
    if (typeof role !== "string" || !isPlatformAdministratorRole(role)) return null;
    roles.push(role);
  }

  if (typeof data.status !== "string" || !isPlatformAdministratorStatus(data.status)) return null;
  if (data.mfaRequired !== true) return null;
  if (typeof data.invitedBy !== "string" || data.invitedBy.trim().length === 0) return null;
  if (data.approvedBy !== undefined && typeof data.approvedBy !== "string") return null;
  if (data.activatedAt !== undefined && !isTimestampLike(data.activatedAt)) return null;
  if (data.suspendedAt !== undefined && !isTimestampLike(data.suspendedAt)) return null;
  if (data.removedAt !== undefined && !isTimestampLike(data.removedAt)) return null;
  if (!isTimestampLike(data.createdAt)) return null;
  if (!isTimestampLike(data.updatedAt)) return null;
  if (!isValidInteger(data.schemaVersion, 1)) return null;

  return {
    userId,
    roles,
    status: data.status,
    mfaRequired: true,
    invitedBy: data.invitedBy,
    ...(data.approvedBy !== undefined ? { approvedBy: data.approvedBy } : {}),
    ...(data.activatedAt !== undefined ? { activatedAt: data.activatedAt.toDate() } : {}),
    ...(data.suspendedAt !== undefined ? { suspendedAt: data.suspendedAt.toDate() } : {}),
    ...(data.removedAt !== undefined ? { removedAt: data.removedAt.toDate() } : {}),
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    schemaVersion: data.schemaVersion,
  };
}

export type PlatformAdministratorDocumentFields = Omit<PlatformAdministrator, "userId">;

/** `userId` is the Firestore document key, never a field within the document itself. */
export function toPlatformAdministratorDocumentFields(
  administrator: PlatformAdministrator,
): PlatformAdministratorDocumentFields {
  return {
    roles: administrator.roles,
    status: administrator.status,
    mfaRequired: administrator.mfaRequired,
    invitedBy: administrator.invitedBy,
    ...(administrator.approvedBy !== undefined ? { approvedBy: administrator.approvedBy } : {}),
    ...(administrator.activatedAt !== undefined ? { activatedAt: administrator.activatedAt } : {}),
    ...(administrator.suspendedAt !== undefined ? { suspendedAt: administrator.suspendedAt } : {}),
    ...(administrator.removedAt !== undefined ? { removedAt: administrator.removedAt } : {}),
    createdAt: administrator.createdAt,
    updatedAt: administrator.updatedAt,
    schemaVersion: administrator.schemaVersion,
  };
}
