# EA-BL-001 — Shared Experience Foundation & Entry Journey

**Status:** Implemented / pending review. Founder Preview remains withdrawn.
**Branch:** `codex/ea-bl-001`
**Entry commit:** `af874b7da3be1d484f183cd42f6270a816fd61ae` (canonical `main`)
**Experience Reference:** `18e8d700f505beefe46d324f6ea33f20a670abe7` (frozen approved revision).

## Scope and finding

This package assembles the shared visual foundation, sign-in/create-account experience, role-aware existing shells, localized state feedback, and deterministic proof of seeded sign-in. It does not complete the Owner, Manager, Frontline, Customer, or Operator role journeys, and does not make the application Founder Preview ready.

Implementation was performed in an isolated local clone because the shared canonical checkout had unrelated existing changes and its Git metadata was read-only. No changes were made to that checkout or the prototype repository.

## Experience Reference mapping

The reference `TopBar`, workspace/mobile navigation, and role-specific prototypes establish 11thONUS identity, warm amber/ink hierarchy, task context, compact navigation, and mobile-first composition. This implementation introduces a shared brand mark/tagline, responsive entry composition, consistent panel/action/status treatment, business/personal context framing, and shared sign-out in the existing business and customer shells. Authenticated role landing continues to be derived from existing server-backed role/business data.

Reference demo role switching, simulated device/demo scenarios, marketing dashboards, fabricated balances/Reward content, and prototype-only shortcuts were excluded. They are illustrative and/or exceed canonical Product Truth. No prototype code was copied.

## Code changes

- Reworked the shared entry page and authentication panel with responsive 11thONUS identity, clearer hierarchy, validation, loading, and human-readable localized feedback.
- Protected unauthenticated routes return to the shared entry; successful identity resolution and existing route decisions remain authoritative.
- Added common brand and sign-out components. Added identity/context framing and sign-out to existing customer and business shells without adding capabilities or destinations.
- Preserved backend-derived Owner/Manager/Staff distinctions. This is a shared shell foundation, not a completed role dashboard.
- Corrected customer identity messaging: registration/authentication issues Loyalty Number and QR artefacts; the customer-scoped read is unavailable, so the UI states the retrieval limitation without inventing client data.
- Added English/French parity for all new strings.
- Preview warm-start coherence now verifies every deterministic manifest identity against Auth Emulator sign-in, not merely that the manifest prints or that the Operator can authenticate.
- Extended real-browser acceptance for seeded roles, Auth Emulator port, invalid credentials, Create Account, route resolution, sign-out, and mobile/desktop layout. Captured screenshots under `docs/05-implementation/evidence/EA-BL-001/`.

## Authentication and account creation

The Founder-reported historical failure cause cannot be established conclusively from available evidence. The deterministic manifest includes Grace (`grace.owner@preview.example.test`); `preview:accounts` is a manifest display, not proof of an Auth record. Earlier preview warm-start verification authenticated only the Operator, allowing other missing/mismatched identities to go undetected. This package closes that verification gap: all manifest identities are authenticated against the Auth Emulator during preview coherence checks.

The browser acceptance suite verified Grace Owner, Manager, Staff, and Customer against Auth Emulator port `28101`, then verified authenticated application state and role-appropriate existing destination. It also verified invalid credentials are bounded and visible. This proves the current canonical local flow; it does not prove the precise cause of the Founder machine's prior incident.

Create Account uses the existing Firebase identity registration and canonical registration/sign-in service, which provisions customer identity artefacts. A newly created account is authenticated, receives the existing customer identity setup, and routes to the customer experience. Customer-scoped retrieval remains unavailable and the experience reports that limitation truthfully. Business Terms are not accepted or bypassed; the customer registration path does not represent Business onboarding. Password recovery has no assembled entry UI in this package.

## Product Truth boundaries and seams

No Product Truth, domain rules, Functions source, database schema, migrations, or commercial behaviour changed. Existing registration issuance of Loyalty Number/QR was verified in the canonical registration service. Customer-scoped reads for identity and Circle/Reward state remain seams; this package deliberately provides no client-side database workaround.

Commercial standing and Business Reward ID/read data remain required by their later Owner/Manager journey. Operator business review, activation, commercial administration, exception actions, and associated read models remain unassembled seams. No Operator capabilities or role destinations were fabricated. Current identity routing with no accessible Business can land in the existing customer route; this must not be taken as Operator journey support.

Business Terms remain governed by `DEC-LEGAL-002`; this package introduces no Terms behaviour. Commercial gate remains OFF. WP-COM-08 was not started.

## Verification

- Real-browser preview acceptance: 28 passed across desktop and mobile Chromium projects. Journeys cover seeded Owner (including Grace), Manager, Staff, Customer, Create Account, invalid credentials, role destinations, responsive entry, and authenticated shell screenshots.
- Browser requests assert the Auth Emulator endpoint at port `28101`; manifest identities are independently verified by preview tooling against the Auth Emulator.
- Preview tooling/unit checks: 46/46 passed (local-network permission required for loopback bind tests).
- Focused web tests covering changed entry/routing/shell behavior passed. Full web Vitest suite and final type/lint/format checks are recorded at completion below.
- Browser runner printed all 28 passing results; its process needed interruption during post-suite Chrome worker shutdown. No browser assertion failed in the final run.
- Screenshots: desktop/mobile Sign In, Create Account, error/validation, Owner, Manager, Staff, and Customer shells are in `docs/05-implementation/evidence/EA-BL-001/`.

## PR #295

PR #295 remains open/held and untouched. The EA-RESET-001 inventory describes it as a conflicting, read-oriented Owner summary/navigation branch. Its visual ideas are not an architectural baseline and no code was reused. Recommendation: supersede it with the coherent assembly baseline; after the Founder accepts the baseline direction, formally close PR #295 as superseded. Do not merge it.

## Files, configuration, dependencies, schema

Source/test changes are limited to shared web entry/shell/i18n and preview identity verification/acceptance. Evidence and this report plus the implementation change log are documentation outputs. No dependency was added or manifest/lockfile dependency changed. No application config, schema, database migration, or Product Truth document changed. A missing package already declared by the repository was restored only in the isolated local test workspace; it is not a source/config change.

## Risks and remaining work

- Owner, Manager, Frontline, Customer, and Operator journeys remain incomplete; screenshots prove shell context only.
- Customer-scoped identity/Circle/Reward reads are unavailable. The UI must continue to distinguish issued artefacts from retrievable presentation.
- Operator role resolution/destinations and supported account recovery remain incomplete.
- Founder historical authentication failure remains unexplained; current deterministic identity and browser paths are now covered.
- EA-BL-001 completion does not pass the Founder Preview re-entry gate. Founder Preview remains withdrawn and all later role journeys require assembly packages.

## Rollback and completion metadata

Rollback is `git revert <EA-BL-001-commit>` on this branch. The implementation is isolated on `codex/ea-bl-001`; no PR was created. PR #295 was not modified or merged. No deployment occurred. The shared checkout and prototype repository were not modified.

**Implementation commit:** `1a3552b6756396ae0ad7bd1324b16e3cc7daadd1` on `codex/ea-bl-001`.
**Final verification:** 928/928 web unit tests, 46/46 preview tooling tests, and 28/28 browser assertions; web typecheck, ESLint, Prettier, and `git diff --check` passed. The browser process was interrupted only after all assertions passed, during Chrome worker shutdown. No Product Truth, backend, schema, migration, or application configuration changed.

## Exact change inventory

No dependencies were added. `package.json` only extends the existing preview tooling test command. No configuration, schema, migration, Functions/backend, Product Truth, or prototype files changed. Product-facing web experience code changed only in the shared entry, business/customer shell framing, sign-out, and the customer identity availability statement described above.

Commands executed (from the isolated clone unless noted):

- `node tests/preview/cli.mjs start` / `verify` during local Auth Emulator + app preview, then `node tests/preview/cli.mjs stop`.
- `node --test tests/preview/guards.test.mjs tests/preview/ports.test.mjs tests/preview/lib/identityVerification.test.mjs` — 46/46.
- `apps/web/node_modules/.bin/vitest run` — 928/928.
- `apps/web/node_modules/.bin/tsc -b --noEmit` — passed.
- Playwright preview acceptance against system Chrome, desktop and mobile Chromium projects — 28/28 assertions.
- ESLint on changed TS/TSX and browser spec — 0 errors.
- Prettier check on changed code/docs, and `git diff --check` — passed.
- Targeted Docker commands inspected and removed only the EA-BL-001 disposable PostgreSQL container/volumes; other project databases were left running.

Files changed by the implementation commit:

- `apps/web/src/App.test.tsx`
- `apps/web/src/App.tsx`
- `apps/web/src/RootEntry.tsx`
- `apps/web/src/authentication/SignInPage.tsx`
- `apps/web/src/authentication/SignInPanel.emailMode.test.tsx`
- `apps/web/src/authentication/SignInPanel.test.tsx`
- `apps/web/src/authentication/SignInPanel.tsx`
- `apps/web/src/business/dashboard/BusinessDashboardBoundaryPage.test.tsx`
- `apps/web/src/business/dashboard/BusinessDashboardBoundaryPage.tsx`
- `apps/web/src/business/dashboard/BusinessDashboardRoutes.test.tsx`
- `apps/web/src/business/dashboard/BusinessDashboardRoutes.tsx`
- `apps/web/src/business/dashboard/BusinessDashboardShell.test.tsx`
- `apps/web/src/business/dashboard/BusinessDashboardShell.tsx`
- `apps/web/src/business/onboarding/BusinessResolverPage.tsx`
- `apps/web/src/customer/CustomerHomePage.tsx`
- `apps/web/src/customer/CustomerRoutes.tsx`
- `apps/web/src/customer/CustomerShell.test.tsx`
- `apps/web/src/customer/CustomerShell.tsx`
- `apps/web/src/dev/dashboardHarness/DashboardHarnessPage.tsx`
- `apps/web/src/experience/ExperienceBrand.tsx`
- `apps/web/src/experience/ExperienceSignOutButton.tsx`
- `apps/web/src/i18n/locales/en.ts`
- `apps/web/src/i18n/locales/fr.ts`
- `docs/05-implementation/evidence/EA-BL-001/create-account-chromium-preview-mobile.png`
- `docs/05-implementation/evidence/EA-BL-001/create-account-chromium-preview.png`
- `docs/05-implementation/evidence/EA-BL-001/customer-shell-chromium-preview-mobile.png`
- `docs/05-implementation/evidence/EA-BL-001/customer-shell-chromium-preview.png`
- `docs/05-implementation/evidence/EA-BL-001/entry-error-chromium-preview-mobile.png`
- `docs/05-implementation/evidence/EA-BL-001/entry-error-chromium-preview.png`
- `docs/05-implementation/evidence/EA-BL-001/entry-validation-error-chromium-preview-mobile.png`
- `docs/05-implementation/evidence/EA-BL-001/entry-validation-error-chromium-preview.png`
- `docs/05-implementation/evidence/EA-BL-001/manager-shell-chromium-preview-mobile.png`
- `docs/05-implementation/evidence/EA-BL-001/manager-shell-chromium-preview.png`
- `docs/05-implementation/evidence/EA-BL-001/owner-shell-chromium-preview-mobile.png`
- `docs/05-implementation/evidence/EA-BL-001/owner-shell-chromium-preview.png`
- `docs/05-implementation/evidence/EA-BL-001/registered-customer-shell-chromium-preview-mobile.png`
- `docs/05-implementation/evidence/EA-BL-001/registered-customer-shell-chromium-preview.png`
- `docs/05-implementation/evidence/EA-BL-001/sign-in-chromium-preview-mobile.png`
- `docs/05-implementation/evidence/EA-BL-001/sign-in-chromium-preview.png`
- `docs/05-implementation/evidence/EA-BL-001/staff-shell-chromium-preview-mobile.png`
- `docs/05-implementation/evidence/EA-BL-001/staff-shell-chromium-preview.png`
- `docs/05-implementation/reports/EA-BL-001-shared-experience-foundation-entry-journey-implementation-report-2026-10-03.md`
- `docs/changes/IMPLEMENTATION_CHANGES.md`
- `package.json`
- `tests/e2e/preview/preview-identities.spec.ts`
- `tests/preview/cli.mjs`
- `tests/preview/lib/identityVerification.mjs`
- `tests/preview/lib/identityVerification.test.mjs`

---

## Correction pass — 2026-10-05

**Trigger:** independent technical review of `104e5d5a81da4ef41d59c75793d1f56b6783a70c` returned **CORRECTION REQUIRED** (F1 P1, F2 P2, F3 minor). The review found no issue with Product Truth, backend, commercial logic, authentication or role-resolution architecture, or schema. The sections above are the original implementation record and are unchanged; where they conflict with this section (screenshot file names, test counts), this section governs.

**Corrected implementation commit:** `0b03df0e418c764a2c2cef172e0e54d137e030ad` (on top of reviewed `104e5d5`). A documentation-only commit follows it; the final pushed HEAD is reported in the handoff.

### F1 — mobile menu toggle invisible (corrected)
- **Defect:** mobile headers in `BusinessDashboardShell.tsx` / `CustomerShell.tsx` hard-coded `bg-white`/`text-slate-*` while the menu button had no colour, so it inherited the near-white application foreground and was effectively invisible on the white header.
- **Fix:** headers use `--color-background`/`--color-muted-foreground`; the toggle has `text-[var(--color-foreground)]`, a `--color-border` outline and `min-h-11 min-w-11` (44px). Sidebar context text uses tokens. `ExperienceBrand` no longer hard-codes a light-only wordmark colour (inherits; tagline uses opacity); `ExperienceSignOutButton` uses tokens (+ `dark:` error colour). Fixed-light surfaces (`RootEntry` card page, `BusinessResolverPage`) now set `text-slate-900` themselves, which also fixes card text inheriting a near-white foreground on a white card. Navigation behaviour and role logic untouched.
- **Verification:** new e2e tests compute the toggle-vs-header contrast (must be ≥ 3:1) on mobile for Business and Customer, and capture the open menu, in both schemes.

### F2 — Create Account copy (corrected)
- `SignInPanel` gained an optional `onModeChange` callback (no behaviour change; fires from the existing `switchEmailMode`). `SignInPage` keeps the mode and shows mode-aware heading/description.
- New keys (`customer.entry.*`): `createAccountTitle` — EN "Create your account" / FR "Créez votre compte"; `createAccountDescription` — EN "Create an account to get your personal 11thONUS identity." / FR "Créez un compte pour obtenir votre identité 11thONUS personnelle."
- Tests: new `SignInPage.entryMode.test.tsx` (default, register, revert); e2e asserts the "Create your account" heading and no "Sign in" heading in register mode.

### F3 disposition
| Item | Disposition |
|---|---|
| ExperienceBrand `aria-label` on plain div | **Corrected** — removed; the visible "11thONUS" text (badge is `aria-hidden`) is the accessible name. |
| Duplicate screenshots | **Corrected** — evidence directory fully re-captured by the e2e run; the seeded-customer capture that duplicated `registered-customer-shell` was removed; role captures now wait for the role label (manager/staff mobile were byte-identical because the role had not loaded). No byte-identical files remain (checked by SHA-1). Desktop-dark theme captures that equal existing desktop evidence are intentionally not taken. |
| e2e screenshots dirtying tracked docs | **Corrected** — `captureEvidence` is a no-op unless `EA_BL_001_CAPTURE_EVIDENCE=1`. |
| "Loyalty Number has been issued" copy | **Unchanged** — independently verified against `registrationSignInService` (artefact establishment on register and sign-in). |
| `qrcode.react` environment gap | **No repository change.** Declared in `apps/web/package.json` and `pnpm-lock.yaml`; a normal `pnpm install --frozen-lockfile` in a clean worktree restored it and all web tests/typecheck passed. The reviewer's scratch environment symlinked a `node_modules` that lacked it. |
| Remaining P3 (unconditional "issued" copy) | Unchanged (see above). |

### Newly discovered pre-existing issue — not fixed (out of scope)
`apps/web/src/index.css` nests `@theme` inside `@media (prefers-color-scheme: dark)`. In the built/dev app the dark token values apply regardless of OS colour scheme (verified: `matchMedia` light and dark both resolve `--color-background` to `hsl(240 10% 4%)`), so the light palette is never rendered. This predates EA-BL-001 (Phase 0 foundation) and is global; correcting it changes theming for the whole application and was not authorised here. Consequences for this pass: the shells always render dark; the "light" evidence applies the `index.css` light token values verbatim via an injected style (`*-light-palette-*` files) to prove the F1 fix works under the light palette; "dark" evidence is the application as shipped. Recommend a separate bounded theming package.

### Validation (corrected commit `0b03df0`, clean worktree, `pnpm install --frozen-lockfile`)
- Web unit tests: **930/930** (128 files) — baseline 928 + 2 new.
- Preview tooling `node --test`: **46/46**.
- ESLint on all changed TS/TSX: 0 errors. Prettier check on changed files: clean.
- `pnpm -r run typecheck` (web + functions): passed. `pnpm --filter web run build`: passed.
- Browser e2e (`chromium-preview` desktop + `chromium-preview-mobile`, system Chrome via a throwaway local config because Playwright's bundled browsers were not installed; against a freshly started and seeded preview, Auth Emulator port 28101): **36 passed** (28 prior + 8 new light/dark shell tests); clean exit, no interruption.

### Evidence (`docs/05-implementation/evidence/EA-BL-001/`, 22 files, all re-captured)
`sign-in-*`, `create-account-*` (corrected heading), `entry-error-*`, `entry-validation-error-*`, `registered-customer-shell-*`, `owner-shell-*`, `manager-shell-*`, `staff-shell-*` (each with the role label rendered), plus new `business-shell-{light,dark}-palette-*` and `customer-shell-{light,dark}-palette-*` (mobile with menu open; light also desktop). Supersedes the 18-file set listed above (`customer-shell-chromium-preview*.png` removed).

### Boundaries
No change to Product Truth, `functions/`, authentication architecture, role logic, database/schema/migrations, commercial logic, dependencies or configuration. No deployment. EA-BL-002 not started. FEF-TLC-001 not adopted. PR #295 untouched.
