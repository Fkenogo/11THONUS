/**
 * Commerce Knowledge seed loader (`ENG-P3-001B`, design §10.4-§10.5/§N-§P).
 *
 * Deterministic, idempotent, explicitly-invoked administrative tool — not
 * a runtime command, never wired to any HTTPS/callable transport, never
 * run automatically on a production request path (design §N/§Q). It is a
 * plain exported async function; the only caller in this repository is
 * its own emulator test and (if ever wired up) a manually-run operational
 * script outside the request-serving path.
 *
 * Transaction/batch strategy (design §P): each manifest entry's node
 * creation, its lifecycle transitions to `active`, and its EN translation
 * creation/publication are their own small, independently-committed
 * Firestore transactions (reusing `knowledgeNodeRepository`/
 * `knowledgeTranslationRepository` as-is) — not one giant transaction
 * across the whole manifest. This is the deliberately bounded, safe MVP
 * strategy: at ~27 nodes today, a single transaction would already be
 * viable, but nothing here assumes that stays true as the manifest grows
 * (design §P: "do not assume one giant transaction is appropriate for
 * arbitrary future taxonomy sizes"). Processing strictly in
 * `topologicallySortSeedManifest` order guarantees a parent is always
 * already committed before any child creation is attempted, so a failed
 * parent validation can never leave an orphaned child persisted — and
 * because each already-created node is a no-op on rerun (idempotency
 * below), a partial failure partway through the manifest is safely
 * resumable by simply re-running the loader, never by a separate repair
 * path.
 *
 * Idempotency/conflict semantics (design §O): same id + identical
 * immutable identity (`nodeType`, `parentId`, `slug`, `canonicalName`) is
 * a safe no-op; same id + a materially different value on any of those
 * fields is a fail-closed conflict (`seedContentConflictError`) — the
 * loader never silently overwrites already-persisted canonical content.
 */

import type { Firestore } from "firebase-admin/firestore";
import {
  createKnowledgeNodePersisted,
  getKnowledgeNodeById,
  transitionKnowledgeNodeStatusPersisted,
} from "../repositories/knowledgeNodeRepository";
import {
  createKnowledgeTranslationPersisted,
  getKnowledgeTranslationByTuple,
  transitionKnowledgeTranslationStatusPersisted,
} from "../repositories/knowledgeTranslationRepository";
import { seedContentConflictError } from "../models/commerceKnowledgeErrors";
import {
  topologicallySortSeedManifest,
  validateSeedManifest,
  type CommerceKnowledgeSeedManifest,
  type SeedNodeManifestEntry,
} from "./seedManifest";

export type SeedLoaderOptions = {
  now: Date;
};

export type SeedLoaderResult = {
  manifestVersion: string;
  created: string[];
  unchanged: string[];
};

function immutableIdentityMatches(
  entry: SeedNodeManifestEntry,
  persistedParentId: string | null,
  persisted: { nodeType: string; parentId: string | null; slug: string; canonicalName: string },
): boolean {
  return (
    entry.nodeType === persisted.nodeType &&
    persistedParentId === persisted.parentId &&
    entry.slug === persisted.slug &&
    entry.canonicalName === persisted.canonicalName
  );
}

/**
 * Runs the given seed manifest against `db`. Validates the entire
 * manifest before any write is attempted (design §N). Idempotent:
 * re-running against an already-seeded environment with an unchanged
 * manifest is a no-op for every entry. Fails closed on any conflicting
 * immutable-field mismatch — never overwrites.
 */
export async function runCommerceKnowledgeSeed(
  db: Firestore,
  manifest: CommerceKnowledgeSeedManifest,
  options: SeedLoaderOptions,
): Promise<SeedLoaderResult> {
  validateSeedManifest(manifest);
  const ordered = topologicallySortSeedManifest(manifest);

  const created: string[] = [];
  const unchanged: string[] = [];

  for (const entry of ordered) {
    const existing = await getKnowledgeNodeById(db, entry.id);

    if (existing) {
      if (
        !immutableIdentityMatches(entry, entry.parentId, {
          nodeType: existing.nodeType,
          parentId: existing.parentId,
          slug: existing.slug,
          canonicalName: existing.canonicalName,
        })
      ) {
        throw seedContentConflictError(entry.id);
      }
      unchanged.push(entry.id);
    } else {
      await createKnowledgeNodePersisted(db, {
        id: entry.id,
        nodeType: entry.nodeType,
        parentId: entry.parentId,
        canonicalName: entry.canonicalName,
        slug: entry.slug,
        searchTerms: entry.searchTerms,
        createdAt: options.now,
      });
      // Design §10.2 rule 2: a seeded node's status must be "active" —
      // never left draft/in_review — so it is selectable immediately.
      await transitionKnowledgeNodeStatusPersisted(db, entry.id, "in_review", {
        updatedAt: options.now,
      });
      await transitionKnowledgeNodeStatusPersisted(db, entry.id, "active", {
        updatedAt: options.now,
      });
      created.push(entry.id);
    }

    await ensureEnglishTranslation(db, entry, options.now);
  }

  return { manifestVersion: manifest.manifestVersion, created, unchanged };
}

async function ensureEnglishTranslation(
  db: Firestore,
  entry: SeedNodeManifestEntry,
  now: Date,
): Promise<void> {
  const existing = await getKnowledgeTranslationByTuple(db, "knowledge_node", entry.id, "en");
  if (existing) {
    if (existing.displayName !== entry.translations.en) {
      throw seedContentConflictError(existing.id);
    }
    return;
  }

  const translation = await createKnowledgeTranslationPersisted(db, {
    entityType: "knowledge_node",
    entityId: entry.id,
    languageCode: "en",
    displayName: entry.translations.en,
    createdAt: now,
  });
  await transitionKnowledgeTranslationStatusPersisted(db, translation.id, "reviewed", {
    updatedAt: now,
  });
  await transitionKnowledgeTranslationStatusPersisted(db, translation.id, "published", {
    updatedAt: now,
  });
}
