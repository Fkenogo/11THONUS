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
 *
 * **Lifecycle disposition (ENG-P1-003-IMP-01-CR1 review finding,
 * documented rather than fixed with new runtime code):**
 * - **Begins:** the first call to `resolveCorrelationId()` with no
 *   existing ID (generates one), or an explicit `setCorrelationId()`.
 * - **Ends:** nothing automatic today — only an explicit
 *   `clearCorrelationId()` call clears it.
 * - **Could unrelated interactions inherit the same ID?** Yes, in
 *   principle: this is a single module-global mutable value with no
 *   per-workflow scoping or automatic expiry. If wired into the
 *   application without deliberate workflow-boundary discipline (e.g.
 *   clearing on navigation between unrelated features), two unrelated
 *   user actions could share one correlation ID.
 * - **Page reload:** clears it implicitly — this is an in-memory module
 *   variable with no persistence layer, so a full page reload always
 *   resets it. Client-side route navigation within a single-page-app
 *   session does **not** reload the module and therefore does **not**
 *   clear it on its own.
 * - **Logout:** nothing currently calls `clearCorrelationId()` on
 *   logout — no such wiring exists yet.
 * - **Current risk level: dormant, not active.** `getObservability()`
 *   (`index.ts`) is not called from `main.tsx`/`App.tsx`, and no
 *   application code calls any function in this module outside its own
 *   tests — so no real workflow-boundary gap can manifest yet. This
 *   module supplies the *mechanism* (`clearCorrelationId`), not the
 *   *trigger* (a route-change hook, a logout handler); deciding and
 *   wiring that trigger is future application-integration work, not
 *   this module's responsibility, and is deliberately not built
 *   speculatively here — see the ENG-P1-003-IMP-01-CR1 correction
 *   report for the full disposition.
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
