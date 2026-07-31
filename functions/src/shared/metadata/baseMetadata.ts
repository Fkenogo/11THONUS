/**
 * Base Firestore metadata shape (RES-005.2b).
 *
 * Every authoritative Firestore document carries this shared metadata
 * shape, per TRD10 §10.5 ("Standard Document Metadata") — the authoritative
 * normative contract, engineering-expressed in the Version 1 Engineering
 * Blueprint §3.3 and referenced (not restated) by TRD8 §8.7. See the
 * RES-005.2a Contract Analysis for the full field-by-field derivation.
 *
 * Base fields (every document): `id`, `schemaVersion`, `status`,
 * `createdAt`, `createdBy`, `updatedAt`, `updatedBy` — `createdBy`/
 * `updatedBy` are nullable to permit system-initiated writes with no
 * human actor.
 *
 * Scoped fields (where applicable): `businessId`, `customerId`,
 * `countryCode`, `currencyCode`, `timezone`, `archivedAt`, `archivedBy`
 * — archival (DAP-010), never deletion; present-but-null while active.
 *
 * `languageCode` is deliberately not part of this shared shape — TRD10
 * §10.5 does not include it here. It is a genuine, mandatory field
 * (PRD2 §6) on the specific collections that require it (e.g. `users`,
 * `customerProfiles`), not a universal document-metadata field.
 *
 * `status` and `schemaVersion` are intentionally not stamped here — no
 * authoritative source defines a default value or an auto-increment rule
 * for either; both remain each domain's own explicit responsibility to
 * set, per the "Pass 2 implementation detail" boundary this work package
 * observes for anything not already specified upstream.
 */

import type { FieldValue, Timestamp } from "firebase-admin/firestore";
import { serverTimestamp } from "./serverTimestamp";

export type BaseMetadata = {
  readonly id: string;
  schemaVersion: number;
  status: string;
  readonly createdAt: Timestamp;
  readonly createdBy: string | null;
  updatedAt: Timestamp;
  updatedBy: string | null;
  businessId?: string;
  customerId?: string;
  countryCode?: string;
  currencyCode?: string;
  timezone?: string;
  archivedAt?: Timestamp | null;
  archivedBy?: string | null;
};

type CreateStamp = {
  createdAt: FieldValue;
  createdBy: string | null;
  updatedAt: FieldValue;
  updatedBy: string | null;
};

type UpdateStamp = {
  updatedAt: FieldValue;
  updatedBy: string | null;
};

export function stampCreate(actorId: string | null): CreateStamp {
  const now = serverTimestamp();

  return { createdAt: now, createdBy: actorId, updatedAt: now, updatedBy: actorId };
}

export function stampUpdate(actorId: string | null): UpdateStamp {
  return { updatedAt: serverTimestamp(), updatedBy: actorId };
}
