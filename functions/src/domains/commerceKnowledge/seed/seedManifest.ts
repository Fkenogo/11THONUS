/**
 * Commerce Knowledge seed-manifest contract (`ENG-P3-001B`, design §10.3-§10.6).
 *
 * Pure model — no Firestore dependency. A manifest is a versioned,
 * checked-in, reviewable-in-source-control mapping of stable ids to node
 * content (design §10.3: "the manifest is what's stable and re-runnable,
 * not the id-generation algorithm itself"). `validateSeedManifest` is the
 * unit-testable referential-integrity check the loader runs before any
 * write (design §N: "validate the full manifest before writes where
 * practical").
 *
 * Deliberately does **not** decide translation content policy — a
 * manifest entry's `translations` may omit `fr` entirely (design §R of
 * the ENG-P3-001B task: "do not fabricate French translations if
 * authoritative translations don't exist in the repo" — see
 * `burundiPilotSeedManifest.ts`'s own header for why `fr` is omitted at
 * this launch scope).
 */

import {
  assertValidParentNodeType,
  isKnowledgeNodeType,
  type KnowledgeNodeType,
} from "../models/knowledgeNodeType";
import { invalidSeedManifestError } from "../models/commerceKnowledgeErrors";

export type SeedNodeTranslations = {
  en: string;
  fr?: string;
};

export type SeedNodeManifestEntry = {
  /** Stable, opaque, checked-in id — never regenerated across seed runs (design §10.3). */
  id: string;
  nodeType: KnowledgeNodeType;
  /** Must be `null` (root) or another entry's `id` within the same manifest. */
  parentId: string | null;
  canonicalName: string;
  slug: string;
  translations: SeedNodeTranslations;
  searchTerms?: string[];
  /** Traceability: exact governing source citation for this entry — required, never left blank (design §L: "trace it to governing source material"). */
  sourceRef: string;
};

export type CommerceKnowledgeSeedManifest = {
  /** A version marker for this manifest — used by the loader's bootstrap-only gate (design §10.5). */
  manifestVersion: string;
  nodes: readonly SeedNodeManifestEntry[];
};

/**
 * Referential-integrity validation only (design §22 "Unit (seed manifest)"
 * row) — does not touch Firestore. Throws on the first violation found;
 * the loader (design §N) calls this before any write is attempted.
 */
export function validateSeedManifest(manifest: CommerceKnowledgeSeedManifest): void {
  const idsSeen = new Set<string>();
  const slugByType = new Map<KnowledgeNodeType, Set<string>>();

  for (const entry of manifest.nodes) {
    if (entry.id.trim().length === 0) {
      throw invalidSeedManifestError("a manifest entry has a blank id");
    }
    // Review Phase N: a Firestore document id may not contain "/" — that
    // is a path separator, not a valid id character. Without this check,
    // an id like this would pass manifest validation and only fail later,
    // at Firestore write time inside 001A's `createKnowledgeNode`
    // (`requireNoPathSeparator`), after any earlier manifest entries had
    // already been committed by the loader (design §N: "validate the full
    // manifest before writes where practical" — this closes that gap).
    if (entry.id.includes("/")) {
      throw invalidSeedManifestError(
        `entry "${entry.id}" has an id containing a Firestore path separator ("/")`,
      );
    }
    if (idsSeen.has(entry.id)) {
      throw invalidSeedManifestError(`duplicate manifest id "${entry.id}"`);
    }
    idsSeen.add(entry.id);

    if (!isKnowledgeNodeType(entry.nodeType)) {
      throw invalidSeedManifestError(`entry "${entry.id}" has an invalid nodeType`);
    }

    if (entry.canonicalName.trim().length === 0) {
      throw invalidSeedManifestError(`entry "${entry.id}" has a blank canonicalName`);
    }
    if (entry.slug.trim().length === 0) {
      throw invalidSeedManifestError(`entry "${entry.id}" has a blank slug`);
    }
    if (entry.translations.en.trim().length === 0) {
      throw invalidSeedManifestError(`entry "${entry.id}" is missing a required EN translation`);
    }
    if (entry.sourceRef.trim().length === 0) {
      throw invalidSeedManifestError(`entry "${entry.id}" is missing a sourceRef citation`);
    }

    const slugSet = slugByType.get(entry.nodeType) ?? new Set<string>();
    if (slugSet.has(entry.slug)) {
      throw invalidSeedManifestError(
        `duplicate slug "${entry.slug}" within nodeType "${entry.nodeType}"`,
      );
    }
    slugSet.add(entry.slug);
    slugByType.set(entry.nodeType, slugSet);
  }

  // Second pass: every non-null parentId resolves to another manifest
  // entry, with a compatible nodeType, and the parent chain reaches a
  // root within a bound (dangling reference / manifest-internal cycle
  // detection — mirrors the repository's own bounded traversal guard).
  const byId = new Map(manifest.nodes.map((entry) => [entry.id, entry] as const));
  for (const entry of manifest.nodes) {
    if (entry.parentId === null) {
      assertValidParentNodeType(entry.nodeType, null);
      continue;
    }
    const parent = byId.get(entry.parentId);
    if (!parent) {
      throw invalidSeedManifestError(
        `entry "${entry.id}" has a dangling parentId "${entry.parentId}" — no such manifest entry`,
      );
    }
    assertValidParentNodeType(entry.nodeType, parent.nodeType);

    let currentId: string | null = parent.parentId;
    let steps = 0;
    while (currentId !== null) {
      if (currentId === entry.id) {
        throw invalidSeedManifestError(`manifest entry "${entry.id}" forms a hierarchy cycle`);
      }
      steps += 1;
      if (steps > manifest.nodes.length) {
        throw invalidSeedManifestError(
          `manifest entry "${entry.id}" ancestor chain exceeds manifest size — likely a cycle`,
        );
      }
      const next: SeedNodeManifestEntry | undefined = byId.get(currentId);
      if (!next) {
        throw invalidSeedManifestError(
          `entry "${entry.id}" has an ancestor chain referencing missing id "${currentId}"`,
        );
      }
      currentId = next.parentId;
    }
  }
}

/**
 * Design §P "preserve hierarchy dependency order": returns manifest
 * entries ordered so every entry appears strictly after its `parentId`
 * entry (a topological sort by hierarchy depth), computed rather than
 * trusting the authored array order. Callers must run
 * `validateSeedManifest` first — this function assumes no dangling
 * reference/cycle (both already rejected there) and will throw if that
 * invariant is violated (defensive, should be unreachable post-validation).
 */
export function topologicallySortSeedManifest(
  manifest: CommerceKnowledgeSeedManifest,
): SeedNodeManifestEntry[] {
  const byId = new Map(manifest.nodes.map((entry) => [entry.id, entry] as const));
  const depthCache = new Map<string, number>();

  function depthOf(entry: SeedNodeManifestEntry): number {
    const cached = depthCache.get(entry.id);
    if (cached !== undefined) return cached;
    if (entry.parentId === null) {
      depthCache.set(entry.id, 0);
      return 0;
    }
    const parent = byId.get(entry.parentId);
    if (!parent) {
      throw invalidSeedManifestError(
        `entry "${entry.id}" references missing parent "${entry.parentId}" during sort`,
      );
    }
    const depth = depthOf(parent) + 1;
    depthCache.set(entry.id, depth);
    return depth;
  }

  return [...manifest.nodes].sort((a, b) => depthOf(a) - depthOf(b));
}
