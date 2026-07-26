/**
 * Frontend correlation-ID context carrier (ENG-P1-003-IMP-01).
 *
 * Per the ENG-P1-003 Operational Observability Blueprint §4/§7: a
 * browser-initiated workflow originates its own correlation ID, which
 * is then carried through the first authenticated API call so the
 * backend's `resolveCorrelationId` (`functions/src/shared/correlation`)
 * adopts it rather than minting a second one for the same workflow.
 *
 * This is the minimum context carrier the blueprint permits — not a
 * second correlation-ID *generator* in the backend's sense. The
 * backend's own `generateCorrelationId()` cannot run here (it is
 * Node-only, in a separate workspace package); this module uses the
 * browser's native `crypto.randomUUID()` and mirrors only the backend's
 * "resolve, never regenerate" semantics for a single active workflow.
 */

let current: string | undefined;

export function getCurrentCorrelationId(): string | undefined {
  return current;
}

export function resolveCorrelationId(existing?: string): string {
  if (existing) {
    current = existing;
    return existing;
  }
  if (current) {
    return current;
  }
  current = crypto.randomUUID();
  return current;
}

export function setCorrelationId(id: string): void {
  current = id;
}

export function clearCorrelationId(): void {
  current = undefined;
}
