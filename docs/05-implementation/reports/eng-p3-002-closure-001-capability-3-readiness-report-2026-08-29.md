# ENG-P3-002-CLOSURE-001 — Founder Closure Recording & Capability 3 Readiness Assessment

**Final gate:** **`ENG-P3-002 CLOSED — CAPABILITY 3 STATUS ASSESSED`**

**Capability 3 recommendation:** **`CAPABILITY 3 IN PROGRESS — blocked on DEC-LEGAL-002 (Terms content) resolution and governed Terms-version configuration`**

## Closure strategy (before any change was made)

`ENG-P3-002` closure is a Founder-level administrative act recording that a work package's engineering content is complete — it is recorded in the two documents this repository actually keeps live for that purpose (`CDR-001-capability-delivery-roadmap.md`'s §2 snapshot table and §5 Capability 3 narrative, and `docs/changes/IMPLEMENTATION_CHANGES.md`'s work-package log), by appending a new dated entry in each document's own established convention — never by rewriting the historical entries beneath it. Capability 3 readiness is a separate, broader question: it asks whether the *capability* (a customer-facing milestone, not a work-package label) is actually deliverable end-to-end, which requires checking the capability's own authoritative definition and exit criteria against the real, current state of the code — not copying whatever status label the most recent work-package closure happened to leave behind. Both were verified from primary sources (git history, source code, the decision register) before anything was written.

## Phase A — Entry gate (verified, not assumed)

| Check | Result |
|---|---|
| `a5ae068098e16c95262d791945fcb6cb6ba44d0b` (Package H merge) ancestral to `origin/main` | ✅ confirmed via `git merge-base --is-ancestor` |
| `5cc1aa7465fd9859eb0af87a46b5816e6ea60aae` (Package H closure sync) ancestral | ✅ |
| `6a0823566929b982d417a00cc53e75b678980555` (EST idempotency correction merge) ancestral | ✅ |
| `0cbc50d11e7d684f311cba4105daaca288cb0bf1` (correction closure sync) ancestral | ✅ |
| Current `main` tip (`0cbc50d`) CI | ✅ `success` (run `33243035766`) |
| Later commits reopening the issue | None — `0cbc50d` is the actual tip; no subsequent commit exists |
| `ENG-P3-002` already administratively closed elsewhere | No — checked `CDR-001` §2/§5 (both still said `Open`/`Planned` before this task's own edit) and `IMPLEMENTATION_CHANGES.md` (no prior `ENG-P3-002` closure entry) |
| Open PRs that could affect this closure | Two unrelated open PRs found (`#164` App Check preview recovery, `#34` an old admin decision-sync doc) — neither touches the business/idempotency domain or claims any closure status |

## Phase B — `ENG-P3-002` closure recording

Recorded in `CDR-001-capability-delivery-roadmap.md`:
- §2 (Capability Status Summary table): Capability 3 row updated from the stale, never-updated `Planned` label.
- §5 (Capability 3 narrative): a new dated `[UPDATED 2026-08-29]` entry appended, stating `ENG-P3-002 = Closed`, listing Packages A–H complete (Package G's privacy correction named explicitly), `IDENTITY-PROFILE-A`/`B` complete, the EST-02 correction complete, hosted Founder QA deferred/not required, no blocking engineering finding remaining, and the full deferred-items list preserved unresolved/unreopened.

Recorded in `docs/changes/IMPLEMENTATION_CHANGES.md`: a new `ENG-P3-002-CLOSURE-001` entry, same content, plus this report's own findings.

No historical report or historical dated entry in either document was edited or rewritten — only new, dated entries were appended, per each document's own established convention (identical to every prior work-package closure in this file's history).

## Phase B — Independent re-verification that "Packages A–H complete" is actually true (not just asserted)

The Founder's own instruction states Packages A–H are complete; this was independently re-verified rather than transcribed, because `IMPLEMENTATION_CHANGES.md`'s narrative text for Package A never explicitly recorded a "merged" follow-up entry (only "READY FOR FOUNDER REVIEW" gates are visible there):

| Package | Merge evidence (primary source) |
|---|---|
| A (Establishment EST-01/02/03) | `git log`: PR #173 merged via `84995e693aa082bc5bf7dd2091ecd410151f9fa7` (commit message of `fac0c19`, the review/closure-sync commit) |
| A-CORR-001 (Review completeness fix) | PR #175 merged via commit referenced in `99c1fc8` |
| B (Dashboard shell/home) | `IMPLEMENTATION_CHANGES.md`: "PACKAGE B MERGED AND CLOSED" |
| C (Profile + Locations) | "PACKAGE C MERGED AND CLOSED" |
| D (Terms/Activation) | "PACKAGE D MERGED AND CLOSED" |
| E | Folded into B/C/D's own scope — no standalone Package E was ever built or required ("Package E unchanged (satisfied by inclusion in B/C/D)") |
| F (Team Management) | This session's own prior work: merged `da46e15871ab427edf429bc4f2b40d677c0f39b5`, post-merge CI `success` |
| G / G-COMPLETION | Merged (staff transport identity projection); G-COMPLETION-REVIEW's privacy/fail-closed correction (`readDisplayNamesByUserIds`) merged in the same pass |
| H (Integration/E2E QA) | This session's own work: merged `a5ae068098e16c95262d791945fcb6cb6ba44d0b` |
| `IDENTITY-PROFILE-A` | "merged and closed" |
| `IDENTITY-PROFILE-B` | "merged and closed" |
| EST-02 idempotency correction | This session's own work: merged `6a0823566929b982d417a00cc53e75b678980555` |

## Phase C — Deferred items confirmed non-blocking, not reopened

All eight items the Founder listed were independently cross-checked against the source that first disclosed each (Package H's own implementation report's deferred-items table, and this session's own EST-02 report), confirming each is a real, previously-disclosed, non-blocking item — none was newly discovered, none was touched, none is claimed resolved:

1. `Business.address`/`BusinessBranch.address` model debt — a real product-decision gap, Package H's own report classifies it "blocking for a real product decision, non-blocking for this closure."
2. `legalName`/`logoUrl`/`supportedLanguages` Business-Profile read-contract gap — confirmed still open (`getBusinessContext`'s DTO still omits these three).
3. Terms reacceptance/versioning pending separate legal authority — `DEC-LEGAL-002`, confirmed `OPEN_LEGAL` in `decision-register.md` (see Phase D below — this is also the actual Capability-3 blocker, not merely a cosmetic deferred item).
4. Unsupported Team actions — out of MVP scope, not begun, unchanged.
5. Multi-location — out of MVP scope (single-Branch bootstrap invariant, unchanged), not begun.
6. Transient category-label flash — confirmed self-healing, cosmetic, unchanged.
7. `LanguageSwitcher` cosmetic spacing — cosmetic, unchanged.
8. Intermittent unrelated CI timing flakes — this session alone observed three distinct instances (`PhoneAuthHarnessPage`, `commandDispatcher.emulator.test.ts`, `registrationSignInService.emulator.test.ts`), each confirmed non-reproducing on an immediate rerun of the identical commit, each in a file untouched by any of this session's changes — consistent with this repository's own long-disclosed flake class (`CDR-001`'s own historical entries name the identical pattern repeatedly, e.g. the Capability-2 G2 entry: "one concurrency-timing idempotency-test flake, the same disclosed class as prior closure reports").

None of the eight was implemented, fixed, or otherwise touched by this task.

## Phase D — Capability 3 readiness assessment

### Governing sources found (not inferred from task numbering)

1. `CDR-001-capability-delivery-roadmap.md` §5, "Capability 3 — Business Identity": objective, customer outcome, and the named major work packages (`ENG-P2-002`, `ENG-P2-003`, `ENG-P2-004`, `ENG-P3-001`, `ENG-P3-002`, `ENG-P3-003`).
2. `docs/05-implementation/change-tracking/engineering-implementation-programme.md`'s Phase-table row **P3** ("Commerce Knowledge and Business Onboarding"), which states the actual **TRD22 §22.13 exit criteria**: *"Business completes onboarding without creating uncontrolled categories; Knowledge Studio manages launch taxonomy; EN/FR labels display correctly; missing-option suggestion works."* This is the formal completion bar, not just descriptive prose.
3. `ENG-P3-001-DESIGN-001-commerce-knowledge-architecture-delivery-design.md` §26 (`DEC-CKS-001`/`DEC-CKS-002`, Founder-approved) — reconciles the P3 exit criteria against what `ENG-P3-001`/`ENG-P3-003` actually each own.
4. `docs/00-governance/decisions/decision-register.md` — live decision status (`DEC-LEGAL-002`, `DEC-TECH-008`).

Two documents were checked and found **not** to be live/authoritative for this purpose and were **not** updated: `engineering-implementation-programme.md`'s own "Last controlled update" is 2026-08-22 (predates every `ENG-P3-002-UI-IMP-*` package) and `requirements-traceability-matrix.md` shows every single row as `Not Started`/`Not yet defined` — an initial-planning snapshot never kept current as implementation progressed, not a live tracker. Neither was rewritten (out of this task's scope, and doing so would risk a much larger, unrelated-file edit).

### Requirements matrix

| Capability 3 requirement | Governing source | Implemented by | Verified | Remaining work |
|---|---|---|---|---|
| Business identity — create, owner, profile, branch | `CDR-001` §5 | `ENG-P2-002A`/`B`/`C` | ✅ Merged/closed (`git log`, `CDR-001` §5 history) | None |
| Staff identity — invite, membership, suspend/remove, role change, permission override | `CDR-001` §5 | `ENG-P2-003A`–`E` + `ENG-P2-003C-CORR-001` | ✅ `ENG-P2-003` concern = Complete (20-row acceptance matrix, all PASS or correctly `DEFERRED-BY-DESIGN`) | None |
| Role context and permission resolution | `CDR-001` §5 (shared with Capability 2) | `ENG-P2-004A`–`D` + corrections | ✅ Complete (merged PR #109 and corrections) | None |
| Commerce Knowledge seed data | `CDR-001` §5 | `ENG-P3-001A`/`B`/`C` | ✅ "Complete with explicit downstream content deferrals" (`DEC-CKS-001`) | Content-governance deferrals (missing Business Types, Reward Program categories, French glossary gaps) — explicitly non-blocking per `DEC-CKS-001` |
| Business completes onboarding without creating uncontrolled categories | `engineering-implementation-programme.md` P3 (TRD22 §22.13) | `ENG-P3-001C`'s `validateBusinessClassificationReferences`, invoked inside `bootstrapBusiness`'s own transaction | ✅ Structurally enforced — `primaryCategoryId`/`businessTypeId` must resolve to an existing, active, correctly-typed `KnowledgeNode`; no client-invented category path exists | None |
| Knowledge Studio manages launch taxonomy | `engineering-implementation-programme.md` P3 | `ENG-P3-003` (not built) | **Satisfied by Founder-approved substitution, not by building `ENG-P3-003`** — `DEC-CKS-002`: "Initial seed knowledge may be repository-controlled... `ENG-P3-003` may follow the initial onboarding capability... central Commerce Knowledge governance is unaffected" | `ENG-P3-003` itself remains `Not started`, separately authorizable, explicitly not launch-blocking |
| EN/FR labels display correctly | `engineering-implementation-programme.md` P3 | `I18N-001` (centralized i18next foundation) + Package H's own French screenshots (#13–17) | ✅ Confirmed via merged i18n infrastructure and direct visual evidence | None |
| Missing-option suggestion works | `engineering-implementation-programme.md` P3 | `ENG-P3-003`'s own future `knowledgeSuggestions` write path (not built) | **Deferred by the same `DEC-CKS-002` disposition** — `ENG-P3-001-DESIGN-001` explicitly scopes "any write command beyond seed-loading (suggest/review/approve/publish/translate)" to `ENG-P3-003` | Same as above — bundled with `ENG-P3-003`, not a separate gap |
| Business onboarding flow (EST-01→02→03, Terms, Team, wizard) | `CDR-001` §5 | `ENG-P3-002A`/`B`/`C` + `ENG-P3-002-UI-IMP-A`–`H` + the EST-02 idempotency correction | ✅ `ENG-P3-002` = Closed (this task) | None at the work-package level |
| **A business can actually reach `pending_verification` in the real system today** | Implicit in every governing source's own "onboarding completes" language; directly enforced by `businessLifecycleCommand.ts`'s `assertCurrentBusinessTermsAccepted` | `acceptBusinessTerms`/`submitBusinessForVerification` (`ENG-P3-002A`), gated on a governed Terms version existing in `platformConfig/businessTerms` | ❌ **Not currently satisfiable** — no governed Terms version is configured (confirmed by direct source inspection of the fail-closed gate, and independently corroborated by Package H's own `07-business-terms-unavailable-*.png` evidence, captured days before this report) | **`DEC-LEGAL-002`** (Terms/legal content) resolution, `OPEN_LEGAL` in `decision-register.md`, plus a governed Terms-version configuration action — a legal/product dependency, not an engineering defect |
| Knowledge Studio MVP (`ENG-P3-003`) | `CDR-001` §5 | Not built | N/A — `DEC-CKS-002` confirms not required for Capability 3's own onboarding-completion bar | Remains `Not started`, separately authorizable whenever the Founder chooses; not blocking |
| `DEC-TECH-008` (search) | `ENG-P3-001-DESIGN-001` | Engineering-Lead-owned decision | Open, `ENG-P3-001-DESIGN-001` itself confirms non-blocking (§17) | Owed for its own sake, not a Capability-3 gate |

### Is the roadmap's "Not started" stale?

**Yes, unambiguously.** `CDR-001` §2's Capability 3 row said `Planned` since the table's creation and was never updated across dozens of subsequent §5 narrative entries documenting real, merged engineering work (`ENG-P2-002A`–`C`, `ENG-P2-003A`–`E`, `ENG-P3-001A`–`C`, `ENG-P3-002A`–`C`, `ENG-P3-002-UI-IMP-A`–`H`) — a pure tracking-currency lapse in the summary table, not a considered assessment. §5's own narrative label, `Open — partially implemented; not closed`, was more current but itself hadn't been touched since 2026-08-23 (before Package F/G/H and this correction merged) and — as this task's own Phase D analysis shows — was also imprecise in a different direction: it undersold how much engineering work was actually complete by that point, while not naming the one dependency (`DEC-LEGAL-002`) that actually blocks the capability's customer-facing completion. Both are corrected in this task.

### Recommendation

**`CAPABILITY 3 IN PROGRESS — blocked on DEC-LEGAL-002 (Terms content) resolution and governed Terms-version configuration`**

Not `READY FOR FOUNDER CLOSURE`: the capability's own completion bar — a business can complete onboarding — is not achievable end-to-end in the real system today, for a reason entirely outside engineering scope (no governed Terms content/version exists).

Not `NOT STARTED`: every named major engineering work package is genuinely `Complete` or `Closed`, and the one remaining named package (`ENG-P3-003`) is Founder-dispositioned as explicitly non-blocking for this exact reason — asserting "not started" would misstate substantial, verified, merged engineering progress.

## Files modified

- `docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md` (§2 row, §5 dated entry — append only, no historical text rewritten).
- `docs/changes/IMPLEMENTATION_CHANGES.md` (new `ENG-P3-002-CLOSURE-001` entry — append only).
- `docs/05-implementation/reports/eng-p3-002-closure-001-capability-3-readiness-report-2026-08-29.md` (this file, new).

No `functions/`, `apps/web/`, Firestore Rules, dependency, lockfile, or CI-workflow file touched. No feature implementation performed, per the task's own explicit instruction.

## Diff summary

Two append-only edits to existing tracking documents plus one new report. No code diff.

## Commands executed

`git fetch origin main`; `git merge-base --is-ancestor <sha> origin/main` ×4 (entry-gate ancestry); `gh run list --branch main` / `gh run view` (current CI); `gh pr list --state open` (reopening/conflict check); `grep`/`git log --oneline --merges`/`git show --stat` across `CDR-001`, `IMPLEMENTATION_CHANGES.md`, `engineering-implementation-programme.md`, `requirements-traceability-matrix.md`, `decision-register.md`, `ENG-P3-001-DESIGN-001` (governing-source discovery and cross-verification); direct `grep`/read of `businessLifecycleCommand.ts` (Terms-gate confirmation) and `docs/05-implementation/evidence/ENG-P3-002-UI-IMP-H/` (screenshot corroboration); `npx prettier --check` on the edited roadmap file.

## Dependencies added

None.

## Config changes

None.

## Risks

- The Capability 3 status wording adopted here (`Open — engineering work packages complete; blocked on governed Terms-content configuration`) is longer/more specific than the repository's prior two-word-style labels (`Planned`, `Open — partially implemented; not closed`) — a deliberate choice to avoid re-creating the same staleness/ambiguity this task found, but it does depart from the established terse convention; the Founder may prefer a shorter label carrying the same meaning.
- `DEC-LEGAL-002`'s own `decision-register.md` entry lists "Required by: Phase 14/pilot" — an apparent tension with this report's finding that it functionally blocks Phase 3/Capability 3 today (the runtime code enforces the gate regardless of the decision's originally-scoped governance phase). This report surfaces the tension rather than resolving it; reconciling the decision register's own "Required by" field is a governance question for the Founder/Engineering Lead, not something this task's scope authorizes settling.
- This assessment did not re-verify hosted deployment/production readiness beyond what Package H's own report already covered (hosted preview deferred, Founder-accepted) — consistent with how every other capability closure in this repository's history has treated that dimension, but noted for completeness.

## Rollback

Revert the three files listed above — no code, no data, no config to unwind. All changes are additive documentation entries.

## Closure record path

`docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md` (§2, §5).

## Changes-tracking path

`docs/changes/IMPLEMENTATION_CHANGES.md` (`ENG-P3-002-CLOSURE-001` entry).

## Capability 3 governing definition

`CDR-001-capability-delivery-roadmap.md` §5 (objective/work-packages) + `engineering-implementation-programme.md`'s Phase-table row P3 (TRD22 §22.13 formal exit criteria) + `ENG-P3-001-DESIGN-001` §26 (`DEC-CKS-001`/`DEC-CKS-002` reconciliation of those criteria against `ENG-P3-001`/`ENG-P3-003`'s respective scopes).

## Capability 3 requirements matrix

See the table above (Phase D).

## Capability 3 current status recommendation

**`CAPABILITY 3 IN PROGRESS — blocked on DEC-LEGAL-002 (Terms content) resolution and governed Terms-version configuration`**

## Remaining governed work

`DEC-LEGAL-002` (Terms/legal content, `OPEN_LEGAL`) resolution, followed by configuring a governed Terms version in `platformConfig/businessTerms` — the sole remaining dependency before a real business can complete onboarding to `pending_verification`. `ENG-P3-003` (Knowledge Studio) remains separately authorizable whenever the Founder chooses, explicitly not required for this. `DEC-TECH-008` (search) remains open, confirmed non-blocking.

## Exact next Founder action

Resolve or route `DEC-LEGAL-002` (with legal adviser, per its own `decision-register.md` ownership) and authorize a governed Terms-version configuration action once content exists — this is the one concrete, named step between the current state and a business being able to actually complete onboarding. Separately and independently, decide whether/when to authorize `ENG-P3-003` (Knowledge Studio) — not required for Capability 3's own MVP completion bar, per `DEC-CKS-002`.
