Warning: truncated output (original token count: 336593)
... 297796 bytes omitted ...

# Implementation Changes

> Persistent, append-only engineering change log per TRD22 §22.39 (Coding-Agent Change Tracking).
> This file does not replace Git history — it exists to provide a Founder-readable implementation trail.
> This file itself is a **target-only** addition, created by ENG-P0-001; it did not exist in the
> governed documentation source and is not part of the migrated documentation baseline.

---

## 2026-10-08 — 11THONUS-MEDIA-001 — MV-206 Media Storage & Delivery Alignment Assessment

- **Task:** Align 11thONUS with Miledge MV-206 v0.1 and close the project-specific media capability assessment. Documentation/assessment only; no code, schema, Storage Rules, dependency, provider, configuration, infrastructure or deployment change.
- **Status:** **CLOSED — ASSESSMENT COMPLETE; IMPLEMENTATION NOT AUTHORISED.** MV-206 aligned; 11thONUS Firebase-native classification unchanged.
- **Product Truth finding:** Business Logo is the only currently governed image requirement found for the bounded MVP media scope. Customer/owner/manager/staff profile photos and loyalty-programme imagery are not authorised by this assessment.
- **Provider disposition:** Do not select/provision R2 now. Recommend Firebase Storage as the first Business Logo implementation candidate because it is already scaffolded inside the Firebase-native architecture; retain R2 as the preferred reassessment candidate when broader media, higher public-read volume or portability needs are demonstrated. Cloudflare Images deferred pending measured transformation need.
- **Data/security direction:** future implementation should use application-owned asset identity (`MediaAsset` / `logoAssetId`) rather than provider URL as authority; validated uploads only; public delivery only for active publication logos; personal imagery remains out of scope and would default private if later authorised.
- **Next package:** proposed `11THONUS-MEDIA-002 — Business Logo Media Capability`, separately reviewed/authorised before any implementation or provisioning.
- **Files:** [MEDIA-001 assessment](../05-implementation/reports/11THONUS-MEDIA-001-mv206-media-storage-delivery-alignment-assessment-2026-10-08.md).
- **Rollback:** revert this documentation-only assessment/change-log commit; no runtime state exists to roll back.

---

---

## 2026-10-12 — EA-BL-001-CORR-002-B1R — Governed Staff Redemption Binding

- **Task:** Bind the existing `confirmRedemption` engine into the transaction-scoped Staff Counter after B1A.
- **Status:** Implementation pending Founder review; PR #307 remains open/unmerged; ITR paused. Entry `ad63568ee0b36612433b1d90be6167897cc5f371`.
- **Phone gate:** **PHYSICAL-PHONE VALIDATION — PASSED / FOUNDER APPROVED.** B1R does not reopen the accepted phone evidence.
- **Authority:** FD-UX-1/2/3A retained. Staff receives only resolved display name, current-Business programme/progress, awaiting count, available reward description and state. Reward ID is returned only when live `redemption.confirm` evaluation allows the actor; no email, phone, profile, cross-Business history, unrelated transactions, reviewer or Business Review threshold is exposed.
- **Binding:** B1R requires the current presented QR/Loyalty Number artifact and expected programme reference with the reward reference. The server re-resolves the artifact after live authorization, then checks customer, Business, programme, and available reward against the authoritative Reward before the existing engine runs. The callable still accepts no client-supplied customer identity, role, permission, ownership, or reward state.
- **Experience:** eligible Owner/Manager/explicitly granted Staff see `Use 11th`, then a confirmation dialog. Ineligible Staff see the bounded Manager/Owner handoff. Mutation-time permission reauthorization remains authoritative. Redemption remains separate from `recordPurchase`; no purchase or Verified Unit is issued by redemption. B1R does not change reward/cycle mechanics.
- **Documentation:** [B1R implementation report](../05-implementation/reports/11THONUS-post-phone-ux-correction-b1r-implementation-report-2026-10-12.md). The preceding [B1A report](../05-implementation/reports/11THONUS-post-phone-ux-correction-b1a-implementation-report-2026-10-12.md) records the earlier reward-awareness-only boundary; this entry supersedes that forward-looking statement after B1R implementation.
- **Boundary:** no PR #310 changes; no schema/migration, dependency, config, auth-provider, Cloudflare, redemption-authority, or Product Truth change; no B2 or ITR.
- **Rollback:** revert the B1R implementation commit(s) from PR #307; no migration rollback is required.

---

## 2026-10-07 — EA-BL-001-CORR-002-B — Authorisation Correction Pass (PR #306 review)

- **Task:** Make the authorised Slice B contract technically precise (documentation only; no code, test, schema, config or dependency change).
- **Status:** unchanged — **AUTHORISED / READY FOR IMPLEMENTATION**, not started.
- **Corrections:** purchaseDate frozen with the idempotency key across retries (P1, locked acceptance test); bounded error-discriminator backend enabler authorised; alphanumeric Loyalty Number keyboard; D1–D8 all Founder-disposed; replay wording qualified (authorisation still gates retries); Counter role scope follows `purchase.record`; camera scan primary, Loyalty Number manual fallback (no customer QR-copy); dual-role customers select Personal context.
- **Boundary:** Slices C/D/E NOT AUTHORISED / NOT STARTED; EA-BL-002, WP-COM, FEF-TLC-001 unchanged.
- **Files:** [assessment §23](../05-implementation/reports/11THONUS-EA-BL-001-CORR-002-B-staff-counter-authorisation-and-design-2026-10-07.md); Documentation Changes Log Entry 297.
- **Rollback:** revert the correction commit.

---

## 2026-10-07 — EA-BL-001-CORR-002-B — Staff Counter Founder Authorisation Recorded

- **Task:** Record Founder dispositions D1–D8 on PR #306. Documentation only; no code, test, schema, config, dependency or deployment change.
- **Status:** **AUTHORISED / READY FOR IMPLEMENTATION** (not started/implemented/accepted/merged). Supersedes the "DESIGN ASSESSED — AWAITING FOUNDER AUTHORISATION" entry below.
- **Dispositions:** D1 no customer profile lookup; D2 camera QR scanning + manual fallback (browser-native preferred; bounded dependency authorised); D3 tokenless two-device self-registration (no synthetic identity/handoff token/same-device switching); D4 and D5 deferred; D6 Staff-own recent activity enforced server-side (minimum API adjustment only); D7 Business name only; D8 bounded Staff shell.
- **Locked requirement:** uncertain/network failures preserve the same idempotency key (minimum architecture-consistent correction if not retryable; never a new key).
- **Gate:** Founder Preview (17 scenarios) required before acceptance.
- **Boundary:** Slices C/D/E NOT AUTHORISED / NOT STARTED; EA-BL-002, WP-COM, FEF-TLC-001 unchanged.
- **Files:** [assessment §22](../05-implementation/reports/11THONUS-EA-BL-001-CORR-002-B-staff-counter-authorisation-and-design-2026-10-07.md); Master Workflow §17; EIP §C.2; Prompt Register §4; Documentation Changes Log Entry 296.
- **Rollback:** revert the PR commit (documentation only).

---

## 2026-10-07 — EA-BL-001-CORR-002-B — Staff Counter Authorisation & Design Assessment

- **Task:** Analysis/design/governance only. No Slice B implementation; no code, test, schema, permission, config, dependency or deployment change.
- **Status:** **DESIGN ASSESSED — AWAITING FOUNDER AUTHORISATION.** Slice B **NOT AUTHORISED / NOT STARTED**. Entry `origin/main` `92ffd217668e64d3e38f6c45fb253d200766ffbb`; BR prerequisite satisfied.
- **Key findings:** existing backend suffices for a record-only Counter (`recordPurchase` + `review` outcome, threshold key absent for Staff); no pre-record customer lookup, no web QR scanner, no Staff progress read, Staff over-read Business purchases (pre-existing); assisted registration is tokenless two-device self-registration (no synthetic identity, no new token).
- **Founder decisions open:** D1 identity display, D2 QR capture, D3 registration handoff, D4 Staff progress, D5 redemption in Counter, D6 own-activity scoping, D7 branch label, D8 bounded Staff shell.
- **Carry-forward:** N4 binding (never expose the Business Review threshold to Staff); N1 not widened if Staff see only own submissions.
- **Files:** [assessment](../05-implementation/reports/11THONUS-EA-BL-001-CORR-002-B-staff-counter-authorisation-and-design-2026-10-07.md); Master Workflow §17; EIP §C.2; Prompt Register §4; Documentation Changes Log Entry 295.
- **Rollback:** revert the PR (documentation only).

---

## 2026-10-07 — EA-BL-001-CORR-002-BR — Post-Merge Closure & Status Synchronisation

- **Task:** Documentation-only closure of the Business Review Domain Foundation. No code, test, migration, schema, permission, config, dependency or deployment change.
- **Status:** **COMPLETE / ACCEPTED / MERGED — BR FOUNDATION CLOSED.** (Supersedes the "IMPLEMENTED — TECHNICAL REVIEW PENDING" entries below, which remain as historical record.)
- **Evidence:** authorisation PR #303 (merge `8d7491d6fa85879c6b2e75eed4198e18d073dd62`); implementation PR #304, reviewed head `a848cfe95f058a2cb9d650162f26cd51429f9cd8`, merge `75ae6acf30d66f6a39270ce400ca927258bbadeb`; exact-head CI run 37591490739 SUCCESS; Independent Technical Review APPROVE WITH NON-BLOCKING NOTES (no P0/P1/P2); Founder approved merge. Post-merge main CI run 37607673497 was in progress at writing (not recorded).
- **Carried forward (non-blocking):** N1 — pre-existing customer exposure of `recordedByUserId`/recorder attribution, a separate unauthorised privacy-hygiene candidate (not fixed); N4 — Staff/customer-facing Trust/activity/read surfaces must never expose the configured Business Review threshold (Trust Event data unchanged); PostgreSQL ordering issue PRE-EXISTING / NON-BLOCKING (not fixed).
- **Programme boundary:** BR prerequisite for considering Slice B satisfied; Slice B and Slice C remain NOT AUTHORISED / NOT STARTED; D/E, EA-BL-002, WP-COM, FEF-TLC-001 unchanged.
- **Files:** [closure report](../05-implementation/reports/11THONUS-EA-BL-001-CORR-002-BR-closure-2026-10-07.md); Master Workflow §17; EIP §C.2; Prompt Register §4; BR implementation report §16; Documentation Changes Log Entry 294.
- **Rollback:** revert the closure PR (documentation only).

---

## 2026-10-07 — EA-BL-001-CORR-002-BR — PR #304 Pre-Technical-Review Correction

- **Task:** Correct the bounded security/truthfulness findings on PR #304 before Independent Technical Review. No redesign; no Slice B/C.
- **Status:** **IMPLEMENTED — TECHNICAL REVIEW PENDING** (unchanged; not Complete). Entry head `e2697cf491eec366500db4ad8f1a938ccc02ca5a`; corrected head and exact-head CI run are recorded on PR #304.
- **Founder dispositions applied:** canonical permission id `purchase.businessReview`; rejection vocabulary `quantity_not_confirmed | transaction_not_confirmed | other` (approved, not expanded) with **`other` requiring a note**; sole-reviewer fail-closed confirmed.
- **Fixes:** (A) Customer waiting list and customer command results redact all Business Review attribution; (B) generic Business list/detail no longer enumerate or reveal the protected review queue to non-reviewers; (C) `businessReviewQuantityThreshold` removed server-side from Reward Program reads for non-reviewers (Staff); (D) recording confirmation now truthful for review-routed Purchases (EN/FR); (E) `other` requires a bounded internal note; (F) commercial-gate orthogonality proven under `enforce` (admitted / pending_admission only via Customer verification; no direct review→hold edge).
- **Validation (local):** functions unit 2015; web 941; PostgreSQL+emulator 746; emulator 877 (3 pre-existing skips); typecheck/format/eslint (changed files) green. Repo-wide lint closes only on green exact-head CI.
- **Boundary:** no WP-COM source change (commercial test files: migration bookkeeping only, boundary exemption tightened); no migration change; no deployment; no dependencies/config added.
- **Rollback:** revert the correction commit(s) on PR #304 (read-path redaction and web copy only; no schema change).

---

## 2026-10-06 — EA-BL-001-CORR-002-BR — Business Review Domain Foundation Implementation

- **Task:** Implement the authorised Business Review domain/backend foundation (no UI).
- **Status:** **IMPLEMENTED — TECHNICAL REVIEW PENDING.** Not Complete. Entry `origin/main` `8d7491d6fa85879c6b2e75eed4198e18d073dd62`; branch `feat/ea-bl-001-corr-002-br-implementation`; PR open and unmerged (see the PR for the exact head and CI run).
- **Migration:** `0028_business_review_foundation` (+ fail-closed `.down`): `business_review_required` status; per-version `business_review_quantity_threshold` (`NULL` = disabled; routing only); reviewer attribution + distinct `business_review_reason`; guard trigger (`business_review_required` entered only at INSERT, exits only to `waiting_for_customer`/`rejected`); evidence vocabularies. No new table.
- **State machine:** `∅ → business_review_required`; `business_review_required → waiting_for_customer` (approve) / `→ rejected` (reject). `under_review`, `pending_admission`, customer `rejection_reason` and `bulk_review_threshold` untouched.
- **Permission:** `purchase.businessReview` (repository camelCase spelling of the design's `purchase.business_review`) — Owner floor, Manager default/revocable/re-grantable, **Staff structurally ineligible** (no grant path; constructor refuses and evaluator independently ignores a fabricated Staff grant), no Platform Administrator/Customer authority.
- **Invariants:** approval and rejection create **no** Verified Unit, Cycle allocation or Reward (customer verification stays mandatory); strict **reviewer ≠ recorder** with no exception (DB CHECK backstop; sole-reviewer fails closed); threshold crossing never auto-rejects.
- **Surface:** `approveBusinessReview`, `rejectBusinessReview`, `listBusinessReviewQueue` callables; additive `review` field on the record-purchase result; neutral customer copy (EN "Waiting for business confirmation" / FR "En attente de confirmation du commerce").
- **Validation (local):** functions unit 2015, web unit 938, PostgreSQL+emulator 724 (37 BR integration + 10 migration), emulator 877 (3 pre-existing skips), preview tooling 44; build/typecheck/lint/format green.
- **Programme boundary:** Slice B/C/D/E not authorised; Slice B remains blocked until BR is reviewed, accepted and merged. EA-BL-002 unstarted. No WP-COM source change (commercial *tests* updated only for the new migration head). FEF-TLC-001 not adopted. No deployment.
- **Founder attention:** the Business-review reason vocabulary (`quantity_not_confirmed | transaction_not_confirmed | other`) is a minimal implementation-level choice awaiting confirmation; sole-reviewer deadlock is intentional.
- **Files:** see [BR implementation report](../05-implementation/reports/11THONUS-EA-BL-001-CORR-002-BR-implementation-report-2026-10-06.md).
- **Rollback:** revert the PR; a database with no Business Review data rolls back via `0028.down`; a populated database refuses rollback by design.

---

## 2026-10-06 — EA-BL-001-CORR-002-BR — Business Review Domain Foundation Authorisation & Design

- **Task:** Analyse the current purchase lifecycle and, if Product Truth supports it, authorise the Business Review Domain Foundation (analysis + governance/design confirmation only).
- **Status:** **BR AUTHORISED — READY FOR IMPLEMENTATION** under `DEC-PROD-015`. Entry `origin/main` `961fc272abf6f50656973cdbb361dbec90ddd289`.
- **Design:** distinct `business_review_required` state; per-version quantity-threshold routing (`NULL` = disabled; routing only); `purchase.business_review` permission (Owner default, Manager default revocable, Staff INELIGIBLE with no grant path; no Platform Administrator/Customer authority); strict reviewer-`!=`-recorder rule (no sole-reviewer exception authorised); Trust/event evidence reuse; neutral customer visibility excluded from verifiable/pending reads; proposed migration `0028` delta (not executed); T1–T10 matrix; atomic concurrency. `under_review` (customer dispute) and `pending_admission` (commercial hold) untouched; `bulk_review_threshold` stays visibility-only; business-review rejection requires a distinct business-reason representation and MUST NOT reuse customer `rejection_reason` semantics; no Product Truth conflict.
- **Correction (2026-10-06, same PR):** Staff grant path removed (Staff INELIGIBLE, no explicit-grant path; grant-eligible `["manager"]` for re-grant after revocation only); EIP current-state contradiction corrected (BR AUTHORISED, implementation NOT STARTED; Slice B NOT AUTHORISED until BR implementation is reviewed/accepted/merged). No redesign; no new Founder decision.
- **Authorises BR ONLY.** Does not authorise Slice B/C/D/E, EA-BL-002, WP-COM, FEF-TLC-001, deployment, or implementation. Slice B remains blocked until BR is implemented and merged.
- **Files:** governance documentation only. See [BR authorisation & design report](../05-implementation/reports/11THONUS-EA-BL-001-CORR-002-BR-authorisation-and-design-2026-10-06.md).
- **Deployment/schema/dependencies/config:** none. No application code changed. No migration executed.
- **Rollback:** revert this documentation-only change set; programme records return to “BR NOT AUTHORISED”.

---

## 2026-10-05 — EA-BL-001-CORR-002-A — Post-Merge Closure

- **Task:** Close Slice A after verifying its successful merge and exact-head evidence chain.
- **Status:** **COMPLETE / ACCEPTED / MERGED.** PR #300 final reconciled head `cd2ffbbac6e0edffd7ab19cf480a50731783dfb8`; merge commit `facf59c73ddea3404d70469a490dd6cbc8e6d126`. Current `origin/main` was that exact merge commit when closure work began.
- **Evidence:** authority `DEC-PROD-015` plus Experience Assembly authority reconciliation; frozen prototype SHA `18e8d700f505beefe46d324f6ea33f20a670abe7`; Founder Preview ACCEPTED; Independent Technical Review APPROVED WITH NON-BLOCKING NOTES; Founder Final Confirmation / Manual QA SATISFIED; exact-head CI run [37337547775](https://github.com/Fkenogo/11THONUS/actions/runs/37337547775) SUCCESS; PR #300 merged.
- **NB dispositions:** NB-001 (hard-coded display threshold 10) remains informational under fixed ten-Verified-Unit Product Truth. NB-002 (inner `max-w-xl` constrained by parent `max-w-md`) remains informational. Neither requires correction.
- **Programme boundary:** BR remains next candidate for separate Founder authorization, not authorized or started. Slice B remains blocked on BR. B–E unauthorized/unstarted; EA-BL-002 unstarted; WP-COM untouched; FEF-TLC-001 not adopted.
- **Files:** governance documentation only. See [post-merge closure report](../05-implementation/reports/11THONUS-EA-BL-001-CORR-002-A-post-merge-closure-2026-10-05.md).
- **Deployment/schema/dependencies/config:** none. No application code changed.
- **Rollback:** revert the documentation-only closure PR; the previously merged implementation remains unaffected.

---

## 2026-10-05 — EA-BL-001-CORR-002-A — Customer Identity & Circle

- **Task:** Assemble the customer Identity/Circle vertical slice from the frozen prototype using real server-authoritative state.
- **Base/authority:** PR #299 merge `76214100400b0df43082b29f6ddd46e13c3dd5d2`; Slice A only. Implementation commit `e5bd42dc0fa5d97f4533b311458c861e61dec1b1`; draft PR #300.
- **Implementation:** Auth-context-derived canonical identity/QR read; customer-scoped Cycle, Pending Unit, reward and activity projection; prototype-faithful home/Circle/activity/profile and mobile navigation; English/French copy.
- **Data/security:** Pending Units project only from `waiting_for_customer`; Verified Units use persisted Cycle allocations; Reward availability uses the existing server read; no client-supplied customer identity authority, confirmer disclosure, schema change or new dependency.
- **Validation:** Web 937/937; Functions 1,982/1,982; TypeScript, ESLint, Prettier and production build pass; preview tooling 44/44; migrated PostgreSQL read smoke check passed.
- **Preview status:** Blocked by emulator ports held by a separate running preview; exact-branch browser comparison, E2E and Founder acceptance remain pending. Full report: [EA-BL-001-CORR-002-A report](../05-implementation/reports/ea-bl-001-corr-002-a-customer-identity-circle-implementation-report-2026-10-05.md).
- **Disposition:** Do not call Slice A complete until Founder Preview and visual acceptance pass. No merge; no later slice started.

---

## 2026-10-03 — EA-002-CORR-002 — Founder Preview Cross-Project Port Isolation (PR #297)

- **Task:** Give the local Founder Preview a coherent 11thONUS-specific port allocation so it runs beside other projects without changing or stopping their processes.
- **Implementation commit:** `0496be735e18ca6be746345887f5507c2f962260`; review-fix commits and final exact head are recorded in the linked report; PR #297 is open and unmerged.
- **Port block:** Auth 28101, Functions 28102, Firestore 28103, Storage 28104, Hosting 28105, Emulator UI 28106, Hub 28107, logging 28108, web 28109, PostgreSQL 28110.
- **Safety:** bind-only collision checks; readiness HTTP requests only for positively owned preview processes; PostgreSQL publishes on loopback; existing EA-002 demo-project, destructive-operation, process-ownership and Commercial gate guards retained.
- **Validation:** preview guards/ports 44/44; focused Firebase client tests 15/15; web and Functions typechecks pass; ESLint, Prettier, JavaScript syntax and `git diff --check` pass. Exact-head CI passed, including cross-project port-isolation acceptance, browser journeys, PostgreSQL integration and Firebase Emulator Suite validation.
- **Boundaries:** no dependencies, migrations, schema, `functions/src`, Product Truth, Commercial logic or admission-gate changes. Browser Firebase source changes only select local emulator ports when emulator mode is enabled.
- **Files:** see the [implementation report](../05-implementation/reports/ea-002-corr-002-founder-preview-cross-project-port-isolation-implementation-report-2026-10-03.md) for the complete 28-file PR inventory and validation details.
- **Automated review dispositions:** all four findings were investigated and corrected: pass the Functions URL into browser evaluation; persist/check the emulator port fingerprint before readiness requests; use web port 28109 in the runbook; create the CI preview database through PostgreSQL host port 28110. See the implementation report for details.
- **Disposition:** ready for Founder review; do not merge without Founder approval. PR #295 / EA-003 remains open and untouched.

---

## 2026-10-03 — EA-002-CORR-001 — Automated Review Corrections (PR #296)

- **Date:** 2026-10-03
- **Task:** Correct five P2 automated findings on the Founder Preview Emulator UI port collision correction; PR #296 remains unmerged.
- **Corrections:** verify `demo-11thonus` UI readiness before reusing a suite; stop only a positively identified stale owned suite using the old UI config; probe IPv4 loopback only; fail closed on `EADDRINUSE`/`EACCES` and propagate unexpected bind errors; isolate port-4000 testing from real port 4001; bound Emulator UI readiness requests to five seconds.
- **Validation:** `node --test tests/preview/guards.test.mjs tests/preview/ports.test.mjs` — 42/42 pass with local networking enabled. The first PR head CI passed on `c15c710…`; corrected head CI is pending rerun.
- **Files:** `tests/preview/cli.mjs`, `tests/preview/lib/emulatorClient.mjs`, `tests/preview/lib/ports.mjs`, `tests/preview/lib/runtime.mjs`, `tests/preview/ports.test.mjs`, the implementation report, this change log, and the governance documentation log.
- **Product boundary:** no `apps/web/src` or `functions/src` changes; no dependency, schema, Commercial, Product Truth, or admission-gate changes. EA-002 guards preserved.
- **Disposition:** do not merge until corrected exact-head CI passes and automated review is clear; then await Founder approval.

---

## 2026-10-02 — EA-002-CORR-001 — Founder Preview Emulator UI Port Collision (Correction)

- **Date:** 2026-10-02
- **Phase:** Experience track — local runtime correction (no screens, no product API)
- **Task:** EA-002-CORR-001 — the Founder Preview failed on a Mac where another local project held port 4000 (Emulator UI: "Could not start Emulator UI, port taken").
- **Status:** Implemented — pending Founder review. Entry `origin/main` `ae4f05f`; branch `claude/sleepy-babbage-6kxfof`. Isolated from PR #295 / EA-003. Not merged.
- **Change:** Emulator UI port **4000 → 4001** in `firebase.json` and `tests/preview/lib/config.mjs` (Auth 9099, Functions 5001, Firestore 8080 unchanged); new bind-only port preflight before the emulators are launched; Emulator UI readiness now identifies the demo project's UI; drift test between `firebase.json` and the tooling config.
- **Tests / validation:** preview tooling 39/39 (15 new); lint 0 errors; format check clean; real runtime start → verify → reset → verify → browser journeys 18/18 with an unrelated listener on 4000; start refused cleanly with an unrelated listener on 4001. Details in the report.
- **Configuration / dependencies / migrations:** `firebase.json` UI port; no dependency; no migration.
- **Product Truth:** unchanged. No `apps/web/src` or `functions/src` change. Guards untouched.
- **Rollback:** `git revert` the correction commit.
- **Report link:** [`ea-002-corr-001-emulator-ui-port-collision-implementation-report-2026-10-02.md`](../05-implementation/reports/ea-002-corr-001-emulator-ui-port-collision-implementation-report-2026-10-02.md)

---

## 2026-10-02 — EA-002 — Local Founder Preview Foundation (Implementation)

- **Date:** 2026-10-02
- **Phase:** Experience track — local runtime foundation (no screens, no product API)
- **Task:** EA-002 — one reliable local Founder Preview workflow: PostgreSQL + canonical migrations + Firebase emulators + Functions + web app + deterministic seed/reset + preview identities (Owner, Manager, Staff, Customers, Operator) + Playwright-compatible data + runbook. Built on the accepted `11THONUS-EA-001` assessment.
- **Status:** Implemented — pending Founder review. Entry `origin/main` `c064f43659d87922d14bb4a245d94a5dfe8d918d`; branch `claude/kind-franklin-hg8iey`.
- **Files changed:** see the [Implementation Report](../05-implementation/reports/ea-002-local-founder-preview-foundation-implementation-report-2026-10-02.md). Summary: new `tests/preview/**` (CLI, guards, runtime, seed, fingerprint, identities), `tests/e2e/preview/preview-identities.spec.ts`, `docs/runbooks/founder-preview-runbook.md`; modified `package.json` (preview scripts), `playwright.config.ts` (2 preview projects), `eslint.config.js`, `.gitignore`, `.prettierignore`, `.github/workflows/ci.yml` (preview acceptance steps), `README.md`. **No change** under `apps/web/src`, `functions/src`, migrations, Firebase config, dependencies or the Experience Reference.
- **Tests / validation:** build, typecheck, lint (0 errors), format; unit functions 1971 / web 926; preview guards 24; PostgreSQL suite 678 (19 files); emulator suite 877 (+3 skipped); Playwright default 41, emulator 18, preview 18 (desktop + Pixel 7); clean-state `preview:start → verify → reset → verify` proven.
- **Configuration / dependencies / migrations:** scripts, CI steps, lint/prettier ignores only; no dependency; no migration (the existing 27 are applied by the existing runner).
- **Product Truth:** unchanged. Commercial admission gate **OFF** (tooling refuses otherwise); no held Purchases seeded; Terms accepted through the real callable against the existing test-only fixture (screen still unavailable, `DEC-LEGAL-002`); `PB-013B P3-3` remains **OPEN**; `WP-COM-06b` not started; Cloudflare Tunnel not implemented (requirements recorded).
- **Founder decisions:** D-6 and D-9 proceeded on EA-001 recommendations (local only) and flagged for confirmation — see report §8.
- **Risks / deviations:** report §9 (seams found) and §12.
- **Rollback:** `git revert`; delete `.preview/`; optional `docker compose -f docker-compose.postgres.yml down -v`.
- **Report link:** [`ea-002-local-founder-preview-foundation-implementation-report-2026-10-02.md`](../05-implementation/reports/ea-002-local-founder-preview-foundation-implementation-report-2026-10-02.md)

---

## 2026-10-02 — 11THONUS-EA-001 — Founder Preview & Experience Assembly Readiness Assessment (Assessment)

- **Date:** 2026-10-02
- **Phase:** Experience track — assessment (no implementation)
- **Task:** 11THONUS-EA-001 — assess how implemented Product Truth can be assembled through the frozen Experience Reference into a local, mobile-first Founder Preview (Business Owner/Manager, Frontline, Customer, Operator Console); design seed/reset, test model, local runtime, auth/role strategy, Cloudflare Tunnel suitability; recommend bounded Experience Assembly packages.
- **Status:** Assessment complete — pending Founder review. Entry `origin/main` `c064f43659d87922d14bb4a245d94a5dfe8d918d` (`WP-COM-06a` merge present); branch `claude/kind-franklin-hg8iey`.
- **Experience Reference:** `Fkenogo/11thonus-prototype` @ `18e8d700f505beefe46d324f6ea33f20a670abe7` (verified as the prototype repository `main` HEAD) — **UNCHANGED / FROZEN**; read-only clone outside the working tree.
- **Files changed:** documentation only — the [assessment report](../05-implementation/reports/11THONUS-EA-001-founder-preview-and-experience-assembly-readiness-assessment-2026-10-02.md); this entry; `docs/00-governance/documentation-changes-log.md` (Entry 281 + header).
- **Headline findings:** engine largely complete; **no Frontline counter or redemption UI**, **no Operator Console and no Operator endpoint/read models**, customers cannot see their own Loyalty Number/QR or Circle progress (backend reads missing), **no local runtime orchestration or migration CLI**; four prototype-vs-Product-Truth discrepancies flagged for Founder decision (instant progress vs customer verification; Manager Approvals and quick-add customer unauthorised; bottom-nav vs earlier Founder instruction; superseded `$1`/5-unit values). Cloudflare Tunnel: **suitable with bounded changes**. 14 open Founder decisions recorded; recommended next package `EA-002` Local Preview Foundation.
- **Tests / validation:** documentation only; `prettier --check` on the report; no code, build or test run was required or performed; no services started.
- **Configuration / dependencies / migrations:** none.
- **Product Truth:** unchanged. Commercial gate **default OFF** and untouched; `WP-COM-06b` **not started**; `PB-013B P3-3` remains **OPEN**; nothing deployed; no tunnel created.
- **Risks:** report §23 (R-1…R-15). Items labelled UNVERIFIED in the report (Auth-emulator TOTP, HTTPS callable emulator origin, tunnel behaviours) require spikes.
- **Rollback:** delete the report; `git checkout origin/main -- docs/changes/IMPLEMENTATION_CHANGES.md docs/00-governance/documentation-changes-log.md`. No data, schema, configuration or deployment rollback is needed.
- **Report link:** [`11THONUS-EA-001-founder-preview-and-experience-assembly-readiness-assessment-2026-10-02.md`](../05-implementation/reports/11THONUS-EA-001-founder-preview-and-experience-assembly-readiness-assessment-2026-10-02.md)

---

## 2026-10-01 — WP-COM-06a — Held-Purchase Processor Activation & Recovery (Implementation)

- **Date:** 2026-10-01
- **Phase:** Commercial implementation programme (11THONUS-COMMERCIAL-DESIGN-001 v1.1 + CORR-002, §8.11–§8.13, §22.3, §24)
- **Task:** WP-COM-06a — make the WP-COM-05b held-Purchase processor operationally safe. A **best-effort post-commit signal** (not a transactional outbox) after the Commercial mutations that can raise capacity (`confirmSettlement`, `grantTrial`, positive `adjustTrial` / `adjustCommercialCredit`, `restoreCommercialStanding`; `activatePaidService` deliberately **not** a trigger), coalesced per Business + 60 s window (a later signal in the same window is still processed via a claim counter); a **scheduled recovery** Function (`recoverHeldPurchases`, every 5 minutes, deployment-time cadence) with a persisted Business cursor (no starvation beyond 100 Businesses) and a rotating tail window (rows beyond the 1000-Purchase window are eventually reached); per-Purchase / per-Business failure isolation with transient / concurrency-winner / permanent classification; backlog observability (structured logs + persisted run state); an operations runbook. No admission logic added — every admission still runs through the unchanged `reevaluatePendingAdmissions`. The gate remains **default OFF**; nothing enables `enforce`.
- **Status:** Implemented — pending review. Not merged. Entry `origin/main` `bb22f43af8a1696e04799f4ccd9dd234af7542cb`; branch `claude/gallant-ramanujan-vzw1zd`. A previous session's claim of WP-COM-06a was found to have no code anywhere on GitHub; this is a fresh implementation.
- **Files changed:** see the [Implementation Report](../05-implementation/reports/wp-com-06a-held-purchase-processor-activation-and-recovery-implementation-report-2026-10-01.md) §20. Summary: 5 new source files, 8 modified (the command runner + five one-line eligibility predicates, the processor's failure isolation / continuation window, two exports in `index.ts`), 4 new test files (39 PostgreSQL, 10 emulator, 28 unit), runbook `docs/runbooks/held-purchase-processor-runbook.md`.
- **Tests / validation:** build, lint (0 errors; 1 pre-existing warning), format, typecheck; unit (functions 1971, web 926); full PostgreSQL suite under the Firestore Emulator, cold cache, fresh DB (19 files, 677 tests); emulator suite with Auth + Firestore (67 files, 877 passed, 3 skipped); Playwright e2e 41 passed; both new Functions loaded by the real Functions emulator. Four mutation checks confirmed the fairness, tail-window, post-commit and classification tests fail when violated. Technical Assurance review TA-REV-001 (two findings) addressed: a continuation-state failure is never a successful run (status `partial`, the scheduled invocation fails, an error log is written before Firestore persistence); the signal timeout bounds the command's WAIT only and the contract now says so (no cancellation claimed). A pre-existing warm-cache PostgreSQL ordering flake (reproduced on untouched `main`) is recorded in report §22.
- **Configuration / dependencies:** no committed configuration, dependency, `package.json`, lockfile or Firebase config change. One new optional runtime variable, `HELD_PURCHASE_PROCESSOR_MODE=drain` (absent by default), alongside the existing `PURCHASE_ADMISSION_GATE_MODE`.
- **Migrations:** none (existing partial index `purchase_records_pending_admission_fifo_idx` serves every new query).
- **Deliberately not implemented:** durable PostgreSQL outbox, Business/Operator read models and UI (WP-COM-06b), an endpoint for the Commercial commands, payment provider, Cloud Monitoring metrics/alerts and Firestore TTL policies (deployment actions). **Redemption, the WP-COM-04 projector, `admitOrHoldPurchase`, the 05b policy, Reward Program / Qualifying Item code, `apps/` and the prototype: zero diff.**
- **Product Truth:** unchanged. **PB-013B P3-3 remains OPEN** — untouched, not worsened.
- **Risks / deviations:** report §24–§25 (D1–D7, R-1–R-8). Notably R-1: no production path runs the Commercial commands yet, so scheduled recovery is the only live path until they are wired. Gate-enforcement readiness (technical only): **READY WITH CONDITIONS**; the gate stays OFF.
- **Rollback:** `git revert`; no schema change; unset the two environment variables, pause the scheduler job, or delete the Functions. See runbook §10.
- **Report link:** [`wp-com-06a-held-purchase-processor-activation-and-recovery-implementation-report-2026-10-01.md`](../05-implementation/reports/wp-com-06a-held-purchase-processor-activation-and-recovery-implementation-report-2026-10-01.md)

---

## 2026-10-01 — WP-COM-05b — Commercial Admission Gate, Earmarks & Held-Purchase Processor (Implementation)

- **Date:** 2026-10-01
- **Phase:** Commercial implementation programme (11THONUS-COMMERCIAL-DESIGN-001 v1.1 + CORR-002, §4.4, §5, §7, §8.1–§8.17, §22–§24)
- **Task:** WP-COM-05b — the actual Commercial admission decision. A valid Purchase that would start a **new Circle** is **ADMITTED** when usable capacity (balance − reserved) exists and otherwise **HELD** as `pending_admission` (valid, preserved, credit-free). ADMIT reserves capacity and writes an immutable earmark (funding bucket fixed at admission, never reclassified) in the transaction that creates the Verified Unit, parent before child. A callable, repeat-safe, FIFO processor (`reevaluatePendingAdmissions`) admits held Purchases when capacity returns. A Purchase continuing an admitted Circle is never gated and takes no Commercial lock. The gate defaults to `off` (behaviour byte-identical to before); `PURCHASE_ADMISSION_GATE_MODE=enforce` enables it.
- **Status:** Implemented — pending review. Not merged. Entry `origin/main` `94fa71e6516ab5376fa355eaf9f771db6fa01aa9`; branch `claude/exciting-brahmagupta-kxkep4`.
- **Files changed:** see the [Implementation Report](../05-implementation/reports/wp-com-05b-commercial-admission-gate-earmarks-and-held-purchase-processor-implementation-report-2026-10-01.md). Summary: new migration `0027_commercial_admissions_and_earmarks` (+ `.down.sql`); Commercial admission model/repository/service; Purchase `purchaseAdmissionPort`, `admitOrHoldPurchase`, `reevaluatePendingAdmissions`; one composition-root binding; `verifyPurchase` discriminated outcome; web status handling and EN/FR copy; new 59-test PostgreSQL suite and 8 boundary tests; migration-bookkeeping updates in existing tests.
- **Idempotency / locks:** HOLD writes no `admit:<purchase_id>` key (proven by rows and by statement trace); ADMIT reserves it only after the locked decision. Lock order `[client key] → purchase → stream → Cycle → [account] → decision → admit key → Verified Unit → reservation → admission → earmarks → allocation`, asserted from the real statement trace; no Reward or price lock.
- **Tests / validation:** typecheck, lint (0 errors; 1 pre-existing `apps/web` warning), format, build, unit (functions 1943, web 926), full PostgreSQL suite under the Firestore Emulator (18 files, 624 tests, fresh database) and the emulator suite (66 files, 867 passed, 3 skipped) green locally against a disposable PostgreSQL 16; the 05a gate-off golden still matches `main`. Three mutation checks confirmed the idempotency-timing, grace and parent-before-child tests fail when violated.
- **Configuration / dependencies:** one optional environment variable, `PURCHASE_ADMISSION_GATE_MODE` (`off` default | `enforce`); no dependency, `package.json`, lockfile or Firebase config change.
- **Migrations:** `0027_commercial_admissions_and_earmarks` — additive: two Commercial tables, deferred reservation↔earmark consistency trigger, the `earmark_id` foreign key `0025` left open, a consumption-bucket guard. No data, no Loyalty table change, no payment/scheduler/read-model schema. `.down.sql` fails closed while any admission/earmark exists. Applied only to a local disposable test database.
- **Deliberately not implemented:** scheduler and automatic triggers for the processor, `shadow` mode, Operator Console / read models, payment provider, Experience Assembly. **`confirmRedemption`, the WP-COM-04 projector, Reward Program/Qualifying Item code and the prototype: zero diff.**
- **Product Truth:** unchanged. Held-Purchase wording is provisional pending Experience Assembly and exposes no commercial detail (a read-model leak of event payloads was found and closed).
- **Risks / deviations:** report §23–§24 (D1–D10, R-1–R-7). **PB-013B P3-3 remains OPEN** — untouched, not worsened.
- **CORR-001 (Founder decision):** processor policy changed from strict FIFO to **FIFO scan order + skip-and-continue** — a non-fitting held Purchase stays held and the scan continues; the Business-wide no-overtaking rule is not applied by the processor (the stream rule is); window 100 → 1000. Residual starvation risk (a large Purchase can stay held while smaller ones admit) recorded, with no priority aging added. Negative-paid-balance pooled-capacity rule **retained unchanged** (Founder-confirmed; not a defect; a test pins it). Report §24B.
- **Deployment prerequisite:** do NOT enable `enforce` until (1) relevant Businesses have Commercial accounts, (2) trial/paid capacity is provisioned, (3) a production-safe invocation path for held-Purchase re-evaluation exists, and (4) held-backlog read/alerting exists. Report §24A also records two policy findings for Founder decision: strict-FIFO head-of-line blocking (Purchase costs differ) and the shared-pool availability rule (a negative paid balance reduces usable capacity even when uncommitted trial exists).
- **Rollback:** unset/`off` the gate variable (instant); `git revert`; `migrateDown` rolls `0027` back on a database with no admission/earmark rows (fails closed otherwise).
- **Report link:** [`wp-com-05b-commercial-admission-gate-earmarks-and-held-purchase-processor-implementation-report-2026-10-01.md`](../05-implementation/reports/wp-com-05b-commercial-admission-gate-earmarks-and-held-purchase-processor-implementation-report-2026-10-01.md)

---

## 2026-10-01 — WP-COM-05a — Purchase Admission Seam & `pending_admission` Foundation (Implementation)

- **Date:** 2026-10-01
- **Phase:** Commercial implementation pro…242152 tokens truncated… or Identity Platform API directly; (2) `revokeRefreshTokens` does not immediately invalidate existing ID tokens (~1 hour window); (3) session revocation and factor removal are separate operations requiring both to be performed; (4) the bootstrap precedent (`bootstrapPlatformAdministrator.ts`) provides a proven backend-only trust boundary for break-glass recovery; (5) no existing `platformAdministration` recovery mechanism exists — this is net-new design.
- **Threat analysis:** 15 scenarios analyzed (attacker with password, stolen session, malicious administrator, collusion, single-admin lockout, compromised service account, replay, duplicate execution, wrong target, partial failure, suspended administrator, expired request).
- **Founder decisions:** 10 decisions required covering recovery authority, self-approval prohibition, approval cardinality, break-glass authority, session revocation, lifecycle interaction, persistent request model, expiry, mandatory re-enrollment, and audit vocabulary.
- **Configuration:** none.
- **Migrations:** none.
- **Risks:** none — design only. Implementation risk deferred to AUTH-MFA-003D implementation package.
- **Rollback:** revert this task's commit(s) — documentation only.
- **Report link:** [`docs/05-implementation/reports/AUTH-MFA-003D-DESIGN-001-platform-administrator-mfa-recovery-assessment-2026-09-07.md`](../05-implementation/reports/AUTH-MFA-003D-DESIGN-001-platform-administrator-mfa-recovery-assessment-2026-09-07.md).

---

## 2026-09-07 — AUTH-MFA-003D-DESIGN-001-CORR-001 — Corrections to the MFA Recovery Policy and Architecture Assessment

- **Date:** 2026-09-07
- **Phase:** TRD22 Phase 12 identity/security enablement (Platform Administrator MFA — correction to the AUTH-MFA-003D design assessment on PR #232, pushed to the existing `docs/auth-mfa-003d-design-001` branch; base unchanged at `origin/main` `a7b3a43756837390d60137a96883c8925b8e306e`). **Design/assessment only — no production implementation.**
- **Status:** Corrected — **READY FOR FOUNDER RECOVERY POLICY DISPOSITION**
- **Files changed:** the [design assessment report](../05-implementation/reports/AUTH-MFA-003D-DESIGN-001-platform-administrator-mfa-recovery-assessment-2026-09-07.md) (superseding correction appended + affected sections corrected), `docs/changes/IMPLEMENTATION_CHANGES.md` (this entry), and `docs/00-governance/documentation-changes-log.md` (Entry 176 original preserved; Entry 177 added). **No production code, configuration, Firebase state, or dependencies changed.**
- **Eight findings corrected (all genuine):**
  1. **Locked-out requester path (P1):** the affected administrator cannot use the normal authenticated application path (primary factor accepted → `auth/multi-factor-auth-required` → no resolved `UserCredential` → no AUTH-03 token → no session). Request creation is now designed as a bounded pre-MFA recovery proof (proves primary-factor possession without granting privileged access) or an independently authenticated actor/operator creating the request on the target's behalf. Founder section updated.
  2. **Approver MFA (P1):** every in-product Platform Administrator approver must be active and satisfy the server-verified MFA path (`verifiedMfaSatisfied === true`). No active-status-only, no factorless, no client-declared MFA. Backend/service-account break-glass operator uses a separate governed trust boundary.
  3. **Revocation fail-closed (P1):** `approved → revoke → revocation succeeds → THEN factor reset`. If revocation fails, request remains failed/retryable and factor reset MUST NOT proceed.
  4. **Factor-enrollment binding (P1):** recovery binds to the exact original TOTP enrollment via immutable `targetFactorEnrollmentId`; retries never remove a replacement factor; idempotent/complete if already gone.
  5. **ID-token lifetime vs backend acceptance (P2):** `exp` (~1 h) does not make a pre-revocation token usable against 11thONUS — the verifier calls `verifyIdToken(rawToken, true)` at `firebaseTokenVerifier.ts:174`. One-hour window no longer an accepted residual risk.
  6. **Server-side factor-removal API reconciled (P2):** primary verified backend path is Identity Platform **v1 Admin** `projects.accounts.update` (`POST /v1/projects/{targetProjectId}/accounts:update`; service-account/OAuth2; IAM `firebaseauth.users.update`; `localId`; `mfa` `MfaInfo` overwrite). Client-facing v2 `accounts.mfaEnrollment:withdraw` (user `idToken`) is NOT a service-account path. Admin SDK `updateUser` blocked by #2995.
  7. **Baseline SHA (P2):** corrected to `a7b3a43756837390d60137a96883c8925b8e306e` in both places in the controlled log (the previously recorded SHA did not exist).
  8. **File inventory (P2):** corrected to the actual three-file diff (report + IMPLEMENTATION_CHANGES.md + documentation-changes-log.md).
- **Validation:** docs-only; repository format/line-length checks pass; PR CI re-runs at the corrected head.
- **Configuration:** none. **Migrations:** none. **Risks:** none added — design only; implementation risk deferred to AUTH-MFA-003D implementation package.
- **Rollback:** revert this task's commit(s) — documentation only; original Entry 176 and the base assessment remain preserved as superseded.
- **Report link:** [`docs/05-implementation/reports/AUTH-MFA-003D-DESIGN-001-platform-administrator-mfa-recovery-assessment-2026-09-07.md`](../05-implementation/reports/AUTH-MFA-003D-DESIGN-001-platform-administrator-mfa-recovery-assessment-2026-09-07.md).

---

## 2026-09-07 — AUTH-MFA-003D-FD-001 — Founder Recovery Policy Disposition, Design Closure, and PR #232 Merge

- **Date:** 2026-09-07
- **Phase:** TRD22 Phase 12 identity/security enablement (Platform Administrator MFA — Founder disposition and design closure on PR #232, branch `docs/auth-mfa-003d-design-001`; base `origin/main` `a7b3a43756837390d60137a96883c8925b8e306e`). **Governance/documentation only — no implementation, no live Firebase action.**
- **Status:** **COMPLETE / MERGED** — Founder approved the ten recovery decisions R1–R10 as one package (disposition `FD-MFA-R`, recorded as `DEC-SEC-005`); design assessment finalized as the approved design basis and closed; PR #232 merged at its exact reviewed final head. **`AUTH-MFA-003D` implementation = NOT STARTED / NOT AUTHORIZED by this recording.**
- **Founder decisions recorded (R1–R10, governing authority for a future implementation package):**
  1. **R1 — Recovery Request Authority:** normal recovery initiated on the target's behalf by an independent authorised Platform Administrator presenting server-verified MFA evidence; no target-initiated pre-MFA recovery-proof mechanism at MVP; break-glass when no eligible independent administrator.
  2. **R2 — Self-Approval:** prohibited without exception (target ≠ approver; target ≠ normal-path executor exercising approval authority).
  3. **R3 — Approval Cardinality:** one independent active MFA-satisfied approver at MVP (server-verified chain to `verifiedMfaSatisfied === true`; active status alone insufficient); no two-person requirement; break-glass if none eligible.
  4. **R4 — Break-Glass Authority:** explicit Founder authorization + backend/service-account execution; service account is execution mechanism only; fully attributable/audited; no public endpoint; no standing service-account authority.
  5. **R5 — Session Revocation:** mandatory and fail-closed before factor removal (`approved → revoke → revocation succeeds → verify approved factor binding → remove factor`); no natural-expiry downgrade; security invariant.
  6. **R6 — Administrator Lifecycle:** unchanged (`invited → active → suspended → removed`); recovery state separate; no activation/reactivation/role/status change; privileged access unavailable until MFA re-established.
  7. **R7 — Persistent Recovery Record:** persistent recovery-request record with controlled lifecycle; binds exact original factor enrollment (`targetFactorEnrollmentId`-equivalent immutable identifier); no TOTP secrets/codes/recovery credentials stored; retries never remove a replacement factor.
  8. **R8 — Approval Expiry:** one hour after approval if execution has not begun; expired = new approval, never revived/extended.
  9. **R9 — Re-enrollment and Fresh Challenge:** `old factor reset → fresh TOTP enrollment → end enrollment session → fresh primary sign-in → genuine TOTP challenge → Firebase MFA-resolved session → server verifies sign_in_second_factor`; no shortcut; security invariant.
  10. **R10 — Recovery Audit Vocabulary:** `mfa_recovery_requested/approved/executed/denied/expired`; **no `mfa_recovery_failed`** unless separately justified and approved.
- **Coherence:** initiating and approving administrator may be the same independent administrator unless existing architecture/authority requires separation; target self-approval remains prohibited; sole-administrator flows use the break-glass chain. Recovery remains TOTP-only. No new Platform Administrator role activated.
- **Files changed:** `docs/00-governance/decisions/decision-register.md` (added **`DEC-SEC-005`**; note added to `DEC-SEC-004`; header + total-records updated), the [design assessment report](../05-implementation/reports/AUTH-MFA-003D-DESIGN-001-platform-administrator-mfa-recovery-assessment-2026-09-07.md) (status finalized; new §34 Founder Disposition; §19/§30/§32 updated; editorial phrase corrected), `docs/00-governance/documentation-changes-log.md` (Entry 178 added), and `docs/changes/IMPLEMENTATION_CHANGES.md` (this entry). **No production code, configuration, Firebase state, or dependencies changed.**
- **Validation:** docs-only; repository format/line-length checks pass; PR CI re-ran SUCCESS at the new final head; no new review findings; PR #232 merged at the exact reviewed final head; post-merge `origin/main` and CI verified SUCCESS.
- **Configuration:** none. **Migrations:** none. **Risks:** none added — this task records policy only; implementation risk (including the Firebase v1 Admin factor-removal path and Admin SDK #2995) is deferred to the AUTH-MFA-003D implementation package, which must consume R1–R10 as fixed governing authority.
- **Rollback:** for this documentation task, revert the decision-recording commit(s); the design package is merged and preserved as the approved design basis (no production effect).

---

## 2026-09-07 — AUTH-MFA-003D-WP-001 — Controlled Implementation Work Package — AUTH-MFA-003D-IMPL-001

- **Date:** 2026-09-07
- **Phase:** TRD22 Phase 12 identity/security enablement (Platform Administrator MFA — controlled work-package authoring/governance, branch `docs/auth-mfa-003d-impl-001-wp`, isolated worktree; base `origin/main` `ebdb7cc80ba4930c4075321899b58df0620efc6a`). **Documentation/governance only — no production implementation.**
- **Status:** **RECORDED — PENDING FOUNDER REVIEW OF THE CONTROLLED WORK PACKAGE — NOT YET AUTHORISED FOR IMPLEMENTATION** — PR opened for Founder review, **not merged**; `AUTH-MFA-003D-IMPL-001` implementation **NOT STARTED**.
- **Framework:** FEF-EWPCS-001 v1.0 referenced but its template was **unavailable** in any authorized repository/working environment (verified; **no unofficial template fabricated**); FEF-EWPCS principles preserved and mapped onto current 11thONUS controlled-document conventions.
- **Placement:** `docs/05-implementation/reports/AUTH-MFA-003D-IMPL-001-work-package-2026-09-07.md` — no dedicated work-package directory exists; smallest logical controlled path adjacent to the governing `AUTH-MFA-003D-DESIGN-001` assessment (also in `docs/05-implementation/reports/`). No competing copies.
- **Work package records:** authority condition (implementation authorized only by `DEC-SEC-005`/`FD-MFA-R` + this merged controlled WP + explicit Founder execution authorization); classification (`AUTH-MFA-003D-IMPL-001`, Controlled Security Implementation Work Package; outcome limited to `IMPLEMENTED — AWAITING INDEPENDENT REVIEW` / `BLOCKED — DECISION REQUIRED`; never self-declares APPROVED/MERGED/CLOSED); R1–R10 fixed authority (zero discretion); primary security invariant (recovery restores the ability to establish MFA, never substitutes for `firebase.sign_in_second_factor`); persistent recovery model (semantics over syntax, no TOTP material); governed lifecycle; request/approval/denial/expiry security; mandatory fail-closed execution ordering (`revoke sessions → confirm success → factor reset`; STOP on revocation failure); exact-factor idempotency (absent ⇒ idempotent; replacement ⇒ fail closed, new decision); partial-failure model (six enumerated cases); provider boundary (Identity Platform v1 Admin `projects.accounts.update`, re-verify before implementation, no silent substitution with client `unenroll()`/`accounts.mfaEnrollment:withdraw`/unsupported Admin SDK path, material divergence ⇒ `BLOCKED — DECISION REQUIRED`); session revocation via existing backend architecture (`revokeRefreshTokens`, revocation-aware `verifyIdToken(rawToken, true)` intact); provider-adapter architecture; break-glass contract (no public endpoint, Founder-authorization evidence reference — not a client boolean, service-account execution-only, no lifecycle elevation, no MFA exemption); exactly five audit events with correct timing; Platform Administrator boundaries; smallest usable UI + exact EN/FR key parity; Firestore server-governance; concurrency protections; no recovery-to-MFA shortcut; security testing acceptance matrix (Authority/Persistent model/Execution/Audit/Break-glass/Regression); validation requirements with accurate TOTP Auth Emulator limitations; live-environment prohibition; out-of-scope list (incl. `AUTH-MFA-003E`, `ENG-P3-003B`, implementation PR merge); agent permissions; 25-item evidence requirement.
- **Files changed:** `docs/05-implementation/reports/AUTH-MFA-003D-IMPL-001-work-package-2026-09-07.md` (new), `docs/00-governance/documentation-changes-log.md` (Entry 179), `docs/changes/IMPLEMENTATION_CHANGES.md` (this entry). **`DEC-SEC-005` NOT modified; no recovery-policy decision changed.** No production code, configuration, Firebase state, or dependencies changed.
- **Validation:** docs-only; repository Prettier/format checks pass; PR CI runs on the pushed head.
- **Configuration:** none. **Migrations:** none. **Risks:** none added — records the contract only; implementation risk (Firebase v1 Admin factor-removal path, Admin SDK #2995, provider contract drift) is governed by the WP's `BLOCKED — DECISION REQUIRED` provisions.
- **Rollback:** for this authoring task, revert the WP-recording commit(s) — documentation only.

---

## 2026-09-07 — AUTH-MFA-003D-WP-AUTH-001 — Founder Execution Authorization Record

- **Date:** 2026-09-07
- **Phase:** TRD22 Phase 12 identity/security enablement. Documentation/governance authorization record on existing PR #233 branch `docs/auth-mfa-003d-impl-001-wp`, against Founder-reviewed pre-authorization WP head `b32eef5d576c4e9ad0bbea43d424f02ed6fba095`. **No production implementation or live Firebase action.**
- **Authorization:** `FD-AUTH-MFA-003D-IMPL-001` records Founder execution authorization for the bounded official `FEF-EWPCS-001` v1.0 work package under `DEC-SEC-005` / `FD-MFA-R` R1–R10.
- **Status:** **AUTHORISED — READY FOR IMPLEMENTATION.** This is execution authority for the exact work package, not a new security policy decision; it neither changes nor permits redesign of R1–R10.
- **Preserved controls:** the 23 acceptance criteria, all security invariants, required validation, explicit agent permissions, `Merge = NO`, and the **YES** High-Risk Review Gate remain unchanged. Future execution must still complete its remaining Entry Gate checks and follow: Entry Gate → implementation approach → independent approach review → contract/tests → independent contract/test review → substantive implementation → final independent review.
- **Files changed:** the authoritative WP, `docs/00-governance/documentation-changes-log.md` (Entry 181), and this record. No production code, dependency, configuration, decision, R1–R10 text, or Firebase state changed.
- **Validation:** documentation-only diff reviewed; PR CI must pass on the resulting authorization-recording head before merge.
- **Rollback:** revert this documentation-only authorization-recording commit. The prior FEF WP remains the governing package but returns to its pre-authorization state.

---

## 2026-09-07 — AUTH-MFA-003D-WP-002 — Official FEF Work Package Replacement

- **Date:** 2026-09-07
- **Phase:** TRD22 Phase 12 identity/security enablement. Documentation/governance correction on existing PR #233 branch `docs/auth-mfa-003d-impl-001-wp`; original PR head `126722c6089228e0230f41f6dcebc3fb1a9e38ce`; base `origin/main` `ebdb7cc80ba4930c4075321899b58df0620efc6a`. **No production implementation or live Firebase action.**
- **Status:** **PENDING FOUNDER AUTHORISATION — NOT EXECUTABLE.** This change replaces the provisional custom WP format with an official `FEF-EWPCS-001` v1.0 template instantiation; it does not grant execution authority.
- **Authority and placement:** FEF-EWPCS-001 v1.0, its Work Package Template, and its Completion Report Template were verified **APPROVED — ACTIVE**, effective 2026-09-07. The sole authoritative WP remains [`AUTH-MFA-003D-IMPL-001-work-package-2026-09-07.md`](../05-implementation/reports/AUTH-MFA-003D-IMPL-001-work-package-2026-09-07.md); no parallel document was created. `DEC-SEC-005` / `FD-MFA-R` R1–R10, `DEC-SEC-004` / `FD-MFA-2`, the merged design basis, and `AUTH-03` are consumed, not changed.
- **Security corrections carried forward:** R5 now requires revocation → confirmed success → authoritative post-revocation current-factor retrieval → exact-factor verification immediately before reset. An unexplained absent factor on first execution is not successful; durable evidence of the same recovery's prior provider-reset stage is required for retry reconciliation. A replacement factor always fails closed and provider semantics that cannot guarantee exact-factor safety require `BLOCKED — DECISION REQUIRED`. Recovery-state and Platform Administration audit persistence must be coordinated in one Firestore transaction; `outboxEntries` is an identity-domain projection and is not reused or extended.
- **FEF fields populated:** entry gate/hard authority stop; scope/out-of-scope/deferred decisions; dependencies; required implementation; invariants; prohibited shortcuts; 23 evidence-bearing acceptance criteria; required tests/validation; evidence; explicit permissions; high-risk review gate; expected state; stop conditions; and completion-report requirement.
- **Files changed:** the authoritative WP, `docs/00-governance/documentation-changes-log.md` (Entry 180), and this record. No production code, dependency, configuration, decision, R1–R10 text, or Firebase state changed.
- **Validation:** documentation format and repository validation run on the corrected head; PR #233 remains open for fresh review and must not be self-merged.
- **Rollback:** revert this documentation-only correction commit. Entry 179 remains historical provenance and is explicitly superseded; the official replacement is restored by reverting this entry and the WP replacement together.

---

## 2026-09-19 — 11THONUS-CF-001 — Cloudflare Capability & Architecture Alignment Assessment

- **Date:** 2026-09-19
- **Task:** 11THONUS-CF-001 (Miledge portfolio alignment follow-on to MCPA-001/KCF-001; assessment only)
- **Status:** Assessment complete — awaiting Founder review. No merge performed.
- **Scope honouring:** no production deployment, DNS change, authentication migration, database migration, runtime migration, or Cloudflare infrastructure created; no application code changed; no unrelated files modified.
- **Files changed:** new `docs/05-implementation/reports/11thonus-cf-001-cloudflare-capability-and-architecture-alignment-assessment-2026-09-19.md`; this log entry.
- **Substance:** independent review of 14 Cloudflare capabilities against the canonical 11thONUS architecture (base SHA `a404a53`). Outcome: edge/security-perimeter capabilities (DNS/TLS, WAF, DDoS, Access) classified LIKELY LATER, gated on a production domain / persistent non-prod hostnames (neither exists); rate limiting & Turnstile ARCHITECTURE-DEPENDENT on abuse evidence/`EXT-TECH-001`; R2 ARCHITECTURE-DEPENDENT on a future file-storage requirement; CDN, Tunnel, Hyperdrive, Queues NOT NEEDED; Containers, Workers (app logic), Pages REJECTED. No conflict with any approved decision; no live pilot justified now. Portable core + Cloudflare edge achievable with zero change to the portable core.
- **Risks:** none introduced (documentation only). Unresolved blockers recorded: production domain decision, deployment/preview pipeline, `EXT-TECH-001`, `DEC-TECH-010`/`DEC-PROV-006`, `DEC-SEC-003`.
- **Rollback:** delete the new report file and this log entry; no other artifact exists.
- **Report link:** [`11thonus-cf-001-cloudflare-capability-and-architecture-alignment-assessment-2026-09-19.md`](../05-implementation/reports/11thonus-cf-001-cloudflare-capability-and-architecture-alignment-assessment-2026-09-19.md)

---

## 2026-09-19 — 11THONUS-CF-001 — Closure (Founder review accepted)

- **Date:** 2026-09-19
- **Task:** 11THONUS-CF-001 closure
- **Status:** **CLOSED.** Founder review accepted the findings and disposition of the [CF-001 assessment](../05-implementation/reports/11thonus-cf-001-cloudflare-capability-and-architecture-alignment-assessment-2026-09-19.md) in full. No further Cloudflare architecture assessment is required at this stage. The assessment entry above is superseded only in its interim status line ("awaiting Founder review"); its substance is unchanged.
- **Accepted disposition (retained, not reopened):** Cloudflare is a potential edge/security/delivery capability, not a replacement application platform; DNS/TLS/WAF/DDoS LIKELY LATER (production-domain decision); Access LIKELY LATER (persistent internal/non-prod surfaces only); Turnstile & rate limiting ARCHITECTURE-DEPENDENT; R2 ARCHITECTURE-DEPENDENT behind a portable/S3-compatible boundary; CDN, Tunnel, Hyperdrive, Queues NOT NEEDED; Containers, Workers (application logic), Pages REJECTED for the present 11thONUS runtime; no Cloudflare live pilot justified now.
- **Merge evidence:** assessment merged via PR #262 (head `3f3768c`, merge commit `96b0ff0`); reconciliation note: reviewed commit `1865f37` cherry-picked onto advanced `origin/main` (`1bb3e8e`) with one append-only conflict in this file resolved by placing the CF-001 entry last per convention — content unchanged (+251 lines, same two files).
- **Files changed:** this log entry only.
- **Constraints honoured:** no application code, DNS, Cloudflare resource, authentication, database, or runtime change; no new Cloudflare work package opened; the implementation programme continues per its approved schedule.
- **Rollback:** revert this closure entry (documentation only; does not alter the merged assessment).

---

## 2026-10-07 — EA-BL-001-CORR-002-B — Staff Counter Implementation

- **Date:** 2026-10-07
- **Phase:** Experience Assembly, Slice B (authorised via PR #306; entry `origin/main` `4bc9c49`, post-merge CI 37642428840 green).
- **Task:** Mobile-first Staff Counter on the production architecture, bound to the frozen prototype `11thonus-prototype@18e8d700…` (experience only).
- **Status:** **IMPLEMENTED — FOUNDER PREVIEW / TECHNICAL REVIEW PENDING.** Not accepted, not complete, not merged.
- **Scope:** Staff shell + Counter (camera QR scan with lazy `jsqr` fallback, Loyalty Number fallback, tokenless new-customer panel, truthful normal / business-review outcomes, Serve next, Staff-own recent activity); EN/FR; accessibility.
- **Backend enablers:** safe public error discriminator (`reason` on `purchase_command_failed`); `listMyRecentCounterPurchases` (server-scoped, purpose-built projection). No schema, WP-COM, BR or Trust change.
- **Idempotency correction:** `recordPurchase` classifies `functions/internal|unknown|cancelled` as uncertain/retryable so the key survives a lost response; the Counter keeps payload + `purchaseDate` + key as one intent. Authorisation still gates retries.
- **Validation:** functions 2026 unit / 772 PostgreSQL; web 1076; Playwright harness 69 (axe, 320px, fake camera) and real preview stack 20; typecheck, lint, format clean.
- **Preview:** seed adds Express Styling Circle; `preview:counter-checks`; runbook §13.
- **Dependencies:** `jsqr@1.4.0`. **Migrations:** none. **Configuration:** Playwright harness project gains fake-capture-device flags.
- **Rollback:** revert the PR.
- **Report link:** [implementation report](../05-implementation/reports/11THONUS-EA-BL-001-CORR-002-B-staff-counter-implementation-report-2026-10-07.md)

---

## 2026-10-08 — EA-BL-001-CORR-002-B — Pre-Founder-Preview Correction Pass

- **Date:** 2026-10-08
- **Task:** Bounded correction/preview-readiness pass on PR #307 (entry head `529fc88`).
- **Status:** **IMPLEMENTED — FOUNDER PREVIEW / TECHNICAL REVIEW PENDING** (unchanged). Not accepted/complete/merged. Slices C/D/E not authorised/not started.
- **Role routing:** fail-closed completed — only `staff`/`owner`/`manager` select a shell; absent Business, empty result, missing/unknown role and request error all show the integrity error.
- **Schema:** migration `0029` additive index `purchase_records_recorder_recent_idx (business_id, recorded_by_user_id, created_at DESC, id DESC)` for the Staff-own recent read (Founder-authorised); migration test bookkeeping updated.
- **Review threads:** 4 → disposition recorded in the implementation report §12.
- **Owner/Manager navigation:** unchanged by Founder disposition (no Counter link in Slice B).
- **Preview:** stale Slice A preview stopped via its own command after verified ownership; Slice B reset/verified/checked on canonical ports.
- **Follow-up candidate (separate):** `FU-OWNER-MANAGER-PURCHASE-IDEMPOTENCY` — existing Owner/Manager Purchases page recomputes `purchaseDate` per submit and can mint a new idempotency intent after an uncertain/lost response. PRE-EXISTING / OUT OF SLICE B / REQUIRES BOUNDED FOLLOW-UP.
- **Physical-phone camera:** deferred to the secure phone-access / Cloudflare preview capability work.
- **Dependencies:** none. **Configuration:** none. **Rollback:** revert the correction commit(s); `0029.down.sql` drops the index.
- **Report link:** [implementation report §12](../05-implementation/reports/11THONUS-EA-BL-001-CORR-002-B-staff-counter-implementation-report-2026-10-07.md)

## 2026-10-08 — EA-BL-001-CORR-002-B — Founder Preview Pass 1: Staff Mobile Experience Correction
- **Founder Preview Pass 1:** APPROVE WITH BOUNDED MOBILE EXPERIENCE CORRECTION (Founder Preview NOT yet accepted). Accepted: Counter, scan, purchase, new-customer flows, business switching, prototype alignment. Correction: Staff phone-first shell with a Staff-only bottom navigation (the Business/Owner-Manager shell's bottom-bar rejection is unchanged and that shell is untouched).
- **Status:** unchanged — **IMPLEMENTED — FOUNDER PREVIEW / TECHNICAL REVIEW PENDING**; PR #307 not merged; Slices C/D/E NOT AUTHORISED / NOT STARTED.
- **Change:** phone-width Staff shell — simplified header, fixed bottom bar (Counter / New customer / Activity / More), in-page section navigation (no routes), More sheet (language + Switch Business / Personal), sticky Record bar stacked above the bar via `--staff-nav-offset`, safe-area handling, EN/FR, a11y. Desktop/tablet unchanged.
- **Tests:** web unit (`StaffMobileShell`, Owner/Manager-unchanged proof), harness Playwright 320/375/390 px, real-stack preview specs (desktop + Pixel 7), `preview:verify`, `preview:counter-checks`.
- **Dependencies:** none. **Schema/config:** none. **Backend:** none. **Rollback:** revert the correction commit(s).
- **Follow-on (not built):** physical-phone secure Cloudflare preview capability (separate bounded task). `FU-OWNER-MANAGER-PURCHASE-IDEMPOTENCY` remains separate and unfixed.
- **Report link:** [implementation report §13](../05-implementation/reports/11THONUS-EA-BL-001-CORR-002-B-staff-counter-implementation-report-2026-10-07.md)

## 2026-10-08 — EA-BL-001-CORR-002-B — Founder Preview Pass 2: Mobile-Only Staff Shell
- **Founder Preview Pass 2:** CORRECTION REQUIRED — the Staff Counter remained a desktop composition at wider widths. Founder disposition: Staff needs no desktop experience; one phone-oriented Staff shell at all viewport sizes, centred/constrained on larger screens. Founder Preview NOT yet accepted.
- **Status:** unchanged — **IMPLEMENTED — FOUNDER PREVIEW / TECHNICAL REVIEW PENDING**; PR #307 not merged; Slices C/D/E NOT AUTHORISED / NOT STARTED.
- **Change:** removed the responsive Staff branch, Staff top bar and two-column Counter; permanent bottom bar; single column; app/bar centred at `max-w-lg` (512 px); unused `useMediaQuery` hook deleted. Owner/Manager shell untouched.
- **Tests:** harness Playwright at 320/375/390/768/1024/1440; real-stack preview specs (1280 + Pixel 7); unit tests; Owner/Manager-unchanged proof.
- **Dependencies/schema/config/backend:** none. **Rollback:** revert the Pass 2 commit.
- **Report link:** [implementation report §14](../05-implementation/reports/11THONUS-EA-BL-001-CORR-002-B-staff-counter-implementation-report-2026-10-07.md)

## 2026-10-08 — EA-BL-001-CORR-002-B — Founder Preview Pass 3: Staff Information Architecture + Limited Loyalty Context
- **Founder Preview Pass 3:** mobile-only shell accepted; the all-in-one Counter is too concentrated — Activity and Profile become their own views, New customer becomes a quick action, and Staff need limited loyalty progress during service. Founder Preview NOT yet accepted.
- **D4 SUPERSEDED** (historical decision left as made, annotated): Staff get limited, transaction-scoped loyalty progress (PRD01 §8.2/§12.2).
- **Status:** unchanged — **IMPLEMENTED — FOUNDER PREVIEW / TECHNICAL REVIEW PENDING**; PR #307 not merged; Slices C/D/E NOT AUTHORISED / NOT STARTED.
- **Change:** new read-only callable `getCounterLoyaltyContext` (four values; Customer resolved server-side; one neutral failure token; no schema); `listMyRecentCounterPurchases` gains a keyset cursor (Activity paging; existing index); web: Counter / Activity / Profile routes + quick-action sheet (Scan / Help a new customer join), Counter kept mounted, Loyalty status card + reward-available alert before recording; Express seed positions (Jean-Claude 8, Esther 9 + 1 awaiting, Chantal reward available) + fingerprint refresh; 10 new live preview checks.
- **Defects fixed on the way:** reserved i18next `ordinal` option; scan request handled while the Counter was hidden; sticky Record bar clamped by a nested wrapper.
- **Experience Assembly direction recorded (not authorised):** Owner/Manager Operations (Slice C) mobile-first; Platform Operator Console desktop-first.
- **Dependencies/config/schema:** none. **Rollback:** revert the Pass 3 commit(s).
- **Report link:** [implementation report §15](../05-implementation/reports/11THONUS-EA-BL-001-CORR-002-B-staff-counter-implementation-report-2026-10-07.md)

## 2026-10-09 — EA-BL-001-CORR-002-B — Founder Preview Pass 3 ACCEPTED (acceptance recording)
- **Founder disposition:** Founder Preview Pass 3 ACCEPTED at head `ea8e8e6051335c7160d9e06516372bad953be65b` (CI run 37826012528 success). Earlier Pass 1/2/3 observations preserved.
- **Status:** **IMPLEMENTED — FOUNDER ACCEPTED / TECHNICAL REVIEW PENDING**; not complete/closed/merged; PR #307 unmerged; Slices C/D/E NOT AUTHORISED / NOT STARTED.
- **Follow-ups:** new `FU-COUNTER-LOOKUP-ABUSE-PROTECTION` (non-blocking security hardening; no thresholds); `FU-OWNER-MANAGER-PURCHASE-IDEMPOTENCY` preserved unfixed. Owner/Manager Counter recent activity deferred to `EA-BL-001-CORR-002-C` (mobile-first).
- **Physical-phone validation:** pre-merge verification activity; not a Product Truth gate.
- **Change:** documentation/status/PR-body only. No code, tests, dependencies, config or schema. (PR #307 carries additive migration `0029`; earlier "no schema" wording corrected.)
- **Report link:** [implementation report §16](../05-implementation/reports/11THONUS-EA-BL-001-CORR-002-B-staff-counter-implementation-report-2026-10-07.md)

## 2026-10-12 — EA-BL-001-CORR-002-B — Post-phone B1A Staff Context + Fast Purchase
- **Physical-phone validation:** **PASSED / FOUNDER APPROVED**. Phone evidence remains accepted and is not reopened by subsequent UX corrections.
- **Authority:** FD-UX-1 bounded transaction-scoped/current-Business Staff context; FD-UX-2 programme-to-purchase shortcut; FD-UX-3A reward awareness only. B1R redemption assembly remains separate and required before Staff can confirm redemption.
- **Change:** new `getCounterCustomerContext` read seam resolves one QR/Loyalty Number before returning display name and participating current-Business programme/Circle progress, awaiting customer confirmation, and authoritative reward availability. It omits contact/auth/profile/history, reward binding, reviewer and Business Review threshold. Counter cards show eligible services and reward handoff; Add Purchase retains the artifact, preselects programme and quantity 1, safely preselects only a sole item, and preserves explicit Record.
- **Preserved authority:** no redemption mutation/control or client-side permission check; no change to `redemption.confirm`, purchase verification, Business Review, Verified Units, cycle/reward creation, schema, auth, Cloudflare, or Slices C/D/E.
- **Validation:** focused Counter + Staff shell 106/106; Functions unit 2,031/2,031; full web 1,144/1,144 (Node 26 experimental webstorage disabled for jsdom); B1A PostgreSQL/emulator 6/6; Staff Counter PostgreSQL file 53/53; Functions/web typecheck, changed-file lint/format, web build passed. Three exact-head CI runs passed build, lint, format, typecheck and unit tests, then exposed the cost-based planner choosing another index in the pre-existing tiny-fixture plan assertion. The fixture now disables sorting to prove the ordered composite index remains applicable. Exact-head CI is rerunning. Preview commands could not run because guarded startup found required emulator ports owned by another process; no process was stopped. Playwright harness could not launch because this host lacks its configured Chromium binary.
- **Post-preview correction:** CI run `38241468078` showed that Loyalty Number resolution returned only programmes that allowed that number, hiding a participating QR-only programme. Commit `362316657d0dcb850fa86941334d0d0bf246a051` removes the presentation-method filter from the post-resolution Business/customer context projection while preserving the neutral resolver gate and the purchase-record shared-number policy. A PostgreSQL regression now records a QR-only participation and asserts QR and Loyalty Number context match; preview seed commentary reflects the same boundary.
- **Preview test correction:** CI run `38244313476` passed the product checks but its desktop/mobile cases had a stale request observer collecting `getCounterLoyaltyContext` while asserting `getCounterCustomerContext`; commit `f2cc3b509952b3972080ca2b5ecdc8c1be068ff3` fixes the observer.
- **Validation:** exact-head CI `38245729043` at `f2cc3b5` passed build, lint, format, typecheck, unit/component tests, PostgreSQL, Playwright E2E, Founder Preview tooling, cross-project port-isolation acceptance, and Firebase Emulator validation. Local Functions typecheck and Prettier pass; local Postgres and preview checks were unavailable without emulator and seeded preview state.
- **Status:** implementation is pushed to PR #307, Founder review required; ITR paused; PR #307 and PR #310 unmerged. All four returned inline review threads are resolved. Physical-phone validation remains PASSED / FOUNDER APPROVED.
- **Report link:** [B1A implementation report](../05-implementation/reports/11THONUS-post-phone-ux-correction-b1a-implementation-report-2026-10-12.md)

## 2026-10-12 — EA-BL-001-CORR-002-B — Post-phone B1R Governed Redemption Binding
- **Physical-phone validation:** remains **PASSED / FOUNDER APPROVED**; B1R does not reopen the device gate.
- **Change:** transaction-scoped Staff context now binds only the resolved customer's available reward for the active Business/programme, provides server-evaluated `redemption.confirm` eligibility, and offers an explicit confirmation dialog through a Firebase callable adapter. The callable resolves the presented QR/Loyalty Number and verifies customer/programme/reward binding before calling the existing redemption command.
- **Authority/privacy:** mutation-time permission reauthorization and existing redemption lifecycle are unchanged. The read eligibility signal is guidance only. Ineligible Staff see reward awareness and a bounded Manager/Owner handoff. Payload excludes client authority/identity claims; no eligible Reward identifier is returned to ineligible actors. Redemption does not record a purchase or issue a Verified Unit.
- **B1R boundary:** B1R binds the existing governed action; it does not redesign redemption. No reward/cycle/product rules, permission semantics, schema, migrations, dependencies, config, auth, Cloudflare, or PR #310 changes.
- **Validation:** Functions suite 2,033 passed; full web suite 1,148 passed with the Node 26 webstorage compatibility flag; focused Counter/API 87 passed; web typecheck, changed-file ESLint/Prettier, `git diff --check`, and Vite production build passed. PostgreSQL/Firestore emulator and Founder Preview checks could not run locally because the emulator's required ports were occupied; no foreign process was stopped. Exact-head CI remains to be checked after push.
- **Status:** B1R implementation prepared on PR #307 branch for Founder review. PR #307 remains unmerged, PR #310 untouched, ITR paused, and B2 not started.
- **Report link:** [B1R implementation report](../05-implementation/reports/11THONUS-post-phone-ux-correction-b1r-implementation-report-2026-10-12.md)

## 2026-10-12 — B1R validation correction — preserve legacy redemption idempotency
- **Finding:** the initial B1R hash included customer/programme binding in all command calls. Internal callers without B1R fields would no longer match a pre-B1R reward-only request hash and could fail to replay an existing key.
- **Correction:** when both B1R artifact and programme fields are absent, preserve the original Reward-only fingerprint. When either field is supplied, retain the stronger Reward + resolved customer + programme hash. The callable still requires the bound request and the mutation still verifies all bindings.
- **Regression coverage:** PostgreSQL tests now cover replay of an old-format legacy key, same-bound B1R replay, and same-key conflict for changed customer, programme, or Reward.
- **Preview compatibility:** the Founder Preview redemption seed now supplies Aline's already-issued QR reference and the seeded programme reference to the governed callable.
- **PR reconciliation:** current `main` was three commits ahead of the PR merge base and added the MEDIA-001 assessment plus this tracker entry. GitHub reported `mergeable_state=dirty`; direct three-way comparison confirmed a content conflict in this append-only tracker because both branches prepended entries. The mechanical merge preserves both entries and the MEDIA-001 report.
- **Validation:** exact-head CI run `38257093090` passed at `8cec3bdd2f61c897238049c571a74abb059e7bd5`; the later documentation-only head `c877af914c65cf11f4dfa08bc6cec9753a78c27e` passed exact-head CI run `38259373589`, including build, lint, format, typecheck, unit/component, PostgreSQL integration, Playwright, Founder Preview, cross-project port isolation, and Firebase Emulator validation. The `main` conflict was resolved by preserving both documentation entries in a two-parent commit; the reconciled head's exact-head CI is pending. No PR #310, schema, migration, dependency, config, or Product Truth changes.
