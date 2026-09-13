/**
 * Commerce Knowledge reference validation for Reward Program
 * (`PLATFORM-BASELINE-005A`).
 *
 * Reuses the existing Commerce Knowledge domain's pure predicates
 * unmodified (`isEligibleForNewReference`, `isResolvableForExistingReference`)
 * and its Firestore read (`getKnowledgeNodeById`) -- no Commerce Knowledge
 * record is ever copied into PostgreSQL; every reference is validated
 * server-side against live Firestore state at the two moments that matter:
 * draft add/change-time (new-reference eligibility) and publish time
 * (the authoritative operation boundary, RF-3).
 *
 * Publish-time semantic contract (`PLATFORM-BASELINE-005-
 * REVIEW-FINDINGS-001` RF-3): this validation is an authoritative
 * Firestore read performed BEFORE the PostgreSQL publish transaction
 * begins -- it is never part of that transaction's conflict set. This is
 * "server-authoritative publish-time validation with a disclosed bounded
 * cross-store race window," not distributed fail-closed atomicity. A node
 * retiring between this read and the PostgreSQL commit is a real, accepted
 * possibility; a version that passed this check is never retroactively
 * invalidated by a later retirement (see `isResolvableForExistingReference`
 * for how a historical, already-published reference resolves).
 */

import type { Firestore } from "firebase-admin/firestore";
import { getKnowledgeNodeById } from "../../commerceKnowledge/repositories/knowledgeNodeRepository";
import { isEligibleForNewReference } from "../../commerceKnowledge/models/referenceEligibility";
import type { KnowledgeNodeType } from "../../commerceKnowledge/models/knowledgeNodeType";
import type { QualifyingNode } from "../models/rewardProgram";
import {
  invalidCategoryNodeError,
  invalidQualifyingNodeError,
  invalidStandardRewardNodeError,
} from "../models/rewardProgramErrors";

const QUALIFYING_NODE_TYPES: readonly KnowledgeNodeType[] = [
  "standard_product",
  "standard_service",
];

async function assertNodeEligible(
  db: Firestore,
  nodeId: string,
  allowedTypes: readonly KnowledgeNodeType[],
  onInvalid: (reason: string) => Error,
): Promise<void> {
  const node = await getKnowledgeNodeById(db, nodeId);
  if (!node) {
    throw onInvalid("node does not exist");
  }
  if (!allowedTypes.includes(node.nodeType)) {
    throw onInvalid(
      `node type "${node.nodeType}" is not one of the governed types for this reference`,
    );
  }
  if (!isEligibleForNewReference(node.status)) {
    throw onInvalid(
      `node status "${node.status}" is not eligible for a new reference (must be active)`,
    );
  }
}

export async function validateCategoryReference(db: Firestore, categoryId: string): Promise<void> {
  await assertNodeEligible(db, categoryId, ["reward_program_category"], invalidCategoryNodeError);
}

export async function validateStandardRewardNodeReference(
  db: Firestore,
  nodeId: string | null | undefined,
): Promise<void> {
  if (!nodeId) return;
  await assertNodeEligible(db, nodeId, QUALIFYING_NODE_TYPES, invalidStandardRewardNodeError);
}

export async function validateQualifyingNodes(
  db: Firestore,
  nodes: readonly QualifyingNode[],
): Promise<void> {
  for (const node of nodes) {
    await assertNodeEligible(db, node.knowledgeNodeId, QUALIFYING_NODE_TYPES, (reason) =>
      invalidQualifyingNodeError(node.knowledgeNodeId, reason),
    );
  }
}

/**
 * The full authoritative validation pass a create/draft-edit/publish
 * command runs: category, optional standard reward node, and every
 * qualifying node. Callers run this once at draft add/change-time and
 * again, unconditionally, immediately before starting the PostgreSQL
 * publish transaction (RF-3 step 4).
 */
export async function validateAllReferences(
  db: Firestore,
  input: {
    readonly rewardProgramCategoryId: string;
    readonly standardRewardNodeId?: string | null;
    readonly qualifyingNodes: readonly QualifyingNode[];
  },
): Promise<void> {
  await validateCategoryReference(db, input.rewardProgramCategoryId);
  await validateStandardRewardNodeReference(db, input.standardRewardNodeId);
  await validateQualifyingNodes(db, input.qualifyingNodes);
}
