/**
 * `businessBranches` collection reader/writer (`ENG-P2-002A`).
 *
 * Pure parsing/serialization only — no Firestore I/O. `fromBusinessBranchDocument`
 * fail-closed parses raw document data (matching the fail-closed
 * convention `functions/src/domains/permissions/models/businessMembershipDocument.ts`
 * already established: return `null`, never throw, for a structurally
 * invalid document). `toBusinessBranchDocumentFields` produces a plain
 * object shaped for a future Firestore write, using native `Date` (the
 * Admin SDK auto-converts `Date` to `Timestamp` on write) rather than
 * importing `firebase-admin`'s `Timestamp` type directly, keeping this
 * module framework-independent.
 *
 * Framework-independent by machine-enforced rule (`eslint.config.js`,
 * `domains/business/**`) — Firestore `Timestamp` is recognized
 * structurally (duck typing on `.toDate()`), not by importing its type.
 */

import type { BusinessBranch } from "./businessBranch";

function isTimestampLike(value: unknown): value is { toDate: () => Date } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  );
}

const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;

/** Returns `null` (never throws) for a structurally invalid document. */
export function fromBusinessBranchDocument(id: string, raw: unknown): BusinessBranch | null {
  if (typeof raw !== "object" || raw === null) return null;

  const data = raw as Partial<{
    businessId: unknown;
    displayName: unknown;
    countryCode: unknown;
    city: unknown;
    address: unknown;
    createdAt: unknown;
    updatedAt: unknown;
    schemaVersion: unknown;
  }>;

  if (typeof data.businessId !== "string" || data.businessId.length === 0) return null;
  if (typeof data.displayName !== "string" || data.displayName.length === 0) return null;
  if (typeof data.countryCode !== "string" || !COUNTRY_CODE_PATTERN.test(data.countryCode)) {
    return null;
  }
  if (typeof data.city !== "string" || data.city.length === 0) return null;
  if (data.address !== undefined && typeof data.address !== "string") return null;
  if (!isTimestampLike(data.createdAt)) return null;
  if (!isTimestampLike(data.updatedAt)) return null;
  if (typeof data.schemaVersion !== "number") return null;

  return {
    id,
    businessId: data.businessId,
    displayName: data.displayName,
    countryCode: data.countryCode,
    city: data.city,
    address: data.address,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    schemaVersion: data.schemaVersion,
  };
}

export type BusinessBranchDocumentFields = {
  businessId: string;
  displayName: string;
  countryCode: string;
  city: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
  schemaVersion: number;
};

/** `id` is the Firestore document key, never a field within the document itself. */
export function toBusinessBranchDocumentFields(
  branch: BusinessBranch,
): BusinessBranchDocumentFields {
  return {
    businessId: branch.businessId,
    displayName: branch.displayName,
    countryCode: branch.countryCode,
    city: branch.city,
    address: branch.address,
    createdAt: branch.createdAt,
    updatedAt: branch.updatedAt,
    schemaVersion: branch.schemaVersion,
  };
}
