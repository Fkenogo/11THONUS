/**
 * `KnowledgeNode` domain model (`ENG-P3-001A`, design §7.1).
 *
 * The canonical, hierarchical taxonomy node. Platform-global — carries no
 * `businessId`/`branchId`/`ownerUserId`/`membershipId` field, and none
 * should ever be added (design §8/§20/§N): multiple Businesses reference
 * the same canonical node, this module never models a per-business copy.
 *
 * `createKnowledgeNode` always produces `status: "draft"` — the params
 * type has no `status` key at all, mirroring `business.ts`'s own
 * "constructor can't accept an initial status" pattern.
 *
 * `path`/`depth` are supplied by the caller (a future `ENG-P3-001B`
 * repository, which resolves the parent's own `path`/`depth` before
 * constructing a child) — this module has no persistence access to
 * compute them itself, consistent with framework independence (Phase P).
 *
 * `parentNodeType` is likewise caller-supplied — the actual parent's
 * resolved `nodeType`, already read by the caller — so the adjacency rule
 * (`knowledgeNodeType.ts`) can be validated purely, without this module
 * performing a repository read itself.
 */

import {
  invalidKnowledgeNodeFieldError,
  replacementNodeIdRequiredForRetirementError,
} from "./commerceKnowledgeErrors";
import { invalidReplacementNodeReferenceError } from "./commerceKnowledgeErrors";
import {
  assertConsistentParentReference,
  assertValidParentNodeType,
  type KnowledgeNodeType,
} from "./knowledgeNodeType";
import {
  isValidKnowledgeLifecycleTransition,
  type KnowledgeLifecycleStatus,
} from "./knowledgeLifecycle";
import { invalidKnowledgeLifecycleTransitionError } from "./commerceKnowledgeErrors";

export type KnowledgeNode = {
  readonly id: string;
  readonly nodeType: KnowledgeNodeType;
  parentId: string | null;
  canonicalName: string;
  slug: string;
  path: string;
  depth: number;
  description?: string;
  iconKey?: string;
  status: KnowledgeLifecycleStatus;
  version: number;
  replacementNodeId?: string;
  searchTerms: string[];
  readonly createdAt: Date;
  updatedAt: Date;
  schemaVersion: number;
};

export type CreateKnowledgeNodeParams = {
  id: string;
  nodeType: KnowledgeNodeType;
  parentId: string | null;
  parentNodeType: KnowledgeNodeType | null;
  canonicalName: string;
  slug: string;
  path: string;
  depth: number;
  description?: string;
  iconKey?: string;
  searchTerms?: string[];
  createdAt: Date;
};

function requireNonBlank(field: string, value: string): string {
  if (value.trim().length === 0) {
    throw invalidKnowledgeNodeFieldError(field, value);
  }
  return value;
}

/**
 * Review Phase I: a `"/"` is a Firestore document-path separator, not a
 * valid character in a single document id — a value containing one would
 * either throw at the repository layer or silently resolve to an
 * unintended nested path once `ENG-P3-001B` uses these ids directly as
 * Firestore document keys. Matches the platform's own established
 * precedent (`functions/src/domains/permissions/evaluator/evaluatePermission.ts`'s
 * `businessId.includes("/")` rejection).
 */
function requireNoPathSeparator(field: string, value: string): string {
  if (value.includes("/")) {
    throw invalidKnowledgeNodeFieldError(field, value);
  }
  return value;
}

export function createKnowledgeNode(params: CreateKnowledgeNodeParams): KnowledgeNode {
  const id = requireNoPathSeparator("id", requireNonBlank("id", params.id));
  const canonicalName = requireNonBlank("canonicalName", params.canonicalName);
  const slug = requireNonBlank("slug", params.slug);
  const path = requireNonBlank("path", params.path);
  if (params.parentId !== null) {
    requireNoPathSeparator("parentId", params.parentId);
  }

  if (!Number.isInteger(params.depth) || params.depth < 0) {
    throw invalidKnowledgeNodeFieldError("depth", String(params.depth));
  }

  /**
   * Review Phase E: a root node (`parentId === null`) must have `depth`
   * exactly 0; a non-root node must have `depth > 0`. Enforcing the exact
   * `childDepth === parentDepth + 1` relationship requires reading the
   * actual parent's persisted `depth`, which is repository state deferred
   * to `ENG-P3-001B` — this is the bound of what `001A` can determine
   * purely from the supplied params themselves.
   */
  if (params.parentId === null && params.depth !== 0) {
    throw invalidKnowledgeNodeFieldError("depth", String(params.depth));
  }
  if (params.parentId !== null && params.depth === 0) {
    throw invalidKnowledgeNodeFieldError("depth", String(params.depth));
  }

  assertConsistentParentReference(params.parentId, params.parentNodeType);
  assertValidParentNodeType(params.nodeType, params.parentNodeType);

  return {
    id,
    nodeType: params.nodeType,
    parentId: params.parentId,
    canonicalName,
    slug,
    path,
    depth: params.depth,
    description: params.description,
    iconKey: params.iconKey,
    status: "draft",
    version: 1,
    searchTerms: params.searchTerms ?? [],
    createdAt: params.createdAt,
    updatedAt: params.createdAt,
    schemaVersion: 1,
  };
}

export type TransitionKnowledgeNodeStatusParams = {
  updatedAt: Date;
  replacementNodeId?: string;
};

export function transitionKnowledgeNodeStatus(
  node: KnowledgeNode,
  toStatus: KnowledgeLifecycleStatus,
  params: TransitionKnowledgeNodeStatusParams,
): { node: KnowledgeNode } {
  if (!isValidKnowledgeLifecycleTransition(node.status, toStatus)) {
    throw invalidKnowledgeLifecycleTransitionError(node.status, toStatus);
  }

  if (toStatus === "retired") {
    if (!params.replacementNodeId) {
      throw replacementNodeIdRequiredForRetirementError(node.id);
    }
    if (params.replacementNodeId === node.id) {
      throw invalidReplacementNodeReferenceError(node.id);
    }
    requireNoPathSeparator("replacementNodeId", params.replacementNodeId);
  }

  return {
    node: {
      ...node,
      status: toStatus,
      replacementNodeId: toStatus === "retired" ? params.replacementNodeId : node.replacementNodeId,
      updatedAt: params.updatedAt,
    },
  };
}
