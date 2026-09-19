/**
 * Qualifying Item domain model (`PLATFORM-BASELINE-013A.2`).
 *
 * The Business-owned stable identity behind whatever a Business actually
 * sells ("Black Coffee", "Medium Pizza") -- `DEC-LOY-016` /
 * `FD-REWARD-QUALIFYING-ITEM-001`. PostgreSQL-authoritative; mirrors the
 * `qualifying_items` table `PLATFORM-BASELINE-013A.1` created (migration
 * `0016`) column for column.
 *
 * `businessId` and `knowledgeNodeId` are opaque Firestore-owned references
 * (`TEXT`, never a PostgreSQL FK) -- validated server-side at write time,
 * never at the database layer.
 *
 * `knowledgeNodeId` is OPTIONAL classification only: a Qualifying Item is
 * fully valid with `null`, and a Commerce Knowledge node is never
 * qualification authority (`DEC-LOY-016`).
 */

import { invalidQualifyingItemNameError } from "./qualifyingItemErrors";

/** Mirrors `qualifying_items.status CHECK (status IN ('active', 'retired'))` (migration 0016). */
export const QUALIFYING_ITEM_STATUSES = ["active", "retired"] as const;
export type QualifyingItemStatus = (typeof QUALIFYING_ITEM_STATUSES)[number];

/** `qualifying_items` row (`PLATFORM-BASELINE-012` design report Section 5). */
export type QualifyingItem = {
  readonly id: string;
  readonly businessId: string;
  name: string;
  /** Optional Commerce Knowledge classification -- zero-or-one, never qualification authority. */
  knowledgeNodeId: string | null;
  status: QualifyingItemStatus;
  readonly createdAt: Date;
  readonly createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  readonly schemaVersion: number;
};

/**
 * An engineering bound on a Business-authored label, not a product rule:
 * `qualifying_items.name` is unbounded `TEXT`, and an unbounded value on a
 * callable that Managers and Owners can reach is an avoidable abuse
 * surface. Generous enough for any menu-item label.
 */
export const QUALIFYING_ITEM_NAME_MAX_LENGTH = 100;

/**
 * Trims and validates a Business-authored name. Throws
 * `QualifyingItemDomainError` (`VALIDATION_FAILED`, field `name`) for a
 * non-string, empty/whitespace-only, or over-long value. Deliberately does
 * NOT enforce uniqueness (`PLATFORM-BASELINE-012` FQ-2: duplicate names are
 * permitted at this layer) and does not consult Commerce Knowledge.
 */
export function normalizeQualifyingItemName(raw: unknown): string {
  if (typeof raw !== "string") {
    throw invalidQualifyingItemNameError("must be a string");
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw invalidQualifyingItemNameError("must not be empty");
  }
  if (trimmed.length > QUALIFYING_ITEM_NAME_MAX_LENGTH) {
    throw invalidQualifyingItemNameError(
      `must be at most ${QUALIFYING_ITEM_NAME_MAX_LENGTH} characters`,
    );
  }
  return trimmed;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * `qualifying_items.id` is a `UUID`; PostgreSQL rejects a non-UUID
 * comparison operand with a raw driver error. Checking the shape first
 * lets a malformed or fabricated id fail safely as an ordinary "not found"
 * instead of surfacing an internal database error.
 */
export function isWellFormedQualifyingItemId(value: string): boolean {
  return typeof value === "string" && UUID_PATTERN.test(value);
}
