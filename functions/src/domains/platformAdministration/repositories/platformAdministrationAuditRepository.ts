/**
 * `platformAdministrationAuditRecords` persistence (`ENG-P3-003A`).
 *
 * Append-only — no update/delete function exists in this module at all
 * (the absence is the enforcement, mirroring how `identityAudit`'s
 * repositories expose no mutation of a written record either).
 */

import type { Firestore, Transaction } from "firebase-admin/firestore";
import type { PlatformAdministrationAuditRecord } from "../models/platformAdministrationAuditRecord";

export const PLATFORM_ADMINISTRATION_AUDIT_RECORDS_COLLECTION =
  "platformAdministrationAuditRecords";

function toDocumentFields(
  record: PlatformAdministrationAuditRecord,
): Omit<PlatformAdministrationAuditRecord, "id"> {
  return {
    actionType: record.actionType,
    actorReference: record.actorReference,
    targetType: record.targetType,
    targetId: record.targetId,
    outcome: record.outcome,
    ...(record.reasonCode !== undefined ? { reasonCode: record.reasonCode } : {}),
    correlationId: record.correlationId,
    occurredAt: record.occurredAt,
    schemaVersion: record.schemaVersion,
  };
}

/**
 * Write-only — takes a bare `Transaction`/`Firestore.WriteBatch`-compatible
 * writer so a caller composing this inside a larger transaction (as
 * `resolvePlatformAdministratorAuthorization.ts` does) never needs read
 * access through this seam.
 */
export function recordPlatformAdministrationAuditEntry(
  db: Firestore,
  transaction: Pick<Transaction, "set">,
  record: PlatformAdministrationAuditRecord,
): void {
  const ref = db.collection(PLATFORM_ADMINISTRATION_AUDIT_RECORDS_COLLECTION).doc(record.id);
  transaction.set(ref, toDocumentFields(record));
}
