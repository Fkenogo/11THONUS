/**
 * `knowledgeTranslations` persistence (`ENG-P3-001B`, design §20-§21, §F).
 *
 * Composite `(entityType, entityId, languageCode)` uniqueness is enforced
 * by construction — `001A`'s `createKnowledgeTranslation` always produces
 * the deterministic id `{entityType}_{entityId}_{languageCode}`, so a
 * `.doc(id).create()`-style write can never collide two different tuples.
 * The explicit existence check below is the fail-closed backstop for the
 * one case construction alone cannot prevent: a caller successfully
 * re-creating over an already-existing translation document outside the
 * intended update path.
 */

import type { Firestore } from "firebase-admin/firestore";
import {
  createKnowledgeTranslation,
  transitionKnowledgeTranslationStatus,
  type CreateKnowledgeTranslationParams,
  type KnowledgeTranslation,
} from "../models/knowledgeTranslation";
import type { TranslationLifecycleStatus } from "../models/translationLifecycle";
import {
  fromKnowledgeTranslationDocument,
  toKnowledgeTranslationDocumentFields,
} from "../models/knowledgeTranslationDocument";
import {
  duplicateTranslationTupleError,
  knowledgeTranslationNotFoundError,
} from "../models/commerceKnowledgeErrors";

export const KNOWLEDGE_TRANSLATIONS_COLLECTION = "knowledgeTranslations";

function stripUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key of Object.keys(value) as Array<keyof T>) {
    if (value[key] !== undefined) {
      result[key] = value[key];
    }
  }
  return result;
}

/**
 * Creates a new `KnowledgeTranslation`. Fails closed
 * (`VALIDATION_FAILED`/`duplicateTranslationTupleError`) if the
 * deterministic `(entityType, entityId, languageCode)` id already exists —
 * callers that want to change an existing translation must use
 * `transitionKnowledgeTranslationStatusPersisted`, never re-create.
 */
export async function createKnowledgeTranslationPersisted(
  db: Firestore,
  params: CreateKnowledgeTranslationParams,
): Promise<KnowledgeTranslation> {
  const translation = createKnowledgeTranslation(params);
  const ref = db.collection(KNOWLEDGE_TRANSLATIONS_COLLECTION).doc(translation.id);

  return db.runTransaction(async (transaction) => {
    const existing = await transaction.get(ref);
    if (existing.exists) {
      throw duplicateTranslationTupleError(
        translation.entityType,
        translation.entityId,
        translation.languageCode,
      );
    }
    transaction.set(ref, stripUndefined(toKnowledgeTranslationDocumentFields(translation)));
    return translation;
  });
}

export async function getKnowledgeTranslationById(
  db: Firestore,
  id: string,
): Promise<KnowledgeTranslation | null> {
  const snapshot = await db.collection(KNOWLEDGE_TRANSLATIONS_COLLECTION).doc(id).get();
  if (!snapshot.exists) return null;
  return fromKnowledgeTranslationDocument(id, snapshot.data());
}

/**
 * Deterministic-id lookup by tuple — no query index needed, matches
 * `001A`'s own id construction (design §7.2/§F).
 */
export async function getKnowledgeTranslationByTuple(
  db: Firestore,
  entityType: "knowledge_node" | "knowledge_tag",
  entityId: string,
  languageCode: string,
): Promise<KnowledgeTranslation | null> {
  return getKnowledgeTranslationById(db, `${entityType}_${entityId}_${languageCode}`);
}

export type TransitionKnowledgeTranslationStatusPersistedParams = {
  updatedAt: Date;
  reviewedBy?: string;
};

export async function transitionKnowledgeTranslationStatusPersisted(
  db: Firestore,
  id: string,
  toStatus: TranslationLifecycleStatus,
  params: TransitionKnowledgeTranslationStatusPersistedParams,
): Promise<KnowledgeTranslation> {
  const ref = db.collection(KNOWLEDGE_TRANSLATIONS_COLLECTION).doc(id);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) {
      throw knowledgeTranslationNotFoundError(id);
    }
    const translation = fromKnowledgeTranslationDocument(id, snapshot.data());
    if (!translation) {
      throw knowledgeTranslationNotFoundError(id);
    }
    const { translation: updated } = transitionKnowledgeTranslationStatus(
      translation,
      toStatus,
      params,
    );
    transaction.set(ref, stripUndefined(toKnowledgeTranslationDocumentFields(updated)));
    return updated;
  });
}

export async function listKnowledgeTranslationsForEntity(
  db: Firestore,
  entityType: "knowledge_node" | "knowledge_tag",
  entityId: string,
): Promise<KnowledgeTranslation[]> {
  const snapshot = await db
    .collection(KNOWLEDGE_TRANSLATIONS_COLLECTION)
    .where("entityType", "==", entityType)
    .where("entityId", "==", entityId)
    .get();
  const translations: KnowledgeTranslation[] = [];
  for (const doc of snapshot.docs) {
    const translation = fromKnowledgeTranslationDocument(doc.id, doc.data());
    if (translation) translations.push(translation);
  }
  return translations;
}
