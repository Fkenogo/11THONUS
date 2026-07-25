/**
 * Correlation-ID service (ENG-P1-002).
 *
 * Per TRD20 §20.26 / Logging Conventions §5: one correlation ID is
 * generated at a workflow's entry point and passed explicitly through
 * every function call, event, and log entry it produces — never
 * regenerated mid-workflow. `resolveCorrelationId` encodes exactly that
 * rule: an existing ID is always kept unchanged; a new one is generated
 * only when none exists yet.
 */

import { randomUUID } from "node:crypto";

export function generateCorrelationId(): string {
  return randomUUID();
}

export function resolveCorrelationId(existing?: string): string {
  return existing ?? generateCorrelationId();
}
