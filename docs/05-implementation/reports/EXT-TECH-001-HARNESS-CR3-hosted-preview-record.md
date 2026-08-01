> **Title:** EXT-TECH-001-HARNESS-CR3 — Hosted Preview Persistent Record
> **Purpose:** A stable, at-a-glance reference for the CR3 Hosting preview's current state — separate from the full technical narrative in the implementation report's §32, which will keep growing as this task chain continues.
> **Source-of-truth path:** `docs/05-implementation/reports/EXT-TECH-001-HARNESS-CR3-hosted-preview-record.md`
> **Full technical record:** [`EXT-TECH-001-TEST-HARNESS-implementation-report-2026-07-31.md`, §32](EXT-TECH-001-TEST-HARNESS-implementation-report-2026-07-31.md)
> **Prepared:** 2026-08-01.

---

## Preview channel

| Field | Value |
|---|---|
| Firebase project | `eleventh-on-us-dev` |
| Hosting site | `eleventh-on-us-dev` |
| Preview channel name | `phone-auth-test` |
| HTTPS URL | `https://eleventh-on-us-dev--phone-auth-test-3yz68r9z.web.app` |
| Expiry | `2026-08-01 23:00:23` |
| Live channel status | Untouched — no release, unchanged since before this task |

## What the preview contains

A single-page, harness-only build (`harness.html` / `harnessMain.tsx`) — no customer routes, no admin routes, no PWA/service worker, no analytics, no observability pipeline. Structurally isolated from the ordinary application build (32 modules transformed vs. 2,223 for the full app), not merely runtime-gated.

## Status

- Environment preparation: **Complete**
- Real carrier test: **Not yet performed**
- `EXT-TECH-001`: **Still Pending**
- Capability 2: **Blocked**
- No real SMS sent at any point in CR3.

## Before the Founder tests

Nothing further is required — the preview is ready. See the [manual runbook](EXT-TECH-001-TEST-HARNESS-manual-runbook-2026-07-31.md)'s §0 for how to use the hosted preview, and the [evidence template](EXT-TECH-001-delivery-test-evidence-template-2026-07-31.md) for recording results.

## Teardown (perform after testing — do not delete the preview before then)

1. `firebase hosting:channel:delete phone-auth-test --project eleventh-on-us-dev` (or let the expiry above lapse).
2. Re-check Firebase Auth's `authorizedDomains` (`identitytoolkit.googleapis.com/admin/v2/projects/eleventh-on-us-dev/config`) — confirm `eleventh-on-us-dev--phone-auth-test-3yz68r9z.web.app` is gone. If not (Firebase's automatic cleanup on channel deletion was not independently confirmed), remove it manually via a scoped `authorizedDomains` update — never a blanket rewrite.
3. `rm apps/web/.env.test-harness.local` (local-only, gitignored, never committed).
4. Re-confirm the ordinary `pnpm --filter web build` still excludes the harness (grep `dist/` — expect zero matches).
5. Re-confirm the `live` Hosting channel still has no release.

Full detail: implementation report §32.11.

## Known limitation, disclosed

The full reCAPTCHA challenge-iframe round trip was validated on `localhost` against the same Google domains this preview's CSP allows, not literally re-executed against this exact hosted URL (a direct re-test would require internal bundle symbols not exposed for external import from a production build). The `script-src` allowance itself **was** verified live on this URL with zero CSP violations. See implementation report §32.9.
