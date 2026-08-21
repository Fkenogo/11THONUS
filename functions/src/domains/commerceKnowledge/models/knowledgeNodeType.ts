/**
 * `KnowledgeNode` type vocabulary and hierarchy contracts (`ENG-P3-001A`,
 * design §7.1.1/§I/§J).
 *
 * `KNOWLEDGE_NODE_TYPES` is the already-declared six-value union (TRD10
 * §10.7.1) — reconstructed verbatim, no category invented.
 *
 * `isValidParentNodeType` expresses the Commerce Knowledge Standard Part
 * III's fixed linear adjacency chain — a genuine, bounded gap the design
 * found (TRD10 declares `parentId`/`nodeType` but never states which
 * `nodeType` may parent which) and closed directly from that already-
 * governed source, not invented here.
 *
 * `wouldCreateHierarchyCycle` is the pure half of the cycle-protection
 * contract (design §J): it decides, given the *already-resolved* ancestor
 * id chain of a candidate parent, whether adopting that parent would
 * make the node its own ancestor. Resolving that ancestor chain requires
 * reading `parentId` pointers from persisted `KnowledgeNode` documents —
 * that traversal is repository state and is deferred to `ENG-P3-001B`;
 * this function only defines the closed-form predicate `001B`'s
 * repository-backed check must satisfy.
 */

import { invalidParentTypeError } from "./commerceKnowledgeErrors";

export const KNOWLEDGE_NODE_TYPES = [
  "industry",
  "business_category",
  "business_type",
  "reward_program_category",
  "standard_product",
  "standard_service",
] as const;

export type KnowledgeNodeType = (typeof KNOWLEDGE_NODE_TYPES)[number];

export function isKnowledgeNodeType(value: string): value is KnowledgeNodeType {
  return (KNOWLEDGE_NODE_TYPES as readonly string[]).includes(value);
}

const ALLOWED_PARENT_TYPE: Record<KnowledgeNodeType, KnowledgeNodeType | null> = {
  industry: null,
  business_category: "industry",
  business_type: "business_category",
  reward_program_category: "business_type",
  standard_product: "reward_program_category",
  standard_service: "reward_program_category",
};

/**
 * `parentNodeType` is `null` to assert the child must be a root (only
 * `industry` is ever valid with a `null` parent); a non-null value is
 * checked against the single governed allowed-parent type for `childType`.
 */
export function isValidParentNodeType(
  childType: KnowledgeNodeType,
  parentNodeType: KnowledgeNodeType | null,
): boolean {
  return ALLOWED_PARENT_TYPE[childType] === parentNodeType;
}

export function assertValidParentNodeType(
  childType: KnowledgeNodeType,
  parentNodeType: KnowledgeNodeType | null,
): void {
  if (!isValidParentNodeType(childType, parentNodeType)) {
    throw invalidParentTypeError(childType, parentNodeType);
  }
}

/**
 * `candidateParentAncestorIds` is the candidate parent's own ancestor
 * chain (its `parentId`, its parent's `parentId`, ...), already resolved
 * by the caller (a repository read in `ENG-P3-001B`, or an in-memory
 * fixture in a unit test). A cycle exists exactly when `nodeId` appears
 * in that chain — adopting this parent would make `nodeId` its own
 * ancestor.
 */
export function wouldCreateHierarchyCycle(
  nodeId: string,
  candidateParentAncestorIds: readonly string[],
): boolean {
  return candidateParentAncestorIds.includes(nodeId);
}
