/**
 * Adapters for `listBusinessCategories`/`listBusinessTypesForCategory`
 * (design §13/§14), extended by `PLATFORM-BASELINE-008` with the Reward
 * Program qualifying-node selector reads
 * (`listRewardProgramCategories`/`listQualifyingNodesForCategory`/
 * `resolveKnowledgeNodeLabels`).
 */

import { httpsCallable, type Functions } from "firebase/functions";
import { toCallWithActor, type AuthenticatedActor } from "./businessCallableClient";

export type CommerceKnowledgeOption = {
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

/** `PLATFORM-BASELINE-008`: display-only label resolution for an already-held canonical id — see `KnowledgeNodeLabelDto` server-side. */
export type KnowledgeNodeLabel = {
  id: string;
  displayLabel: string | null;
  status: "draft" | "in_review" | "active" | "retired" | "archived" | null;
};

export type ListBusinessCategoriesRequest = { languageCode?: string };
export type ListBusinessTypesForCategoryRequest = { categoryId: string; languageCode?: string };
export type ListQualifyingNodesForCategoryRequest = {
  categoryId: string;
  languageCode?: string;
};
/** `PLATFORM-BASELINE-010B`: the qualifying-node selector's DEFAULT discovery scope, pre-filtered to the Business's own Business Type. */
export type ListQualifyingNodesForBusinessTypeRequest = {
  businessTypeId: string;
  languageCode?: string;
};
/** `PLATFORM-BASELINE-010B`: the qualifying-node selector's broader, platform-wide "escape hatch" — no Business-Type restriction. */
export type SearchQualifyingNodesRequest = { searchText: string; languageCode?: string };
export type ResolveKnowledgeNodeLabelsRequest = { nodeIds: string[]; languageCode?: string };

type BoundCallable = (
  payload: Record<string, unknown>,
) => Promise<{ data: CommerceKnowledgeOption[] }>;

export function toCallListBusinessCategories(
  callable: BoundCallable,
): (
  actor: AuthenticatedActor,
  payload: ListBusinessCategoriesRequest,
) => Promise<CommerceKnowledgeOption[]> {
  return toCallWithActor<ListBusinessCategoriesRequest, CommerceKnowledgeOption[]>(callable);
}

export function makeCallListBusinessCategories(
  functions: Functions,
): (
  actor: AuthenticatedActor,
  payload: ListBusinessCategoriesRequest,
) => Promise<CommerceKnowledgeOption[]> {
  return toCallListBusinessCategories(httpsCallable(functions, "listBusinessCategories"));
}

export function toCallListBusinessTypesForCategory(
  callable: BoundCallable,
): (
  actor: AuthenticatedActor,
  payload: ListBusinessTypesForCategoryRequest,
) => Promise<CommerceKnowledgeOption[]> {
  return toCallWithActor<ListBusinessTypesForCategoryRequest, CommerceKnowledgeOption[]>(callable);
}

export function makeCallListBusinessTypesForCategory(
  functions: Functions,
): (
  actor: AuthenticatedActor,
  payload: ListBusinessTypesForCategoryRequest,
) => Promise<CommerceKnowledgeOption[]> {
  return toCallListBusinessTypesForCategory(
    httpsCallable(functions, "listBusinessTypesForCategory"),
  );
}

export function toCallListRewardProgramCategories(
  callable: BoundCallable,
): (
  actor: AuthenticatedActor,
  payload: ListBusinessCategoriesRequest,
) => Promise<CommerceKnowledgeOption[]> {
  return toCallWithActor<ListBusinessCategoriesRequest, CommerceKnowledgeOption[]>(callable);
}

export function makeCallListRewardProgramCategories(
  functions: Functions,
): (
  actor: AuthenticatedActor,
  payload: ListBusinessCategoriesRequest,
) => Promise<CommerceKnowledgeOption[]> {
  return toCallListRewardProgramCategories(httpsCallable(functions, "listRewardProgramCategories"));
}

export function toCallListQualifyingNodesForCategory(
  callable: BoundCallable,
): (
  actor: AuthenticatedActor,
  payload: ListQualifyingNodesForCategoryRequest,
) => Promise<CommerceKnowledgeOption[]> {
  return toCallWithActor<ListQualifyingNodesForCategoryRequest, CommerceKnowledgeOption[]>(
    callable,
  );
}

export function makeCallListQualifyingNodesForCategory(
  functions: Functions,
): (
  actor: AuthenticatedActor,
  payload: ListQualifyingNodesForCategoryRequest,
) => Promise<CommerceKnowledgeOption[]> {
  return toCallListQualifyingNodesForCategory(
    httpsCallable(functions, "listQualifyingNodesForCategory"),
  );
}

export function toCallListQualifyingNodesForBusinessType(
  callable: BoundCallable,
): (
  actor: AuthenticatedActor,
  payload: ListQualifyingNodesForBusinessTypeRequest,
) => Promise<CommerceKnowledgeOption[]> {
  return toCallWithActor<ListQualifyingNodesForBusinessTypeRequest, CommerceKnowledgeOption[]>(
    callable,
  );
}

export function makeCallListQualifyingNodesForBusinessType(
  functions: Functions,
): (
  actor: AuthenticatedActor,
  payload: ListQualifyingNodesForBusinessTypeRequest,
) => Promise<CommerceKnowledgeOption[]> {
  return toCallListQualifyingNodesForBusinessType(
    httpsCallable(functions, "listQualifyingNodesForBusinessType"),
  );
}

export function toCallSearchQualifyingNodes(
  callable: BoundCallable,
): (
  actor: AuthenticatedActor,
  payload: SearchQualifyingNodesRequest,
) => Promise<CommerceKnowledgeOption[]> {
  return toCallWithActor<SearchQualifyingNodesRequest, CommerceKnowledgeOption[]>(callable);
}

export function makeCallSearchQualifyingNodes(
  functions: Functions,
): (
  actor: AuthenticatedActor,
  payload: SearchQualifyingNodesRequest,
) => Promise<CommerceKnowledgeOption[]> {
  return toCallSearchQualifyingNodes(httpsCallable(functions, "searchQualifyingNodes"));
}

type ResolveLabelsBoundCallable = (
  payload: Record<string, unknown>,
) => Promise<{ data: KnowledgeNodeLabel[] }>;

export function toCallResolveKnowledgeNodeLabels(
  callable: ResolveLabelsBoundCallable,
): (
  actor: AuthenticatedActor,
  payload: ResolveKnowledgeNodeLabelsRequest,
) => Promise<KnowledgeNodeLabel[]> {
  return toCallWithActor<ResolveKnowledgeNodeLabelsRequest, KnowledgeNodeLabel[]>(callable);
}

export function makeCallResolveKnowledgeNodeLabels(
  functions: Functions,
): (
  actor: AuthenticatedActor,
  payload: ResolveKnowledgeNodeLabelsRequest,
) => Promise<KnowledgeNodeLabel[]> {
  return toCallResolveKnowledgeNodeLabels(httpsCallable(functions, "resolveKnowledgeNodeLabels"));
}
