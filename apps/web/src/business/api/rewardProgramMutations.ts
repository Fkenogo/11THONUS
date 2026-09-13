/**
 * Adapters for the Reward Program callables (`PLATFORM-BASELINE-005A`):
 * `createRewardProgram`, `updateRewardProgramDraft`,
 * `publishRewardProgramVersion`, `createNextRewardProgramVersion`,
 * `getRewardProgram`, `listRewardPrograms`.
 *
 * Every write returns its result directly (no `authorizeAndExecute`
 * envelope, unlike the Staff lifecycle/role callables) -- mirrors
 * `acceptStaffInvitation`'s self-service adapter shape. Dates cross the
 * wire as ISO strings (the callable transport JSON-serializes the
 * server's `Date` values automatically); this layer never re-parses them
 * into `Date` objects itself -- display formatting is the UI layer's job.
 */

import { httpsCallable, type Functions } from "firebase/functions";
import { toCallWithActor, type AuthenticatedActor } from "./businessCallableClient";

export type QualifyingNodeWire = {
  knowledgeNodeId: string;
  businessDisplayName: string | null;
};

export type RewardProgramWire = {
  id: string;
  businessId: string;
  displayName: string;
  rewardProgramCategoryId: string;
  sharedLoyaltyNumberAllowed: boolean;
  status: "draft" | "active" | "paused" | "retired" | "archived";
  currentVersionId: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  schemaVersion: number;
};

export type RewardProgramVersionWire = {
  id: string;
  rewardProgramId: string;
  version: number;
  requiredVerifiedUnits: number;
  rewardQuantity: number;
  sharedLoyaltyNumberAllowed: boolean;
  rewardDescription: string;
  standardRewardNodeId: string | null;
  multipleUnitsAllowed: boolean;
  bulkReviewThreshold: number | null;
  effectiveFrom: string;
  effectiveUntil: string | null;
  status: "draft" | "active" | "superseded";
  createdAt: string;
  createdBy: string;
  approvedAt: string | null;
  updatedAt: string;
  rowVersion: number;
  schemaVersion: number;
  qualifyingNodes: QualifyingNodeWire[];
};

export type RewardProgramWithCurrentVersionWire = {
  program: RewardProgramWire;
  currentVersion: RewardProgramVersionWire | null;
};

export type RewardProgramDraftFieldsRequest = {
  rewardDescription: string;
  standardRewardNodeId?: string | null;
  multipleUnitsAllowed: boolean;
  sharedLoyaltyNumberAllowed: boolean;
  bulkReviewThreshold?: number | null;
  effectiveFrom: string;
  effectiveUntil?: string | null;
  qualifyingNodes: QualifyingNodeWire[];
};

export type CreateRewardProgramRequest = RewardProgramDraftFieldsRequest & {
  businessId: string;
  displayName: string;
  rewardProgramCategoryId: string;
  idempotencyKey: string;
};

export type CreateRewardProgramResult = {
  program: RewardProgramWire;
  version: RewardProgramVersionWire;
};

export type UpdateRewardProgramDraftRequest = RewardProgramDraftFieldsRequest & {
  businessId: string;
  rewardProgramId: string;
  versionId: string;
  expectedRowVersion: number;
  idempotencyKey: string;
};

export type PublishRewardProgramVersionRequest = {
  businessId: string;
  rewardProgramId: string;
  versionId: string;
  idempotencyKey: string;
};

export type CreateNextRewardProgramVersionRequest = RewardProgramDraftFieldsRequest & {
  businessId: string;
  rewardProgramId: string;
  idempotencyKey: string;
};

export type GetRewardProgramRequest = {
  businessId: string;
  rewardProgramId: string;
};

export type ListRewardProgramsRequest = {
  businessId: string;
};

type BoundCallable<TResult> = (payload: Record<string, unknown>) => Promise<{ data: TResult }>;

function adapt<TRequest extends Record<string, unknown>, TResult>(
  callable: BoundCallable<TResult>,
): (actor: AuthenticatedActor, payload: TRequest) => Promise<TResult> {
  return toCallWithActor<TRequest, TResult>(callable);
}

export function makeCallCreateRewardProgram(functions: Functions) {
  return adapt<CreateRewardProgramRequest, CreateRewardProgramResult>(
    httpsCallable(functions, "createRewardProgram"),
  );
}

export function makeCallUpdateRewardProgramDraft(functions: Functions) {
  return adapt<UpdateRewardProgramDraftRequest, RewardProgramVersionWire>(
    httpsCallable(functions, "updateRewardProgramDraft"),
  );
}

export function makeCallPublishRewardProgramVersion(functions: Functions) {
  return adapt<PublishRewardProgramVersionRequest, RewardProgramVersionWire>(
    httpsCallable(functions, "publishRewardProgramVersion"),
  );
}

export function makeCallCreateNextRewardProgramVersion(functions: Functions) {
  return adapt<CreateNextRewardProgramVersionRequest, RewardProgramVersionWire>(
    httpsCallable(functions, "createNextRewardProgramVersion"),
  );
}

export function makeCallGetRewardProgram(functions: Functions) {
  return adapt<GetRewardProgramRequest, RewardProgramWithCurrentVersionWire>(
    httpsCallable(functions, "getRewardProgram"),
  );
}

export function makeCallListRewardPrograms(functions: Functions) {
  return adapt<ListRewardProgramsRequest, RewardProgramWithCurrentVersionWire[]>(
    httpsCallable(functions, "listRewardPrograms"),
  );
}
