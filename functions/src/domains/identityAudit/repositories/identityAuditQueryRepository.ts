/**
 * Identity audit query repository (ENG-P2-001-10).
 *
 * Bounded, read-only queries over the *existing* `outboxEntries`
 * collection (`shared/outbox/outboxWriter.ts`/`outboxProcessor.ts`) — no
 * new persistence, no second queue. Every query is server-side (Admin
 * SDK, bypasses Firestore Rules) and projects each matching document
 * through `toIdentityAuditRecord` (`../models/auditEnvelope.ts`), so a
 * caller never sees the outbox's own internal processing-state fields.
 *
 * `authority` is validated against the closed `AuditQueryAuthority` set
 * and used for nothing else here — per the brief, caller-supplied
 * authority is never proof; a future trusted application boundary is
 * responsible for verifying a real caller is entitled to the authority
 * category it declares, and for failing closed if it cannot.
 *
 * A malformed outbox document (missing/corrupt `event`) is skipped
 * rather than failing the whole query — a single corrupt record must
 * not hide the rest of a customer identity's audit history from a
 * support or security-review reader.
 *
 * `queryAuditRecordsByEventId` is this package's practical stand-in for
 * the brief's "command or idempotency ID" query dimension: no true
 * command ID is threaded onto `DomainEvent`/`OutboxEntry` anywhere in
 * this codebase today (Stage B analysis, point 4) — `eventId` is the
 * closest existing correlating handle, since a multi-event command's
 * sub-events already share one `eventId` value in their payload (see
 * `loyaltyNumberRepository.ts`/`qrIdentityRepository.ts`) even though
 * each sub-event's outbox *document* ID gets a distinct `-{index}`
 * suffix. This is disclosed as a known gap, not silently worked around.
 */

import type { Firestore, Query, Timestamp } from "firebase-admin/firestore";
import { toIdentityAuditRecord, type IdentityAuditRecord } from "../models/auditEnvelope";
import { createAuditQueryAuthority } from "../models/auditQueryAuthority";
import { invalidAuditQueryParamsError } from "../models/identityAuditErrors";

const COLLECTION = "outboxEntries";
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

export type AuditQueryOptions = {
  limit?: number;
  occurredFrom?: string;
  occurredTo?: string;
};

export type AuditQueryResult = {
  records: IdentityAuditRecord[];
  hasMore: boolean;
};

function requireNonEmpty(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw invalidAuditQueryParamsError(`${field} must be a non-empty string`);
  }
}

function resolveBoundedLimit(requested: number | undefined): number {
  if (requested === undefined) {
    return DEFAULT_LIMIT;
  }
  if (!Number.isInteger(requested) || requested <= 0) {
    throw invalidAuditQueryParamsError("limit must be a positive integer");
  }
  return Math.min(requested, MAX_LIMIT);
}

function resolveTimeRange(options: AuditQueryOptions): { from?: Date; to?: Date } {
  const from = options.occurredFrom ? new Date(options.occurredFrom) : undefined;
  const to = options.occurredTo ? new Date(options.occurredTo) : undefined;

  if (from && Number.isNaN(from.getTime())) {
    throw invalidAuditQueryParamsError("occurredFrom is not a valid date-time");
  }
  if (to && Number.isNaN(to.getTime())) {
    throw invalidAuditQueryParamsError("occurredTo is not a valid date-time");
  }
  if (from && to && from.getTime() > to.getTime()) {
    throw invalidAuditQueryParamsError("time range end precedes start");
  }

  return { from, to };
}

async function runBoundedQuery(
  db: Firestore,
  field: string,
  value: string,
  authority: string,
  options: AuditQueryOptions,
): Promise<AuditQueryResult> {
  createAuditQueryAuthority(authority);
  requireNonEmpty(value, field);
  const limit = resolveBoundedLimit(options.limit);
  const { from, to } = resolveTimeRange(options);

  let query: Query = db.collection(COLLECTION).where(field, "==", value);
  if (from) {
    query = query.where("createdAt", ">=", from);
  }
  if (to) {
    query = query.where("createdAt", "<=", to);
  }
  query = query.orderBy("createdAt", "desc").limit(limit + 1);

  const snapshot = await query.get();
  const records: IdentityAuditRecord[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data() as { event?: unknown; status?: unknown; createdAt?: Timestamp };
    if (!data.event || !data.status || !data.createdAt) {
      // Malformed record — skip rather than fail the whole query.
      continue;
    }
    records.push(
      toIdentityAuditRecord({
        id: doc.id,
        event: data.event as never,
        status: data.status as never,
        retryCount: 0,
        createdAt: data.createdAt,
      }),
    );
  }

  const hasMore = records.length > limit;
  return { records: hasMore ? records.slice(0, limit) : records, hasMore };
}

export function queryAuditRecordsByCustomerIdentityId(
  db: Firestore,
  customerIdentityId: string,
  authority: string,
  options: AuditQueryOptions = {},
): Promise<AuditQueryResult> {
  return runBoundedQuery(db, "event.aggregateId", customerIdentityId, authority, options);
}

export function queryAuditRecordsByCorrelationId(
  db: Firestore,
  correlationId: string,
  authority: string,
  options: AuditQueryOptions = {},
): Promise<AuditQueryResult> {
  return runBoundedQuery(db, "event.correlationId", correlationId, authority, options);
}

export function queryAuditRecordsByEventType(
  db: Firestore,
  eventType: string,
  authority: string,
  options: AuditQueryOptions = {},
): Promise<AuditQueryResult> {
  return runBoundedQuery(db, "event.eventType", eventType, authority, options);
}

export function queryAuditRecordsByEventId(
  db: Firestore,
  eventId: string,
  authority: string,
  options: AuditQueryOptions = {},
): Promise<AuditQueryResult> {
  return runBoundedQuery(db, "event.eventId", eventId, authority, options);
}
