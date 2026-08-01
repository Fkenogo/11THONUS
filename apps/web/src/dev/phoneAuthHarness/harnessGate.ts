/**
 * Development-only access gate for the EXT-TECH-001 delivery-test harness.
 *
 * Accepts an explicit boolean rather than reading `import.meta.env.DEV`
 * internally — the same pattern `config/env.ts`'s `loadEnv(source,
 * viteFlags)` already uses — so the gate is a pure, directly testable
 * function, and callers (`App.tsx`, the harness page itself) each pass
 * `import.meta.env.DEV` explicitly at their own call site. Fails closed:
 * only the exact boolean `true` enables the harness.
 */

export function isHarnessEnabled(dev: boolean): boolean {
  return dev === true;
}
