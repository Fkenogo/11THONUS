/**
 * `knowledgeTags` persistence (`ENG-P3-001B`, design §20-§21, §G).
 *
 * Thin, framework-boundary wrapper around `001A`'s `knowledgeTag.ts`/
 * `knowledgeTagDocument.ts` — no hierarchy, no cycle detection (tags are
 * flat, design §7.3). Never writes the obsolete inline `translations`
 * field (`toKnowledgeTagDocumentFields` structurally cannot produce one);
 * `fromKnowledgeTagDocument` already fails closed if a raw document
 * carries one (`001A`, Review Phase H) — this repository does not weaken
 * that.
 */

import type { Firestore } from "firebase-admin/firestore";
import {
  createKnowledgeTag,
  transitionKnowledgeTagStatus,
  type CreateKnowledgeTagParams,
  type KnowledgeTag,
} from "../models/knowledgeTag";
import type { KnowledgeLifecycleStatus } from "../models/knowledgeLifecycle";
import {
  fromKnowledgeTagDocument,
  toKnowledgeTagDocumentFields,
} from "../models/knowledgeTagDocument";
import { knowledgeTagNotFoundError } from "../models/commerceKnowledgeErrors";

export const KNOWLEDGE_TAGS_COLLECTION = "knowledgeTags";

function stripUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key of Object.keys(value) as Array<keyof T>) {
    if (value[key] !== undefined) {
      result[key] = value[key];
    }
  }
  return result;
}

export async function createKnowledgeTagPersisted(
  db: Firestore,
  params: CreateKnowledgeTagParams,
): Promise<KnowledgeTag> {
  const tag = createKnowledgeTag(params);
  const ref = db.collection(KNOWLEDGE_TAGS_COLLECTION).doc(tag.id);
  await ref.set(stripUndefined(toKnowledgeTagDocumentFields(tag)));
  return tag;
}

export async function getKnowledgeTagById(db: Firestore, id: string): Promise<KnowledgeTag | null> {
  const snapshot = await db.collection(KNOWLEDGE_TAGS_COLLECTION).doc(id).get();
  if (!snapshot.exists) return null;
  return fromKnowledgeTagDocument(id, snapshot.data());
}

export async function listKnowledgeTagsByGroup(
  db: Firestore,
  tagGroup: string,
): Promise<KnowledgeTag[]> {
  const snapshot = await db
    .collection(KNOWLEDGE_TAGS_COLLECTION)
    .where("tagGroup", "==", tagGroup)
    .get();
  const tags: KnowledgeTag[] = [];
  for (const doc of snapshot.docs) {
    const tag = fromKnowledgeTagDocument(doc.id, doc.data());
    if (tag) tags.push(tag);
  }
  return tags;
}

export type TransitionKnowledgeTagStatusPersistedParams = {
  updatedAt: Date;
};

export async function transitionKnowledgeTagStatusPersisted(
  db: Firestore,
  id: string,
  toStatus: KnowledgeLifecycleStatus,
  params: TransitionKnowledgeTagStatusPersistedParams,
): Promise<KnowledgeTag> {
  const ref = db.collection(KNOWLEDGE_TAGS_COLLECTION).doc(id);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) {
      throw knowledgeTagNotFoundError(id);
    }
    const tag = fromKnowledgeTagDocument(id, snapshot.data());
    if (!tag) {
      throw knowledgeTagNotFoundError(id);
    }
    const { tag: updated } = transitionKnowledgeTagStatus(tag, toStatus, params);
    transaction.set(ref, stripUndefined(toKnowledgeTagDocumentFields(updated)));
    return updated;
  });
}
