/**
 * Translation-readiness lifecycle (`ENG-P3-001A`).
 *
 * `KnowledgeTranslation.status` — separate, narrower enum from
 * `knowledgeLifecycle.ts`'s canonical content lifecycle, unchanged from
 * TRD10 §10.7.2 as already declared, confirmed correct (not unified) by
 * `DEC-DATA-005`'s disposition (`ENG-P3-001-DESIGN-001` §9.4): this models
 * a materially different question — is this specific language's
 * rendering trustworthy — scoped to one `(nodeId, languageCode)` pair,
 * independent of the underlying node's own canonicality.
 *
 * There is no terminal state distinct from `published`: a published
 * translation may still move back to `draft` on the *same* document —
 * this is a correction cycle, not a terminal-state reversal (design §9.4).
 */

export const TRANSLATION_LIFECYCLE_STATUSES = ["draft", "reviewed", "published"] as const;

export type TranslationLifecycleStatus = (typeof TRANSLATION_LIFECYCLE_STATUSES)[number];

export function isTranslationLifecycleStatus(value: string): value is TranslationLifecycleStatus {
  return (TRANSLATION_LIFECYCLE_STATUSES as readonly string[]).includes(value);
}

const PERMITTED_TRANSITIONS: Record<
  TranslationLifecycleStatus,
  readonly TranslationLifecycleStatus[]
> = {
  draft: ["reviewed"],
  reviewed: ["published", "draft"],
  published: ["draft"],
};

export function isValidTranslationLifecycleTransition(
  from: TranslationLifecycleStatus,
  to: TranslationLifecycleStatus,
): boolean {
  return PERMITTED_TRANSITIONS[from].includes(to);
}
