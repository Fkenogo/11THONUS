/**
 * Canonical-reference eligibility contracts (`ENG-P3-001A`, design §G/§H).
 *
 * These pure predicates are the exact export surface `ENG-P3-001C` (the
 * `Business.primaryCategoryId`/`businessTypeId` live-validation addition)
 * and `ENG-P3-002` (onboarding submission validation) both consume — no
 * Business-facing validation is wired up here, only the predicate.
 *
 * F3 independent-review correction (design §9.4, applied throughout):
 * referential validity is governed **solely** by `KnowledgeNode.status`.
 * `KnowledgeTranslation.status` plays no role in whether a node may be
 * newly referenced — that is a separate, display-only concern
 * (`isDisplayAvailable`-shaped logic belongs to a future localization
 * consumer, not this module). Neither function below takes a translation
 * status parameter, by design — there is nothing to couple.
 */

import type { KnowledgeLifecycleStatus } from "./knowledgeLifecycle";

/**
 * Design §9.4/§G, "New-reference eligibility": only an `active` node may
 * be targeted by a *new* `Business.primaryCategoryId`/`businessTypeId`
 * write or a future `RewardProgramVersion.qualifyingKnowledgeNodeIds`
 * entry. `draft`, `in_review`, `retired`, and `archived` are never
 * eligible for a new reference.
 */
export function isEligibleForNewReference(status: KnowledgeLifecycleStatus): boolean {
  return status === "active";
}

/**
 * Design §9.4/§H, "Existing-reference resolution": `active` and `retired`
 * nodes both resolve normally for a reference already made (retirement
 * never breaks an existing reference). `archived` nodes still resolve
 * (DAP-010, never deleted) for historical/audit lookup. `draft`/`in_review`
 * never resolve as a valid existing reference, since they were never
 * eligible to be referenced in the first place.
 */
export function isResolvableForExistingReference(status: KnowledgeLifecycleStatus): boolean {
  return status === "active" || status === "retired" || status === "archived";
}
