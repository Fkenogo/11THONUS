/**
 * `platformAdministrators` persistence (`ENG-P3-003A`).
 *
 * Document id is the `userId` itself (one administrator record per Customer
 * Identity, `ENG-P3-003-DESIGN-001` §6) — mirrors `businessCodeReservations`'s
 * doc-id-as-key pattern; avoids a duplicate-detection query. Every mutating
 * function wraps in `db.runTransaction` with a read-before-write existence
 * check, the same pattern `knowledgeTagRepository.ts`/`knowledgeNodeRepository.ts`
 * already established after their own Review-Phase-L race-safety fix.
 */

import type { Firestore } from "firebase-admin/firestore";
import {
  createPlatformAdministrator,
  hasSameRoles,
  type CreatePlatformAdministratorParams,
  type PlatformAdministrator,
} from "../models/platformAdministrator";
import type { PlatformAdministratorLifecycleAction } from "../models/platformAdministratorStatus";
import { applyPlatformAdministratorTransition } from "../models/platformAdministratorStatus";
import {
  fromPlatformAdministratorDocument,
  toPlatformAdministratorDocumentFields,
} from "./platformAdministratorDocument";
import {
  platformAdministratorBootstrapConflictError,
  platformAdministratorConfigMalformedError,
  platformAdministratorNotFoundError,
} from "../models/platformAdministrationErrors";

export const PLATFORM_ADMINISTRATORS_COLLECTION = "platformAdministrators";

function stripUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key of Object.keys(value) as Array<keyof T>) {
    if (value[key] !== undefined) {
      result[key] = value[key];
    }
  }
  return result;
}

export async function getPlatformAdministratorById(
  db: Firestore,
  userId: string,
): Promise<PlatformAdministrator | null> {
  const snapshot = await db.collection(PLATFORM_ADMINISTRATORS_COLLECTION).doc(userId).get();
  if (!snapshot.exists) return null;
  const administrator = fromPlatformAdministratorDocument(userId, snapshot.data());
  if (administrator === null) {
    throw platformAdministratorConfigMalformedError();
  }
  return administrator;
}

/**
 * Idempotent, transactional create used by `bootstrapPlatformAdministrator.ts`
 * (and by any future invite-and-approve path). If a record for this `userId`
 * already exists:
 *  - same role set AND already `active` → safe no-op, returns the existing
 *    record unchanged (retried bootstrap call, `FD-KS-1`'s idempotency
 *    requirement);
 *  - anything else (different roles, or a non-`active` status — i.e. someone
 *    deliberately suspended/removed this administrator since) → fails closed
 *    with `platformAdministratorBootstrapConflictError`, never silently
 *    overwrites.
 */
export async function createPlatformAdministratorPersisted(
  db: Firestore,
  params: CreatePlatformAdministratorParams,
): Promise<PlatformAdministrator> {
  const candidate = createPlatformAdministrator(params);
  const ref = db.collection(PLATFORM_ADMINISTRATORS_COLLECTION).doc(candidate.userId);

  return db.runTransaction(async (transaction) => {
    const existingSnapshot = await transaction.get(ref);
    if (!existingSnapshot.exists) {
      transaction.set(ref, stripUndefined(toPlatformAdministratorDocumentFields(candidate)));
      return candidate;
    }

    const existing = fromPlatformAdministratorDocument(candidate.userId, existingSnapshot.data());
    if (
      existing === null ||
      existing.status !== "active" ||
      !hasSameRoles(existing.roles, candidate.roles)
    ) {
      throw platformAdministratorBootstrapConflictError(candidate.userId);
    }
    return existing;
  });
}

export type TransitionPlatformAdministratorStatusPersistedParams = {
  updatedAt: Date;
};

export async function transitionPlatformAdministratorStatusPersisted(
  db: Firestore,
  userId: string,
  action: PlatformAdministratorLifecycleAction,
  params: TransitionPlatformAdministratorStatusPersistedParams,
): Promise<PlatformAdministrator> {
  const ref = db.collection(PLATFORM_ADMINISTRATORS_COLLECTION).doc(userId);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) {
      throw platformAdministratorNotFoundError();
    }
    const administrator = fromPlatformAdministratorDocument(userId, snapshot.data());
    if (administrator === null) {
      throw platformAdministratorConfigMalformedError();
    }

    const nextStatus = applyPlatformAdministratorTransition(administrator.status, action);
    const updated: PlatformAdministrator = {
      ...administrator,
      status: nextStatus,
      updatedAt: params.updatedAt,
      ...(action === "suspend" ? { suspendedAt: params.updatedAt } : {}),
      ...(action === "remove" ? { removedAt: params.updatedAt } : {}),
    };
    transaction.set(ref, stripUndefined(toPlatformAdministratorDocumentFields(updated)));
    return updated;
  });
}
