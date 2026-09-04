/**
 * Platform Administration audit record (`ENG-P3-003A`).
 *
 * A narrow, Knowledge-Studio-scoped audit writer — `ENG-P3-003-DESIGN-001`
 * §9 found `identityAudit` is a Customer-Identity-specific projection over a
 * different event set, not a generic audit domain, so this is a parallel,
 * equally narrow record type, not a cross-domain import. Field shape follows
 * TRD18 §18.49's `AdministrativeAuditRecord` (Class C per `CORR-001` §2A —
 * the specific field list is an engineering choice satisfying the
 * independently-governed audit *duty*, not itself a governed schema).
 *
 * Records are append-only: nothing in this domain ever updates or deletes a
 * previously-written audit record.
 */

export const PLATFORM_ADMINISTRATION_AUDIT_ACTION_TYPES = [
  "platform_administrator_bootstrapped",
  "knowledge_permission_evaluated",
] as const;

export type PlatformAdministrationAuditActionType =
  (typeof PLATFORM_ADMINISTRATION_AUDIT_ACTION_TYPES)[number];

export type PlatformAdministrationAuditRecord = {
  readonly id: string;
  readonly actionType: PlatformAdministrationAuditActionType;
  /** The subject's own `userId` for a self-directed action, or the actor for an authorization check. Never a spoofable client-declared value — always derived server-side. */
  readonly actorReference: string;
  readonly targetType: "platform_administrator";
  readonly targetId: string;
  readonly outcome: "allow" | "deny" | "created";
  readonly reasonCode?: string;
  readonly correlationId: string;
  readonly occurredAt: Date;
  readonly schemaVersion: number;
};

export type CreatePlatformAdministrationAuditRecordParams = {
  id: string;
  actionType: PlatformAdministrationAuditActionType;
  actorReference: string;
  targetId: string;
  outcome: "allow" | "deny" | "created";
  reasonCode?: string;
  correlationId: string;
  occurredAt: Date;
};

export function createPlatformAdministrationAuditRecord(
  params: CreatePlatformAdministrationAuditRecordParams,
): PlatformAdministrationAuditRecord {
  return {
    id: params.id,
    actionType: params.actionType,
    actorReference: params.actorReference,
    targetType: "platform_administrator",
    targetId: params.targetId,
    outcome: params.outcome,
    ...(params.reasonCode !== undefined ? { reasonCode: params.reasonCode } : {}),
    correlationId: params.correlationId,
    occurredAt: params.occurredAt,
    schemaVersion: 1,
  };
}
