/**
 * `KnowledgeTag` domain model (`ENG-P3-001A`, design §7.3).
 *
 * A governed, reusable tag (Business/Product/Customer-Interest/
 * Behaviour groups, CKS Part IX). Shares `knowledgeLifecycle.ts`'s
 * canonical content lifecycle with `KnowledgeNode` (`DEC-DATA-005`,
 * design §9.4) — both model the same "is this canonical entry currently
 * the live truth" question. Unlike `KnowledgeNode`, a tag has no
 * `replacementNodeId`/hierarchy — CKS treats tags as simpler, lower-churn
 * objects (design §7.3), so retirement here is a plain lifecycle
 * transition with no forward-reference requirement.
 *
 * Deliberately carries **no** `translations` field — TRD10 §10.7.3's
 * originally-declared inline `Record<string, string>` map is not
 * reconstructed here; per design §9.3's disposed `ENGINEERING SCHEMA
 * CLARIFICATION`, `KnowledgeTag` localization is provided entirely by
 * `knowledgeTranslation.ts`'s generalized `(entityType, entityId,
 * languageCode)` shape (`entityType: "knowledge_tag"`), never a second,
 * inconsistent inline mechanism.
 */

import {
  invalidKnowledgeTagFieldError,
  invalidKnowledgeLifecycleTransitionError,
} from "./commerceKnowledgeErrors";
import {
  isValidKnowledgeLifecycleTransition,
  type KnowledgeLifecycleStatus,
} from "./knowledgeLifecycle";

export const KNOWLEDGE_TAG_GROUPS = [
  "business_attribute",
  "product_attribute",
  "customer_interest",
  "system_behaviour",
] as const;

export type KnowledgeTagGroup = (typeof KNOWLEDGE_TAG_GROUPS)[number];

export function isKnowledgeTagGroup(value: string): value is KnowledgeTagGroup {
  return (KNOWLEDGE_TAG_GROUPS as readonly string[]).includes(value);
}

export type KnowledgeTag = {
  readonly id: string;
  tagGroup: KnowledgeTagGroup;
  canonicalName: string;
  slug: string;
  status: KnowledgeLifecycleStatus;
  searchTerms: string[];
  readonly createdAt: Date;
  updatedAt: Date;
  schemaVersion: number;
};

export type CreateKnowledgeTagParams = {
  id: string;
  tagGroup: KnowledgeTagGroup;
  canonicalName: string;
  slug: string;
  searchTerms?: string[];
  createdAt: Date;
};

function requireNonBlank(field: string, value: string): string {
  if (value.trim().length === 0) {
    throw invalidKnowledgeTagFieldError(field, value);
  }
  return value;
}

export function createKnowledgeTag(params: CreateKnowledgeTagParams): KnowledgeTag {
  const id = requireNonBlank("id", params.id);
  const canonicalName = requireNonBlank("canonicalName", params.canonicalName);
  const slug = requireNonBlank("slug", params.slug);

  if (!isKnowledgeTagGroup(params.tagGroup)) {
    throw invalidKnowledgeTagFieldError("tagGroup", params.tagGroup);
  }

  return {
    id,
    tagGroup: params.tagGroup,
    canonicalName,
    slug,
    status: "draft",
    searchTerms: params.searchTerms ?? [],
    createdAt: params.createdAt,
    updatedAt: params.createdAt,
    schemaVersion: 1,
  };
}

export type TransitionKnowledgeTagStatusParams = {
  updatedAt: Date;
};

export function transitionKnowledgeTagStatus(
  tag: KnowledgeTag,
  toStatus: KnowledgeLifecycleStatus,
  params: TransitionKnowledgeTagStatusParams,
): { tag: KnowledgeTag } {
  if (!isValidKnowledgeLifecycleTransition(tag.status, toStatus)) {
    throw invalidKnowledgeLifecycleTransitionError(tag.status, toStatus);
  }

  return {
    tag: {
      ...tag,
      status: toStatus,
      updatedAt: params.updatedAt,
    },
  };
}
