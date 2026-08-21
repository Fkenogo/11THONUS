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
