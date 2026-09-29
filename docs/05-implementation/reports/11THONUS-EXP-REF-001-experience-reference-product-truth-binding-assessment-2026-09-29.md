> **Title:** 11THONUS-EXP-REF-001 — Experience Reference → Product Truth Binding and Assembly Assessment  
> **Version:** 1.0 · **Status:** Assessment record — awaiting Founder review · **Classification:** Working (governance/assessment record)  
> **Governing documents:** 11thONUS Platform Constitution; [11thONUS Master Workflow](../11thonus-master-workflow.md); [Decision Register](../../00-governance/decisions/decision-register.md); Platform Constitution Part VII hierarchy  
> **Source-of-truth path:** `docs/05-implementation/reports/11THONUS-EXP-REF-001-experience-reference-product-truth-binding-assessment-2026-09-29.md`  
> **Scope:** Assessment only. No production UI was created, no production application code was changed, no domain logic, permissions, migrations, dependency, configuration, Firebase or infrastructure change was made, no payment integration or French localisation was implemented, and nothing was deployed. No Experience Assembly was started.

# 11THONUS-EXP-REF-001 — Experience Reference → Product Truth Binding and Assembly Assessment

## 1. Evidence basis

- **Repository:** `Fkenogo/11THONUS`.
- **Entry `origin/main` SHA:** `09a6c084013e9b5b52cf594f9a9d9f20a8dbf9d9` (merge of PR #282, `CAPABILITY-6-REDEMPTION-ENGINE-001-MERGE-CLOSE-001`), verified by `git fetch origin --prune && git rev-parse origin/main` at assessment start.
- **Assessment workspace:** isolated worktree `/Volumes/PRODUCTION/Projects/11THONUS-worktrees/exp-ref-assessment-001`, branch `docs/11thonus-exp-ref-001-binding-assessment` branched from that exact SHA, clean at entry. The primary working directory was **not** used as an authority source and was **not** altered — see §2.
- **Experience Reference repository:** `Fkenogo/11thonus-prototype`.
- **Adopted Experience Reference SHA:** `18e8d700f505beefe46d324f6ea33f20a670abe7` (merge of PR #2, `feat/redemption-experience-reference-pass1`), verified present as a commit object, checked out detached, and inspected in full. This is the frozen adopted state; no later prototype state was assessed and nothing was reinterpreted from memory.
- **Method:** direct read/`grep` of files in the two isolated checkouts. The `search_codebase` tool roots at the contaminated primary working directory and was deliberately **not** used for evidence; all findings below were re-verified by `grep`/`find`/`git` scoped to the isolated worktrees.

### 1.1 Authorities reviewed

- `FD-REDEMPTION-AUTHORITY-001` — Founder direction, 2026-09-27 (`docs/00-governance/decisions/evidence/`), recorded as `DEC-LOY-018`.
- `CAPABILITY-6-REDEMPTION-ENGINE-001` implementation report and `-MERGE-CLOSE-001` merge-closure record (2026-09-27 / 2026-09-28).
- `BUSINESS-REWARD-CYCLE-VISIBILITY-001` (Entry 260) — Business Reward / Loyalty-Cycle read surface.
- `PLATFORM-BASELINE-006A` (Purchase / Verification spine) and the Qualifying Item series `-011`, `-012`, `-013A.1`, `-013A.2`, `-013B`, `-013C`, `-013D`, `-013E`.
- TRD 10/11/12/16/17/18, TRD 22 §22.39; PRD 01/06/07; Decision Register; Master Workflow §17; `CDR-001`; `ENG-P3-003-DESIGN-001`; `FD-KS-1` / `DEC-GOV-011` (Knowledge-Studio platform-administrator scope).
- Production code: `functions/src/domains/{purchase,rewardProgram,permissions,platformAdministration,commerceKnowledge,business,identity,qrIdentity,trust}/`, `functions/src/infrastructure/postgres/migrations/`, `apps/web/src/**`.

## 2. Pre-existing repository hazard (recorded, not caused by this task)

The **primary working directory** `/Volumes/PRODUCTION/Projects/11THONUS` is in a heavily dirty state at entry: **384 porcelain entries, 256 staged deletions, 92 staged modifications, ~56,195 lines removed**, including deletions across `apps/web/src/**` and `functions/src/**`. Its branch `docs/11thonus-cf-001-cloudflare-assessment-001` (`d4f674c9`) is **not** a descendant of `origin/main`.

Production documentation already records this class of hazard twice, and it is the reason this assessment used an isolated worktree:

- `DATA-ARCH-001-pre-pilot-persistence-architecture-reassessment-2026-09-08.md:31` — "Verified that `FD-COM-001`, `CB-004` and `CB-008` are **absent from `origin/main`**… The protected primary worktree contains unc[ommitted]…"
- `DEC-LEGAL-002-BT-WHOLE-RECON-001-whole-instrument-reconciliation-report-2026-09-03.md:37` — re-verified against a correct isolated worktree, which confirmed `DEC-SUB-014` "does not exist on `origin/main`"; described `FD-COM-001` as "exclusively unmerged `FD-COM-001` work-in-progress."

**This assessment did not modify, stage, commit, stash, reset or repair the primary working directory.** The hazard is restated because it directly determines the Phase 8 commercial finding — see §6.2.

## 3. Programme position at entry

- **Capability 6 Redemption Engine:** engine **ACCEPTED / MERGED / CLOSED** (PR #281, merge `ea1e005…`; hygiene head `1c047f1…`; CI `36446612646` exact-head and `36447960092` merged-main both succeeded). **Capability 6 itself is NOT YET COMPLETE** — Experience Reference refinement and production Experience Assembly remain outstanding.
- **PB-013B P3-3:** **OPEN / UNRESOLVED and separate.** Repository authority at entry says so explicitly in Entry 264, the merge-closure record, and Master Workflow §17. Nothing in the adopted Experience Reference changes that, and this assessment does not close it.
- **Deployments:** nothing deployed. Migration `0019` was never executed in any environment; `0020` was exercised only in local/CI test databases.
- **Master Workflow:** P0–P2 `Complete`; **P3 `Open`** (Terms-blocked); P4–P16 `Blocked`. **P12 Platform Administration / Admin console: `Blocked`**, dependent on P2/P4/P11. The roadmap successor to Capability 6 is Capability 7 (Business Operations), then Capability 8 (Platform Operations).
- **`CDR-001` currency gap:** the capability roadmap has **not** been updated for the 2026-09-28 merge; its Capability 6 row still reads "unmerged at the time of writing" and its §5 still says "not started." Recorded as **DC-05** in §6.3.

## 4. Experience Reference inventory (adopted SHA `18e8d700`)

Inventoried from `src/` at the frozen SHA. Line counts are of the adopted state.

| Ref | Experience area | Prototype location | Loc |
|---|---|---|---|
| A | Global shell / navigation / role switcher | `src/components/common/TopBar.tsx` | 237 |
| B | Mobile-first composition (phone frame, mobile nav) | `src/App.tsx`, `src/components/business/MobileNavigation.tsx` | 147 / 333 |
| C | Business onboarding — 4-step wizard | `BusinessWorkspace.tsx:2223+` (`onboarding_wizard`) | — |
| D | Organisation setup (business → first programme → team → ready) | same wizard | — |
| E | First programme setup (wizard step 2 + `new_programme_wizard`) | `BusinessWorkspace.tsx:1969+`, `:2223+` | — |
| F | Programme creation/configuration (8 tabs incl. Rules) | `BusinessWorkspace.tsx:344–351, 1352+` | 2850 |
| G | Qualifying Item experience (`qualifyingItemName`, selling price) | `types.ts` `LoyaltyProgramme`; `initialData.ts:118+` | — |
| H | Owner dashboard — "Command Centre" | `BusinessWorkspace.tsx:344, 381+` | — |
| I | Manager dashboard (role-scoped, approvals-led) | `TopBar.tsx:61–70`; `isOwner` gating | — |
| J | Staff / counter experience (QR scan, search, record, confirm) | `src/components/business/StaffCounterExperience.tsx` | 1006 |
| K | Participant experience (home/programmes/activity/profile) | `src/components/participant/ParticipantExperience.tsx` | 723 |
| L | Customer identity / lookup / QR (code, not a voucher) | `ParticipantExperience.tsx:104–160`; `StaffCounterExperience.tsx:854+` | — |
| M | Purchase/earning recording | `StaffCounterExperience.tsx` record flow | — |
| N | Pending / approval experience | `BusinessWorkspace.tsx:1450+`; `types.ts` `ApprovalItem` | — |
| O | Reward-ready experience (Loyalty Circle visual) | `src/components/common/LoyaltyCircle.tsx` | 278 |
| P | Redemption confirmation (confirm sheet, "This one's on us.") | `StaffCounterExperience.tsx:806–850`; `data/redemptionCopy.ts` | 59 |
| Q | Post-redemption continuity (next cycle starts now) | `StaffCounterExperience.tsx:551–553`; `ParticipantExperience.tsx:168–190` | — |
| R | Team / member representation | `BusinessWorkspace.tsx:1671+` | — |
| S | Commercial standing (business-facing notice) | `BusinessWorkspace.tsx:1120+` `CommercialStandingNotice` | — |
| T | Trial experience (trial units remaining) | `BusinessWorkspace.tsx:1813+` | — |
| U | Commercial / billing experience ("Commercial & Usage", credit, ledger) | `BusinessWorkspace.tsx:1813+` | — |
| V | Operator / Platform Administrator Console (7 nav sections) | `src/components/operator/OperatorConsole.tsx` | 690 |
| W | Business 360° (Operator → selected Business) | `OperatorConsole.tsx:78–80, 300+` | — |
| X | Manual paid-service activation (offline payment reference) | `OperatorConsole.tsx:89–90, 677–680` scenario C | — |
| Y | Commercial credit adjustment | `OperatorConsole.tsx:91–94, 681` scenarios D/E | — |
| Z | Support workflow (cases, categories, notes) | `OperatorConsole.tsx:26, 550+`; `types.ts` `SupportCase` | — |
| AA | Integrity workflow (flags, priority, evidence) | `OperatorConsole.tsx:27, 458+`; `types.ts` `IntegrityCase` | — |
| AB | Markets / platform configuration | `OperatorConsole.tsx:28`; `types.ts` `MarketConfig` | — |
| AC | Audit visibility (actor/role/action/previous→new state) | `OperatorConsole.tsx:29`; `types.ts` `AuditLogEntry` | — |
| AD | Notifications / history / activity | toasts `App.tsx:96–136`; participant activity tab | — |
| AE | English-primary / French-readiness boundary | `data/redemptionCopy.ts` header; `AppContext` `AppLanguage`; `TopBar` | — |

### 4.1 Prototype-only review/demo tooling (must NOT become production architecture)

| Item | Location | Disposition |
|---|---|---|
| Scripted demo tour modal (`jumpToDemoStep`, `resetDemoData`) | `src/components/demo/ScriptedDemoModal.tsx` (292) | PROTOTYPE-ONLY |
| Deterministic operator review scenarios A–F | `OperatorConsole.tsx:677–684`; `AppContext.applyOperatorScenario` | PROTOTYPE-ONLY |
| Deterministic redemption scenarios A–F | `AppContext.applyRedemptionScenario`; staff scenario panel | PROTOTYPE-ONLY |
| `participantSeesConfirmer` privacy toggle | `AppContext.tsx:90–98` — "Prototype flag only — NOT policy" | PROTOTYPE-ONLY (open Founder privacy question, **not** a decision) |
| Phone-frame simulator chrome + caption | `App.tsx:38–65` | PROTOTYPE-ONLY |
| Role switcher with 5 named demo personas | `TopBar.tsx:40–102` | PROTOTYPE-ONLY (auth is real in production) |
| `OperatorSubRole` typing (`business_ops`/`support`/`integrity`/`finance`) | `types.ts:8–21` — self-documents as "inert prototype typing only and must NOT be treated as approved production authority boundaries" | PROTOTYPE-ONLY |
| `OnboardingState` / `CommercialStanding` unions | `types.ts:30–43` — "Prototype-only … (experience, not production lifecycle)" | PROTOTYPE-ONLY as *type names*; concepts may need governed equivalents |
| Stray agent worktree copy of an earlier prototype | `.kilo/worktrees/bevel-intelligence/**` (own `metadata.json`, `@google/genai` dep) | PROTOTYPE-ONLY / stray artefact |
| Committed `dist/` bundle | `11thonus-prototype/dist/**` | PROTOTYPE-ONLY build output |

**Prototype honesty markers present and respected.** The adopted SHA carries explicit non-authority annotations in `types.ts` (OperatorSubRole; OnboardingState; CommercialStanding; `redemptionAuthority`), in `AppContext.tsx` (redemption-authority prototype typing; `participantSeesConfirmer`; scenario helpers), and in `redemptionCopy.ts` ("prototype-only"; French keys are structural placeholders). Its self-labelling is reliable and is treated as evidence of intent, **not** as Product Truth.

## 5. Product Truth mapping — summary by area

Legend: **DB** DIRECT BIND · **AN** ASSEMBLY NEEDED · **AD** ADAPTER NEEDED · **TG** TRUTH GAP · **DC** DOCUMENTATION CONFLICT · **MC** MATERIAL CONFLICT · **PO** PROTOTYPE-ONLY.

| Ref | Experience area | Product Truth authority (production) | Production implementation | Class |
|---|---|---|---|---|
| A | Global shell / nav | TRD16; real auth + `platformAdministration` discovery | `SignInPanel`, `CustomerShell`, `BusinessDashboardShell` (role-agnostic nav) | AN |
| B | Mobile-first composition | TRD16 (PWA/responsive) | production UI already mobile-first (§12) | AN |
| C | Business onboarding | ENG-P3-002 design; `ENG-P2-002/003/004` | `business/onboarding/steps` (EST-01/02/03 only) | AN |
| D | Organisation setup | DEC-LOY-016/017; PB-012 | establishment steps; terms/team moved to Dashboard | AN |
| E | First programme setup | PB-012/013; `rewardProgram` domain | **no onboarding-time programme step**; only `/dashboard/reward-programs` | AN |
| F | Programme configuration | PB-013A–013E; DEC-LOY-016/017 | `RewardProgramManagementPage`, `QualifyingItemSelector` | AN |
| G | Qualifying Item | DEC-LOY-016/017; PB-013B/C/D/E | `qualifyingItem` domain + migrations 0016–0019 | DB / AN |
| H | Owner dashboard | TRD10/11; `businessLoyaltyVisibility` | `DashboardHome` | AN |
| I | Manager dashboard | DEC-AUTH-*; permissions evaluator | role-agnostic shell; no client role guard | AN |
| J | Staff counter | `PLATFORM-BASELINE-006A` `recordPurchase` | `purchaseMutations.ts` adapter; no mobile counter surface | AN + AD |
| K | Participant | TRD16; loyalty visibility | `CustomerShell` + 2 stub destinations; no progress/reward | AN |
| L | Customer identity / QR | DEC-ID-002; `qrIdentity` domain | QR/loyalty-number presentation; participant code CTA absent | AN |
| M | Purchase recording | `PLATFORM-BASELINE-006A` (19-step contract) | `recordPurchase` callable + web adapter | DB / AN |
| N | Pending / approval | `purchase_record_events`; `under_review` state | `PurchaseRecordsPage` | AN |
| O | Reward-ready | TRD11; `reward_available` cycle state | `listLoyaltyCycleProgressForBusiness` (`reward`, `unitsToReward`) | AD |
| P | Redemption confirmation | **DEC-LOY-018 / `confirmRedemption`** | callable-only, undeployed | AD |
| Q | Post-redemption continuity | DEC-LOY-018 D-1; engine CORR-001 | closes cycle → opens next → forward-allocates | AD |
| R | Team representation | DEC-ID-*; `staffMembership` | `TeamManagementPage` | AN |
| S | Commercial standing | **none governed in production** | `businessStatus` only (lifecycle ≠ commercial) | **TG** |
| T | Trial | **none governed in production** | none | **TG** |
| U | Commercial / billing | TRD17 v1.0 *Draft*, subscription-first | inert `subscriptionId?`; never-thrown error code | **DC** + **TG** |
| V | Operator Console | TRD18 §18.5 (11 roles); `DEC-GOV-011`/`FD-KS-1` (2 knowledge roles) | `platformAdministration` is **knowledge-only**; 1 callable | **TG** |
| W | Business 360° | none | none | **TG** |
| X | Manual paid activation | none | none | **TG** |
| Y | Commercial credit | none | none | **TG** |
| Z | Support cases | none | none | **TG** |
| AA | Integrity cases | `trust_events` (evidence substrate only) | no case management | **TG** |
| AB | Markets / platform config | `commerceKnowledge` (taxonomy/classification only) | knowledge nodes, not markets | **TG** |
| AC | Audit visibility | `platformAdministrationAuditRecord` (**write-only**) | no read/query function | AD + TG |
| AD | Notifications / history | `notification_intents` + `purchase_outbox` (from 006A) | no delivery, no UI | AD + TG |
| AE | Language boundary | TRD16; i18next in production | **EN + FR both already at key parity** | DC (scope) |

## 6. Classification counts and conflicts

### 6.1 Counts (each material capability carries exactly one primary classification)

| Classification | Count | Areas |
|---|---|---|
| **DIRECT BIND** | 2 | G (Qualifying Item truth), M (purchase-recording truth) |
| **ASSEMBLY NEEDED** | 12 | A, B, C, D, E, F, H, I, K, L, N, R |
| **ADAPTER NEEDED** | 6 | O, P, Q, J, AC (read), AD |
| **TRUTH GAP** | 11 | S, T, V, W, X, Y, Z, AA, AB, audit-read, notification-delivery |
| **DOCUMENTATION CONFLICT** | 6 | DC-01…DC-06 (§6.3, §13) |
| **MATERIAL CONFLICT** | 1 | MC-01 (§6.2) |
| **PROTOTYPE-ONLY** | 11 | §4.1 items |

> Count note: 31 experience areas (A–AE) are inventoried. Counts are capability-level and intentionally overlap where an area has both an assembly strand and a distinct adapter or truth-gap strand (e.g. J, K, AC, AD), so the sum exceeds 31 by design.

### 6.2 MATERIAL CONFLICT — MC-01: the adopted commercial experience has no repository authority

**Evidence.**

1. The task brief directs mapping against "**FD-COM-001** and subsequent authority." `FD-COM-001` **does not exist on `origin/main`**. Verified: `git ls-tree -r --name-only HEAD | grep -iE 'fd-com|commercial'` returns nothing; `git log --all --diff-filter=A -- '*FD-COM*' '*fd-com*'` returns nothing.
2. It exists only as **six untracked (`??`) files** in the contaminated primary worktree, including `docs/00-governance/decisions/evidence/FD-COM-001 — 11thONUS Core Commercial Model Decision.md`. Its own status line reads `**Status:** APPROVED FOR GOVERNED RECONCILIATION` — explicitly *for reconciliation*, not merged authority.
3. Production documentation classifies it as **provisional and ungoverned**, repeatedly and in the Founder-facing record:
   - `DATA-ARCH-001-…-2026-09-08.md:76` — "FD-COM-001 completed-cycle debit, grace-debt and top-up settlement rules | **PROVISIONAL / UNGOVERNED INPUT** | Absent from entry `origin/main`; excluded…"
   - `DATA-ARCH-001-…-2026-09-08.md:122` — "FD-COM-001 debit/grace/top-up rules are excluded as **PROVISIONAL / UNGOVERNED INPUT**."
   - `DATA-ARCH-001-…-2026-09-08.md:31` — verified absent from `origin/main`.
4. The only commercial document in production is `docs/02-technical/trd/17-subscription-and-billing.md`, **v1.0, "Draft for approval (pre-freeze)"**, and it is **subscription-first** (subscription plans, plan limits, upgrades/downgrades, mobile-money billing) — the opposite architecture from the consumption-first model the Experience Reference presents. Its consumption-first rewrite never landed on `main`.

**Consequence.** The adopted Experience Reference's Commercial & Usage tab, Commercial Standing, trial units, credit balance, grace, restriction, manual activation and credit adjustment have **no governed production authority to bind to**. This is not a documentation conflict (which would imply an existing document wrongly restricting the experience) — it is a **material conflict between the adopted experience and the repository's actual authority state**. It is escalated, not resolved.

**Explicitly NOT done:** FD-COM-001 was **not** merged, adopted, copied, back-filled or treated as authority; the prototype's commercial model was **not** promoted to default; the 5-unit trial was **not** adopted (see §10.2).

### 6.3 Documentation conflicts

| ID | Conflict | Evidence | Recommended amendment |
|---|---|---|---|
| DC-01 | `TRD17` is subscription-first v1.0 "Draft for approval", contradicting the adopted consumption-first commercial experience | `17-subscription-and-billing.md:1–2, 11–40` | Amend TRD17 to the adopted commercial model **only after** MC-01 is resolved by Founder direction |
| DC-02 | `DATA-ARCH-001` sizes and recommends the datastore while **explicitly excluding** all FD-COM-001 commercial inputs | `DATA-ARCH-001-…:76, 122, 172` | Reassess on governance rather than back-filling authority (the report itself says so) |
| DC-03 | `PB-013B P3-3` OPEN/UNRESOLVED and gated before "the first dependent Reward Program publishing/authoring production path" | Entry 264; merge-closure record; Master Workflow §17 | **Keep open.** Assembly must not route through the publication path until separately resolved |
| DC-04 | Onboarding deliberately stops at establishment; Terms and Team were moved to the Dashboard | `EstablishmentReviewPage.tsx:6–8` | Amend if the adopted 4-step onboarding is approved; no Product Truth reason currently forbids it |
| DC-05 | `CDR-001` not updated for the 2026-09-28 merge; Capability 6 row still "unmerged", §5 still "not started" | `CDR-001` vs Entry 264 | Currency correction; factual only |
| DC-06 | Direction says "French optional/deferred", but production ships complete EN+FR parity | `apps/web/src/i18n/`; `i18n.test.tsx:66–75` (453/453) | Restate direction as "English primary; French maintained at parity". Factual correction only (§13) |

## 7. Existing production UI disposition

Assessed **separately** from Product Truth. No recommendation here replaces working domain/backend architecture.

| Production UI / structure | Disposition | Rationale |
|---|---|---|
| `BusinessDashboardShell.tsx` | **REFINE** | Structure and responsive approach are sound and already mobile-first; nav is role-agnostic and must gain the adopted hierarchy |
| `DashboardHome.tsx` | **REFINE** | Useful truth; needs adopted information priority (reward-ready first) |
| `PurchaseRecordsPage.tsx` | **REFINE** | Aligned with `PLATFORM-BASELINE-006A`; must become the staff/counter recording surface's desktop counterpart |
| `TeamManagementPage.tsx` | **REUSE** | Materially aligned with the adopted Team experience |
| `RewardProgramManagementPage.tsx` + `QualifyingItemSelector` | **REFINE** | Domain-correct and recently corrected (PB-013D/E); needs adopted composition and mobile layout. **PB-013B P3-3 still gates the publication path** |
| `QualifyingNodeSelector.tsx` | **REPLACE** | Superseded by the Business-owned Qualifying Item model (migrations 0016–0019); retaining it preserves legacy schema terminology in the experience. Backend truth is unaffected |
| `businessLoyaltyVisibility.ts` | **REUSE** | The correct adapter seam for reward-ready and cycle progress |
| `purchaseMutations.ts` | **REUSE** | Correct adapter for `recordPurchase` |
| `CustomerShell.tsx` + customer pages | **REFINE** | 2 of 5 destinations are "not yet available" stubs; no reward progress or redemption; **zero responsive test coverage** |
| `SignInPanel.tsx`, `MfaEnrollmentPage` | **REUSE** | Real auth; aligned with TRD16 and `DEC-SEC-002`/`DEC-SEC-003` |
| `business/onboarding/steps` (EST-01/02/03) | **REFINE** | Establishes truth; adopted onboarding adds a first-programme step and a combined ready state |
| `dev/**` harnesses | **DEFER** | Developer/review scaffolding, excluded from production builds. Must **not** be assembled into the product experience |
| `components/ui/formPrimitives.tsx` (5 exports) | **REFINE** | Design system is thin. Seven declared dependencies have **zero imports** |
| Onboarding dead code (`ReviewStep`, `TeamStep`, `TermsStepContainer`) | **DEFER** | Zero production importers; separate bounded cleanup |
| Any **Operator Console UI** | **DEFER** | Does not exist; depends on TRUTH GAP closure (MC-01) |
| Any **commercial UI** | **DEFER** | Does not exist; blocked on MC-01 |

**Disposition counts: REUSE 4 · REFINE 8 · REPLACE 1 · DEFER 4.**

## 8. Required assessment matrix (part 1 of 2: A–M)

`DE` = Experience Reference location. Classification per §6.1. Dependency gives the prerequisite work package (§15).

| Ref | Experience area | DE location | Intended experience | Product Truth authority | Production implementation | Existing UI | Class | UI disp. | Gap / conflict | Recommended production action | Security / integrity / privacy | Tests / evidence | Dependency |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | Global shell / nav | `TopBar.tsx` | Role-aware shell, consistent hierarchy | TRD16 | `BusinessDashboardShell`, `CustomerShell` | Shell + nav | AN | REFINE | Nav role-agnostic; no client role guard | Assemble adopted hierarchy; keep server-side authz authoritative | Client nav is not authorization; never expose role as a security boundary | `BusinessDashboardShell.test.tsx`, `CustomerShell.test.tsx` | WP-1 |
| B | Mobile-first composition | `App.tsx`, `MobileNavigation.tsx` | Mobile-first for all human roles | TRD16 | Already mobile-first | 4 files use `md:`; 0 tables | AN | REFINE | No bottom-nav primitive; customer untested | Keep mobile-first; add bottom-nav/drawer primitives | n/a | `accessibility.spec.ts` (1 test @390px) | WP-1 |
| C | Business onboarding | `BusinessWorkspace:2223+` | 4-step guided setup | ENG-P3-002; `ENG-P2-002/003/004` | EST-01/02/03 | `onboarding/steps` | AN | REFINE | Onboarding stops at establishment (DC-04) | Amend onboarding composition, not truth | Setup must not imply a commercial entitlement | step tests | WP-3 |
| D | Organisation setup | same | Business → programme → team → ready | DEC-LOY-016/017; PB-012 | establishment + profile | `BusinessProfilePage`, `LocationsPage` | AN | REFINE | Terms/Team relocated to Dashboard | Recompose without changing truth | Terms acceptance remains separately governed | existing page tests | WP-3 |
| E | First programme setup | `:1969+`, wizard step 2 | Create first programme during setup | PB-012/013 | `rewardProgram` domain | `RewardProgramManagementPage` | AN | REFINE | No onboarding-time programme step | Add step **only after** PB-013B P3-3 resolution (DC-03) | Must not route through the unresolved publication path | PB-013 suite | WP-3, DC-03 |
| F | Programme configuration | `:1352+`, 8 tabs | Programme + rules configuration | PB-013A–013E | `rewardProgram`, `qualifyingItem` | `RewardProgramManagementPage` | AN | REFINE | Desktop-leaning rows at `:663`, `:745` | Refine composition; keep domain rules | Owner-only rule authority unchanged | PB-013D/E suites | WP-3 |
| G | Qualifying Item | `initialData:118+` | Business-defined item per programme | DEC-LOY-016/017 | migrations 0016–0019 | `QualifyingItemSelector` | DB / AN | REFINE | Legacy node vocabulary in UI | Bind existing truth; retire legacy labels | Business ownership is the security boundary | `platform-baseline-013*` | WP-3 |
| H | Owner dashboard | `:381+` "Command Centre" | Reward-ready-first home | TRD10/11 | `businessLoyaltyVisibility` | `DashboardHome` | AN | REFINE | Information priority differs | Recompose priority; reuse adapter | Cross-customer data stays Owner/Manager-scoped server-side | `DashboardHome.test.tsx` | WP-4 |
| I | Manager dashboard | `TopBar:61–70` | Approvals-led Manager home | DEC-AUTH-* | permissions evaluator | same shell | AN | REFINE | No Manager-specific home | Derive Manager view from **permission, not title** | **Title must not become authority** (`FD-REDEMPTION-AUTHORITY-001`) | `evaluatePermission.*` | WP-4 |
| J | Staff counter | `StaffCounterExperience.tsx` | Scan → identify → record → confirm | `PLATFORM-BASELINE-006A` | `recordPurchase` | `purchaseMutations.ts` | AN + AD | REFINE | No mobile counter surface | Assemble counter surface on the existing adapter | Recorder identity/role server-resolved; 19-step contract must not be re-derived client-side | `PurchaseRecordsPage.test.tsx` | WP-2, WP-5 |
| K | Participant | `ParticipantExperience.tsx` | Mobile loyalty wallet | TRD16 | loyalty visibility reads | `CustomerShell` + stubs | AN | REFINE | 2 stub destinations; no progress/reward | Assemble from visibility adapter | Participant sees **own** data only | `CustomerRewardsPage.test.tsx` | WP-6 |
| L | Identity / QR | `Participant:104–160` | Present code at counter; lookup only | DEC-ID-002 | `qrIdentity`, loyalty number | QR present | AN | REFINE | Participant code CTA absent | Add code presentation as lookup, never a voucher | **No customer confirmation tap/PIN/token** (`FD-…` D-1) | identity suites | WP-6 |
| M | Purchase recording | staff record flow | Fast counter recording | `PLATFORM-BASELINE-006A` | `recordPurchase` callable | adapter exists | DB / AN | REFINE | Experience not assembled | Assemble; **do not** re-implement rules | Server-resolved actor/role/status; artifact-only input | 006A suites | WP-5 |

## 8.1 Required assessment matrix (part 2 of 2: N–AE)

Same column semantics. **`HOLD`** means the recommended action is to not assemble this area until the named blocker is resolved by Founder direction.

| Ref | Experience area | DE location | Intended experience | Product Truth authority | Production implementation | Existing UI | Class | UI disp. | Gap / conflict | Recommended production action | Security / integrity / privacy | Tests / evidence | Dependency |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| N | Pending / approval | `:1450+` | Approvals queue | `purchase_record_events`; `under_review` | `PurchaseRecordsPage` | AN | REFINE | Approvals are a dashboard section, not a first-class queue | Promote to its own destination | Approver authority stays server-side | `TeamManagementPage.workforce.test.tsx` | WP-4 |
| O | Reward-ready | `LoyaltyCircle.tsx` | Visual 10-of-10 progress | TRD11 `reward_available` | `listLoyaltyCycleProgressForBusiness` | `businessLoyaltyVisibility.ts` | AD | REUSE | UI visual absent | Bind existing read model; **no new rule** | Business-scoped server-side | `businessLoyaltyVisibility.test.ts` | WP-2 |
| P | Redemption confirm | `StaffCounter:806–850` | Confirm sheet, "This one's on us." | **DEC-LOY-018** | `confirmRedemption` callable | none | AD | — (new) | No web adapter, no eligibility signal | Build adapter + UI on the engine | **Mutation-boundary reauthorization is server-side only**; never trust client eligibility | `confirmRedemptionCommand.postgres.test.ts` (44), lock-order (4) | WP-7 |
| Q | Post-redemption continuity | `StaffCounter:551–553` | Next cycle starts now | DEC-LOY-018 D-1; CORR-001 | cycle close → open → forward-allocate | none | AD | — (new) | No read model for next-cycle state | Consume engine response; **do not** duplicate state in the client | Engine is the single source of truth | same as P | WP-7 |
| R | Team | `:1671+` | Team & frontline staff | DEC-ID-* | `staffMembership` | `TeamManagementPage` | AN | REUSE | None material | Reuse | Invitation/authority boundaries unchanged | `TeamManagementPage.test.tsx` | WP-4 |
| S | Commercial standing | `CommercialStandingNotice` | Standing visible to business | **none governed** | none | none | **TG** | — (new) | MC-01 | **HOLD** pending Founder governance | Do not display an ungoverned standing | none | **MC-01** |
| T | Trial | `:1813+` | Trial units remaining | **none governed** | none | none | **TG** | — (new) | MC-01; the 5-unit value is ungoverned | **HOLD**; never adopt 5 as a production default | n/a | none | **MC-01** |
| U | Commercial / billing | `:1813+` | Credit, ledger, grace | TRD17 v1.0 Draft (subscription-first) | inert `subscriptionId?` | none | **DC** + **TG** | — (new) | DC-01, MC-01 | **HOLD**; amend TRD17 after governance | Payment integration out of scope | none | **MC-01** |
| V | Operator Console | `OperatorConsole.tsx` | Human-in-the-loop launch ops | TRD18 §18.5; `DEC-GOV-011`/`FD-KS-1` | `platformAdministration` = **knowledge-only** | none | **TG** | — (new) | All 13 console capabilities absent | **HOLD**; P12 blocked; no RBAC invented | **Sole-administrator launch model; no new roles without Founder approval** | platformAdmin suites | **MC-01**, WP-9 |
| W | Business 360° | `OperatorConsole:300+` | Full business view for operator | none | none | none | **TG** | — (new) | Absent | **HOLD** | Cross-tenant access must be explicitly governed | none | MC-01 |
| X | Manual paid activation | scenario C | Offline payment → activate | none | none | none | **TG** | — (new) | Absent | **HOLD** | Manual activation is a privileged, audited act | none | MC-01 |
| Y | Commercial credit | scenarios D/E | Grant / adjust credit | none | none | none | **TG** | — (new) | Absent | **HOLD** | Money-affecting mutation; audit + dual control needed | none | MC-01 |
| Z | Support | `OperatorConsole:550+` | Support cases | none | none | none | **TG** | — (new) | Absent | **HOLD** | PII handling; participant privacy | none | MC-01 |
| AA | Integrity | `OperatorConsole:458+` | Integrity cases | `trust_events` (substrate only) | none | **TG** | — (new) | No case management | **HOLD** | Must not infer guilt from signals alone | none | MC-01 |
| AB | Markets | `OperatorConsole:28` | Market configuration | `commerceKnowledge` (taxonomy only) | knowledge nodes | **TG** | — (new) | Taxonomy ≠ markets | **HOLD** | n/a | none | MC-01 |
| AC | Audit visibility | `OperatorConsole:29` | Who did what, previous → new | `platformAdministrationAuditRecord` | **write-only** | none | AD + **TG** | — (new) | No read/query function | Build a governed audit read model | Audit reads must themselves be audited | audit repository tests | WP-9 |
| AD | Notifications / history | toasts, activity tab | Notifications, history | `notification_intents` + `purchase_outbox` (006A) | intents only | none | AD + **TG** | — (new) | No delivery, no UI | Assemble on existing intents | Participant-facing content must respect privacy | 006A suites | WP-10 |
| AE | Language | `redemptionCopy.ts` | English primary, French deferred | TRD16; i18next | **EN + FR both at key parity** | `i18n/` | DC (scope) | REFINE | Direction says FR deferred, yet FR exists in production | Confirm FR scope with Founder; **do not** claim unverified support | n/a | `i18n.test.tsx` (453/453 parity) | WP-11 |

## 9. Redemption experience binding (Phase 7)

### 9.1 What Experience Assembly must consume — exactly

The single governed mutation is `confirmRedemption`, exposed as a Firebase callable taking `{ businessId, rewardId, idempotencyKey }` and returning `{ reward, redemption, completedLoyaltyCycleId, nextLoyaltyCycleId, unitsAllocatedForward, nextReward }` (migration `0020`; `functions/src/domains/purchase/services/confirmRedemptionCommand.ts`; `repositories/redemptionRepository.ts`).

| Adopted experience element | Engine truth | Assembly obligation |
|---|---|---|
| Reward-ready detection | `rewards.state = 'available'`; cycle `reward_available` | Read from `listAvailableRewardsForBusiness` / `listLoyaltyCycleProgressForBusiness`. **Do not re-derive readiness client-side** |
| Persisted Reward | `rewards` table (business/customer/program scope, `rewards_governing_version`) | Display from the read model only |
| Confirmer eligibility | `redemption.confirm`: Owner floor; Manager default/revocable; Staff explicit grant; **no** Platform Administrator; **no** Customer | Render authority from server-resolved permissions |
| Live authority | re-resolved per attempt; no cached authority | Revoked grants must immediately grey out the action |
| Mutation-boundary reauthorization | re-checked **inside** `confirmRedemption` | Never gate solely on a client-side check |
| Explicit Business confirmation | staff confirm sheet after the reward is provided | Preserve the two-step confirm |
| Confirmer attribution | the actual confirmer, never the granter | Display exactly who confirmed |
| Redemption lifecycle | `available → redeemed` | Consume the response; do not mirror state |
| Cycle closure | `reward_available → reward_redeemed` | Engine-owned (CORR-001) |
| Next cycle opening | engine opens the next cycle | Engine-owned |
| Pending-unit forward allocation | ordered by originating Purchase Record commercial `purchase_date` (CORR-003) | Engine-owned; deterministic |
| Governing version | post-redemption cycle binds to first-allocation version (CORR-002) | Engine-owned |
| Trust Events | `reward.redeemed` + `loyalty_cycle.reward_redeemed` | Evidence only; not a UI state source |
| Notification intents | governed intents emitted by the engine | Delivery is a separate gap (AD/TG) |
| Idempotency | **client must supply `idempotencyKey`**; server does not derive one | UI must generate and reuse it per attempt |
| Concurrent confirmation | deterministic lock order; 4 lock-order tests | UI must not assume first-write-wins |
| Participant privacy | no customer tap/PIN/token/offline (D-1) | Participant sees acknowledgement only |
| Post-redemption continuity | "next 10 starts now" | Derived from `nextLoyaltyCycleId` / `nextReward` |

### 9.2 Binding gaps

1. **No web adapter.** No file in `apps/web/src` imports, calls, or types `confirmRedemption`. `apps/web/src/business/api/` has `purchaseMutations.ts` but no redemption equivalent. → **ADAPTER NEEDED**.
2. **No confirmer-eligibility signal in any read.** Both available-reward reads filter on `state='available'` plus membership/ownership; neither consults `redemption.confirm` nor returns an eligibility flag. The only feedback is the error taxonomy (`AUTH_FORBIDDEN`, `INVALID_STATE_TRANSITION`, and a deliberately indistinguishable `RESOURCE_NOT_FOUND`). → **ADAPTER NEEDED**.
3. **No redemption history or attribution read.** No `listRedemptionsForBusiness`/`…ForCustomer`; the `redemptions` table is write-and-test-only. The adopted "Confirmed by {name}" and history views have **no production source**. → **ADAPTER + TRUTH GAP**.
4. **Callables only, never deployed.** The single `onRequest` export is `ping`; migration `0020` has only been exercised in local/CI test databases. → no HTTP adapter; deployment is out of scope.
5. **Mass-assignment guard is untested.** `functions/src/index.ts:2385` states the redemption transport parser is "Exported for the mass-assignment regression test", but no such test exists. → evidence gap to close before assembly.
6. **Prototype privacy toggle is not a decision.** `participantSeesConfirmer` (`AppContext.tsx:90–98`) is explicitly a Founder-review choice, not policy. It is **PROTOTYPE-ONLY** and must be resolved by Founder direction before any participant attribution is displayed.

**Conclusion:** the engine is accepted, deployed nowhere, and paired with a real but sparse read surface. The redemption experience is **bindable**; it is not **ready** — it needs an adapter layer, an eligibility signal, a history/attribution read, and a closed privacy decision.

## 10. Commercial experience binding (Phase 8)

### 10.1 Governed Product Truth in production

**There is none for the adopted commercial model.** The only commercial document in production is `docs/02-technical/trd/17-subscription-and-billing.md` — **v1.0, "Draft for approval (pre-freeze)"**, and **subscription-first** (plans, limits, upgrades/downgrades, mobile-money billing, invoices). The consumption-first rewrite exists only in the untracked FD-COM-001 material in the contaminated primary worktree and never landed on `main`.

The **only genuinely implemented, governed commercial-adjacent facts** on `main` are loyalty-side: `LOYALTY_CYCLE_THRESHOLD = 10` (`loyaltyCycleRepository.ts:37`); the customer-protection rules in the `DEC-LOY-011` family with `DEC-LOY-002`/`DEC-LOY-008`; and the Commerce Knowledge taxonomy, which its own seed manifest states is **classification-only**.

### 10.2 GOVERNED PRODUCT TRUTH vs PROTOTYPE EXAMPLE VALUES

| Adopted concept | Status on `main` | Prototype value | Classification |
|---|---|---|---|
| 10+1 / Circle model | Threshold 10 **implemented**; "Circle" naming not governed | `requiredSteps: 10`; `LoyaltyCircle` | DIRECT BIND / ASSEMBLY |
| Billable point | **No referent in any document, merged or unmerged** | "Completed Billable Circles" | TRUTH GAP — term unsourced |
| Flat $1-equivalent unit | **Not governed** | `$1.00 USD Deducted`, `unitAmountUSD` | TRUTH GAP (MC-01) |
| Trial 3–5 range | **Not present anywhere** | `trialAllowanceTotal: 5` on all demo orgs | TRUTH GAP |
| Grace | **Not governed** | `commercialStanding: 'grace'` | TRUTH GAP |
| Negative credit | **Not governed** | `creditDelta = -5` | TRUTH GAP |
| Zero-credit new-start restriction | **Not governed** | Sparkle Car Wash `operatorNote` | TRUTH GAP |
| Completion of active Circles | Unmerged FD-COM-001 §9 only | grace copy in Commercial tab | TRUTH GAP |
| Earned Reward preservation | **Partially governed** — `DEC-LOY-011` suspension default-redeemable; PRD06 §5 retired programmes still redeemable | grace copy | DIRECT BIND |
| Manual activation | **Not governed** | `ManualActivationRecord`, `paidActivationRef` | TRUTH GAP |
| Commercial standing | **Not governed** | `CommercialStanding` union | TRUTH GAP |
| Business-facing visibility | **Not governed** | `CommercialStandingNotice` | TRUTH GAP |
| Operator actions | **Not governed** | scenarios A–F | TRUTH GAP + PROTOTYPE-ONLY |
| Audit / evidence | Audit record **write-only**, no read | `AuditLogEntry` previous→new | TRUTH GAP |

**The 5-unit trial — explicit finding.** The prototype sets `trialAllowanceTotal: 5` on all four demo organisations and `OperatorConsole.tsx:85` defaults `trialUnits` to 5. Even the **unmerged** FD-COM-001 text calls it a *hypothesis* — "The current working hypothesis is: **5 free Consumption Units**… The final trial quantity remains configurable and subject to pilot validation" — and states no `3–5` range. **There is no governed 3–5 range and no governed default.** The 5-unit demonstration **must not** silently become the production default; it requires separate Founder approval. Recorded as **PROTOTYPE-ONLY / TRUTH GAP**; not resolved here.

**Conclusion:** the entire adopted commercial experience (S, T, U, W, X, Y) is **unbindable** until MC-01 is resolved. It is escalated, not assumed.

## 11. Operator Console assessment (Phase 6)

**The decisive production finding:** `functions/src/domains/platformAdministration/` is **knowledge-only**. `platformAdministratorRole.ts:23–36` defines exactly **two** roles — `knowledge_editor` and `knowledge_approver` — approved by `FD-KS-1` / `DEC-GOV-011` as a deliberate narrowing of `DEC-GOV-007`. Its permission catalogue holds exactly **7 permissions, all `knowledge.*`**. A structural test (`frameworkBoundary.test.ts:26–55`) **machine-enforces** that this domain never imports `domains/business` or `domains/permissions`. The one commercial-adjacent action in the repository, `activateBusinessAfterVerification`, lives in `domains/business` and is **not** part of this domain.

| Console capability (Founder's list) | Product Truth available | Missing | Read model / API needed | Permissions | Audit | Prototype status |
|---|---|---|---|---|---|---|
| Operations queue | none | all | queue read model | n/a | n/a | illustrative |
| Organisation onboarding oversight | Business lifecycle in `domains/business` | operator-facing oversight | oversight read model | n/a | required | illustrative |
| Business 360° | none | all | cross-tenant aggregate read | must be explicitly governed | required | illustrative |
| Trial grant / extension | none | all | — | — | required | illustrative |
| Manual paid-service activation | none | all | — | privileged | required | illustrative |
| Offline/manual payment reference capture | none | all | — | privileged | required | illustrative |
| Commercial credit | none | all | ledger | money-affecting | required + dual control | illustrative |
| Restriction / restoration visibility | Business `status` exists | commercial dimension | — | — | required | illustrative |
| Support cases | none | all | case read/write | — | required | illustrative |
| Integrity cases | `trust_events` (substrate only) | case management | case read/write | — | required | illustrative |
| Market configuration | `commerceKnowledge` (taxonomy only) | markets | — | — | required | illustrative |
| Audit visibility | audit record exists, **write-only** | **read/query** | audit read model | read must itself be audited | required | illustrative |
| Commercial history | none | all | — | — | required | illustrative |

**All 13 capabilities are NOT PRESENT IN PRODUCTION.** No Operator Console UI, route, frontend directory, or backend module exists. `ENG-P12-001`/`-002` are `Blocked` with placeholder report/commit/deployment cells.

**Founder direction honoured.** The adopted experience renders a single "Platform Administrator". The prototype's `OperatorSubRole` typing is self-labelled "inert prototype typing only and must NOT be treated as approved production authority boundaries" and is classified **PROTOTYPE-ONLY**. **No administrator RBAC has been invented here.** The sole-administrator launch model stands; differentiated roles require later definition and approval.

## 12. Mobile-first assembly (Phase 9)

**Production is already mobile-first — this corrects an assumption in the brief.** Verified across `apps/web/src`: all 22 `md:` occurrences and the single `sm:` occurrence live in just 4 files (2 shells + 2 pages); `min-w-` = 0, `<table>` = 0, `overflow-x` = 0, `lg:`/`xl:`/`2xl:` = 0, `matchMedia`/`innerWidth` = 0. Data-heavy pages avoid tables entirely in favour of stacked card lists.

| Role | Adopted composition | Production readiness | Structures that would prevent it |
|---|---|---|---|
| Owner | Mobile nav (Home/Customers/Programmes/More) + desktop nav | **Ready** — shell already mobile-first | none material |
| Manager | Same shell, permission-derived | **Ready** on layout; Manager home not assembled | role-agnostic nav (nav ≠ authz) |
| Staff/counter | QR scan → search → record → confirm | **Not assembled** — no mobile counter surface | `PurchaseRecordsPage` is desktop-shaped; the *counter* needs a mobile surface, not a rewrite of the page |
| Participant | Phone-framed mobile wallet | **Partial** — `CustomerShell` exists, 2 of 5 destinations are stubs | **zero responsive test coverage for the entire customer experience** |

**Blocking structures found (all minor; none architectural):**

1. `RewardProgramManagementPage.tsx:663` and `:745` — `flex items-center justify-between` / `flex items-end gap-2` rows with no `flex-wrap` and no breakpoint; mitigated only by e2e overflow tests.
2. **No bottom-navigation or drawer primitive.** The adopted mobile composition (4-item bottom bar + "More" sheet) has no counterpart in the design system. `components/ui/formPrimitives.tsx` is a single 168-line file with 5 exports; seven declared dependencies (`@tanstack/react-table`, `recharts`, `react-hook-form`, `zod`, `@hookform/resolvers`, `class-variance-authority`, `qrcode.react`) have **zero imports**.
3. **Responsive test coverage is uneven:** 6 of 7 responsive specs target the **dev-only** `/dev/dashboard-harness`; the only responsive assertion against a real production route is one test in `accessibility.spec.ts:88–105` at 390×844; `screenshotEvidence.spec.ts` captures but does not assert.

**Recommendation:** preserve the existing mobile-first approach; add the missing bottom-nav/drawer primitives and real-route responsive coverage. Desktop-first components are **not** treated as authoritative merely because they exist — nor is mobile-first a reason to discard them.

## 13. Language boundary (Phase 10)

**Finding requiring Founder confirmation.** The stated direction is "English primary, French optional/deferred", but **French already exists in production and is complete**: `apps/web/src/i18n` uses i18next with EN and FR locale files at **453/453 key parity**, enforced by `i18n.test.tsx:66–75`; the only 4 identical EN/FR values are legitimate cognates.

- **No French support is claimed that does not exist.** French *is* present and *is* at parity.
- The adopted reference's own position matches: `redemptionCopy.ts` states "English is primary. French keys are structural placeholders so layouts stay length-tolerant and a future pass can fill translations" — EN-primary with FR readiness, exactly the production posture.
- **Later French localisation is architecturally supported without immediate translation work:** i18next with a complete key set and an enforced parity test means new Experience Assembly surfaces must add keys to both locales or the parity test fails. That is a strong structural guarantee.
- **No localisation was implemented by this task.**

**Recommended amendment (documentation, not code):** restate the direction as *"English primary; French is present in production at full key parity and must be maintained, not deferred"* — otherwise the governed direction contradicts shipped reality. Recorded as **DC-06** in §6.3.

## 14. Recommended assembly sequence (Phase 11) — planning only, NOT started

Dependency-driven, derived from the actual repository. **This is a recommendation, not authorization.**

| # | Work package | Depends on | Reuse | Rationale |
|---|---|---|---|---|
| **WP-0** | **Resolve MC-01 — commercial authority governance** | Founder decision | — | **GATE FOR EVERYTHING COMMERCIAL.** Establishes whether FD-COM-001 enters the repository as approved authority, and settles the trial value. Without it, WP-8/WP-9 cannot start |
| WP-1 | Experience shell (adopted nav hierarchy, bottom-nav/drawer primitives, mobile-first tokens) | WP-0 (non-commercial parts parallelizable) | `BusinessDashboardShell`, `CustomerShell` (REFINE) | Foundation for all role surfaces; no new truth needed |
| WP-2 | Experience-facing adapters/read models (redemption adapter, eligibility signal, reward-ready, history/attribution, audit read) | WP-0 | `businessLoyaltyVisibility.ts`, `purchaseMutations.ts` (REUSE) | Closes the ADAPTER gaps; consumes existing truth without duplicating rules |
| WP-3 | Organisation/business context + onboarding + first programme | WP-1, WP-2, **DC-03** | `onboarding/steps`, `RewardProgramManagementPage` (REFINE) | Business readiness; **must not** route through the unresolved PB-013B P3-3 publication path |
| WP-4 | Owner/Manager assembly (Command Centre, Customers, Approvals, Team, Reports) | WP-1, WP-2 | `DashboardHome`, `PurchaseRecordsPage`, `TeamManagementPage` (REUSE/REFINE) | Manager views derived from **permission, not title** |
| WP-5 | Staff/counter assembly (mobile counter) | WP-2, WP-4 | `purchaseMutations.ts` | Mobile recording surface on the `PLATFORM-BASELINE-006A` contract |
| WP-6 | Participant assembly (wallet, progress, code presentation) | WP-2, WP-5 | `CustomerShell` (REFINE) | Own-data-only; code as lookup, never a voucher |
| WP-7 | **Redemption binding** | WP-2, WP-5, WP-6 + privacy decision | `confirmRedemption` (DIRECT BIND to engine) | The one area where accepted engine truth directly drives the adopted experience |
| WP-8 | Commercial-standing binding | **WP-0** | none (new) | Entirely gated on MC-01 |
| WP-9 | Operator Console assembly | **WP-0**, P12 unblocking | none (new) | All 13 capabilities absent; sole-administrator model only |
| WP-10 | Cross-role continuity (notifications, history, activity) | WP-4…WP-7 | `notification_intents` (ADAPTER) | Delivery is a separate gap |
| WP-11 | Mobile validation + Experience acceptance | WP-1…WP-10 | existing e2e (extend) | Real-route responsive coverage, incl. the customer experience |

**Reusable existing packages:** `PLATFORM-BASELINE-006A` (purchase/verification), `BUSINESS-REWARD-CYCLE-VISIBILITY-001` (read surface), the Qualifying Item series `-013A.1`→`-013E`, and `CAPABILITY-6-REDEMPTION-ENGINE-001` (accepted engine) are all **reusable as-is**. None needs replacement.

**New bounded work packages necessary:** WP-1 (shell/primitives), WP-2 (adapters), WP-5 (counter surface), WP-6 (participant assembly), WP-7 (redemption binding), WP-10 (continuity/notification delivery), WP-11 (mobile validation), and — after governance — WP-8 and WP-9.

**Critical path:** WP-0 → WP-8/WP-9, and independently WP-1 → WP-2 → WP-5 → WP-7. **The commercial and operator-console halves of the adopted experience cannot start without a Founder governance decision.**

### 14.1 Proposed next executable work package

**`11THONUS-EXP-REF-002 — Experience Foundation (WP-1 + WP-2)`.** Rationale: it is the only substantial work package that is (a) unblocked by MC-01, (b) reuses two existing adapters unchanged, (c) establishes the shell and adapter boundary every later package needs, and (d) creates no new Product Truth. It deliberately excludes redemption UI, commercial UI and the Operator Console. Requires separate Founder execution authorization; **not authorized by this assessment**.

## 15. Risks

| # | Risk | Severity | Control / recommendation |
|---|---|---|---|
| R-1 | **Primary working directory contamination** — 384 staged entries, 256 deletions across `apps/web` and `functions`, FD-COM-001 present only there | **High** | Quarantine or preserve the primary worktree before further work. Any tool reading it (including `search_codebase`) will return non-authoritative commercial material |
| R-2 | **Commercial experience assembled on ungoverned truth** | **High** | WP-0 gate. Do not display commercial standing, trial, credit or grace until governed |
| R-3 | **5-unit trial silently becomes production default** | **High** | Explicitly classified PROTOTYPE-ONLY / TRUTH GAP; requires separate Founder approval |
| R-4 | Frontend duplicating engine rules (readiness, cycle state, idempotency) | Medium | WP-2 adapter boundary; server remains authoritative; client generates `idempotencyKey` only |
| R-5 | Participant privacy: displaying the confirmer name | Medium | `participantSeesConfirmer` is an open Founder question, not policy. Resolve before any attribution UI |
| R-6 | Client-side eligibility mistaken for authorization | Medium | Mutation-boundary reauthorization is server-side; never gate solely on the client |
| R-7 | Operator RBAC invented by analogy to the prototype | Medium | Sole-administrator model preserved; `OperatorSubRole` classified PROTOTYPE-ONLY |
| R-8 | `dev/**` harnesses leaking into the product experience | Medium | Classified DEFER / PROTOTYPE-ONLY; excluded from production builds |
| R-9 | `PB-013B P3-3` (OPEN) bypassed by onboarding programme creation | Medium | WP-3 gated on DC-03 |
| R-10 | Customer experience has zero responsive test coverage | Low–Medium | WP-11 adds real-route coverage |
| R-11 | `CDR-001` currency lag misleads a future reader | Low | DC-05; factual correction recommended |

## 16. Rollback instructions

Documentation-only change set on branch `docs/11thonus-exp-ref-001-binding-assessment`:

1. Delete the added report `docs/05-implementation/reports/11THONUS-EXP-REF-001-experience-reference-product-truth-binding-assessment-2026-09-29.md`.
2. Revert the two change-tracking updates: `git checkout origin/main -- docs/changes/IMPLEMENTATION_CHANGES.md docs/00-governance/documentation-changes-log.md`.
3. Remove the worktree if desired: `git worktree remove /Volumes/PRODUCTION/Projects/11THONUS-worktrees/exp-ref-assessment-001` (only after the branch is deleted or the changes are no longer needed).
4. The primary working directory requires **no** rollback — it was not modified.
5. No database, migration, deployment, configuration or dependency rollback is required, because none occurred.

## 17. Explicit negative confirmation

This assessment performed **NO production implementation**. Specifically, it did **not**: copy prototype code into production; create production UI; modify domain logic; modify permissions; modify migrations; resolve any Product Truth gap; invent Platform Administrator RBAC; implement payment integration; implement French; deploy anything; alter Firebase configuration; or alter infrastructure. It added no dependency and changed no configuration, schema or migration. It did not start Experience Assembly, and it did not merge, adopt or back-fill FD-COM-001.

## 18. Disposition

**ASSESSMENT COMPLETE — READY FOR FOUNDER REVIEW**

Two items require a Founder decision before further assembly: **MC-01** (commercial authority) and the **participant-confirmer privacy question**. Neither blocks the proposed WP-1/WP-2 foundation package.

---

## 19. MC-01 RESOLUTION AND RECLASSIFICATION — 2026-09-29 (`FD-COM-001-FOUNDER-RECONFIRM-001`)

**This section is a dated addendum. §§1–18 above are preserved as originally assessed** (assessment date 2026-09-29, entry `origin/main` `09a6c08…`). Where this section conflicts with them, **this section governs**.

### 19.1 MC-01 is RESOLVED — and the resolution is a new Founder decision, not a recovered one

MC-01 (§6.2) held that the adopted commercial experience had **no repository authority** to bind to, because `FD-COM-001` was absent from `origin/main`. That finding was correct and has been superseded by a different kind of event.

The [`FD-COM-001-REC-ASSESS-001` provenance assessment](FD-COM-001-REC-ASSESS-001-commercial-authority-recovery-and-provenance-assessment-2026-09-29.md) established that the untracked candidate package was **never committed, reviewed, merged or registered**, and that its self-certified `DEC-SUB-014` never existed. **The candidate was not adopted.**

The Founder has now **explicitly reconfirmed the commercial direction**, recorded prospectively as **`DEC-SUB-014`** (CONFIRMED) in the [Decision Register](../../00-governance/decisions/decision-register.md) from Founder decision `FD-COM-001`, with canonical evidence at [FD-COM-001 — Core Commercial Model (Founder Decision)](../../00-governance/decisions/evidence/FD-COM-001-core-commercial-model-founder-decision-2026-09-29.md).

**Governed commercial Product Truth now exists:** consumption-first model; **commercial unit** = the governed 10 qualifying-unit earning side of the 10+1 Circle; **USD 2 equivalent per commercial unit**; subscription tiers deferred; trial **3–5** units (no universal 5 default); capacity governs **new** Cycle starts; grace for active Circles; negative credit recoverable with no floor; earned-Reward preservation by reference to `DEC-LOY-011`/PRD06 §5; manual launch commercial administration for the sole Platform Administrator, auditable, with an explicit non-authorisation boundary.

**MC-01 status: RESOLVED.**

### 19.2 Price binding: the frozen Experience Reference's `$1` is illustrative and superseded

The frozen Experience Reference (`Fkenogo/11thonus-prototype` @ `18e8d700f505beefe46d324f6ea33f20a670abe7`) contains **illustrative commercial scaffolding**, including `unitAmountUSD: 1.0`, `$1.00 USD Deducted` display copy, and a 5-unit trial default.

**Those values are PROTOTYPE-ONLY. They are not Product Truth and they are superseded for production binding.**

- The **frozen prototype is NOT modified.** It remains adopted and frozen as the **Experience Architecture**.
- The Experience Reference governs **experience architecture, not commercial pricing semantics**. Its `$1` is **not** a reason to alter Product Truth.
- **Binding rule for Experience Assembly:** any illustrative commercial value encountered in the reference — the `$1.00` unit, the 5-unit trial display, credit-balance and settlement demo values — **must be bound to the governed USD 2 equivalent price and the governed 3–5 trial range**. This is a **binding requirement on assembly**, not a change to the reference.

### 19.3 Reclassified commercial areas

| Ref | Area | Original classification | **Reclassified (2026-09-29)** | Rationale |
|---|---|---|---|---|
| S | Commercial standing | TRUTH GAP (MC-01) | **ASSEMBLY/ADAPTER NEEDED** | Product Truth now governed; missing pieces are the standing read model and UI, not authority |
| T | Trial | TRUTH GAP (MC-01) | **ASSEMBLY NEEDED** | Governed: 3–5 units, no default. The prototype's 5 is illustrative and must bind to the range |
| U | Commercial / billing | DC + TG (MC-01) | **DC resolved; ASSEMBLY/ADAPTER NEEDED** | TRD17 now marked SUPERSESSION-BOUND rather than governing subscription-first truth |
| W | Business 360° | TRUTH GAP | **ADAPTER NEEDED** | Commercial standing/history now governed; cross-tenant read model still missing |
| X | Manual paid activation | TRUTH GAP | **AUTHORISED — implementation missing** | Explicitly authorised by `DEC-SUB-014` §8; still no command surface |
| Y | Commercial credit | TRUTH GAP | **AUTHORISED — implementation missing** | Grant/adjust credit and negative balance governed; ledger still missing |
| AB | Markets / platform config | TRUTH GAP | **reclassified — see 19.3b** | Launch-market scope is **not** open (Burundi and Rwanda are the immediate operating context). Only the **bounded local-currency derivation mechanics** remain, as commercial-design questions |
| Y (negative credit) | Negative-credit limit | *n/a* | **GOVERNED — not a gap** | `DEC-SUB-014` §6: credit may go negative, is recoverable, and there is **no hard negative floor and no maximum negative balance**. A limit is **not** an unresolved requirement of the current model |

### 19.3b Two classification corrections (review correction, 2026-09-29)

**Correction 1 — negative credit is GOVERNED, not a Product Truth gap.** An earlier draft of this section listed "negative-credit limit policy" as genuinely unresolved Product Truth. That was wrong and is corrected here. `DEC-SUB-014` §6 already establishes the complete rule: commercial credit **may become negative** as a **recoverable** balance; there is **no governed hard negative floor**; and there is **no governed maximum negative balance**. **A negative-credit limit is therefore NOT an unresolved Product Truth requirement for the current commercial model.** No limit is invented here. If risk controls or limits are proposed later, they constitute a **new future governance decision** and must **not** be treated as a prerequisite for, or a blocker on, the present model. Consequently the commercial-unit ledger must support a negative balance, but owes no maximum-balance concept.

**Correction 2 — currency/market is a bounded commercial-DESIGN question, not a broad unresolved Product Truth gap.** An earlier draft listed "market/currency configuration scope" as genuinely unresolved. That was over-broad and is corrected here. The **launch-market scope is not open**: the current product direction and the adopted Experience Reference establish **Burundi and Rwanda** as the immediate operating context. What `DEC-SUB-014` fixes is the **commercial price — USD 2 equivalent per commercial unit**. What remains unresolved is only the **mechanism for translating that equivalent into operational/local-currency commercial values**, namely: local-currency equivalent determination; administrative versus FX-derived pricing; effective dates; rounding; BIF/RWF representation; and adjustment/change governance. These are **bounded COMMERCIAL DESIGN questions for the forthcoming consumption-first commercial design package**. **They are not decided in this task, and this task does not broaden launch-market scope.**

**Corrected remaining picture.**

*Remaining genuine Product Truth gaps* (unresolved authority): differentiation of Platform Administrator roles beyond the sole Founder at launch (`DEC-GOV-007` remains **OPEN**); separation-of-duty specifics for commercial actions beyond existing `DEC-GOV-011`. Nothing else in the commercial area is an authority gap.

*Remaining commercial-DESIGN / implementation gaps* (authority exists; design and build outstanding): the commercial-unit **ledger and data architecture**; the **cycle-completion → consumption-event** binding; the **cycle-start capacity gate**; the **local-currency derivation mechanics** enumerated above; the **audited manual-administration command surface**; the **commercial standing/history read model**; the **commercial audit read model**; and **notification/low-balance threshold configuration**. All are **no longer an absence of commercial authority**.


### 19.4 Reclassified Operator Console capabilities

The absence of implementation must not be read as absence of Product Truth. Reclassified into the four categories required:

**A. Already-authorised platform responsibilities** (pre-existing platform authority, unchanged by this decision): business onboarding oversight; business suspend/restore where permitted; support case management; platform reporting; platform configuration. Basis: TRD18 §18.5.2 and the `DEC-GOV-007`/`DEC-GOV-011` platform-administration frame.

**B. Operational capabilities now authorised by `DEC-SUB-014` §8** (newly authorised, still unimplemented): grant/adjust trial allowance within 3–5; record offline/manual settlement or payment reference; add/adjust commercial credit; activate paid service; restrict/restore commercial service per governed standing; inspect commercial standing and history. All attributable and auditable, with the §8.1 non-authorisation boundary binding.

**C. Implementation/adapters still missing:** the commercial-unit ledger; the manual-administration command surface and its audit record; the commercial standing read model; the capacity gate; the consumption-event binding; the Operator Console UI itself.

**D. Genuinely unresolved Product Truth:** differentiation of Platform Administrator roles beyond the sole Founder at launch (`DEC-GOV-007` remains **OPEN**); separation-of-duty specifics for commercial actions beyond existing `DEC-GOV-011`. **Nothing else.** In particular, and per the review correction in §19.3b: a **negative-credit limit is not an unresolved Product Truth requirement** (credit may go negative, is recoverable, and no hard floor or maximum negative balance is governed — a future limit would be a *new* governance decision, not a present prerequisite); and **launch-market scope is not open** (Burundi and Rwanda are the immediate operating context — only bounded local-currency derivation mechanics remain, as commercial-design questions).

### 19.5 Documentation conflicts

DC-01 (TRD17 subscription-first) — **RESOLVED** by the supersession banner. DC-05 (`CDR-001` currency lag) — **RESOLVED** by the Capability 7 currency note. The CF-001 authority defect (recorded externally as FDC-DC-01) — **RESOLVED** by the dated authority-chain correction. DC-02 (`DATA-ARCH-001` explicit exclusion) — **remains as a historical exclusion note**, correctly describing its own scope; it is not a conflict with the new decision, which post-dates it.

### 19.6 What still blocks Experience Assembly

**Commercial and Operator Console assembly is now unblocked at the authority level and blocked at the implementation level.** The genuine blockers are: a **separate Founder/Technical Lead implementation authorization** for the consumption-first commercial design and build; the **consumption-unit ledger, capacity gate and consumption-event binding**; the **manual-administration command surface with audit**; the **TRD17 governed rewrite**; and the **adapters/read models** listed in §19.3–19.4. `PB-013B P3-3` remains **OPEN / UNRESOLVED and separate**. **Experience Assembly has not been started.**
