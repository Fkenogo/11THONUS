/**
 * Optional Commerce Knowledge classification validation for Qualifying Items
 * (`PLATFORM-BASELINE-013A.2`, `DEC-LOY-016` / `FD-REWARD-QUALIFYING-ITEM-001`).
 *
 * A Qualifying Item's `knowledgeNodeId` is OPTIONAL classification only --
 * never qualification authority, and never a prerequisite for creating an
 * item. The boundary, preserved exactly as `PLATFORM-BASELINE-012` §5/§11
 * specify:
 *
 *   - `null` / `undefined` -> NO Commerce Knowledge read of any kind; there
 *     is nothing to validate against. A Business can create and operate
 *     "Black Coffee" without touching any taxonomy.
 *   - a supplied (non-null) id -> must still be a real, eligible reference:
 *     the node must exist, be a `standard_product`/`standard_service`, and
 *     be eligible for a NEW reference (active). This is the same predicate
 *     set the Reward Program domain applies (`assertNodeEligible` in
 *     `rewardProgramKnowledgeValidation.ts`), reproduced here over the
 *     same Commerce Knowledge primitives so the qualifyingItem domain
 *     neither depends on nor modifies the Reward Program domain, and
 *     raises its own domain error.
 *
 * No Commerce Knowledge record is ever copied into PostgreSQL. Validation
 * is against live Firestore state at write time only; a mapping that is
 * later retired never invalidates an item that already carries it (callers
 * do not re-validate an unchanged mapping).
 */

import type { Firestore } from "firebase-admin/firestore";
import { getKnowledgeNodeById } from "../../commerceKnowledge/repositories/knowledgeNodeRepository";
import { isEligibleForNewReference } from "../../commerceKnowledge/models/referenceEligibility";
import type { KnowledgeNodeType } from "../../commerceKnowledge/models/knowledgeNodeType";
import { invalidQualifyingItemKnowledgeNodeError } from "../models/qualifyingItemErrors";

const CLASSIFICATION_NODE_TYPES: readonly KnowledgeNodeType[] = [
  "standard_product",
  "standard_service",
];

export async function validateOptionalQualifyingItemKnowledgeNode(
  db: Firestore,
  knowledgeNodeId: string | null | undefined,
): Promise<void> {
  if (knowledgeNodeId === null || knowledgeNodeId === undefined) return;

  const node = await getKnowledgeNodeById(db, knowledgeNodeId);
  if (!node) {
    throw invalidQualifyingItemKnowledgeNodeError(knowledgeNodeId, "node does not exist");
  }
  if (!CLASSIFICATION_NODE_TYPES.includes(node.nodeType)) {
    throw invalidQualifyingItemKnowledgeNodeError(
      knowledgeNodeId,
      `node type "${node.nodeType}" is not one of the governed classification types`,
    );
  }
  if (!isEligibleForNewReference(node.status)) {
    throw invalidQualifyingItemKnowledgeNodeError(
      knowledgeNodeId,
      `node status "${node.status}" is not eligible for a new reference (must be active)`,
    );
  }
}
