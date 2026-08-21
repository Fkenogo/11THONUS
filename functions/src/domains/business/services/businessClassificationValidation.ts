/**
 * Business classification reference validation (`ENG-P3-001C`, design
 * `ENG-P3-001-DESIGN-001` §G/§H).
 *
 * The single integration point where a Business write consumes the
 * authoritative Commerce Knowledge repository read-only (Phase L: no new
 * permission, no authority-domain change — this is data-integrity
 * validation layered on top of the existing Business create/update
 * authority, not a separate gate). Business stores only the two id-string
 * references (`primaryCategoryId`/`businessTypeId`, Phase M) — nothing here
 * copies a `KnowledgeNode` document into a Business collection or adds a
 * `businessId` to `KnowledgeNode`.
 *
 * Always takes the caller's own `Transaction` (never opens one itself) so
 * every read here participates in the exact same atomic boundary as the
 * Business document write it is guarding — the TOCTOU argument (Phase O)
 * this design relies on: a Commerce Knowledge node's `status` cannot change
 * out from under a validated write, because both the read and the Business
 * write commit or abort together as one Firestore transaction.
 *
 * New-reference eligibility only (`isEligibleForNewReference` — active
 * only). This module is never used to re-validate an already-persisted
 * Business's classification (Phase I: existing references follow
 * `isResolvableForExistingReference` semantics instead, and no caller here
 * exercises that path — a previously-valid category later retiring does not
 * retroactively invalidate an existing Business).
 */

import type { Firestore, Transaction } from "firebase-admin/firestore";
import { getKnowledgeNodeInTransaction } from "../../commerceKnowledge/repositories/knowledgeNodeRepository";
import { isEligibleForNewReference } from "../../commerceKnowledge/models/referenceEligibility";
import {
  businessTypeCategoryMismatchError,
  businessTypeInvalidTypeError,
  businessTypeNotEligibleError,
  businessTypeNotFoundError,
  primaryCategoryInvalidTypeError,
  primaryCategoryNotEligibleError,
  primaryCategoryNotFoundError,
} from "../models/businessErrors";

export type BusinessClassificationReferenceInput = {
  primaryCategoryId: string;
  /** Optional (Phase F: most seeded Business Categories have no governed Business Type children at all — this must remain usable on its own). */
  businessTypeId?: string;
};

/**
 * Validates `primaryCategoryId` (always required) and, if present,
 * `businessTypeId` — including that the resolved Business Type actually
 * descends from the resolved Business Category in the authoritative
 * persisted hierarchy (`businessType.parentId === primaryCategoryId`, read
 * directly rather than inferred from naming — Phase E). Throws a
 * `BusinessDomainError` (existing closed taxonomy, Phase K) on any
 * violation; resolves with no return value on success. Never mutates
 * anything — read-only against Commerce Knowledge (Phase L).
 */
export async function validateBusinessClassificationReferences(
  transaction: Transaction,
  db: Firestore,
  input: BusinessClassificationReferenceInput,
): Promise<void> {
  const category = await getKnowledgeNodeInTransaction(transaction, db, input.primaryCategoryId);
  if (!category) {
    throw primaryCategoryNotFoundError(input.primaryCategoryId);
  }
  if (category.nodeType !== "business_category") {
    throw primaryCategoryInvalidTypeError(input.primaryCategoryId);
  }
  if (!isEligibleForNewReference(category.status)) {
    throw primaryCategoryNotEligibleError(input.primaryCategoryId);
  }

  if (input.businessTypeId === undefined) {
    return;
  }

  const businessType = await getKnowledgeNodeInTransaction(transaction, db, input.businessTypeId);
  if (!businessType) {
    throw businessTypeNotFoundError(input.businessTypeId);
  }
  if (businessType.nodeType !== "business_type") {
    throw businessTypeInvalidTypeError(input.businessTypeId);
  }
  if (!isEligibleForNewReference(businessType.status)) {
    throw businessTypeNotEligibleError(input.businessTypeId);
  }
  if (businessType.parentId !== input.primaryCategoryId) {
    throw businessTypeCategoryMismatchError(input.businessTypeId, input.primaryCategoryId);
  }
}
