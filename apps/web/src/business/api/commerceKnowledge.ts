/** Adapters for `listBusinessCategories`/`listBusinessTypesForCategory` (design §13/§14). */

import { httpsCallable, type Functions } from "firebase/functions";
import { toCallWithActor, type AuthenticatedActor } from "./businessCallableClient";

export type CommerceKnowledgeOption = {
  id: string;
  displayLabel: string;
  nodeType: "business_category" | "business_type";
  parentId?: string;
};

export type ListBusinessCategoriesRequest = { languageCode?: string };
export type ListBusinessTypesForCategoryRequest = { categoryId: string; languageCode?: string };

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
