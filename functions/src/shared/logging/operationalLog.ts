/**
 * Structured logging contract (ENG-P1-002).
 *
 * `OperationalLog`, exactly as TRD20 §20.23 / Logging Conventions §2
 * define it. Engineering Standards do not add, rename, or remove fields
 * from this shape — a change here is a TRD20 change, not a Pass 1/Pass 2
 * standards change.
 */

export type LogSeverity = "debug" | "info" | "warning" | "error" | "critical";

export type OperationalLog = {
  timestamp: string;
  environment: string;
  severity: LogSeverity;
  domain: string;
  service: string;
  operation: string;
  correlationId: string;
  commandId?: string;
  eventId?: string;
  actorId?: string;
  businessId?: string;
  customerId?: string;
  aggregateType?: string;
  aggregateId?: string;
  result?: string;
  durationMs?: number;
  errorCode?: string;
};
