/**
 * Reward Program domain model (`PLATFORM-BASELINE-005A`).
 *
 * PostgreSQL-authoritative (Founder-confirmed,
 * `PLATFORM-BASELINE-005-FOUNDER-DISPOSITION-001` FD-1). Mirrors the
 * approved design report's schema exactly (`reward_programs`,
 * `reward_program_versions`, `reward_program_version_qualifying_nodes` —
 * table/column names PROPOSED BY PLATFORM-BASELINE-005, not inherited).
 *
 * Business/Customer-Identity/Commerce-Knowledge references are opaque
 * Firestore-owned ids (`TEXT`, never a PostgreSQL FK) — validated
 * server-side at write time, never at the database layer.
 */

import {
  REQUIRED_VERIFIED_UNITS_MVP,
  REWARD_QUANTITY_FIXED,
} from "../../../config/loyaltyInvariants";

/** Re-exported so callers never need to import `loyaltyInvariants.ts` directly for this domain. */
export const FIXED_REQUIRED_VERIFIED_UNITS = REQUIRED_VERIFIED_UNITS_MVP;
export const FIXED_REWARD_QUANTITY = REWARD_QUANTITY_FIXED;

export const REWARD_PROGRAM_STATUSES = [
  "draft",
  "active",
  "paused",
  "retired",
  "archived",
] as const;
export type RewardProgramStatus = (typeof REWARD_PROGRAM_STATUSES)[number];

export const REWARD_PROGRAM_VERSION_STATUSES = ["draft", "active", "superseded"] as const;
export type RewardProgramVersionStatus = (typeof REWARD_PROGRAM_VERSION_STATUSES)[number];

/** `reward_programs` row (PLATFORM-BASELINE-005 design report Section 22). */
export type RewardProgramRow = {
  readonly id: string;
  readonly businessId: string;
  displayName: string;
  rewardProgramCategoryId: string;
  /** Current-value convenience projection only -- NOT historical authority (RF-2). */
  sharedLoyaltyNumberAllowed: boolean;
  status: RewardProgramStatus;
  currentVersionId: string | null;
  readonly createdAt: Date;
  readonly createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  readonly schemaVersion: number;
};

export type QualifyingNode = {
  readonly knowledgeNodeId: string;
  readonly businessDisplayName: string | null;
};

/** `reward_program_versions` row -- the immutable historical commercial authority once published. */
export type RewardProgramVersionRow = {
  readonly id: string;
  readonly rewardProgramId: string;
  readonly version: number;
  readonly requiredVerifiedUnits: number;
  readonly rewardQuantity: number;
  /** Authoritative, immutable per-version snapshot (RF-2) -- matches TRD10 Section 10.9.2. */
  readonly sharedLoyaltyNumberAllowed: boolean;
  readonly rewardDescription: string;
  readonly standardRewardNodeId: string | null;
  readonly multipleUnitsAllowed: boolean;
  readonly bulkReviewThreshold: number | null;
  readonly effectiveFrom: Date;
  readonly effectiveUntil: Date | null;
  status: RewardProgramVersionStatus;
  readonly createdAt: Date;
  readonly createdBy: string;
  approvedAt: Date | null;
  updatedAt: Date;
  /** Optimistic-concurrency field for draft edits (Section 19) -- callers must pass this back unchanged to `updateRewardProgramDraft`. */
  rowVersion: number;
  readonly schemaVersion: number;
  readonly qualifyingNodes: readonly QualifyingNode[];
};

export type RewardProgramWithCurrentVersion = {
  readonly program: RewardProgramRow;
  readonly currentVersion: RewardProgramVersionRow | null;
};

/** Draft-editable fields on a version -- excludes fixed values, ids, timestamps, status. */
export type RewardProgramVersionDraftInput = {
  readonly rewardDescription: string;
  readonly standardRewardNodeId?: string | null;
  readonly multipleUnitsAllowed: boolean;
  readonly sharedLoyaltyNumberAllowed: boolean;
  readonly bulkReviewThreshold?: number | null;
  readonly effectiveFrom: Date;
  readonly effectiveUntil?: Date | null;
  readonly qualifyingNodes: readonly QualifyingNode[];
};
