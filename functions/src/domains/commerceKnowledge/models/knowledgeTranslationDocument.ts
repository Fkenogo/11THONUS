/**
 * `knowledgeTranslations` collection reader/writer (`ENG-P3-001A`, design §20).
 *
 * Pure parsing/serialization only, mirroring `knowledgeNodeDocument.ts`'s
 * fail-closed convention. Parses the generalized `(entityType, entityId,
 * languageCode)` shape (design §9.3) — see `knowledgeTranslation.ts`'s
 * own header for why this is the single authoritative localization
 * representation for both `KnowledgeNode` and `KnowledgeTag`.
 */

import { isKnowledgeTranslationEntityType } from "./knowledgeTranslation";
import { isSupportedLanguageCode } from "./languageCode";
import { isTranslationLifecycleStatus } from "./translationLifecycle";
import type { KnowledgeTranslation } from "./knowledgeTranslation";

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

/** Review Phase F: fail closed against NaN/Infinity/fractional — see `knowledgeNodeDocument.ts`'s `isValidInteger` for the full rationale (same platform precedent, `trustRecord.ts`/`trustRuleVersion.ts`). */
function isValidInteger(value: unknown, minimum: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= minimum;
}

/** Returns `null` (never throws) for a structurally invalid document. */
export function fromKnowledgeTranslationDocument(
  id: string,
  raw: unknown,
): KnowledgeTranslation | null {
  if (typeof raw !== "object" || raw === null) return null;

  const data = raw as Partial<{
    entityType: unknown;
    entityId: unknown;
    languageCode: unknown;
    displayName: unknown;
    description: unknown;
    synonyms: unknown;
    status: unknown;
    reviewedBy: unknown;
    reviewedAt: unknown;
    createdAt: unknown;
    updatedAt: unknown;
    schemaVersion: unknown;
  }>;

  if (typeof data.entityType !== "string" || !isKnowledgeTranslationEntityType(data.entityType)) {
    return null;
  }
  if (typeof data.entityId !== "string" || data.entityId.trim().length === 0) return null;
  if (typeof data.languageCode !== "string" || !isSupportedLanguageCode(data.languageCode)) {
    return null;
  }
  if (typeof data.displayName !== "string" || data.displayName.trim().length === 0) return null;
  if (data.description !== undefined && typeof data.description !== "string") return null;
  if (!isStringArray(data.synonyms)) return null;
  if (typeof data.status !== "string" || !isTranslationLifecycleStatus(data.status)) return null;
  if (data.reviewedBy !== undefined && typeof data.reviewedBy !== "string") return null;
  if (data.reviewedAt !== undefined && !isTimestampLike(data.reviewedAt)) return null;
  if (!isTimestampLike(data.createdAt)) return null;
  if (!isTimestampLike(data.updatedAt)) return null;
  if (!isValidInteger(data.schemaVersion, 1)) return null;

  return {
    id,
    entityType: data.entityType,
    entityId: data.entityId,
    languageCode: data.languageCode,
    displayName: data.displayName,
    description: data.description,
    synonyms: data.synonyms,
    status: data.status,
    reviewedBy: data.reviewedBy,
    reviewedAt: data.reviewedAt ? data.reviewedAt.toDate() : undefined,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    schemaVersion: data.schemaVersion,
  };
}

export type KnowledgeTranslationDocumentFields = Omit<KnowledgeTranslation, "id">;

/** `id` is the Firestore document key, never a field within the document itself. */
export function toKnowledgeTranslationDocumentFields(
  translation: KnowledgeTranslation,
): KnowledgeTranslationDocumentFields {
  return {
    entityType: translation.entityType,
    entityId: translation.entityId,
    languageCode: translation.languageCode,
    displayName: translation.displayName,
    description: translation.description,
    synonyms: translation.synonyms,
    status: translation.status,
    reviewedBy: translation.reviewedBy,
    reviewedAt: translation.reviewedAt,
    createdAt: translation.createdAt,
    updatedAt: translation.updatedAt,
    schemaVersion: translation.schemaVersion,
  };
}
