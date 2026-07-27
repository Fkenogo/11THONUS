/**
 * Frontend correlation-ID context carrier (ENG-P1-003-IMP-01, extended
 * under ENG-P1-003-IMP-02).
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
 *
 * **Lifecycle disposition, updated for Stage 2 (`ENG-P1-003-IMP-02`):**
 * - **Begins:** `beginWorkflow()` — always mints a fresh ID, unlike
 *   `resolveCorrelationId()`'s reuse-if-present behaviour (kept for
 *   lower-level/manual use and for the not-yet-wired backend-adoption
 *   case). `main.tsx` calls `beginWorkflow()` once at boot.
 * - **Ends:** `endWorkflow(id)` — a compare-and-clear: only clears the
 *   active ID if it still equals `id`. This closes the "unrelated
 *   interactions could inherit the same ID" risk CR1 flagged: if
 *   workflow A is superseded by workflow B before A's own cleanup
 *   runs, A's late `endWorkflow(A)` call cannot clobber B's still-active
 *   ID (see the concurrent-workflow test).
 * - **Logout:** `main.tsx` registers a Firebase `onAuthStateChanged`
 *   listener (`authLifecycle.ts`) that calls `clearCorrelationId()` and
 *   clears the observability service's identity context whenever the
 *   auth state transitions to signed-out — an existing Firebase Auth
 *   primitive, not new UI. No logout *button* exists anywhere in the
 *   application yet, so this only fires for a real Firebase sign-out
 *   event, never a fabricated one.
 * - **Page reload / route navigation:** unchanged from Stage 1 — reload
 *   clears implicitly (in-memory, no persistence); client-side route
 *   navigation does not clear on its own (no route currently signals a
 *   workflow boundary; there is only one route today).
 * - **Frontend-to-backend propagation / backend-issued-ID adoption:**
 *   **not implemented.** `apps/web` has no API/network abstraction layer
 *   of any kind yet (no `httpsCallable` wrapper, no `fetch` client,
 *   confirmed by direct repository search) — there is no code path to
 *   attach a correlation ID to an outgoing request or read one back from
 *   a response. `resolveCorrelationId(existing)`'s adoption behaviour
 *   remains implemented and tested (Stage 1) for whenever that API layer
 *   exists; wiring it to a real request/response is out of this stage's
 *   scope, per explicit Founder decision — blocked, not built
 *   speculatively.
 * - **Risk level: no longer dormant, but bounded.** This module is now
 *   wired into `main.tsx` (§ above), so the workflow-boundary discipline
 *   is real, not theoretical — `beginWorkflow`/`endWorkflow`'s
 *   compare-and-clear semantics are the concrete mitigation.
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

/**
 * Starts a new workflow, always minting a fresh ID (never reusing the
 * current one) — the Stage 2 entry point application code should use,
 * as distinct from `resolveCorrelationId()`'s "reuse if present"
 * semantics.
 */
export function beginWorkflow(): string {
  const id = crypto.randomUUID();
  current = id;
  return id;
}

/**
 * Ends a workflow started with `beginWorkflow()`. Compare-and-clear: a
 * no-op unless `id` is still the active correlation ID, so a delayed
 * end from a superseded workflow can never clear a newer, still-active
 * one.
 */
export function endWorkflow(id: string): void {
  if (current === id) {
    current = undefined;
  }
}
