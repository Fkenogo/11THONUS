/**
 * `knowledgeNodes` collection reader/writer (`ENG-P3-001A`, design §20).
 *
 * Pure parsing/serialization only — no Firestore I/O, no `firebase-admin`
 * import (machine-enforced, `eslint.config.js`). Mirrors
 * `functions/src/domains/business/models/businessBranchDocument.ts`'s
 * fail-closed convention exactly: `fromKnowledgeNodeDocument` returns
 * `null`, never throws, for a structurally invalid document (Phase O:
 * malformed persisted input fails closed); `toKnowledgeNodeDocumentFields`
 * produces a plain object using native `Date`, never importing
 * `firebase-admin`'s `Timestamp` type.
 */

import { isKnowledgeNodeType } from "./knowledgeNodeType";
import { isKnowledgeLifecycleStatus } from "./knowledgeLifecycle";
import type { KnowledgeNode } from "./knowledgeNode";

function isTimestampLike(value: unknown): value is { toDate: () => Date } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

/** Returns `null` (never throws) for a structurally invalid document. */
export function fromKnowledgeNodeDocument(id: string, raw: unknown): KnowledgeNode | null {
  if (typeof raw !== "object" || raw === null) return null;

  const data = raw as Partial<{
    parentId: unknown;
    nodeType: unknown;
    canonicalName: unknown;
    slug: unknown;
    path: unknown;
    depth: unknown;
    description: unknown;
    iconKey: unknown;
    status: unknown;
    version: unknown;
    replacementNodeId: unknown;
    searchTerms: unknown;
    createdAt: unknown;
    updatedAt: unknown;
    schemaVersion: unknown;
  }>;

  if (data.parentId !== null && typeof data.parentId !== "string") return null;
  if (typeof data.nodeType !== "string" || !isKnowledgeNodeType(data.nodeType)) return null;
  if (typeof data.canonicalName !== "string" || data.canonicalName.trim().length === 0) return null;
  if (typeof data.slug !== "string" || data.slug.trim().length === 0) return null;
  if (typeof data.path !== "string" || data.path.trim().length === 0) return null;
  if (typeof data.depth !== "number" || data.depth < 0) return null;
  if (data.description !== undefined && typeof data.description !== "string") return null;
  if (data.iconKey !== undefined && typeof data.iconKey !== "string") return null;
  if (typeof data.status !== "string" || !isKnowledgeLifecycleStatus(data.status)) return null;
  if (typeof data.version !== "number" || data.version < 1) return null;
  if (data.replacementNodeId !== undefined && typeof data.replacementNodeId !== "string")
    return null;
  if (!isStringArray(data.searchTerms)) return null;
  if (!isTimestampLike(data.createdAt)) return null;
  if (!isTimestampLike(data.updatedAt)) return null;
  if (typeof data.schemaVersion !== "number" || data.schemaVersion < 1) return null;

  return {
    id,
    parentId: data.parentId,
    nodeType: data.nodeType,
    canonicalName: data.canonicalName,
    slug: data.slug,
    path: data.path,
    depth: data.depth,
    description: data.description,
    iconKey: data.iconKey,
    status: data.status,
    version: data.version,
    replacementNodeId: data.replacementNodeId,
    searchTerms: data.searchTerms,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    schemaVersion: data.schemaVersion,
  };
}

export type KnowledgeNodeDocumentFields = Omit<KnowledgeNode, "id">;

/** `id` is the Firestore document key, never a field within the document itself. */
export function toKnowledgeNodeDocumentFields(node: KnowledgeNode): KnowledgeNodeDocumentFields {
  return {
    parentId: node.parentId,
    nodeType: node.nodeType,
    canonicalName: node.canonicalName,
    slug: node.slug,
    path: node.path,
    depth: node.depth,
    description: node.description,
    iconKey: node.iconKey,
    status: node.status,
    version: node.version,
    replacementNodeId: node.replacementNodeId,
    searchTerms: node.searchTerms,
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
    schemaVersion: node.schemaVersion,
  };
}
