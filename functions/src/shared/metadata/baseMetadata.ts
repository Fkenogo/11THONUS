/**
 * Base Firestore metadata shape (ENG-P1-002).
 *
 * Every authoritative Firestore document carries this shared metadata
 * shape, per the Version 1 Engineering Blueprint §3.3: `id`, `createdAt`,
 * `createdBy`, `updatedAt`, `updatedBy`, `status`, `version`, and, where
 * applicable, `businessId`/`customerId`/`countryCode`/`languageCode`/
 * `deletedAt`/`deletedBy`.
 *
 * `status` and `version` are intentionally not stamped here — no
 * authoritative source defines a default value or an auto-increment rule
 * for either; both remain each domain's own explicit responsibility to
 * set, per the "Pass 2 implementation detail" boundary this work package
 * observes for anything not already specified upstream.
 */

import type { FieldValue, Timestamp } from "firebase-admin/firestore";
import { serverTimestamp } from "./serverTimestamp";

export type BaseMetadata = {
  id: string;
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
  status: string;
  version: number;
  businessId?: string;
  customerId?: string;
  countryCode?: string;
  languageCode?: string;
  deletedAt?: Timestamp;
  deletedBy?: string;
};

type CreateStamp = {
  createdAt: FieldValue;
  createdBy: string;
  updatedAt: FieldValue;
  updatedBy: string;
};

type UpdateStamp = {
  updatedAt: FieldValue;
  updatedBy: string;
};

export function stampCreate(actorId: string): CreateStamp {
  const now = serverTimestamp();

  return { createdAt: now, createdBy: actorId, updatedAt: now, updatedBy: actorId };
}

export function stampUpdate(actorId: string): UpdateStamp {
  return { updatedAt: serverTimestamp(), updatedBy: actorId };
}
