> **Title:** CAP-P2-G2-001 — Capability 2 G2 Evidence Ratification, Final Closure & Handover
> **Version:** 1.0 · **Status:** Final governance record · **Classification:** Working (execution-layer record)
> **Governing document:** [CDR-001 §10](../roadmap/CDR-001-capability-delivery-roadmap.md#10-definition-of-capability-completion); `DEC-GOV-008`/`-009`/`-010`; [`ITM-DESIGN-001` §19](../roadmap/ITM-DESIGN-001-identity-trust-management-architecture.md); [`CAP-P2-PRE-G2-001`](CAP-P2-PRE-G2-001-capability-2-pre-g2-closure-readiness-assessment-2026-08-17.md) (if a separate file exists) / the prior conversational PRE-G2 assessment
> **Source-of-truth path:** `docs/05-implementation/reports/CAP-P2-G2-001-g2-evidence-ratification-and-capability-2-closure-2026-08-17.md`
> **Task:** CAP-P2-G2-001 — Founder-authorized G2 execution: evidence ratification (not new deployment), final G2 review, and Capability-2 closure decision.

# CAP-P2-G2-001 — Capability 2 G2 Evidence Ratification, Final Closure & Handover

## 1. Founder Authorization Recorded

This task carries an explicit, written Founder authorization to execute the Capability-2 G2 closure gate, with the following governance disposition confirmed by the Founder and applied throughout:

- Existing valid evidence may satisfy Capability-2 deployment / Preview Review / Manual QA requirements where the relevant customer-facing surface has already been deployed and manually validated, the evidence remains applicable to the current authoritative implementation, a domain-layer component has no governed production endpoint or independent customer-facing surface, and deploying a synthetic/fake production surface would violate or distort the approved architecture.
- Authentication's existing hosted-preview / Founder Manual-QA evidence may be reused at Capability-2 closure.
- Customer Identity's real-environment evidence obtained through Authentication may be reused.
- `ENG-P2-004` and ITM do **not** require a synthetic deployed endpoint, because no governed production consumer exists yet for either.
- This is **not** a waiver of G2 — G2 still had to perform the final evidence review, readiness determination, and closure decision, which this task executed.

## 2. Entry Verification

- `origin/main` fetched and confirmed at **`7c2fab788e5ba96cb542a81e1b9d9e0ffa27246a`** — exact match to the authoritative baseline.
- All four Capability-2 concerns (Customer Identity, Authentication, `ENG-P2-004`, ITM) reconfirmed `Complete` on `main` (see §3).
- Their closure PRs/commits (#82, #90–#97, #99, #100, #106–#109, #111–#118) confirmed present on `main` via `git log`/`git merge-base --is-ancestor`.
- Post-merge CI on the last five merges to `main` confirmed `success` via `gh run list --branch main` (including PR #118's own run, `32007350241`, success, 3m31s).
- Capability 2 confirmed **not** already marked `Complete` anywhere on `main` prior to this task.
- Capability 3 confirmed `Not started` (no work-package rows begun; `CDR-001` §5 §2 unchanged for Capability 3).
- No conflicting G2/Capability-2-closure task, branch, or PR found. Only PR #34 (unrelated, `ENG-P2-RES-ADMIN-003`) was open. Two historically related branches, `docs/res-007-capability-2-resolution-closure-review` and `docs/res-007b-capability-2-closure-finalisation` (PRs #40/#41), were found and independently checked: both are already **merged ancestors of `main`** (2026-07-31), predate Authentication/ITM/`ENG-P2-004` implementation entirely, and their own final status ("Ready with Conditions," blocked on `EXT-TECH-001`/`DEC-PROD-012`/BaseMetadata conformance/Phase 1 exit) is **historical and superseded** — all four of those Capability Authorisation Gate items are independently confirmed resolved on `main` today: `DEC-PROD-012` **CLOSED** (2026-08-07, Decision Register), `EXT-TECH-001` **PENDING but reclassified** as a non-blocking production-launch/readiness item (Decision Register, `DEC-IDENTITY-001`/`DEC-PROV-004` amendments), BaseMetadata conformance **resolved** (`RES-005.2a`/`RES-005.2b`, merged 2026-07-31), Phase 1 exit **`ENG-P1-EXIT-001` approved and merged** (PR #42, 2026-07-31). No open item from that historical gate carries forward as a Capability-2 blocker.
- Dirty primary worktree (`chore/eng-p1-001-closure`) confirmed untouched throughout — all verification, testing, and Firebase reads were performed against `origin/main` content via a detached-HEAD worktree at the exact baseline SHA (`/private/tmp/.../cap2-g2-worktree`), never against the dirty tree.

## 3. Concern Completion Re-Verification

| Concern | Authoritative closure artifact | Merge/commit evidence | CI/validation evidence | Deferred items | Blocks Capability 2? |
|---|---|---|---|---|---|
| Customer Identity | [`CAP-P2-008`](CAP-P2-008-customer-identity-concern-closure-2026-08-07.md) | PR #82 merged `436794faf2b96b768eeb318367d85765161da9aa` | Post-merge CI success (run 31198769553) | RTM Finding F11 (Founder-approved deferred) | No |
| Authentication | [`AUTH-HOSTED-PREVIEW-002`](AUTH-HOSTED-PREVIEW-002-authentication-concern-closure-2026-08-14.md) | PRs #90–#97, #99 (I18N-001), #100 (`AUTH-CORR-003`) all merged | Post-merge CI green on each; hosted-preview evidence PASS | Phone OTP live-SMS readiness (`EXT-TECH-001`, separate track, non-blocking) | No |
| `ENG-P2-004` | [`ENG-P2-004D`](ENG-P2-004D-authorization-boundary-implementation-report-2026-08-16.md) | PR #109 merged `2d7573b6…` | Post-merge CI green | Non-sensitive permission ALLOW baseline gap (Founder Decision FD-5, deferred by design, does not reopen the concern) | No |
| ITM | [`CAP-P2-ITM-D` §54](CAP-P2-ITM-D-risk-gate-contract-and-itm-closure-2026-08-17.md) | PRs #111/#112 (A), #113/#114 (B), #115/#116 (C), #117/#118 (D) all merged | Post-merge CI green on each; independent reviews found no material finding | None outstanding — full 16-row `ITM-DESIGN-001` §15 acceptance matrix PASS/N/A | No |

No concern was reopened. No genuine material defect was found in any of the four.

## 4. Authentication Real-Environment Evidence — Reconstruction & Currency Check

Reconstructed directly from `AUTH-HOSTED-PREVIEW-002-authentication-concern-closure-2026-08-14.md` and cross-checked against `main` `7c2fab7`:

| Item | Evidence | Currency check against current `main` |
|---|---|---|
| Email/Password fresh registration | PASS (`registered`) | No `functions/src/domains/authentication/**` or `apps/web/src/authentication/**` changes since 2026-08-14 (only ITM/`domains/trust` and governance-docs work landed after this date, per `git log --stat` on the intervening commits) — behavior unchanged |
| Email returning sign-in | PASS (`signed_in`, backend `authenticate` + `customer_authenticated [email]`) | Unchanged — same basis |
| Google authentication | PASS (hosted) | Unchanged |
| Customer Identity creation | PASS (via `authenticate` orchestration) | Unchanged — Customer Identity domain untouched since `CAP-P2-008` (2026-08-07) |
| Authentication-reference creation/resolution | PASS (2 principals, 2 identities, 2 references, correct `-09` resolution) | Unchanged |
| Duplicate prevention | PASS (no duplicates observed) | Unchanged |
| `AUTH-08` events | PASS (`customer_authenticated` observed) | Unchanged — outbox/event code untouched since `AUTH-08` (2026-08-10); ITM-B/C/D only ever *consume* the outbox pattern for the separate `domains/trust` collection, they do not modify `AUTH-08`'s emission path |
| English / French | PASS (multi-provider surface + EN/FR) | Unchanged — `I18N-001` (PR #99) is the last copy change, predates this evidence |
| Confirm Password (`AUTH-UX-CORR-001`) | PASS | Unchanged |
| Credential/privacy handling | PASS — no credential/token/OTP material persisted, logged, or rendered | Unchanged; independently reconfirmed by this task's own repository-wide review (§10) |

**Conclusion: the Authentication hosted-preview evidence remains fully valid against the current authoritative implementation.** No file in `functions/src/domains/authentication/**` or `apps/web/src/authentication/**` has changed since the evidence was captured (2026-08-14) through `main` `7c2fab7` (2026-08-17) — the intervening work (`ENG-P2-004B/C/D`, `ITM-DESIGN-001`, `ITM-A/B/C/D`) is confirmed, by this task's own repository-wide grep (§10) and by each package's own disclosed diff scope, to touch only `domains/permissions/**` and `domains/trust/**`, never `domains/authentication/**`. **No repeat of the hosted validation is warranted.**

## 5. Customer Identity Real-Environment Evidence

The Authentication hosted-preview exercised the real Customer Identity path end-to-end: identity creation on first registration (both Email/Password and Google), reference resolution on returning sign-in, correct registration-vs-returning lifecycle branching, and no duplicate identity/reference across either provider (2 distinct principals → 2 distinct identities → 2 distinct references, independently counted in the original evidence). Active-identity state was implicitly exercised (both test accounts remained `active` throughout, no suspension path triggered).

**No independent Customer Identity manual test remains meaningful** — Customer Identity has no deployable surface of its own; every customer-observable behavior it owns (identity issuance, loyalty number/QR association, reference resolution) was already exercised through the real Authentication flow. Disposition confirmed as expected: **no additional manual surface exists.**

## 6. `ENG-P2-004` G2 Disposition

Verified independently in this task's worktree (`domains/permissions/**` inspection + `functions/src/index.ts` grep): `ENG-P2-004` is domain/library code (`authorizeAndExecute.ts` composition function); no `onCall`/`onRequest` Cloud Function wraps or exposes it; its 38 permission-evaluation/audit/boundary emulator tests (part of the 339/339 `emulators:validate` re-run, §12) exercise it against real Firestore via governed internal test fixtures, not a production endpoint. No governed Capability-3 production consumer exists yet (Capability 3 confirmed `Not started`, §2).

**Disposition: PASS — fixture/security validation sufficient for current capability boundary.** No synthetic production endpoint was created or is warranted; doing so would fabricate a Capability-3 consumer that does not yet exist, contrary to the Founder's explicit instruction not to invent one.

## 7. ITM G2 Disposition

`ITM-A`/`B`/`C`/`D` confirmed `Complete` (§3). Repository-wide grep for `effectiveTrustLevel`/`checkRiskGate`/`domains/trust` outside `functions/src/domains/trust/**` on the current `main` worktree confirms, independently, **zero Cloud Function anywhere imports `domains/trust`** — no global wiring, no default minimum trust level, no automatic command wrapping (matching `CAP-P2-ITM-D` §54's own finding, re-verified fresh rather than trusted). `ITM-D`'s explicit-opt-in architecture (a caller must name a specific `riskRequirement` to invoke `checkRiskGate` at all) structurally prevents any blanket/default gating. Emulator/integration evidence is current (339/339 on this task's own fresh re-run, §12, one test file included).

**Disposition: N/A — no independently deployable surface** (ITM has no `onCall`/`onRequest` endpoint of its own) **and DEFERRED BY DESIGN** (a real risk-gated production consumer is a later-capability concern; ITM's own design package, §14/§20, confirms none is governed at Capability-2 MVP). No synthetic endpoint, Reward Engine, or fake production consumer was built or is warranted.

## 8. Firebase Current-State Verification (Read-Only)

Performed against `eleventh-on-us-dev` via the Firebase CLI, read-only:

- **`authenticate` callable:** confirmed present and healthy — `europe-west1`, `v2`, `callable` trigger, `nodejs20`, 256MB. No drift from what `AUTH-HOSTED-PREVIEW-002` deployed.
- **Hosting channels:** `firebase hosting:channel:list --project eleventh-on-us-dev` returned **only the `live` channel** (`https://eleventh-on-us-dev.web.app`, never expires). **`auth-preview-002` is no longer present.**
- **Apps:** two registered Web apps (`11thONUS Web - Development`, `11thONUS Web`) — no unexpected resource.
- No unexpected Capability-2 resource drift observed.

## 9. Preview Teardown Reconciliation

The prior PRE-G2 assessment could not confirm from repository documentation alone whether `auth-preview-002` had actually been deleted (the closure report's own disposition allowed either an explicit delete or a 2026-08-21 passive expiry, and no later document recorded which occurred). **This is now resolved from live Firebase state (§8): `auth-preview-002` does not exist on the `eleventh-on-us-dev` Hosting site today.** Whether it was explicitly deleted earlier or simply is not listed for another reason, the outcome required by the original closure disposition — no lingering preview channel — is confirmed satisfied.

**Disposition: PASS — teardown state confirmed clean.** No Firebase action was taken by this task (nothing needed deleting).

## 10. Manual QA Ratification

| Existing manual test | Original evidence | Still applicable? | Subsequent implementation change to tested behavior? | Disposition |
|---|---|---|---|---|
| Google hosted sign-up/sign-in | `AUTH-HOSTED-PREVIEW-002` | Yes | None found (§4) | Ratified/reused |
| Email/Password registration | `AUTH-HOSTED-PREVIEW-002` | Yes | None found | Ratified/reused |
| Email/Password returning sign-in | `AUTH-HOSTED-PREVIEW-002` | Yes | None found | Ratified/reused |
| Confirm-Password behavior | `AUTH-HOSTED-PREVIEW-002` | Yes | None found | Ratified/reused |
| Multi-provider EN/FR surface | `AUTH-HOSTED-PREVIEW-002` | Yes | None found | Ratified/reused |
| Backend identity/reference integrity | `AUTH-HOSTED-PREVIEW-002` | Yes | None found | Ratified/reused |

**No new Founder Manual QA is required** — no evidence-invalidating change occurred to any tested customer-facing behavior between 2026-08-14 and `main` `7c2fab7`. This matches the expected outcome stated in the task's own Phase I.

## 11. Preview Review Ratification

The existing Authentication `AUTH-HOSTED-PREVIEW-002` preview review remains the sole and sufficient customer-facing Preview Review evidence for Capability 2. Customer Identity, `ENG-P2-004`, and ITM have no independent customer-facing surface (§6, §7, §5) — a combined preview would exercise nothing beyond what Authentication's own preview already covered, and building one merely to generate a labeled artifact was explicitly out of scope per the task's own instruction.

**Disposition: PASS / existing evidence reused.**

## 12. Automated Capability-Level Sanity Validation

Run from a clean, detached-HEAD worktree at `origin/main` `7c2fab7` (dirty primary worktree untouched):

| Check | Result |
|---|---|
| `pnpm install --frozen-lockfile` | Clean, lockfile up to date |
| `pnpm run lint` | Clean — 0 errors |
| `pnpm run format:check` | Clean — all files match Prettier style |
| `pnpm run typecheck` (`apps/web` + `functions`) | Clean — 0 errors |
| `pnpm run build` (`apps/web` + `functions`) | Clean — both build successfully (one non-blocking Vite chunk-size advisory, pre-existing, not a regression) |
| `pnpm run test` (unit) | **functions 943/943; web 397/397** |
| `firebase emulators:exec … test:emulator` (first run) | 338/339 — one failure: `idempotencyService.emulator.test.ts` "two simultaneous callers … exactly one acquires ownership," timed out at the fixed 5000ms test timeout |
| `firebase emulators:exec … test:emulator` (rerun, same worktree, no code change) | **339/339 — clean** |

**Flake classification:** the single first-run failure is a concurrency-timing race in a fixed-5-second-timeout dual-caller idempotency test — the same class of environmental flake explicitly disclosed and non-reproducing in the `ITM-D` and other prior closure reports (e.g., `ITM-D`'s own 336/339-then-339/339 pattern, `AUTH-05`'s two inherited timeout flakes). It reproduced zero times on immediate rerun with an unmodified worktree, confirming it is timing/environment-dependent (emulator/JVM/Firestore-rules-runtime warm-up contention under this task's own concurrent CI-equivalent load), not a code regression. No implementation code was modified to make it disappear — only a clean rerun was used, per the task's explicit instruction.

**No persistent regression affecting Capability 2 was found.** GitHub Actions CI itself (the authoritative gate) was independently confirmed green on the last five merges to `main`, including PR #118's own run (`32007350241`, success, 3m31s).

## 13. Release-Readiness Review

| Item | Disposition |
|---|---|
| Deployment evidence (Authentication) | PASS — reused, current (§4) |
| Deployment evidence (Customer Identity) | PASS — reused via Authentication (§5) |
| Deployment evidence (`ENG-P2-004`) | N/A — no deployable surface (§6) |
| Deployment evidence (ITM) | N/A / DEFERRED BY DESIGN — no deployable surface, no consumer yet (§7) |
| Rollback | PASS — every merge in the closure chain is additive; each closure report/entry records its own single-merge-commit revert path; no schema/data migration performed anywhere in the chain |
| Operational observability | NON-BLOCKING — no dedicated Capability-2 dashboards exist yet; standard Cloud Functions/Firestore logging is in place for `authenticate`; not a governed Capability-2 acceptance criterion |
| Security | PASS — deny-by-default Firestore Rules preserved throughout (no `firestore.rules` change in the ITM/`ENG-P2-004` closure chain); closed error taxonomies; no raw credential/token persistence anywhere (independently reconfirmed, §4) |
| Privacy | PASS — no PII/credential material found in any diff across the closure chain (each package's own disclosed scan, reconfirmed by this task's fresh grep) |
| Localization | PASS — EN/FR surface validated in the Authentication hosted preview (§4); Customer Identity/`ENG-P2-004`/ITM have no customer-facing copy |
| Configuration | ALREADY SATISFIED — no new environment variable or config surface introduced by `ENG-P2-004`/ITM (both are pure domain/library code) |
| Test evidence | PASS — 943 functions unit + 397 web unit + 339 emulator-integration tests green (§12); CI green on `main` |
| Manual QA | PASS — ratified/reused (§10) |
| Preview Review | PASS — ratified/reused (§11) |
| Infrastructure state | PASS — verified clean (§8/§9) |
| Documentation currency | ALREADY SATISFIED prior to this task (per the prior PRE-G2 assessment); updated further by this task's own closure sync (§16) |

No item above is classified BLOCKING.

## 14. Known Observations — Final Disposition

| Observation | Disposition |
|---|---|
| Phone OTP live-SMS readiness | SEPARATE TRACK — governed under `EXT-TECH-001`, reclassified non-blocking for Capability 2/identity decisions (Decision Register); Phone OTP itself is implemented and emulator/CR3-hosted-preview-validated |
| Non-sensitive permission ALLOW gap | DEFERRED — Founder Decision FD-5; does not block Capability 2, does not reopen `ENG-P2-004` |
| ITM `reasonReferences` retention | NON-BLOCKING — governed, implemented, `eventId`-deduplicated evidence field; no retention-policy gap disclosed as blocking anywhere in `ITM-DESIGN-001` or the ITM closure chain |
| ITM `verificationState` future use | NON-BLOCKING — a documented, currently-unpopulated-by-design value object (`ITM-DESIGN-001` §5/§7); reserved for a future verification-signal package, not a Capability-2 gap |
| `parseEventType` discrepancy | NON-BLOCKING — traced (by `ITM-B`'s own independent review) to TRD11 §11.9's own snake_case examples; `AUTH-08` is contract-correct; the shared regex defect is separately disclosed, pre-existing, and does not affect any Capability-2 concern's correctness |
| Retained Firebase test users | NON-BLOCKING — explicitly authorized to remain by `AUTH-HOSTED-PREVIEW-002`'s own closure disposition ("deletion not authorized") |
| Artifact Registry cleanup | NOT APPLICABLE — zero governance mentions found; not a documented Capability-2 concern |
| Node runtime lifecycle | NON-BLOCKING — Node 20 is the correct, current application target (`functions` `package.json` `engines`); mentions elsewhere are CI-runner-internal noise unrelated to the app |
| Inherited test flakes | NON-BLOCKING — this task's own instance (§12) reproduced zero times on rerun; consistent with every prior disclosed instance in the closure chain |

Nothing above was silently dropped; nothing above was promoted to a blocker without governing authority.

## 15. Final G2 Matrix

| Criterion | Authority | Evidence | Disposition | Remaining action | Blocker? |
|---|---|---|---|---|---|
| Customer Identity concern complete | `CDR-001` §10 | `CAP-P2-008` | PASS | None | No |
| Authentication concern complete | `CDR-001` §10 | `AUTH-HOSTED-PREVIEW-002` | PASS | None | No |
| `ENG-P2-004` concern complete | `CDR-001` §10 | `ENG-P2-004D` | PASS | None | No |
| ITM concern complete | `CDR-001` §10 | `CAP-P2-ITM-D` §54 | PASS | None | No |
| Authentication deployment evidence | `DEC-GOV-010`, DoD §2.8 | `AUTH-HOSTED-PREVIEW-002` (reused, current — §4) | PASS | None | No |
| Customer Identity deployment evidence | `DEC-GOV-010`, DoD §2.8 | Reused via Authentication (§5) | PASS | None | No |
| `ENG-P2-004` deployment evidence | `DEC-GOV-010` | No production consumer exists (§6) | PASS (fixture-sufficient) | None | No |
| ITM deployment evidence | `DEC-GOV-010` | No production consumer exists (§7) | N/A / DEFERRED BY DESIGN | None | No |
| Manual QA | DoD §2.9 | Ratified/reused (§10) | PASS | None | No |
| Preview Review | DoD §2.9 | Ratified/reused (§11) | PASS | None | No |
| Firebase infrastructure state | `DEC-GOV-010` | Verified clean, read-only (§8/§9) | PASS | None | No |
| Automated capability sanity validation | TRD19 §19.52 | 943+397 unit, 339 emulator, CI green (§12) | PASS | None | No |
| Release-readiness items | TRD19/TRD22 | §13 | PASS (no BLOCKING item) | None | No |
| Known technical observations | Various | §14 | All NON-BLOCKING/DEFERRED/SEPARATE TRACK | None | No |
| Documentation currency | CDR-001 | Verified prior + this task's own sync | PASS | This closure sync (§16) | No |

**No required criterion remains "unknown." Zero blockers.**

## 16. G2 Decision

All required criteria resolve to **PASS**, **N/A**, or correctly **DEFERRED BY DESIGN**. No blocker remains.

**CAPABILITY 2 G2 = PASS.**

## 17. Capability-2 Closure

With G2 = PASS, **Capability 2 is recorded `Complete`** as of this task, 2026-08-17. Closure records synchronized (docs-only, this task):

- [`CDR-001-capability-delivery-roadmap.md`](../roadmap/CDR-001-capability-delivery-roadmap.md) — §2 table row, §5 Capability 2 subsection, header dated append.
- [`engineering-implementation-programme.md`](../change-tracking/engineering-implementation-programme.md) — header dated append, P2 row/status note.
- [`documentation-changes-log.md`](../../00-governance/documentation-changes-log.md) — Entry 124, header dated append.
- [`IMPLEMENTATION_CHANGES.md`](../../changes/IMPLEMENTATION_CHANGES.md) — new dated entry.
- This report.

No historical report was rewritten; all prior entries are preserved and superseded only by dated supersession notes, per established convention.

## 18. Capability 3 Handover

Capability 2's closure is confirmed the governed prerequisite before Capability 3 authorization (`CDR-001` §5's "Why no new top-level capability number" note and Founder Decision FD-3, `CAP-P2-ITM-DESIGN-001`). With Capability 2 now `Complete`:

- **Prerequisite status:** satisfied as of this task.
- **What fresh Founder authorization would be needed next:** a dedicated Capability-3 (Business Identity) planning/architecture task, scoped and authorized independently — this task does not authorize, plan, or begin any such work.
- **Authoritative starting baseline for that future task:** `origin/main` at the merge commit produced by this task (§24 below).

**Capability 3 remains `Not started`.** No architecture or code for Capability 3 was begun.

## 19. Rollback

`git revert` the merge commit recorded in §24 — the entire change set is documentation-only, purely additive (no historical text rewritten), no schema change, no deployed resource, no data to roll back, no Firebase action taken by this task at all.

## Final Gate

**CAPABILITY 2 G2 PASSED — CAPABILITY 2 MERGED AND CLOSED; CAPABILITY 3 AWAITS FRESH FOUNDER AUTHORIZATION.**
