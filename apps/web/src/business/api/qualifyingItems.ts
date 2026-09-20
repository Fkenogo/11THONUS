/**
 * Adapters for the Qualifying Item callables (`PLATFORM-BASELINE-013A.2`,
 * consumed by the Reward Program management surface since
 * `PLATFORM-BASELINE-013B`): `createQualifyingItem`,
 * `updateQualifyingItem`, `retireQualifyingItem`, `listQualifyingItems`.
 *
 * Same shape as `rewardProgramMutations.ts`: every write returns its
 * result directly, dates cross the wire as ISO strings, and this layer
 * never re-parses them into `Date` objects.
 *
 * A Qualifying Item's `name` is Business-authored free text, stored once
 * and never translated -- it renders identically in every locale. No
 * Commerce Knowledge classification is required to create or select an
 * item (`knowledgeNodeId: null` is fully valid, `DEC-LOY-016`).
 */

import { httpsCallable, type Functions } from "firebase/functions";
import { toCallWithActor, type AuthenticatedActor } from "./businessCallableClient";

export type QualifyingItemWire = {
  id: string;
  businessId: string;
  name: string;
  knowledgeNodeId: string | null;
  status: "active" | "retired";
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  schemaVersion: number;
};

export type CreateQualifyingItemRequest = {
  businessId: string;
  name: string;
  knowledgeNodeId?: string | null;
  idempotencyKey: string;
};

export type UpdateQualifyingItemRequest = {
  businessId: string;
  qualifyingItemId: string;
  name?: string;
  knowledgeNodeId?: string | null;
  idempotencyKey: string;
};

export type RetireQualifyingItemRequest = {
  businessId: string;
  qualifyingItemId: string;
  idempotencyKey: string;
};

export type ListQualifyingItemsRequest = {
  businessId: string;
  statusFilter?: "active" | "retired" | "all";
};

type BoundCallable<TResult> = (payload: Record<string, unknown>) => Promise<{ data: TResult }>;

function adapt<TRequest extends Record<string, unknown>, TResult>(
  callable: BoundCallable<TResult>,
): (actor: AuthenticatedActor, payload: TRequest) => Promise<TResult> {
  return toCallWithActor<TRequest, TResult>(callable);
}

export function makeCallCreateQualifyingItem(functions: Functions) {
  return adapt<CreateQualifyingItemRequest, QualifyingItemWire>(
    httpsCallable(functions, "createQualifyingItem"),
  );
}

export function makeCallUpdateQualifyingItem(functions: Functions) {
  return adapt<UpdateQualifyingItemRequest, QualifyingItemWire>(
    httpsCallable(functions, "updateQualifyingItem"),
  );
}

export function makeCallRetireQualifyingItem(functions: Functions) {
  return adapt<RetireQualifyingItemRequest, QualifyingItemWire>(
    httpsCallable(functions, "retireQualifyingItem"),
  );
}

export function makeCallListQualifyingItems(functions: Functions) {
  return adapt<ListQualifyingItemsRequest, QualifyingItemWire[]>(
    httpsCallable(functions, "listQualifyingItems"),
  );
}
