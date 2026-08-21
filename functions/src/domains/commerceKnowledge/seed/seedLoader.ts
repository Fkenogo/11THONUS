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
  /** Entries whose persisted state already matched the governed seed end-state (`active`/`published`) — nothing was written. */
  unchanged: string[];
  /**
   * Entries that already existed with matching immutable identity but were
   * healed to the governed end-state (`active` node / `published`
   * translation) by this run — e.g. a prior run was interrupted partway
   * through a lifecycle transition. Never reported as `unchanged`: real
   * writes happened, even though no new document was created.
   */
  reconciled: string[];
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
  const reconciled: string[] = [];

  for (const entry of ordered) {
    const existing = await getKnowledgeNodeById(db, entry.id);

    let nodeReconciled = false;
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

      // Terminal/incompatible lifecycle states are never silently
      // resurrected by a seed rerun (design §9.4 "terminal states never
      // return to active") — fail closed as a seed conflict instead. No
      // governing source describes a retired/archived node bootstrapping
      // back to active via the seed path.
      if (existing.status === "retired" || existing.status === "archived") {
        throw seedContentConflictError(entry.id);
      }

      // Reconcile any legal interrupted lifecycle state up to the
      // governed seed end-state (`active`) — this is what makes an
      // interrupted prior run (design §P) safely resumable by rerunning
      // the loader, rather than requiring a separate manual repair path.
      if (existing.status === "draft") {
        await transitionKnowledgeNodeStatusPersisted(db, entry.id, "in_review", {
          updatedAt: options.now,
        });
        await transitionKnowledgeNodeStatusPersisted(db, entry.id, "active", {
          updatedAt: options.now,
        });
        nodeReconciled = true;
      } else if (existing.status === "in_review") {
        await transitionKnowledgeNodeStatusPersisted(db, entry.id, "active", {
          updatedAt: options.now,
        });
        nodeReconciled = true;
      }
      // status === "active" is already the governed end-state: no-op.
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

    const translationReconciled = await ensureEnglishTranslation(db, entry, options.now);

    if (!existing) {
      // Already recorded in `created` above — a brand-new node's
      // translation being freshly created too is not a separate
      // "reconciliation" event.
      continue;
    }
    if (nodeReconciled || translationReconciled) {
      reconciled.push(entry.id);
    } else {
      unchanged.push(entry.id);
    }
  }

  return { manifestVersion: manifest.manifestVersion, created, unchanged, reconciled };
}

/** Returns `true` if an already-existing translation needed a lifecycle transition to reach `published` (a reconciliation), `false` if it was freshly created or already at the governed end-state. */
async function ensureEnglishTranslation(
  db: Firestore,
  entry: SeedNodeManifestEntry,
  now: Date,
): Promise<boolean> {
  const existing = await getKnowledgeTranslationByTuple(db, "knowledge_node", entry.id, "en");
  if (existing) {
    if (existing.displayName !== entry.translations.en) {
      throw seedContentConflictError(existing.id);
    }

    // Reconcile any legal interrupted translation lifecycle state up to
    // the governed seed end-state (`published`) — mirrors the node-level
    // reconciliation above (design §F). There is no retired/archived
    // state on the translation lifecycle (`translationLifecycle.ts`), so
    // every non-`published` state here is a legitimately resumable one.
    if (existing.status === "draft") {
      await transitionKnowledgeTranslationStatusPersisted(db, existing.id, "reviewed", {
        updatedAt: now,
      });
      await transitionKnowledgeTranslationStatusPersisted(db, existing.id, "published", {
        updatedAt: now,
      });
      return true;
    }
    if (existing.status === "reviewed") {
      await transitionKnowledgeTranslationStatusPersisted(db, existing.id, "published", {
        updatedAt: now,
      });
      return true;
    }
    return false; // already "published" — governed end-state, true no-op.
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
  return false;
}
