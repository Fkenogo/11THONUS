/**
 * `knowledgeNodes` persistence (`ENG-P3-001B`, design §20-§21, §H-§J).
 *
 * Repository-backed hierarchy validation and cycle detection layered on
 * top of `001A`'s pure domain model/converter. Client input is never
 * authoritative for derived hierarchy metadata (`path`/`depth`/
 * `parentNodeType`) — this module always re-derives those from persisted
 * parent state inside a transaction, never trusting a caller-supplied
 * value for them (design §H).
 *
 * Only the operations `001B`'s own packages (seed loader, future `001C`
 * read consumers) actually need are exposed here — not a generic CRUD
 * repository and not a Business-facing lookup API (design §E).
 */

import type { Firestore, Transaction } from "firebase-admin/firestore";
import {
  createKnowledgeNode,
  transitionKnowledgeNodeStatus,
  type KnowledgeNode,
} from "../models/knowledgeNode";
import {
  fromKnowledgeNodeDocument,
  toKnowledgeNodeDocumentFields,
} from "../models/knowledgeNodeDocument";
import { assertValidParentNodeType, type KnowledgeNodeType } from "../models/knowledgeNodeType";
import type { KnowledgeLifecycleStatus } from "../models/knowledgeLifecycle";
import {
  duplicateKnowledgeNodeIdError,
  excessiveHierarchyTraversalError,
  hierarchyCycleDetectedError,
  invalidReplacementNodeReferenceError,
  knowledgeNodeNotFoundError,
  malformedHierarchyAncestorError,
  parentKnowledgeNodeNotFoundError,
  replacementKnowledgeNodeNotFoundError,
  replacementNodeTypeMismatchError,
} from "../models/commerceKnowledgeErrors";

export const KNOWLEDGE_NODES_COLLECTION = "knowledgeNodes";

/**
 * Defensive technical traversal guard against a malformed/cyclic existing
 * hierarchy — distinct from any product-level taxonomy depth limit (design
 * §I: "do not invent an arbitrary hierarchy depth business limit"). No
 * governed source names a maximum taxonomy depth; this bound exists only
 * to prevent unbounded traversal against corrupted persisted data.
 */
const MAX_ANCESTOR_TRAVERSAL = 64;

export type ResolvedHierarchyPlacement = {
  parentNodeType: KnowledgeNodeType | null;
  path: string;
  depth: number;
};

/**
 * Resolves and validates where a node (`nodeId`, brand-new or existing)
 * would sit in the hierarchy under `parentId`, entirely from persisted
 * `knowledgeNodes` state read inside the given transaction. Never trusts
 * caller-supplied `path`/`depth`/`parentNodeType`.
 *
 * Used both for creation (a fresh `nodeId` cannot already be its own
 * ancestor, but the same code path is exercised) and for any future
 * re-parent/replacement validation (design §H) — a self-cycle
 * (`parentId === nodeId`) and an indirect cycle (`nodeId` appears deeper
 * in the candidate parent's own ancestor chain) are both rejected here.
 */
export async function resolveHierarchyPlacement(
  transaction: Transaction,
  db: Firestore,
  params: { nodeId: string; nodeType: KnowledgeNodeType; parentId: string | null },
): Promise<ResolvedHierarchyPlacement> {
  if (params.parentId === null) {
    assertValidParentNodeType(params.nodeType, null);
    return { parentNodeType: null, path: `/${params.nodeId}`, depth: 0 };
  }

  if (params.parentId === params.nodeId) {
    throw hierarchyCycleDetectedError(params.nodeId);
  }

  const parentSnapshot = await transaction.get(
    db.collection(KNOWLEDGE_NODES_COLLECTION).doc(params.parentId),
  );
  if (!parentSnapshot.exists) {
    throw parentKnowledgeNodeNotFoundError(params.parentId);
  }
  const parent = fromKnowledgeNodeDocument(params.parentId, parentSnapshot.data());
  if (!parent) {
    throw parentKnowledgeNodeNotFoundError(params.parentId);
  }

  assertValidParentNodeType(params.nodeType, parent.nodeType);

  // Walk the parent's own ancestor chain (bounded), detecting an indirect
  // cycle (`nodeId` reappearing higher up) or malformed existing data.
  let currentId: string | null = parent.parentId;
  let steps = 0;
  while (currentId !== null) {
    if (currentId === params.nodeId) {
      throw hierarchyCycleDetectedError(params.nodeId);
    }
    steps += 1;
    if (steps > MAX_ANCESTOR_TRAVERSAL) {
      throw excessiveHierarchyTraversalError(params.nodeId);
    }
    const snapshot = await transaction.get(
      db.collection(KNOWLEDGE_NODES_COLLECTION).doc(currentId),
    );
    if (!snapshot.exists) {
      throw malformedHierarchyAncestorError(currentId);
    }
    const ancestor = fromKnowledgeNodeDocument(currentId, snapshot.data());
    if (!ancestor) {
      throw malformedHierarchyAncestorError(currentId);
    }
    currentId = ancestor.parentId;
  }

  return {
    parentNodeType: parent.nodeType,
    path: `${parent.path}/${params.nodeId}`,
    depth: parent.depth + 1,
  };
}

export type CreateKnowledgeNodeRepositoryParams = {
  id: string;
  nodeType: KnowledgeNodeType;
  parentId: string | null;
  canonicalName: string;
  slug: string;
  description?: string;
  iconKey?: string;
  searchTerms?: string[];
  createdAt: Date;
};

/**
 * Creates a new `KnowledgeNode`, deriving `path`/`depth`/`parentNodeType`
 * authoritatively from persisted parent state (design §H) inside one
 * transaction. Fails closed (`RESOURCE_NOT_FOUND`) if `parentId` does not
 * resolve; fails closed (`VALIDATION_FAILED`) on a disallowed parent type
 * or a detected cycle in existing data; fails closed
 * (`IDEMPOTENCY_CONFLICT`) if a document already exists at `params.id` —
 * checked via a transactional read of the node's own id before any write,
 * so two concurrent creators racing on the same id can never result in one
 * silently overwriting the other (Review Phase L: `transaction.set` alone,
 * without a prior `transaction.get` establishing a read precondition on
 * that exact document, is last-writer-wins under Firestore's optimistic
 * concurrency model — this explicit existence check is what makes the
 * write itself race-safe, not just the hierarchy derivation around it).
 */
export async function createKnowledgeNodePersisted(
  db: Firestore,
  params: CreateKnowledgeNodeRepositoryParams,
): Promise<KnowledgeNode> {
  return db.runTransaction(async (transaction) => {
    const ownSnapshot = await transaction.get(
      db.collection(KNOWLEDGE_NODES_COLLECTION).doc(params.id),
    );
    if (ownSnapshot.exists) {
      throw duplicateKnowledgeNodeIdError(params.id);
    }

    const placement = await resolveHierarchyPlacement(transaction, db, {
      nodeId: params.id,
      nodeType: params.nodeType,
      parentId: params.parentId,
    });

    const node = createKnowledgeNode({
      id: params.id,
      nodeType: params.nodeType,
      parentId: params.parentId,
      parentNodeType: placement.parentNodeType,
      canonicalName: params.canonicalName,
      slug: params.slug,
      path: placement.path,
      depth: placement.depth,
      description: params.description,
      iconKey: params.iconKey,
      searchTerms: params.searchTerms,
      createdAt: params.createdAt,
    });

    transaction.set(
      db.collection(KNOWLEDGE_NODES_COLLECTION).doc(node.id),
      stripUndefined(toKnowledgeNodeDocumentFields(node)),
    );

    return node;
  });
}

export async function getKnowledgeNodeById(
  db: Firestore,
  id: string,
): Promise<KnowledgeNode | null> {
  const snapshot = await db.collection(KNOWLEDGE_NODES_COLLECTION).doc(id).get();
  if (!snapshot.exists) return null;
  return fromKnowledgeNodeDocument(id, snapshot.data());
}

/**
 * Design §E: "list children by parent" — the one hierarchy-browse query
 * `001B` itself needs (seed-time duplicate checks, ancestry resolution
 * callers). Filters out documents that fail to parse (fail closed, never
 * surfaces a malformed sibling silently as if it did not exist — it is
 * simply excluded from the result rather than crashing the caller).
 */
export async function listKnowledgeNodeChildren(
  db: Firestore,
  parentId: string | null,
): Promise<KnowledgeNode[]> {
  const snapshot = await db
    .collection(KNOWLEDGE_NODES_COLLECTION)
    .where("parentId", "==", parentId)
    .get();
  const nodes: KnowledgeNode[] = [];
  for (const doc of snapshot.docs) {
    const node = fromKnowledgeNodeDocument(doc.id, doc.data());
    if (node) nodes.push(node);
  }
  return nodes;
}

/**
 * Design §J: replacement-node validation against authoritative persisted
 * state. Validates existence, non-self-reference, and `nodeType`
 * compatibility (cross-type replacement is not governed anywhere in the
 * design/CKS — rejected rather than silently permitted, per the task's
 * "do not invent cross-type replacement policy" instruction).
 */
export async function validateReplacementNode(
  transaction: Transaction,
  db: Firestore,
  nodeId: string,
  nodeType: KnowledgeNodeType,
  replacementNodeId: string,
): Promise<KnowledgeNode> {
  if (replacementNodeId === nodeId) {
    throw invalidReplacementNodeReferenceError(nodeId);
  }
  const snapshot = await transaction.get(
    db.collection(KNOWLEDGE_NODES_COLLECTION).doc(replacementNodeId),
  );
  if (!snapshot.exists) {
    throw replacementKnowledgeNodeNotFoundError(replacementNodeId);
  }
  const replacement = fromKnowledgeNodeDocument(replacementNodeId, snapshot.data());
  if (!replacement) {
    throw replacementKnowledgeNodeNotFoundError(replacementNodeId);
  }
  if (replacement.nodeType !== nodeType) {
    throw replacementNodeTypeMismatchError(nodeId, replacementNodeId);
  }
  return replacement;
}

export type RetireKnowledgeNodeParams = {
  updatedAt: Date;
  replacementNodeId: string;
};

/**
 * Design §H/§J: retires a node (`active -> retired`, `001A`'s own
 * transition matrix), requiring and validating `replacementNodeId`
 * against authoritative persisted state in the same transaction.
 */
export async function retireKnowledgeNodePersisted(
  db: Firestore,
  nodeId: string,
  params: RetireKnowledgeNodeParams,
): Promise<KnowledgeNode> {
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(db.collection(KNOWLEDGE_NODES_COLLECTION).doc(nodeId));
    if (!snapshot.exists) {
      throw knowledgeNodeNotFoundError(nodeId);
    }
    const node = fromKnowledgeNodeDocument(nodeId, snapshot.data());
    if (!node) {
      throw knowledgeNodeNotFoundError(nodeId);
    }

    await validateReplacementNode(transaction, db, nodeId, node.nodeType, params.replacementNodeId);

    const { node: retired } = transitionKnowledgeNodeStatus(node, "retired", {
      updatedAt: params.updatedAt,
      replacementNodeId: params.replacementNodeId,
    });

    transaction.set(
      db.collection(KNOWLEDGE_NODES_COLLECTION).doc(nodeId),
      stripUndefined(toKnowledgeNodeDocumentFields(retired)),
    );

    return retired;
  });
}

export type TransitionKnowledgeNodeStatusPersistedParams = {
  updatedAt: Date;
};

/**
 * Non-retirement lifecycle transitions (`draft -> in_review`,
 * `in_review -> active`/`draft`, `retired -> archived`) — no replacement
 * validation required, reuses `001A`'s transition-matrix enforcement.
 */
export async function transitionKnowledgeNodeStatusPersisted(
  db: Firestore,
  nodeId: string,
  toStatus: KnowledgeLifecycleStatus,
  params: TransitionKnowledgeNodeStatusPersistedParams,
): Promise<KnowledgeNode> {
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(db.collection(KNOWLEDGE_NODES_COLLECTION).doc(nodeId));
    if (!snapshot.exists) {
      throw knowledgeNodeNotFoundError(nodeId);
    }
    const node = fromKnowledgeNodeDocument(nodeId, snapshot.data());
    if (!node) {
      throw knowledgeNodeNotFoundError(nodeId);
    }

    const { node: updated } = transitionKnowledgeNodeStatus(node, toStatus, {
      updatedAt: params.updatedAt,
    });

    transaction.set(
      db.collection(KNOWLEDGE_NODES_COLLECTION).doc(nodeId),
      stripUndefined(toKnowledgeNodeDocumentFields(updated)),
    );

    return updated;
  });
}

function stripUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key of Object.keys(value) as Array<keyof T>) {
    if (value[key] !== undefined) {
      result[key] = value[key];
    }
  }
  return result;
}
