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
import { assertValidParentNodeType, type KnowledgeNodeType } from "./knowledgeNodeType";
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

export function createKnowledgeNode(params: CreateKnowledgeNodeParams): KnowledgeNode {
  const id = requireNonBlank("id", params.id);
  const canonicalName = requireNonBlank("canonicalName", params.canonicalName);
  const slug = requireNonBlank("slug", params.slug);
  const path = requireNonBlank("path", params.path);

  if (params.depth < 0) {
    throw invalidKnowledgeNodeFieldError("depth", String(params.depth));
  }

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
