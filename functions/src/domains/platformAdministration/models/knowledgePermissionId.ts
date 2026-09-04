/**
 * Knowledge Studio permission identifiers (`ENG-P3-003A`).
 *
 * The seven permission identifiers `ENG-P3-003-DESIGN-001` §6.2 recommends
 * (sourced from TRD18 §18.6 "Knowledge Studio" list) — Class C per the
 * design's `CORR-001` authority classification (§2A): pure naming, not
 * itself a governed product decision, contingent on the role/capability set
 * `FD-KS-1`/`DEC-GOV-011` approved. Defined as a **closed** union (unlike
 * the general Business `PermissionId`, which validates shape only) because
 * this whole platform-scoped permission space is new and fully enumerable —
 * there is no wider, partially-ungoverned Knowledge permission space the
 * way there is for Business permissions.
 */

import { invalidKnowledgePermissionIdError } from "./platformAdministrationErrors";

export const KNOWLEDGE_PERMISSION_IDS = [
  "knowledge.view",
  "knowledge.create_draft",
  "knowledge.edit_draft",
  "knowledge.approve",
  "knowledge.publish",
  "knowledge.retire",
  "knowledge.bulk_import",
] as const;

export type KnowledgePermissionId = (typeof KNOWLEDGE_PERMISSION_IDS)[number];

export function isKnowledgePermissionId(value: string): value is KnowledgePermissionId {
  return (KNOWLEDGE_PERMISSION_IDS as readonly string[]).includes(value);
}

export function createKnowledgePermissionId(value: string): KnowledgePermissionId {
  if (isKnowledgePermissionId(value)) {
    return value;
  }
  throw invalidKnowledgePermissionIdError(value);
}
