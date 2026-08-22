/**
 * Server-authoritative "currently required Business Terms version"
 * configuration contract (`ENG-P3-002A`, design §37.5).
 *
 * **Legal boundary — read before touching this file.** `DEC-LEGAL-002`
 * (consumer/loyalty terms, business reward obligations, dispute language,
 * platform liability) remains `OPEN_LEGAL`. This module does NOT invent,
 * approve, or hard-code an actual production Terms version — no `"v1"`,
 * `"1.0"`, `"2026-08"`, or any value that could be mistaken for a real,
 * legally-approved Terms identifier is written here. This module defines
 * only the *mechanism* by which a real value would be sourced once legal
 * governance actually approves one.
 *
 * Per design §37.5: `ENG-P3-002A` only needs a stable *reference* — a
 * `termsVersion` string the backend treats as authoritative and stamps
 * onto acceptance records — not an in-repo Terms-document CMS. This
 * mirrors `functions/src/config/region.ts`'s own "single source of truth,
 * platform configuration convention" shape, but is read from environment
 * configuration (`BUSINESS_TERMS_CURRENT_VERSION`) rather than hard-coded,
 * since — unlike the region — this value is explicitly NOT something this
 * task is authorized to choose or freeze in source.
 *
 * **Fail-closed contract:** if no value is configured (the environment
 * variable is unset, empty, or whitespace-only), `getCurrentlyRequiredBusinessTermsVersion`
 * returns `null` — never a fabricated default. Every caller (the
 * `acceptBusinessTerms` command, the `submitBusinessForVerification`
 * precondition) must treat `null` as "Terms acceptance is currently
 * unavailable" and fail closed, never silently skip the check.
 */

const CONFIG_ENV_VAR = "BUSINESS_TERMS_CURRENT_VERSION";

/**
 * Reads the server-authoritative currently-required Business Terms
 * version from governed environment configuration. Returns `null` — never
 * throws, never fabricates a value — when nothing is configured, so every
 * caller must explicitly decide how to fail closed.
 *
 * Deliberately a function, not a module-load-time constant: this lets
 * tests set/unset `process.env[CONFIG_ENV_VAR]` per-case without module
 * re-import gymnastics, and keeps the "no configured value" state a first-
 * class, always-current read rather than something frozen at cold start.
 */
export function getCurrentlyRequiredBusinessTermsVersion(): string | null {
  const raw = process.env[CONFIG_ENV_VAR];
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  return trimmed;
}

export const BUSINESS_TERMS_CONFIG_ENV_VAR = CONFIG_ENV_VAR;
