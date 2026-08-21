/**
 * Commerce Knowledge domain errors (`ENG-P3-001A`).
 *
 * Domain-local error type, structurally compatible with the shared error
 * shape but defined independently so this domain layer stays
 * framework-independent, mirroring
 * `functions/src/domains/business/models/businessErrors.ts`'s own
 * precedent (no `commandDispatcher.ts`/shared-service import here).
 *
 * Every category used below is one of the existing, closed 14 categories
 * `functions/src/shared/errors/errorCategories.ts` defines (TRD11 §11.35)
 * — no new category is introduced (Phase O/S).
 */

import type { ErrorCategory } from "../../../shared/errors/errorCategories";
import type { PlatformFieldError } from "../../../shared/errors/platformError";

export class CommerceKnowledgeDomainError extends Error {
  readonly category: ErrorCategory;
  readonly fieldErrors?: PlatformFieldError[];

  constructor(category: ErrorCategory, message: string, fieldErrors?: PlatformFieldError[]) {
    super(message);
    this.name = "CommerceKnowledgeDomainError";
    this.category = category;
    this.fieldErrors = fieldErrors;
  }
}

export function invalidKnowledgeNodeFieldError(
  field: string,
  value: string,
): CommerceKnowledgeDomainError {
  return new CommerceKnowledgeDomainError(
    "VALIDATION_FAILED",
    `Invalid KnowledgeNode field "${field}": "${value}" is not acceptable.`,
    [{ field, code: "invalid", messageKey: "commerceKnowledge.node.field.invalid" }],
  );
}

export function invalidKnowledgeTagFieldError(
  field: string,
  value: string,
): CommerceKnowledgeDomainError {
  return new CommerceKnowledgeDomainError(
    "VALIDATION_FAILED",
    `Invalid KnowledgeTag field "${field}": "${value}" is not acceptable.`,
    [{ field, code: "invalid", messageKey: "commerceKnowledge.tag.field.invalid" }],
  );
}

export function invalidKnowledgeTranslationFieldError(
  field: string,
  value: string,
): CommerceKnowledgeDomainError {
  return new CommerceKnowledgeDomainError(
    "VALIDATION_FAILED",
    `Invalid KnowledgeTranslation field "${field}": "${value}" is not acceptable.`,
    [{ field, code: "invalid", messageKey: "commerceKnowledge.translation.field.invalid" }],
  );
}

/** Design §9.4: an attempted `KnowledgeNode`/`KnowledgeTag` canonical-lifecycle transition not in the resolved transition matrix. */
export function invalidKnowledgeLifecycleTransitionError(
  from: string,
  to: string,
): CommerceKnowledgeDomainError {
  return new CommerceKnowledgeDomainError(
    "INVALID_STATE_TRANSITION",
    `Cannot transition Commerce Knowledge canonical lifecycle from "${from}" to "${to}".`,
  );
}

/** Design §9.4: an attempted `KnowledgeTranslation` lifecycle transition not in the resolved transition matrix. */
export function invalidTranslationLifecycleTransitionError(
  from: string,
  to: string,
): CommerceKnowledgeDomainError {
  return new CommerceKnowledgeDomainError(
    "INVALID_STATE_TRANSITION",
    `Cannot transition KnowledgeTranslation lifecycle from "${from}" to "${to}".`,
  );
}

/** Design §7.1.1: a `parentId` whose `nodeType` is not the governed allowed parent for the child's `nodeType`. */
export function invalidParentTypeError(
  childNodeType: string,
  parentNodeType: string | null,
): CommerceKnowledgeDomainError {
  return new CommerceKnowledgeDomainError(
    "VALIDATION_FAILED",
    `KnowledgeNode of type "${childNodeType}" may not have a parent of type "${parentNodeType ?? "null"}".`,
    [
      {
        field: "parentId",
        code: "invalid_parent_type",
        messageKey: "commerceKnowledge.node.parentId.invalidType",
      },
    ],
  );
}

/**
 * Review Phase D (`ENG-P3-001A` independent review): `parentId` and
 * `parentNodeType` must agree on whether a parent exists at all —
 * `parentId === null` iff `parentNodeType === null`. A caller supplying
 * a non-null `parentId` alongside `parentNodeType: null` (or vice versa)
 * describes a structurally impossible node, distinct from — and checked
 * before — the type-adjacency question `invalidParentTypeError` covers.
 */
export function inconsistentParentReferenceError(
  parentId: string | null,
  parentNodeType: string | null,
): CommerceKnowledgeDomainError {
  return new CommerceKnowledgeDomainError(
    "VALIDATION_FAILED",
    `parentId (${parentId === null ? "null" : `"${parentId}"`}) and parentNodeType (${parentNodeType === null ? "null" : `"${parentNodeType}"`}) must agree on whether a parent exists — both null (root) or both non-null.`,
    [
      {
        field: "parentId",
        code: "inconsistent_parent_reference",
        messageKey: "commerceKnowledge.node.parentId.inconsistentReference",
      },
    ],
  );
}

/** Design §7.1.1/§J: a hierarchy write whose ancestor chain would revisit itself. */
export function hierarchyCycleDetectedError(nodeId: string): CommerceKnowledgeDomainError {
  return new CommerceKnowledgeDomainError(
    "VALIDATION_FAILED",
    `Setting this parent for KnowledgeNode "${nodeId}" would create a hierarchy cycle.`,
    [
      {
        field: "parentId",
        code: "cycle_detected",
        messageKey: "commerceKnowledge.node.parentId.cycle",
      },
    ],
  );
}

/** Design §9.4/§12: a `replacementNodeId` that fails structural validation (e.g. self-reference). */
export function invalidReplacementNodeReferenceError(nodeId: string): CommerceKnowledgeDomainError {
  return new CommerceKnowledgeDomainError(
    "VALIDATION_FAILED",
    `Invalid replacementNodeId for KnowledgeNode "${nodeId}": a node may not replace itself.`,
    [
      {
        field: "replacementNodeId",
        code: "invalid",
        messageKey: "commerceKnowledge.node.replacementNodeId.invalid",
      },
    ],
  );
}

/** Design §9.4 transition matrix note: `active -> retired` requires `replacementNodeId` to be set at that transition. */
export function replacementNodeIdRequiredForRetirementError(
  nodeId: string,
): CommerceKnowledgeDomainError {
  return new CommerceKnowledgeDomainError(
    "VALIDATION_FAILED",
    `Retiring KnowledgeNode "${nodeId}" requires a replacementNodeId to be set at the same transition.`,
    [
      {
        field: "replacementNodeId",
        code: "required",
        messageKey: "commerceKnowledge.node.replacementNodeId.required",
      },
    ],
  );
}

/** Design §11: a language code outside the closed EN/FR MVP contract. */
export function invalidLanguageCodeError(languageCode: string): CommerceKnowledgeDomainError {
  return new CommerceKnowledgeDomainError(
    "VALIDATION_FAILED",
    `Unsupported language code "${languageCode}" — only "en"/"fr" are governed at current scope.`,
    [
      {
        field: "languageCode",
        code: "invalid",
        messageKey: "commerceKnowledge.translation.languageCode.invalid",
      },
    ],
  );
}

/** Design §20/TRD10 §10.5: a non-positive or otherwise malformed `schemaVersion`. */
export function invalidSchemaVersionError(schemaVersion: number): CommerceKnowledgeDomainError {
  return new CommerceKnowledgeDomainError(
    "VALIDATION_FAILED",
    `Invalid schemaVersion "${schemaVersion}": must be a positive integer.`,
    [
      {
        field: "schemaVersion",
        code: "invalid",
        messageKey: "commerceKnowledge.schemaVersion.invalid",
      },
    ],
  );
}

/**
 * Design §9.4/§G: a new-reference write (e.g. a future `Business.primaryCategoryId`
 * validation in `ENG-P3-001C`) targeted a `KnowledgeNode` whose `status` is not
 * `"active"` — referential validity is governed solely by node status
 * (translation status plays no role, F3 correction).
 */
export function knowledgeNodeNotEligibleForReferenceError(
  nodeId: string,
  status: string,
): CommerceKnowledgeDomainError {
  return new CommerceKnowledgeDomainError(
    "VALIDATION_FAILED",
    `KnowledgeNode "${nodeId}" (status "${status}") is not eligible for a new reference — only "active" nodes may be newly referenced.`,
    [
      {
        field: "nodeId",
        code: "not_eligible",
        messageKey: "commerceKnowledge.node.reference.notEligible",
      },
    ],
  );
}

/**
 * `ENG-P3-001B` addendum (repository/hierarchy-persistence layer, design §H/§I).
 * The error factories below are new to `001B` — they are additive, not a
 * modification of any `001A` contract above.
 */

/** Design §H: a declared `parentId` that does not resolve to any persisted `KnowledgeNode` (or resolves to a structurally malformed one). */
export function parentKnowledgeNodeNotFoundError(parentId: string): CommerceKnowledgeDomainError {
  return new CommerceKnowledgeDomainError(
    "RESOURCE_NOT_FOUND",
    `Parent KnowledgeNode "${parentId}" does not exist or is malformed.`,
    [
      {
        field: "parentId",
        code: "not_found",
        messageKey: "commerceKnowledge.node.parentId.notFound",
      },
    ],
  );
}

/** Design §I: the parent-ancestor traversal (existing persisted data) exceeded the defensive technical bound — a malformed/runaway existing hierarchy, never a product-level depth limit. */
export function excessiveHierarchyTraversalError(nodeId: string): CommerceKnowledgeDomainError {
  return new CommerceKnowledgeDomainError(
    "VALIDATION_FAILED",
    `Hierarchy ancestor traversal for KnowledgeNode "${nodeId}" exceeded the defensive traversal bound — possible malformed or cyclic existing data.`,
    [
      {
        field: "parentId",
        code: "excessive_traversal",
        messageKey: "commerceKnowledge.node.parentId.excessiveTraversal",
      },
    ],
  );
}

/** Design §I: an ancestor referenced by `parentId` during traversal does not itself resolve to a valid persisted `KnowledgeNode` — malformed existing hierarchy, fails closed. */
export function malformedHierarchyAncestorError(ancestorId: string): CommerceKnowledgeDomainError {
  return new CommerceKnowledgeDomainError(
    "VALIDATION_FAILED",
    `Ancestor KnowledgeNode "${ancestorId}" is missing or malformed — cannot safely resolve hierarchy placement.`,
    [
      {
        field: "parentId",
        code: "malformed_ancestor",
        messageKey: "commerceKnowledge.node.parentId.malformedAncestor",
      },
    ],
  );
}

/**
 * Review Phase L (`ENG-P3-001B` independent review): a `createKnowledgeNodePersisted`
 * call targeted an id that already has a persisted `KnowledgeNode` document —
 * fails closed rather than letting a same-id create race silently overwrite
 * an already-committed canonical node (last-writer-wins under Firestore's
 * transaction semantics if this check were absent).
 */
export function duplicateKnowledgeNodeIdError(id: string): CommerceKnowledgeDomainError {
  return new CommerceKnowledgeDomainError(
    "IDEMPOTENCY_CONFLICT",
    `A KnowledgeNode already exists at id "${id}" — refusing to overwrite via create.`,
    [{ field: "id", code: "duplicate_id", messageKey: "commerceKnowledge.node.id.duplicate" }],
  );
}

/** Design §F/§J: a `KnowledgeNode` id that does not resolve to any persisted document. */
export function knowledgeNodeNotFoundError(nodeId: string): CommerceKnowledgeDomainError {
  return new CommerceKnowledgeDomainError(
    "RESOURCE_NOT_FOUND",
    `KnowledgeNode "${nodeId}" does not exist.`,
    [{ field: "id", code: "not_found", messageKey: "commerceKnowledge.node.notFound" }],
  );
}

/** Design §J: a `replacementNodeId` that does not resolve to any persisted `KnowledgeNode`, or that fails a governed replacement-eligibility check. */
export function replacementKnowledgeNodeNotFoundError(
  replacementNodeId: string,
): CommerceKnowledgeDomainError {
  return new CommerceKnowledgeDomainError(
    "RESOURCE_NOT_FOUND",
    `Replacement KnowledgeNode "${replacementNodeId}" does not exist or is malformed.`,
    [
      {
        field: "replacementNodeId",
        code: "not_found",
        messageKey: "commerceKnowledge.node.replacementNodeId.notFound",
      },
    ],
  );
}

/** Design §J: `replacementNodeId` resolves to a node whose `nodeType` differs from the retiring node's own — cross-type replacement is not governed and is rejected, never silently allowed. */
export function replacementNodeTypeMismatchError(
  nodeId: string,
  replacementNodeId: string,
): CommerceKnowledgeDomainError {
  return new CommerceKnowledgeDomainError(
    "VALIDATION_FAILED",
    `Replacement KnowledgeNode "${replacementNodeId}" for "${nodeId}" has a different nodeType — cross-type replacement is not governed.`,
    [
      {
        field: "replacementNodeId",
        code: "type_mismatch",
        messageKey: "commerceKnowledge.node.replacementNodeId.typeMismatch",
      },
    ],
  );
}

/** Design §O: a seed-manifest entry whose stable id already has conflicting persisted immutable identity/hierarchy content — never silently overwritten. */
export function seedContentConflictError(id: string): CommerceKnowledgeDomainError {
  return new CommerceKnowledgeDomainError(
    "IDEMPOTENCY_CONFLICT",
    `Seed entry "${id}" conflicts with existing persisted content in an immutable field — refusing to overwrite.`,
    [{ field: "id", code: "seed_conflict", messageKey: "commerceKnowledge.seed.conflict" }],
  );
}

/** Design §N/§P: the seed manifest itself failed referential-integrity validation (dangling parent reference, duplicate slug within a nodeType, etc.) before any write was attempted. */
export function invalidSeedManifestError(reason: string): CommerceKnowledgeDomainError {
  return new CommerceKnowledgeDomainError(
    "VALIDATION_FAILED",
    `Seed manifest failed validation: ${reason}`,
    [{ field: "manifest", code: "invalid", messageKey: "commerceKnowledge.seed.manifest.invalid" }],
  );
}

/** Design §F: a `KnowledgeTranslation` id that does not resolve to any persisted document. */
export function knowledgeTranslationNotFoundError(id: string): CommerceKnowledgeDomainError {
  return new CommerceKnowledgeDomainError(
    "RESOURCE_NOT_FOUND",
    `KnowledgeTranslation "${id}" does not exist.`,
    [{ field: "id", code: "not_found", messageKey: "commerceKnowledge.translation.notFound" }],
  );
}

/** Design §G: a `KnowledgeTag` id that does not resolve to any persisted document. */
export function knowledgeTagNotFoundError(id: string): CommerceKnowledgeDomainError {
  return new CommerceKnowledgeDomainError(
    "RESOURCE_NOT_FOUND",
    `KnowledgeTag "${id}" does not exist.`,
    [{ field: "id", code: "not_found", messageKey: "commerceKnowledge.tag.notFound" }],
  );
}

/** Design §F: composite `(entityType, entityId, languageCode)` translation uniqueness violated at the persistence boundary (should be structurally prevented by the deterministic id, this is the fail-closed backstop). */
export function duplicateTranslationTupleError(
  entityType: string,
  entityId: string,
  languageCode: string,
): CommerceKnowledgeDomainError {
  return new CommerceKnowledgeDomainError(
    "VALIDATION_FAILED",
    `A KnowledgeTranslation already exists for (${entityType}, ${entityId}, ${languageCode}).`,
    [
      {
        field: "languageCode",
        code: "duplicate_tuple",
        messageKey: "commerceKnowledge.translation.duplicateTuple",
      },
    ],
  );
}
