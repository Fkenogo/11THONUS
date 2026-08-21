/**
 * Canonical Commerce Knowledge content lifecycle (`ENG-P3-001A`).
 *
 * The single, shared status vocabulary `KnowledgeNode.status` and
 * `KnowledgeTag.status` both use — `DEC-DATA-005`, RESOLVED (Engineering
 * Lead, 2026-08-20), recorded in `decision-register.md` and disposed in
 * full at `ENG-P3-001-DESIGN-001` §9.4. This is deliberately a *different*,
 * separate enum from `translationLifecycle.ts` — the two model materially
 * different questions (is this canonical entry currently the live truth,
 * vs. is this specific language's rendering of it trustworthy) and were
 * found, not assumed, to require separate vocabularies (design §9.3).
 *
 * `archived` is the only terminal state — no transition out. Any
 * correction to retired/archived content is made by creating a new node
 * (forward-chained via `replacementNodeId`), never by reversing this
 * document's own lifecycle state (design §9.4 "Terminal-state
 * reversibility").
 */

export const KNOWLEDGE_LIFECYCLE_STATUSES = [
  "draft",
  "in_review",
  "active",
  "retired",
  "archived",
] as const;

export type KnowledgeLifecycleStatus = (typeof KNOWLEDGE_LIFECYCLE_STATUSES)[number];

export function isKnowledgeLifecycleStatus(value: string): value is KnowledgeLifecycleStatus {
  return (KNOWLEDGE_LIFECYCLE_STATUSES as readonly string[]).includes(value);
}

const PERMITTED_TRANSITIONS: Record<KnowledgeLifecycleStatus, readonly KnowledgeLifecycleStatus[]> =
  {
    draft: ["in_review"],
    in_review: ["active", "draft"],
    active: ["retired"],
    retired: ["archived"],
    archived: [],
  };

export function isValidKnowledgeLifecycleTransition(
  from: KnowledgeLifecycleStatus,
  to: KnowledgeLifecycleStatus,
): boolean {
  return PERMITTED_TRANSITIONS[from].includes(to);
}

export function isTerminalKnowledgeLifecycleStatus(status: KnowledgeLifecycleStatus): boolean {
  return PERMITTED_TRANSITIONS[status].length === 0;
}
