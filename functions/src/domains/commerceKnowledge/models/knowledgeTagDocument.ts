/**
 * `knowledgeTags` collection reader/writer (`ENG-P3-001A`, design §20).
 *
 * Pure parsing/serialization only, mirroring `knowledgeNodeDocument.ts`'s
 * fail-closed convention. Deliberately does **not** parse or emit a
 * `translations` field — TRD10 §10.7.3's originally-declared inline map
 * is superseded (design §9.3): localization lives entirely in
 * `knowledgeTranslationDocument.ts` instead.
 *
 * Review Phase H (`ENG-P3-001A` independent review): a raw document
 * carrying a `translations` key **fails closed** (returns `null`),
 * rather than being silently tolerated/ignored. The design's own §4
 * confirms zero Commerce Knowledge data exists anywhere in the repository
 * — there is no live/deployed document in the old inline shape this
 * reader would ever need to migrate or stay compatible with. Silently
 * discarding a present `translations` value would hide a caller's bug
 * (writing to a superseded shape that is never read back) rather than
 * surfacing it, and would risk becoming a second, silently-tolerated
 * localization authority precisely where the architecture requires
 * exactly one. Failing closed is therefore the simpler, more correct
 * choice — not an invented migration/compatibility policy.
 */

import { isKnowledgeTagGroup } from "./knowledgeTag";
import { isKnowledgeLifecycleStatus } from "./knowledgeLifecycle";
import type { KnowledgeTag } from "./knowledgeTag";

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
export function fromKnowledgeTagDocument(id: string, raw: unknown): KnowledgeTag | null {
  if (typeof raw !== "object" || raw === null) return null;

  const data = raw as Partial<{
    tagGroup: unknown;
    canonicalName: unknown;
    slug: unknown;
    status: unknown;
    searchTerms: unknown;
    createdAt: unknown;
    updatedAt: unknown;
    schemaVersion: unknown;
    translations: unknown;
  }>;

  if (data.translations !== undefined) return null;
  if (typeof data.tagGroup !== "string" || !isKnowledgeTagGroup(data.tagGroup)) return null;
  if (typeof data.canonicalName !== "string" || data.canonicalName.trim().length === 0) return null;
  if (typeof data.slug !== "string" || data.slug.trim().length === 0) return null;
  if (typeof data.status !== "string" || !isKnowledgeLifecycleStatus(data.status)) return null;
  if (!isStringArray(data.searchTerms)) return null;
  if (!isTimestampLike(data.createdAt)) return null;
  if (!isTimestampLike(data.updatedAt)) return null;
  if (!isValidInteger(data.schemaVersion, 1)) return null;

  return {
    id,
    tagGroup: data.tagGroup,
    canonicalName: data.canonicalName,
    slug: data.slug,
    status: data.status,
    searchTerms: data.searchTerms,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    schemaVersion: data.schemaVersion,
  };
}

export type KnowledgeTagDocumentFields = Omit<KnowledgeTag, "id">;

/** `id` is the Firestore document key, never a field within the document itself. */
export function toKnowledgeTagDocumentFields(tag: KnowledgeTag): KnowledgeTagDocumentFields {
  return {
    tagGroup: tag.tagGroup,
    canonicalName: tag.canonicalName,
    slug: tag.slug,
    status: tag.status,
    searchTerms: tag.searchTerms,
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
    schemaVersion: tag.schemaVersion,
  };
}
