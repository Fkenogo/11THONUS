# 11THONUS — Experience Assembly Programme Authority Reconciliation Report

> **Date:** 2026-10-05 · **Status:** Governance reconciliation proposed; PR required · **Classification:** Working (programme authority)
> **Base:** `origin/main` `1d15d2d87a513cf892416ed6f286d7604d725797`
> **PR #298:** merged as `1d15d2d87a513cf892416ed6f286d7604d725797`; reviewed head `f30b907e44bafb958be156a9626330bfc6512159` is an ancestor.
> **Experience Reference:** `Fkenogo/11thonus-prototype@18e8d700f505beefe46d324f6ea33f20a670abe7`.
> **Governing direction:** `DEC-PROD-015` and Founder direction: “Preserve the prototype experience as closely as possible, replacing only the specific data, action, field or authority that conflicts with Product Truth.”

## 1. Entry repository state

Fetched `origin` and verified a clean starting branch from current `origin/main` at `1d15d2d87a513cf892416ed6f286d7604d725797`. PR #298 is merged; `DEC-PROD-015`, its decision evidence, the binding plan and changes-log entry are present on `main`. The frozen prototype checkout is exactly `18e8d700f505beefe46d324f6ea33f20a670abe7`.

The Master Workflow §17 still points to 2026-08-07 as its last current-next-action reconciliation. EIP §C.1 tracks three unrelated engineering backlog packages and has no Experience Assembly stream. The Coding Agent Prompt Register lists the 47 phase packages plus those three; it has no EA-BL package rows. `CDR-001` Capability 6 remains incomplete and still contains older status language about the redemption engine/experience assembly. `EA-001` remains an assessment, not authority. The frozen-reference binding assessment is the source mapping; it is pre-implementation and does not authorize code.

`EA-BL-001` implementation source/report cited in prior work is not present on this `main` tree. Its branch does not establish current programme state. PR #298 did merge the decision/plan but did not register execution packages.

Open PR inventory at entry: PR #164 (ENG-P3-002C preview App Check recovery, conflicting) and PR #34 (ENG-P2-RES admin sync, conflicting). Neither overlaps Slice A. No open WP-COM-06a or Experience Assembly PR was found. EA-002 Local Founder Preview Foundation was separately merged as PR #294; **EA-BL-002 remains unstarted and unauthorized**.

## 2. PR #298 disposition

PR #298 is **MERGED**, merge SHA `1d15d2d87a513cf892416ed6f286d7604d725797`. Its reviewed head `f30b907e44bafb958be156a9626330bfc6512159` is on `origin/main`. `DEC-PROD-015` is current and confirmed in the Decision Register. No decision is duplicated here.

## 3. Existing programme authority gap

Before this reconciliation, the Master Workflow did not define an Experience Assembly stream or point to the frozen Experience Reference as an execution authority; EIP and Prompt Register had no EA-BL packages; no current record authorized a vertical assembly slice. EA-001 and the binding assessment are assessment/design records. The previous implementation report/branch is not package authority.

This Founder task expressly authorizes reconciliation of the existing Master Programme and **Slice A only**, conditional on no material new domain/security architecture decision. This reconciliation therefore adds the stream to the existing Master Workflow and registers its child packages in the existing EIP and Prompt Register. It creates no new programme or parallel register.

## 4. Reconciled authority chain

**Master Programme (Master Workflow §17)** → **Experience Assembly stream (same programme)** → **EA-BL-001-CORR-002** → **EA-BL-001-CORR-002-A — Customer Identity & Circle (`Ready`)**.

The Experience Reference governs composition, hierarchy, interaction, responsive behaviour, visual system and experience states. Product Truth governs authoritative state/data, permissions, security and transitions. Both apply together. Where preserving the reference would materially conflict with Product Truth, stop for Founder decision; neither source silently erases the other.

Controls: frozen reference `18e8d700…`; `DEC-PROD-015`, `DEC-PROD-002`, and applicable existing Product Truth; bounded vertical packages; current work-package Definition of Done; ordinary Technical Review; required Founder Preview and final Founder review. Slices B–E are registered `Not Yet Scheduled` and are not authorized. EA-BL-002 and FEF-TLC-001 are not adopted/started by this reconciliation.

## 5. Registered vertical packages

The Master Workflow remains the authority; EIP §C.2 and Prompt Register §4 record package scope/status using their existing structures. These Experience Assembly entries sit outside the 47 Phase 0–16 roadmap count, following existing EIP §C.1 successor-package practice.

| Package | Scope | Status in this reconciliation | Dependency / gate |
|---|---|---|---|
| EA-BL-001-CORR-002-A | Customer Identity & Circle | **Ready** — Founder authorized Slice A only | Becomes current main authority on merge; detailed implementation prompt required before coding; see §6 |
| EA-BL-001-CORR-002-B | Staff Counter | **Not Yet Scheduled — NOT AUTHORIZED** | A accepted; separate future Founder authorization; Business Review foundation precedes this slice |
| EA-BL-001-CORR-002-C | Owner / Manager Operations | **Not Yet Scheduled — NOT AUTHORIZED** | A and B; Business Review foundation; separate future Founder authorization |
| EA-BL-001-CORR-002-D | Onboarding & Programme Creation | **Not Yet Scheduled — NOT AUTHORIZED** | Prior slices and existing Business/programme preconditions; separate future Founder authorization |
| EA-BL-001-CORR-002-E | Secondary / Dependent Surfaces | **Not Yet Scheduled — NOT AUTHORIZED** | Individually bounded read authorities and dependencies; separate future Founder authorization |
| EA-BL-001-CORR-002-BR | Business Review Domain Foundation | **Not Yet Scheduled — NOT AUTHORIZED** | Required before B/C where review is in the path; DEC-PROD-015 governs policy |

`EA-BL-001-CORR-002-A` status `Ready` uses current Prompt Register §3 vocabulary: preconditions are met and the package may receive its detailed implementation prompt. The Founder authorizes Slice A only. Do not treat package registration or the Experience Assembly parent stream as authorization for any other slice.

## 6. Slice A exact authorized scope

**Identifier/title:** `EA-BL-001-CORR-002-A — Customer Identity & Circle`.

**Frozen reference target:** `src/components/participant/ParticipantExperience.tsx`; supporting `src/components/common/LoyaltyCircle.tsx`, participant/customer navigation, identity presentation, reward presentation, activity/history composition and mobile composition from the exact frozen prototype SHA.

**In scope:** member header; customer-owned canonical Loyalty Number and current QR presentation; customer home; relationships needed to render that customer's current Businesses/programmes/Circles; Circle progress; visually distinct Pending Units for recorded purchases awaiting Customer verification; Verified Units from the authoritative loyalty ledger; server-authoritative Reward Available state; redemption history/acknowledgement and next-cycle continuity where persisted; the core customer activity/history feed; mobile bottom navigation; English-primary/French parity; loading/empty/error states; prototype light/slate surfaces, amber emphasis, card hierarchy and interaction density; desktop and phone comparison.

**Out of scope:** Business Review lifecycle/schema/commands; Staff counter; Owner/Manager shells; onboarding/programme creator; Business directory/join for new programmes; complete notifications/delivery; reports; commercial standing; EA-BL-002; application code in this reconciliation.

**Product Truth invariants:** customer verification remains mandatory; Pending Units are not Verified Units and never unlock Rewards; Reward readiness comes from server state; derive the customer identity from the authenticated server context (never a client-supplied customer id); use real records only; no demo balances/relationships/notifications/rewards.

**Presentation of commercial hold:** a `pending_admission` Purchase has already received Customer verification but still awaits governed Commercial admission; it is neither an unverified Pending Unit nor a Verified Unit yet. Show its truthful activity status separately from Circle Pending/Verified progress. The read should allow `WP-COM-06a` recovery/admission to appear later without client-created progress.

## 7. Slice A capability dependency assessment

Current source inspection included `functions/src/index.ts`, customer callables, `identity`/loyalty number/QR repositories, purchase queries, loyalty Cycle/reward/redemption repositories, and the Customer web routes/pages.

| Capability | Classification | Current evidence and Slice A action |
|---|---|---|
| A. Customer-scoped Loyalty Number / QR | **EXISTS BUT NEEDS ADAPTER** | `ensureCustomerIdentityArtifacts` issues/reuses canonical Loyalty Number and current QR on registration and sign-in; repositories can read them. No customer artifact read callable or UI adapter exists. Add one authenticated customer-scoped callable/read and web adapter; no client identity id. `qrcode.react` is already a web dependency. |
| B. Customer-scoped Circle progress | **SMALL BOUNDED READ REQUIRED** | PostgreSQL stores verified units, allocation positions and Cycles; `listLoyaltyCycleProgressForBusiness` is Business-only. Add a read-only customer-scoped query callable deriving identity from auth. No new domain model. |
| C. Distinct Pending vs Verified projection | **SMALL BOUNDED READ REQUIRED** | Pending source is existing `purchase_records` in `waiting_for_customer`; official progress source is allocated verified-unit/Cycle state. Read/aggregate separately; pending quantity must never enter eligibility calculation. `pending_admission` is shown as an activity state, not either count. No migration required. |
| D. Current Business/programme relationships | **SMALL BOUNDED READ REQUIRED** | No customer relationship directory/join is required for existing Circles. Derive current Customer–Business–Program relationships from authoritative Cycle/Purchase/Reward rows, joined to current Business/programme display data where permitted. No mock relationship. |
| E. Available Reward read | **EXISTS** | `listAvailableRewardsForCustomer` callable and customer Rewards UI/query exist. Reuse; Circle reward-ready state must consume server-returned reward state. |
| F. Redemption history / acknowledgement / next Cycle | **SMALL BOUNDED READ REQUIRED** | Redemption table, `getRedemptionByRewardId`, Cycle history, redeemed transition and next Cycle exist; no customer-scoped list/history callable. Add a scoped read adapter joining persisted redemption/reward/Cycle history; only fields authorized for the Customer. |
| G. Core customer activity/history | **SMALL BOUNDED READ REQUIRED** | Existing waiting-for-customer list/detail callable and activity screen cover verification only. Add a bounded authenticated customer timeline over persisted Purchase and Redemption states, including `pending_admission`; do not imply notification delivery. |

No dependency requires a new security authority, new authentication model, persistent Pending Unit ledger, schema migration or Product Truth change for Slice A. The scope is a vertical read/adapter + experience package. If implementation discovers an access boundary or new durable state is necessary, stop and return it before changing architecture.

## 8. WP-COM-06a dependency verdict

**WP-COM-06a DOES NOT BLOCK SLICE A.**

Evidence: PR #293 merged at `c064f43659d87922d14bb4a245d94a5dfe8d918d`; its exact head `5a2d4bbfdf96b4a6b562c45add6909c66ee223b8` is an ancestor of current main, and `gh pr checks 293` reports post-merge CI passed. It contains the held-Purchase processor/recovery implementation and no schema migration. The implementation report still says pending review, and EIP/Prompt Register do not record a formal WP-COM-06a closure status; that administrative closure/synchronization remains outstanding and is not changed here.

There is no technical prerequisite from the processor for customer identity, verified Cycle/reward reads, or reading `waiting_for_customer`/`pending_admission`. Slice A can truthfully render the existing held state and later reflect processor transitions. No active PR overlaps. Do not change or close WP-COM-06a in this task.

## 9. Business Review dependency disposition

Do not include Business Review state machine, schema, migration or commands in Slice A. Slice A's “pending” UI is a read-only projection of existing `waiting_for_customer` Purchase records; it does not approve or reject. Register `EA-BL-001-CORR-002-BR` as a future, unauthorized prerequisite to B/C. Later scope must use a distinct Business Review Required state (not dispute `under_review`), Owner/authorized Manager review, approval → `waiting_for_customer`, rejection → no progress, append-only evidence, zero Verified Units on either decision, and subsequent Customer verification.

## 10. Theme and visual-system disposition

The shipped `apps/web/src/index.css` has a base light token set and a second `@theme` nested under `prefers-color-scheme: dark`; the global dark theme behavior remains a known defect. A broad global theme change would affect every role and is not a prerequisite for Slice A. **Treat accurate prototype appearance as a bounded Slice A styling detail:** use Customer-surface-scoped prototype light/slate and amber tokens/layout, including customer navigation and cards. Do not retain the rejected generic dark Customer shell. If rendering fidelity requires changing global theme architecture or materially affects other roles, stop and return that expanded scope for Founder approval.

## 11. Slice A acceptance criteria

1. Customer home hierarchy and member header materially match the frozen `ParticipantExperience` at desktop and phone widths.
2. Real Customer-owned Loyalty Number and current QR render from the authenticated read; no placeholder/fabricated identity remains when a real artifact exists.
3. Circle composition follows the prototype; Circle progress and reward-ready state consume server-read state.
4. Pending Units display distinctly from Verified Units, update from real waiting purchases, do not add to official progress, and never unlock a reward.
5. `pending_admission` is described as verified by Customer but awaiting Commercial admission; it does not appear as an earned Circle unit.
6. Reward availability is server-authoritative. Post-redemption history and next-cycle continuity use persisted state; absent history is honestly empty.
7. Customer receives only own data; every new read resolves identity from authenticated server context; no client-computed eligibility or direct database access.
8. Prototype mobile bottom navigation, phone-first hierarchy, light/slate surfaces, amber emphasis, card composition and interaction density are reproduced; no generic desktop sidebar shell replaces them.
9. English and French copy/state parity; no layout hierarchy change between languages.
10. Loading, empty, error, stale, active-circle, pending+verified, reward-available, post-redemption and commercial-held activity states are covered by relevant domain/read, authorization, adapter, component, integration and E2E tests.
11. Phone-sized manual acceptance, keyboard/accessibility checks and full desktop/phone visual evidence are required. Compare against the exact prototype with each screenshot pair labelled **MATCH**, **ACCEPTABLE PRODUCT-TRUTH ADAPTATION**, or **MISMATCH**. No unexplained MISMATCH passes.
12. Required comparisons: customer home desktop; customer home phone; active Circle; Pending + Verified Circle; Reward Available; post-redemption; relevant empty state. No demo data.

## 12. Founder Preview gate

Mandatory after implementation and before Slice A closure. Preview must point to the exact package head and provide a stable URL, identities, expected flows, known Product Truth adaptations, desktop/phone screenshot pairs and test evidence. Founder must review and accept the experience. Automated tests alone do not complete Slice A. No preview was started by this governance task.

## 13. Review level under current 11thONUS governance

The current Technical Review Standard §2 requires first-pass review by the ChatGPT Technical Lead and final Founder review before pull/deployment. Definition of Done §2 requires Technical Review, Founder deployment, Preview Review, manual QA, tracking and rollback accuracy. The Technical Review Standard does **not** require a different independent agent/session for every package. FEF-TLC-001 is not adopted and adds no gate here. Slice A still requires ordinary Technical Review plus the explicit Founder Preview/Manual QA gate above.

## 14. Programme next action and authorization

This reconciliation registers the stream in the authoritative Master Workflow and its package states in EIP/Prompt Register. **EA-BL-001-CORR-002-A is Founder-authorized and `Ready` (eligible for its detailed implementation prompt).** B/C/D/E and BR remain `Not Yet Scheduled`, not authorized. No code or migration is authorized by this report.

Because governance changes must be merged before `main` carries the package rows, Slice A's Ready status becomes effective on merge of this reconciliation PR. The next action after that merge is to issue the detailed Slice A implementation prompt; it must cite this package row, `DEC-PROD-015`, the exact prototype SHA, dependencies, DoD, review and Founder Preview gates. No Slice A implementation is performed in this task.

## 15. Final authorization verdict

**SLICE A AUTHORISED — READY FOR IMPLEMENTATION** (effective after this reconciliation PR merges; detailed implementation prompt still required). Slices B–E, Business Review foundation and EA-BL-002 are not authorized.
