/**
 * Commerce Knowledge Category/Business-Type read transport (`ENG-P3-002A`,
 * design §13/§14/§17/ED-P3-002-6).
 *
 * The minimum server-mediated read transport for selectable Business
 * Categories/Types (task Phase H/I/J). Returns only nodes eligible for a
 * NEW Business reference — `status == "active"` — never `draft`/
 * `in_review`/`retired`/`archived` (Phase H). Not a search engine
 * (`DEC-TECH-008` remains non-blocking, §13): both operations are plain,
 * bounded, equality-filtered list reads.
 *
 * EN/FR fallback (Phase J, ED-P3-002-6) happens here, once, server-side —
 * a requested language with no `published` translation falls back to the
 * governed EN `published` translation; if even that is absent, the node's
 * own `canonicalName` is the last-resort label (never a blank string, and
 * never a raw internal key) — this only happens for not-yet-translated
 * seed content, not a product-level design gap (§17's disclosed, known
 * EN-only Commerce Knowledge translation state).
 */

import type { Firestore } from "firebase-admin/firestore";
import {
  listActiveSelectableNodes,
  getKnowledgeNodeById,
} from "../repositories/knowledgeNodeRepository";
import { getKnowledgeTranslationByTuple } from "../repositories/knowledgeTranslationRepository";
import {
  DEFAULT_LANGUAGE_CODE,
  isSupportedLanguageCode,
  type LanguageCode,
} from "../models/languageCode";
import type { KnowledgeNode } from "../models/knowledgeNode";
import { businessCategoryNotFoundForTypeListingError } from "../models/commerceKnowledgeErrors";

/** §14's bounded Commerce Knowledge option DTO — never `schemaVersion`, editorial state, audit/replacement metadata. */
export type CommerceKnowledgeOptionDto = {
  id: string;
  displayLabel: string;
  nodeType: "business_category" | "business_type";
  parentId?: string;
};

async function resolveDisplayLabel(
  db: Firestore,
  node: KnowledgeNode,
  languageCode: LanguageCode,
): Promise<string> {
  const requested = await getKnowledgeTranslationByTuple(
    db,
    "knowledge_node",
    node.id,
    languageCode,
  );
  if (requested && requested.status === "published") {
    return requested.displayName;
  }
  if (languageCode !== DEFAULT_LANGUAGE_CODE) {
    const fallback = await getKnowledgeTranslationByTuple(
      db,
      "knowledge_node",
      node.id,
      DEFAULT_LANGUAGE_CODE,
    );
    if (fallback && fallback.status === "published") {
      return fallback.displayName;
    }
  }
  // Last resort: the canonical (governance-authored, not localized) name —
  // never a blank label, never a raw internal key/id.
  return node.canonicalName;
}

function resolveRequestedLanguage(languageCode: string | undefined): LanguageCode {
  if (languageCode && isSupportedLanguageCode(languageCode)) return languageCode;
  return DEFAULT_LANGUAGE_CODE;
}

async function toOptionDto(
  db: Firestore,
  node: KnowledgeNode,
  languageCode: LanguageCode,
): Promise<CommerceKnowledgeOptionDto> {
  const displayLabel = await resolveDisplayLabel(db, node, languageCode);
  return {
    id: node.id,
    displayLabel,
    nodeType: node.nodeType as "business_category" | "business_type",
    parentId: node.nodeType === "business_type" ? (node.parentId ?? undefined) : undefined,
  };
}

/** Phase H: every `active` `business_category` node, eligible for a NEW Business reference. */
export async function listBusinessCategories(
  db: Firestore,
  languageCode?: string,
): Promise<CommerceKnowledgeOptionDto[]> {
  const resolvedLanguage = resolveRequestedLanguage(languageCode);
  const nodes = await listActiveSelectableNodes(db, "business_category");
  const dtos: CommerceKnowledgeOptionDto[] = [];
  for (const node of nodes) {
    dtos.push(await toOptionDto(db, node, resolvedLanguage));
  }
  return dtos;
}

/**
 * Phase I: every `active` `business_type` node whose `parentId` equals
 * `categoryId` — but only once `categoryId` itself is validated as an
 * existing, `active` `business_category` (never trusting a caller-supplied
 * id blindly — mirrors `businessClassificationValidation.ts`'s own
 * eligibility check). An empty result for a valid Category is a normal,
 * supported outcome (most Categories currently govern zero Business Types,
 * §13) — never treated as an error.
 */
export async function listBusinessTypesForCategory(
  db: Firestore,
  categoryId: string,
  languageCode?: string,
): Promise<CommerceKnowledgeOptionDto[]> {
  const resolvedLanguage = resolveRequestedLanguage(languageCode);

  const category = await getKnowledgeNodeById(db, categoryId);
  if (!category || category.nodeType !== "business_category" || category.status !== "active") {
    throw businessCategoryNotFoundForTypeListingError(categoryId);
  }

  const nodes = await listActiveSelectableNodes(db, "business_type", categoryId);
  const dtos: CommerceKnowledgeOptionDto[] = [];
  for (const node of nodes) {
    dtos.push(await toOptionDto(db, node, resolvedLanguage));
  }
  return dtos;
}
