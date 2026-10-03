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
