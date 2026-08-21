/**
 * `KnowledgeTranslation` domain model (`ENG-P3-001A`, design §7.2/§9.3).
 *
 * The localized display label/description/synonym list for one Commerce
 * Knowledge entity in one language. Generalized to `(entityType, entityId,
 * languageCode)` rather than TRD10 §10.7.2's original `(nodeId,
 * languageCode)`-only shape — this is the disposed `ENGINEERING SCHEMA
 * CLARIFICATION` from design §9.3: `KnowledgeTag` must not retain its own
 * inline `translations: Record<string, string>` map (a second,
 * structurally different, no-review/no-fallback/no-synonym localization
 * mechanism for the same platform); it reuses this one entity-agnostic
 * shape instead, so the platform has exactly one authoritative
 * localization representation for all of Commerce Knowledge, not two.
 *
 * Composite uniqueness `(entityType, entityId, languageCode)` is enforced
 * by construction via a deterministic id — the same "document id doubles
 * as the uniqueness key" pattern `ENG-P2-002B` established for
 * `businessCodeReservations/{businessCode}`.
 */

import {
  invalidKnowledgeTranslationFieldError,
  invalidTranslationLifecycleTransitionError,
} from "./commerceKnowledgeErrors";
import { invalidLanguageCodeError } from "./commerceKnowledgeErrors";
import { isSupportedLanguageCode, type LanguageCode } from "./languageCode";
import {
  isValidTranslationLifecycleTransition,
  type TranslationLifecycleStatus,
} from "./translationLifecycle";

export const KNOWLEDGE_TRANSLATION_ENTITY_TYPES = ["knowledge_node", "knowledge_tag"] as const;

export type KnowledgeTranslationEntityType = (typeof KNOWLEDGE_TRANSLATION_ENTITY_TYPES)[number];

export function isKnowledgeTranslationEntityType(
  value: string,
): value is KnowledgeTranslationEntityType {
  return (KNOWLEDGE_TRANSLATION_ENTITY_TYPES as readonly string[]).includes(value);
}

export type KnowledgeTranslation = {
  readonly id: string;
  readonly entityType: KnowledgeTranslationEntityType;
  readonly entityId: string;
  readonly languageCode: LanguageCode;
  displayName: string;
  description?: string;
  synonyms: string[];
  status: TranslationLifecycleStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  readonly createdAt: Date;
  updatedAt: Date;
  schemaVersion: number;
};

export type CreateKnowledgeTranslationParams = {
  entityType: KnowledgeTranslationEntityType;
  entityId: string;
  languageCode: LanguageCode;
  displayName: string;
  description?: string;
  synonyms?: string[];
  createdAt: Date;
};

function deterministicTranslationId(
  entityType: KnowledgeTranslationEntityType,
  entityId: string,
  languageCode: LanguageCode,
): string {
  return `${entityType}_${entityId}_${languageCode}`;
}

export function createKnowledgeTranslation(
  params: CreateKnowledgeTranslationParams,
): KnowledgeTranslation {
  const entityId = params.entityId.trim();
  if (entityId.length === 0) {
    throw invalidKnowledgeTranslationFieldError("entityId", params.entityId);
  }
  /**
   * Review Phase I: a `"/"` is a Firestore document-path separator — since
   * `entityId` is embedded directly into this document's own deterministic
   * composite id (`deterministicTranslationId` below), a slash here would
   * either be silently mis-parsed as a nested path or throw at the
   * repository layer once `ENG-P3-001B` uses this id as a Firestore
   * document key (same rationale as `knowledgeNode.ts`'s
   * `requireNoPathSeparator`, matching `evaluatePermission.ts`'s
   * established platform precedent).
   */
  if (entityId.includes("/")) {
    throw invalidKnowledgeTranslationFieldError("entityId", params.entityId);
  }
  const displayName = params.displayName.trim();
  if (displayName.length === 0) {
    throw invalidKnowledgeTranslationFieldError("displayName", params.displayName);
  }
  if (!isSupportedLanguageCode(params.languageCode)) {
    throw invalidLanguageCodeError(params.languageCode);
  }

  return {
    id: deterministicTranslationId(params.entityType, entityId, params.languageCode),
    entityType: params.entityType,
    entityId,
    languageCode: params.languageCode,
    displayName,
    description: params.description,
    synonyms: params.synonyms ?? [],
    status: "draft",
    createdAt: params.createdAt,
    updatedAt: params.createdAt,
    schemaVersion: 1,
  };
}

export type TransitionKnowledgeTranslationStatusParams = {
  updatedAt: Date;
  reviewedBy?: string;
};

export function transitionKnowledgeTranslationStatus(
  translation: KnowledgeTranslation,
  toStatus: TranslationLifecycleStatus,
  params: TransitionKnowledgeTranslationStatusParams,
): { translation: KnowledgeTranslation } {
  if (!isValidTranslationLifecycleTransition(translation.status, toStatus)) {
    throw invalidTranslationLifecycleTransitionError(translation.status, toStatus);
  }

  return {
    translation: {
      ...translation,
      status: toStatus,
      reviewedBy: toStatus === "reviewed" ? params.reviewedBy : translation.reviewedBy,
      reviewedAt: toStatus === "reviewed" ? params.updatedAt : translation.reviewedAt,
      updatedAt: params.updatedAt,
    },
  };
}
