/**
 * Identity operational signals (ENG-P2-001-10).
 *
 * Thin, closed-vocabulary wrapper over the existing shared structured
 * logger (`shared/logging/logger.ts` + `OperationalLog`,
 * `shared/logging/operationalLog.ts`) — not a new observability
 * framework, not a metrics client, not a Sentry/diagnostics integration
 * (that stack is frontend-only, `apps/web/src/observability/*`, and out
 * of this backend package's scope). Every call becomes one structured
 * log entry; a log-based metric/counter is a downstream Cloud Logging
 * concern, not something this module needs to reimplement.
 *
 * `result` is a small closed categorical value, not free text — this is
 * a stronger guarantee than the shared logger's own regex-based
 * sensitive-content guard: a signal caller cannot accidentally pass a
 * phone number, email, or token here even if it wanted to, because there
 * is no free-text field to put one in.
 */

import { log } from "../../../shared/logging/logger";
import type { ErrorCategory } from "../../../shared/errors/errorCategories";

export const IDENTITY_OPERATIONAL_SIGNALS = [
  "issuance_succeeded",
  "issuance_failed",
  "collision_exhausted",
  "qr_regeneration_failed",
  "lifecycle_transition_conflict",
  "recovery_failed",
  "proof_reuse_attempted",
  "authentication_reference_conflict",
  "repeated_lookup_failure",
  "persistence_unavailable",
  "outbox_processing_failure",
] as const;

export type IdentityOperationalSignal = (typeof IDENTITY_OPERATIONAL_SIGNALS)[number];

export type SignalResult = "success" | "failure" | "exhausted" | "conflict" | "rejected";

export type EmitIdentityOperationalSignalParams = {
  signal: IdentityOperationalSignal;
  sourceDomain: string;
  correlationId: string;
  result: SignalResult;
  customerIdentityId?: string;
  errorCode?: ErrorCategory;
};

function isKnownSignal(value: string): value is IdentityOperationalSignal {
  return (IDENTITY_OPERATIONAL_SIGNALS as readonly string[]).includes(value);
}

export function emitIdentityOperationalSignal(params: EmitIdentityOperationalSignalParams): void {
  if (!isKnownSignal(params.signal)) {
    throw new Error(`Unrecognised identity operational signal: "${params.signal}"`);
  }

  log({
    timestamp: new Date().toISOString(),
    environment: process.env["NODE_ENV"] ?? "unknown",
    severity: params.result === "success" ? "info" : "warning",
    domain: params.sourceDomain,
    service: "identityAudit",
    operation: params.signal,
    correlationId: params.correlationId,
    result: params.result,
    ...(params.customerIdentityId ? { customerId: params.customerIdentityId } : {}),
    ...(params.errorCode ? { errorCode: params.errorCode } : {}),
  });
}
