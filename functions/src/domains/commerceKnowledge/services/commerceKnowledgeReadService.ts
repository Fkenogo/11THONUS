/**
 * Commerce Knowledge Category/Business-Type read transport (`ENG-P3-002A`,
 * design §13/§14/§17/ED-P3-002-6), extended by `PLATFORM-BASELINE-008`
 * with the Reward Program qualifying-node selector reads.
 *
 * The minimum server-mediated read transport for selectable Business
 * Categories/Types (task Phase H/I/J) and, as of `PLATFORM-BASELINE-008`,
 * Reward Program qualifying nodes. Returns only nodes eligible for a
 * NEW reference — `status == "active"` — never `draft`/`in_review`/
 * `retired`/`archived` (Phase H; same rule `isEligibleForNewReference`
 * already enforces at write time in
 * `rewardProgram/services/rewardProgramKnowledgeValidation.ts`). Not a
 * search engine (`DEC-TECH-008` remains non-blocking, §13): every
 * operation here is a plain, bounded, equality-filtered list read.
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
import type { KnowledgeLifecycleStatus } from "../models/knowledgeLifecycle";
import { isResolvableForExistingReference } from "../models/referenceEligibility";
import {
  businessCategoryNotFoundForTypeListingError,
  businessTypeNotFoundForNodeListingError,
  rewardProgramCategoryNotFoundForNodeListingError,
} from "../models/commerceKnowledgeErrors";

/** §14's bounded Commerce Knowledge option DTO — never `schemaVersion`, editorial state, audit/replacement metadata. */
export type CommerceKnowledgeOptionDto = {
  id: string;
  displayLabel: string;
  nodeType:
    | "business_category"
    | "business_type"
    | "reward_program_category"
    | "standard_product"
    | "standard_service";
  parentId?: string;
};

/**
 * `PLATFORM-BASELINE-008`: a display-only resolution of a Commerce
 * Knowledge node's current label, for a canonical id a caller already
 * holds (e.g. a Qualifying Item's optional classification mapping, or a
 * Reward Program version's frozen `knowledgeNodeIdAtVersion` snapshot).
 * Unlike `CommerceKnowledgeOptionDto`, this is deliberately NOT restricted
 * to `active` nodes — its purpose is hydrating an EXISTING reference for
 * display (mirrors `isResolvableForExistingReference`'s "retirement never
 * breaks an existing reference" rule), never selecting a NEW one.
 * `status: null`/`displayLabel: null` together mean "no such node exists"
 * — the caller must preserve the canonical id it already has regardless
 * (Commerce Knowledge nodes are never deleted, DAP-010, so this should be
 * rare in practice, but the transport handles it explicitly rather than
 * assuming it cannot happen).
 */
export type KnowledgeNodeLabelDto = {
  id: string;
  displayLabel: string | null;
  status: KnowledgeLifecycleStatus | null;
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

/** `PLATFORM-BASELINE-008`: node types whose DTO carries a `parentId` — every non-root type this transport exposes. */
const CHILD_NODE_TYPES: readonly string[] = [
  "business_type",
  "reward_program_category",
  "standard_product",
  "standard_service",
];

async function toOptionDto(
  db: Firestore,
  node: KnowledgeNode,
  languageCode: LanguageCode,
): Promise<CommerceKnowledgeOptionDto> {
  const displayLabel = await resolveDisplayLabel(db, node, languageCode);
  return {
    id: node.id,
    displayLabel,
    nodeType: node.nodeType as CommerceKnowledgeOptionDto["nodeType"],
    parentId: CHILD_NODE_TYPES.includes(node.nodeType) ? (node.parentId ?? undefined) : undefined,
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

/**
 * `PLATFORM-BASELINE-008`: every `active` `reward_program_category` node —
 * the Reward Program create-form category selector's candidate list.
 * Mirrors `listBusinessCategories` exactly, one node type over. Reward
 * Program category is set once at creation and is not draft-editable
 * (`RewardProgramDraftFieldsRequest` carries no `rewardProgramCategoryId`
 * field, `rewardProgram.ts`), so this read is only ever needed by the
 * create form — an existing draft/program already carries its own fixed
 * category id and reads its qualifying-node candidates directly via
 * `listQualifyingNodesForCategory` below.
 */
export async function listRewardProgramCategories(
  db: Firestore,
  languageCode?: string,
): Promise<CommerceKnowledgeOptionDto[]> {
  const resolvedLanguage = resolveRequestedLanguage(languageCode);
  const nodes = await listActiveSelectableNodes(db, "reward_program_category");
  const dtos: CommerceKnowledgeOptionDto[] = [];
  for (const node of nodes) {
    dtos.push(await toOptionDto(db, node, resolvedLanguage));
  }
  return dtos;
}

/**
 * `PLATFORM-BASELINE-008`: every `active` `standard_product`/
 * `standard_service` node whose `parentId` equals `categoryId` — the
 * Reward Program qualifying-node selector's candidate list. Mirrors
 * `listBusinessTypesForCategory` exactly, one level lower in the fixed
 * Commerce Knowledge hierarchy (`reward_program_category` ->
 * `{standard_product, standard_service}`, `knowledgeNodeType.ts`'s
 * `ALLOWED_PARENT_TYPE`) and across the two sibling types a qualifying
 * node may be (`rewardProgramKnowledgeValidation.ts`'s
 * `QUALIFYING_NODE_TYPES`). `categoryId` is independently re-validated
 * server-side (existing, `active`, actually a `reward_program_category`)
 * — never trusted merely because a caller supplied it. An empty result
 * for a valid category is a normal, supported outcome (current Commerce
 * Knowledge seed content has no `reward_program_category`/
 * `standard_product`/`standard_service` nodes at all — see
 * `burundiPilotSeedManifest.ts`'s own disclosed Item 4/5 gap) — never
 * treated as an error, surfaced to the UI as an explicit empty state.
 */
export async function listQualifyingNodesForCategory(
  db: Firestore,
  categoryId: string,
  languageCode?: string,
): Promise<CommerceKnowledgeOptionDto[]> {
  const resolvedLanguage = resolveRequestedLanguage(languageCode);

  const category = await getKnowledgeNodeById(db, categoryId);
  if (
    !category ||
    category.nodeType !== "reward_program_category" ||
    category.status !== "active"
  ) {
    throw rewardProgramCategoryNotFoundForNodeListingError(categoryId);
  }

  const [products, services] = await Promise.all([
    listActiveSelectableNodes(db, "standard_product", categoryId),
    listActiveSelectableNodes(db, "standard_service", categoryId),
  ]);

  const dtos: CommerceKnowledgeOptionDto[] = [];
  for (const node of [...products, ...services]) {
    dtos.push(await toOptionDto(db, node, resolvedLanguage));
  }
  return dtos;
}

/**
 * `PLATFORM-BASELINE-010B` (Founder decision `DEC-LOY-014` /
 * `FD-REWARD-QUALIFICATION-001`): the Reward Program qualifying-node
 * selector's DEFAULT discovery scope — every `active`
 * `standard_product`/`standard_service` node reachable from the
 * Business's own `businessTypeId`, via a two-hop traversal reusing
 * `listActiveSelectableNodes` exactly as `listBusinessTypesForCategory`/
 * `listQualifyingNodesForCategory` already do (`business_type` ->
 * `reward_program_category` -> `{standard_product, standard_service}`,
 * the fixed Commerce Knowledge hierarchy adjacency in
 * `knowledgeNodeType.ts`).
 *
 * This is a DEFAULT discovery convenience only, never a write-time
 * restriction: `businessTypeId` narrows what is shown here, but the
 * qualifying-node write-time validation
 * (`rewardProgramKnowledgeValidation.ts`'s `validateQualifyingNodes`) has
 * and enforces no Business-Type scoping at all — an eligible canonical
 * node outside this default scope remains selectable via
 * `searchQualifyingNodes` below and is accepted identically at write
 * time. An empty result for a valid, active Business Type with no
 * governed `reward_program_category`/`standard_product`/
 * `standard_service` content underneath it is a normal, supported outcome
 * (mirrors `listQualifyingNodesForCategory`'s own disclosed empty-result
 * precedent), never treated as an error.
 */
export async function listQualifyingNodesForBusinessType(
  db: Firestore,
  businessTypeId: string,
  languageCode?: string,
): Promise<CommerceKnowledgeOptionDto[]> {
  const resolvedLanguage = resolveRequestedLanguage(languageCode);

  const businessType = await getKnowledgeNodeById(db, businessTypeId);
  if (
    !businessType ||
    businessType.nodeType !== "business_type" ||
    businessType.status !== "active"
  ) {
    throw businessTypeNotFoundForNodeListingError(businessTypeId);
  }

  const categories = await listActiveSelectableNodes(db, "reward_program_category", businessTypeId);

  const productLists = await Promise.all(
    categories.map((category) =>
      Promise.all([
        listActiveSelectableNodes(db, "standard_product", category.id),
        listActiveSelectableNodes(db, "standard_service", category.id),
      ]),
    ),
  );

  const flattened = productLists.flatMap(([products, services]) => [...products, ...services]);

  const dtos: CommerceKnowledgeOptionDto[] = [];
  for (const node of flattened) {
    dtos.push(await toOptionDto(db, node, resolvedLanguage));
  }
  return dtos;
}

/**
 * `PLATFORM-BASELINE-010B` (Founder decision `DEC-LOY-014` /
 * `FD-REWARD-QUALIFICATION-001`), bounded by
 * `PLATFORM-BASELINE-010B-CORR-001` (P2, independent review finding
 * `PLATFORM-BASELINE-010B-ITR-001`): the qualifying-node selector's
 * broader "escape hatch" — every `active` `standard_product`/
 * `standard_service` node PLATFORM-WIDE (no `parentId`/Business-Type
 * restriction at all, up to `MAX_SEARCH_CANDIDATE_NODES_PER_TYPE` of
 * each), filtered by a simple case-insensitive substring match on the
 * resolved display label. This is what makes a canonical node outside a
 * Business's own default `listQualifyingNodesForBusinessType` scope
 * actually reachable and selectable — the Founder decision explicitly
 * requires this to remain possible, never gated behind Business Type.
 * Not a search engine (`DEC-TECH-008` remains non-blocking, mirrors this
 * file's existing precedent) — a plain, bounded, in-memory substring
 * filter over a bounded `active` candidate set, resolved via the same
 * `resolveDisplayLabel` EN/FR fallback every other read here uses (now
 * resolved concurrently, not serially -- the candidate set is itself
 * bounded, so parallel resolution is bounded too).
 *
 * A `searchText` trimmed to fewer than `MIN_SEARCH_TEXT_LENGTH` characters
 * (including empty/whitespace-only) performs NO Firestore read at all and
 * returns `[]` immediately -- the previous "empty input returns
 * everything" behavior was itself the unbounded platform-wide scan this
 * correction removes. The selector's default Business-Type-scoped list
 * (`listQualifyingNodesForBusinessType`) already covers "nothing typed
 * yet". The response itself is capped at `MAX_SEARCH_RESULTS`.
 *
 * `MAX_SEARCH_CANDIDATE_NODES_PER_TYPE` is a disclosed, accepted
 * limitation, not a hidden one: with more `active` nodes of a given type
 * than this bound, a match outside this call's candidate page is not
 * found by THIS call -- true unbounded platform-wide full-text search
 * (e.g. a denormalized per-token search index) is a larger architecture
 * change than this correction's scope (`DEC-TECH-008` remains
 * non-blocking). Current Commerce Knowledge seed content has zero
 * `standard_product`/`standard_service` nodes at all (§17's disclosed
 * gap), so this bound has no effect on any content that exists today.
 */
const MIN_SEARCH_TEXT_LENGTH = 2;
const MAX_SEARCH_CANDIDATE_NODES_PER_TYPE = 200;
const MAX_SEARCH_RESULTS = 25;

export async function searchQualifyingNodes(
  db: Firestore,
  searchText: string,
  languageCode?: string,
): Promise<CommerceKnowledgeOptionDto[]> {
  const trimmed = searchText.trim().toLowerCase();
  if (trimmed.length < MIN_SEARCH_TEXT_LENGTH) return [];

  const resolvedLanguage = resolveRequestedLanguage(languageCode);
  const [products, services] = await Promise.all([
    listActiveSelectableNodes(
      db,
      "standard_product",
      undefined,
      MAX_SEARCH_CANDIDATE_NODES_PER_TYPE,
    ),
    listActiveSelectableNodes(
      db,
      "standard_service",
      undefined,
      MAX_SEARCH_CANDIDATE_NODES_PER_TYPE,
    ),
  ]);

  const dtos = await Promise.all(
    [...products, ...services].map((node) => toOptionDto(db, node, resolvedLanguage)),
  );

  return dtos
    .filter((dto) => dto.displayLabel.toLowerCase().includes(trimmed))
    .slice(0, MAX_SEARCH_RESULTS);
}

/**
 * `PLATFORM-BASELINE-008`: display-only label resolution for a bounded
 * set of canonical Commerce Knowledge node ids a caller already holds
 * (e.g. hydrating a Qualifying Item's optional classification mapping
 * for display).
 *
 * Gated by `isResolvableForExistingReference` (`active`/`retired`/
 * `archived`), not merely "any status" — an existing reference to a
 * `retired`/`archived` node still resolves for display (retirement never
 * breaks an existing reference), so the caller's already-selected
 * canonical id is never silently dropped just because the node is no
 * longer eligible for a NEW reference. A `draft`/`in_review` node,
 * however, was **never** eligible to be referenced in the first place
 * (`isResolvableForExistingReference`'s own contract) and must not
 * resolve here either: this endpoint requires only authentication, not
 * Business membership or any Commerce-Knowledge-authoring permission, so
 * treating every status as resolvable would let any authenticated caller
 * probe an arbitrary (e.g. guessed or enumerated) node id for the
 * canonical name and lifecycle status of unpublished, governance-in-
 * progress taxonomy content — an information-disclosure gap independent
 * reviewers correctly flagged that mirrors `isEligibleForNewReference`/
 * `isResolvableForExistingReference`'s established fail-closed status
 * gate rather than inventing a new one. A `draft`/`in_review` id resolves
 * identically to a genuinely nonexistent one: `{displayLabel: null,
 * status: null}` — never the draft's real name or status.
 *
 * A truly unresolvable id (`getKnowledgeNodeById` returns `null` —
 * should not occur under DAP-010, but not assumed impossible) also
 * resolves to `{displayLabel: null, status: null}` rather than being
 * omitted from the result, so a caller can match every requested id 1:1
 * and render an explicit "can't resolve" state instead of silently
 * losing the row — this is indistinguishable from the not-yet-resolvable
 * case by design (never leaking "this id exists but is still in
 * governance review" either). Bounded to at most 100 ids per call
 * (transport-level guard against an unbounded fan-out read — no Reward
 * Program version is expected to ever approach that many qualifying
 * nodes; this is a defensive technical bound, not a product limit).
 */
export async function resolveKnowledgeNodeLabels(
  db: Firestore,
  nodeIds: readonly string[],
  languageCode?: string,
): Promise<KnowledgeNodeLabelDto[]> {
  const resolvedLanguage = resolveRequestedLanguage(languageCode);
  const uniqueIds = Array.from(new Set(nodeIds));
  const results: KnowledgeNodeLabelDto[] = [];
  for (const id of uniqueIds) {
    const node = await getKnowledgeNodeById(db, id);
    if (!node || !isResolvableForExistingReference(node.status)) {
      results.push({ id, displayLabel: null, status: null });
      continue;
    }
    results.push({
      id,
      displayLabel: await resolveDisplayLabel(db, node, resolvedLanguage),
      status: node.status,
    });
  }
  return results;
}
