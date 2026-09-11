/**
 * Read-only Commerce Knowledge baseline readiness check (PLATFORM-BASELINE-001).
 *
 * Confirms the governed seed manifest's end-state (`ENG-P3-001B`,
 * `ENG-P3-001A` design §10.4-§10.6/§O) is actually established in
 * Firestore, without ever invoking the seed loader and without writing
 * anything. The manifest passed in is read purely as reference data
 * describing the governed end-state — this function never seeds, heals, or
 * reconciles a missing/partial node; that remains `runCommerceKnowledgeSeed`'s
 * job alone, invoked separately and explicitly, never implicitly by a
 * readiness check.
 *
 * For every manifest node this verifies the full end-state the seed
 * contract requires (reusing the same pure immutable-identity comparison
 * the seed loader itself uses, `seedNodeImmutableIdentityMatches`):
 *
 * - the node exists and is `active` (never `draft`/`in_review`/`retired`/
 *   `archived`);
 * - every governed immutable attribute (`nodeType`, `parentId`, `slug`,
 *   `canonicalName`) matches the manifest entry;
 * - the required EN translation exists, carries the manifest's governed
 *   `displayName`, and is `published`.
 *
 * A mismatch on any of these means the seed loader would either fail
 * closed (conflict) or perform reconciliation on a rerun, so the baseline
 * is reported not established.
 */

import type { Firestore } from "firebase-admin/firestore";
import { getKnowledgeNodeById } from "../repositories/knowledgeNodeRepository";
import { getKnowledgeTranslationByTuple } from "../repositories/knowledgeTranslationRepository";
import {
  seedNodeImmutableIdentityMatches,
  type CommerceKnowledgeSeedManifest,
} from "../seed/seedManifest";

export async function checkCommerceKnowledgeBaselineEstablished(
  db: Firestore,
  manifest: CommerceKnowledgeSeedManifest,
): Promise<boolean> {
  for (const entry of manifest.nodes) {
    const existing = await getKnowledgeNodeById(db, entry.id);
    if (!existing) {
      return false;
    }
    if (existing.status !== "active") {
      return false;
    }
    if (
      !seedNodeImmutableIdentityMatches(entry, {
        nodeType: existing.nodeType,
        parentId: existing.parentId,
        slug: existing.slug,
        canonicalName: existing.canonicalName,
      })
    ) {
      return false;
    }

    const translation = await getKnowledgeTranslationByTuple(db, "knowledge_node", entry.id, "en");
    if (!translation) {
      return false;
    }
    if (translation.displayName !== entry.translations.en) {
      return false;
    }
    if (translation.status !== "published") {
      return false;
    }
  }
  return true;
}
