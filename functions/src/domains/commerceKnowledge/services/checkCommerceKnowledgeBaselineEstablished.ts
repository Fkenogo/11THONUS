/**
 * Read-only Commerce Knowledge baseline readiness check (PLATFORM-BASELINE-001).
 *
 * Confirms the baseline taxonomy required by the platform (the governed
 * seed manifest, `ENG-P3-001B`) is present and `active` in Firestore,
 * without ever invoking the seed loader and without writing anything. The
 * manifest passed in is read purely as reference data describing the
 * governed end-state — this function never seeds, heals, or reconciles a
 * missing/partial node; that remains `runCommerceKnowledgeSeed`'s job
 * alone, invoked separately and explicitly, never implicitly by a
 * readiness check.
 */

import type { Firestore } from "firebase-admin/firestore";
import { getKnowledgeNodeById } from "../repositories/knowledgeNodeRepository";
import type { CommerceKnowledgeSeedManifest } from "../seed/seedManifest";

export async function checkCommerceKnowledgeBaselineEstablished(
  db: Firestore,
  manifest: CommerceKnowledgeSeedManifest,
): Promise<boolean> {
  for (const entry of manifest.nodes) {
    const existing = await getKnowledgeNodeById(db, entry.id);
    if (!existing || existing.status !== "active") {
      return false;
    }
  }
  return true;
}
