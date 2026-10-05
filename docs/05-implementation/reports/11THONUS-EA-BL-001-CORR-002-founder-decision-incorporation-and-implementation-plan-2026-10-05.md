# 11THONUS — EA-BL-001-CORR-002
# Founder Decision Incorporation & Prototype-Fidelity Implementation Plan

> **Status:** Planning and decision incorporation only. No Slice A implementation started.
> **Production base checked:** `origin/main` `af874b7da3be1d484f183cd42f6270a816fd61ae`.
> **EA-BL-001 implementation branch:** `codex/ea-bl-001` at `8c14903e3f351530562da3a498297dab82b0b115`.
> **Experience Reference:** `Fkenogo/11thonus-prototype` at exact frozen SHA `18e8d700f505beefe46d324f6ea33f20a670abe7`.
> **Founder decision evidence:** [FD-EA-BL-001-CORR-002](../../00-governance/decisions/evidence/FD-EA-BL-001-CORR-002-founder-decisions-2026-10-05.md), recorded as `DEC-PROD-015`.

## 1. Founder decisions recorded

The four Founder decisions are recorded in the linked evidence record and `DEC-PROD-015`: distinct pending visual progress while customer verification remains mandatory; separate Business review before customer verification; customer-controlled self-registration rather than staff-created identities; internal confirmer attribution with no customer-visible staff name. These decisions resolve the four former prototype-binding blockers. They do not grant package execution authority.

## 2. Files and authority records changed or required

Recorded in this change set: `FD-EA-BL-001-CORR-002` evidence, `DEC-PROD-015`, and this plan/report. The protocol's documentation changes log records the same change set.

Still required before implementation: reconcile the Master Workflow and Engineering Implementation Programme so the Experience Assembly programme, EA-BL-001 correction scope, and vertical sub-work packages have explicit authority, owners, dependencies, and start gates. EA-BL-001 is absent from the current Engineering Implementation Programme / coding-agent package register; the EA-001 readiness assessment is assessment, not package authorization. The previous experience binding assessment also records the relevant programme gate as pending. This task does not backfill execution authority or alter historical status.

Required Product Truth propagation after Founder review of this plan: update the applicable purchase verification lifecycle and purchase-state technical records for Business Review Required; align the qualifying-quantity review rule in the existing Product Truth documents; clarify the customer-owned identity/handoff and customer-facing redemption-confirmation presentation. `DEC-PROD-015` governs during the correction window. No historical decision is rewritten.

## 3. Updated Prototype → Production binding matrix

Classifications: **A** direct binding; **B** presentation adaptation; **C** missing production capability; **D** Product Truth conflict resolved by Founder; **E** security/authority conflict resolved by Founder. For the former D/E rows, the new production direction below governs. “Future authority gate” means implementation still requires an authorized registered work package.

| Prototype area | Prototype component/screen | Prototype behaviour | Production equivalent today | Relevant Product Truth | Class | Required production action | Founder decision required? |
|---|---|---|---|---|---|---|---|
| Customer | Participant header/home | Personal welcome, identity access, Circle summary | Minimal customer home; identity artifacts issued but not customer-readable | Customer owns identity; server-issued canonical identity | C | Add customer-scoped identity/QR read; assemble header and identity card | No |
| Customer | `ParticipantExperience`, `LoyaltyCircle` | Circle segments distinguish approved/pending | Customer Circle read absent; verified-only server read is Business-scoped | Verification creates Verified Units | D/B | Add separate pending and verified quantities; pending is visually distinct and ineligible | No |
| Customer | Reward-ready state | Clear available reward and next-cycle continuity | Available reward callable exists; customer cycle/progress read incomplete | 10 Verified Units; single current active/reward-ready cycle; redemption advances cycle | C | Bind reward, cycle, redemption, and pending allocation reads | No |
| Customer | Activity/history | Purchase and redemption continuity, notifications | Customer purchase verification feed exists; complete activity feed does not | Append-only purchase/redemption history; customer verifies own purchases | C | Extend customer-scoped timeline; do not invent notification delivery | No |
| Customer | Business/programme relationships | Programme/business list and details | No discovery directory or join flow | Business owns separate programme/customer relationship; joining requires real enrolment | C | Directory/join capability is deferred to Slice E unless needed by Slice A entry | No |
| Customer | QR / mobile navigation | Identity QR and mobile bottom navigation | QR read and assembled Circle absent | Identity is issued by backend; artifact is not authentication | C/B | Real QR read only; phone bottom navigation consistent with reference | No |
| Business owner/manager | `BusinessWorkspace` dashboard | Workspace overview, alerts, quick actions, programme/customer state | Generic shell plus existing separate pages; dashboard summary limited | Role permissions remain server-authoritative; no invented commercial/loyalty authority | C/B | Assemble prototype hierarchy from real dashboard/read adapters; preserve navigable sections | No |
| Business | Customers/programmes | Customer and programme lists/details | Programme management and Owner/Manager customer reward reads exist | Programme rules and customer data are business-scoped | A/C | Reuse existing programme and business-scoped reads; add customer list only where no read exists | No |
| Business | Approvals | Manager/Owner review of threshold-triggered purchases | No Business review state/queue; `under_review` is customer dispute state | `DEC-PROD-015`: approval proceeds to customer verification only | D | Add distinct review state, queue, authorized actions, append-only audit; never credit on approval | No |
| Business | Team/mobile/settings | Role-aware navigation and operational team/settings | Team and settings pages exist; prototype mobile flow not assembled | Existing membership and permission services are authority | A/B | Bind existing capabilities in prototype order and phone-first navigation | No |
| Business | Reports/commercial | Reports, commercial standing, quick actions | Reporting reads absent; commercial domain lacks business read adapter | `DEC-SUB-014`, `DEC-LOY-011`; Business may not infer commercial authority | C | Defer dependent panels to Slice E; preserve shell destinations with honest availability only if necessary | No |
| Frontline | `StaffCounterExperience` | Fast customer lookup, Circle context, record, redeem, success/failure | `recordPurchase` and `confirmRedemption` engines exist; no phone counter UI, lookup/read adapter, scanner or web redemption adapter | Authenticated Business member; Staff sees only transaction-required customer progress | C | Implement limited scoped lookup/read and phone-first command flow | No |
| Frontline | Customer not found | Staff quick-add walk-in customer | No authorized synthetic identity creation | Customer-owned identity and authenticated consent | E resolved | Customer-controlled join handoff; continue only after canonical identity exists | No, unless safe mechanism requires new security decision |
| Frontline | Purchase success/pending | Immediate approved/pending progress feedback | `recordPurchase` creates `waiting_for_customer` | Customer verification controls Verified Units | D | Show “waiting for customer confirmation” and pending Circle indication | No |
| Frontline | Reward confirm | Confirm redemption and success | Backend `confirmRedemption` exists; no web adapter/eligibility feedback | Explicit permission; authenticated confirmer identity audited | A/B | Add web adapter; success surface omits individual confirmer name | No |
| Onboarding | `BusinessWorkspace` onboarding | Profile → first programme → frontline team → celebration/ready | Business creation and establishment review exist; sequence incomplete | Creation and programme publication gates remain existing truth | C/B | Reassemble complete progression around existing commands and true gates | No |
| Programme creation | Prototype 4-step progressive form | Progressive disclosure and clear review/publish | Production programme manager exists; inspect exact flow during Slice D | Existing `rewardProgram.manage`, versioning, qualifying items and publish gates | B | Recompose screens around existing command model; no weakening of publication authority | No |
| Operator | Prototype operator experience | Operator controls, standing and review | Engine/read capability partial; no operator shell/API | Sole Platform Administrator authority per confirmed commercial decision | C | Defer; bind only after Operator read package and authorized interfaces | No |

## 4. Missing capability classification

Each of the nine capability gaps is classified once by its present production posture. Slice E marks deferred capability; this does not mean it may be replaced by permanent placeholder UI.

| Missing capability | Classification | Evidence / dependency | Planned slice |
|---|---|---|---|
| Customer-owned Loyalty Number / QR read | SMALL BOUNDED READ/ADAPTER REQUIRED | Backend issues artifacts; current customer read callable is absent. Customer identity boundary remains server-side. | A |
| Customer Circle / verified + pending progress read | NEW DOMAIN CAPABILITY REQUIRED | No customer-scoped Cycle read and no pending-purchase-to-circle projection. Must keep Pending Units separate from `verified_units`. | A |
| Customer reward/redemption history + next-cycle read | SMALL BOUNDED READ/ADAPTER REQUIRED | Reward/redemption and Cycle domain state exist; customer-facing combined read adapter missing/incomplete. | A |
| Business directory + customer programme join | DEFERABLE WITHOUT BREAKING CORE EXPERIENCE | Not needed to display current enrolled Business/Circle if customer-scoped relationships are queried; do not invent enrolment. | E |
| Complete customer activity/notification feeds | DEFERABLE WITHOUT BREAKING CORE EXPERIENCE | Purchase verification queue exists; notification intents do not imply delivery; compose durable history first, delivery separately. | E |
| Staff customer lookup + limited progress + QR scanner | SMALL BOUNDED READ/ADAPTER REQUIRED | Existing artifact resolver/record path; no staff-scoped query, camera scan, or transaction-only progress read. | B |
| Redemption web adapter + eligibility feedback | SMALL BOUNDED READ/ADAPTER REQUIRED | Server command and governed permission exist; no web adapter or eligibility read. | B |
| Business reporting reads | DEFERABLE WITHOUT BREAKING CORE EXPERIENCE | Reporting foundation depends on stable domain definitions and sufficient production history. | E |
| Business-facing commercial standing/read adapter | FOUNDER DECISION REQUIRED | Commercial implementation/authority remains independently gated; do not invent Business-visible values or entitlement. Revisit only after governed commercial read scope is reconciled. | E |

## 5. Slice A — Customer Identity & Circle

**Prototype target:** `src/components/participant/ParticipantExperience.tsx`, its supporting customer identity/header, `LoyaltyCircle`, reward/home/history views and mobile navigation at the frozen SHA.

**Required real data/actions:** customer-scoped Loyalty Number/QR read; enrolled Business/programme relationships; verified Cycle progress; purchase records awaiting confirmation as separate Pending Units; available Reward and redeemed/next-cycle state; customer-scoped redemption and purchase history. Customer verification callable remains the only path that creates Verified Units. No client-computed eligibility.

**States:** loading; no identity artifact/error; no programmes; active Circle; pending-only; verified + pending; reward available at 10 Verified Units; redemption completed with next-cycle state; stale/unavailable read; French/English copy. Pending is never included in verified progress.

**Boundary:** identity artifact is a membership/payment presentation artifact, not authentication. Read access derives Customer Identity from the authenticated server context. Never accept a client-supplied customer ID as authority. If no safe customer-scoped relationship source exists, treat as a bounded backend dependency before UI assembly, not an empty permanent screen.

## 6. Slice B — Staff Counter

**Prototype target:** `StaffCounterExperience.tsx`, `MobileNavigation.tsx`, scan/lookup, Circle context, record and reward confirmation states.

**Required real data/actions:** scoped staff lookup by presented canonical artifact/QR; limited progress read for the selected transaction; existing `recordPurchase`; Business-review state/action where a configured threshold triggers; customer verification pending indication; `confirmRedemption` with server eligibility and explicit permission; customer-controlled self-registration handoff.

**States:** ready; scanning/lookup; not found; customer helps join; identity resolved; qualifying item/quantity selection; review required; waiting for customer; reward eligible/ineligible; confirm redemption; success/failure/network retry without duplicate command. Business approval does not advance verified progress.

**Security stop:** staff must not create identity or credentials. Inspect existing sign-up/invitation/deep-link mechanisms first. If none safely hands control to the customer in person, return the smallest Founder security decision before implementing that branch.

## 7. Slice C — Owner / Manager Operations

**Prototype target:** `BusinessWorkspace.tsx`, dashboard, customer, programmes, Approvals, Team, reports/settings and prototype mobile navigation.

**Required real data/actions:** existing Business context, programme CRUD/versioning, team/member permission services, business-scoped customer/Circle read, Business Review queue and review command, dashboard roll-ups based only on available authoritative reads. Role and permission enforcement remains server-side.

**States:** empty/new Business; active programmes; no customers; review queue empty/populated; approve to customer verification; reject with evidence; team empty/invitation states; load/error; mobile menu and small-screen primary actions. Reporting and commercial standing remain Slice E dependencies.

## 8. Slice D — Onboarding & Programme Creation

**Prototype target:** Business Profile → First Programme → Frontline Team → Celebration/Ready, and four-step progressive programme creation.

**Required real actions:** existing Business creation/profile/branch, Reward Program draft/version/qualifying-item commands, team invitation and governed publication path. Preserve each actual server precondition and permission. The transition to Ready must reflect actual status, not simulated success.

**States:** profile validation; programme draft/review; existing publication restriction; no staff/invitation pending; invitation accepted; setup complete; retry/error. If authoritative terms/business verification blocks a step, explain it in the reference's sequence without pretending it completed.

## 9. Slice E — Secondary / Dependent Surfaces

Directory/discovery and programme join; complete notification/activity feed; reporting; business commercial standing; operator experience and other non-core read models. Keep their prototype destinations in the information architecture when they are meaningful, but do not force unsupported values into early slices. Each surface receives an individual data contract, authority check and acceptance gate before implementation. Commercial standing is explicitly decision-gated.

## 10. Product Truth, schema and API implications

Current `PurchaseStatus` has `waiting_for_customer`, `pending_admission`, `verified`, `rejected`, `under_review`, etc. `under_review` requires a customer dispute reason and is unsuitable for Business Review. The current status constraint in migration `0008_purchase_records.sql` (extended by `0026_purchase_pending_admission.sql`) has no Business Review state. The transition/event model is append-only in `purchase_record_events`; the TypeScript `PurchaseRecordEventRow` supports Owner/Manager actors and reasons.

`RewardProgramVersion.bulkReviewThreshold` and `reward_program_versions.bulk_review_threshold` exist. `DEC-LOY-003` currently says that threshold is visibility-only. `DEC-PROD-015` permits reuse only after the governed semantic correction and appropriate validation. Do not conflate this with a hard quantity cap: multiple units remain allowed under the existing programme rule.

**Planned bounded domain change in Slice B/C:** add a distinct `business_review_required` status and governed transitions. Approval records an Owner/Manager actor and moves the purchase to `waiting_for_customer`; only customer verification transitions it to `verified` and creates Verified Units. Rejection records actor/reason evidence and ends the purchase without Verified Units. Preserve dispute `under_review` unchanged. Choose a representation for rejection that preserves the existing customer's `rejected` reason integrity (likely a separate Business disposition/event field or state); decide from current repository constraints during the authorized design task, not by overloading dispute or customer rejection fields. Tests must prove the complete transition graph, permissions, event actor/time, no Verified Unit/cycle/reward on business approval or rejection, and customer verification still mandatory after approval.

Exact test groups needed: purchase command state-transition tests; migration constraints/guard tests; permission/evaluator tests for Owner and authorised Manager; denial for non-authorised roles; event/audit tests; customer verification/admission integration tests; Circle read projection tests distinguishing Verified from Pending; UI state/copy/localization; concurrency/idempotency regressions; staff handoff no synthetic identity; redemption attribution hidden from customer view but present in internal audit.

## 11. Proposed work-package structure

Recommend one **Experience Assembly stream** under the existing Master Programme, decomposed into independently reviewable vertical work packages `EA-BL-001-CORR-002-A` through `-E`. Do not create a parallel programme and do not treat them as sub-tasks hidden inside one giant shell package. Each vertical package owns its needed read/adapter/domain seam, experience, test evidence and preview checkpoint together. Shared domain changes (Business review lifecycle) are prerequisites of Slice B/C and should be a separately reviewable dependency within the same authorized stream.

This is a structure recommendation only. Current sources do not register EA-BL-001 or these successor packages in the Engineering Implementation Programme; the prior readiness assessment is not authority. WP-COM-06a closure remains pending in programme reconciliation, `FEF-TLC-001` is not adopted, and EA-BL-002 remains unstarted. The Master Workflow/EIP must record ownership, exact scopes, dependencies, and authorization states before any slice starts. No parallel governance programme is proposed.

## 12. Prototype-fidelity acceptance criteria per slice

Every slice must compare the exact frozen reference components and production experience side by side at comparable data/state and viewport. For each required view record **MATCH**, **ACCEPTABLE PRODUCT-TRUTH ADAPTATION**, or **MISMATCH** with screenshot pair and rationale. No unexplained mismatch may pass.

| Slice | Desktop acceptance | Mobile acceptance | EN/FR acceptance | Visual comparison | Founder Preview checkpoint |
|---|---|---|---|---|---|
| A Customer Identity & Circle | Customer home/header, identity code, Circle segments, reward-ready and redemption continuity preserve reference hierarchy | Phone home, visible QR access, Circle legibility, bottom navigation and key taps | Both languages fit without changing hierarchy; pending/verified language clear | Customer home desktop/mobile, active + pending Circle, reward-ready, post-redemption | Required before Slice B is accepted |
| B Staff Counter | Counter flow usable without management dashboard; every command state truthful | One-hand lookup/scan, record, pending/review and redemption paths; 44px-class touch targets | Both languages for errors, pending, review, reward and handoff | Counter ready, customer found/not found, review, pending, success/failure | Required before Slice C is accepted |
| C Owner/Manager | Dashboard, customer/programme/review/team hierarchy matches prototype | Owner and Manager phone navigation, review queue and actions usable | Complete parity for nav, statuses, empty/error/success | Owner desktop; Owner/Manager mobile; populated/empty review | Required before Slice D is accepted |
| D Onboarding/Programme | Four onboarding moments and 4-step creator preserve progression/disclosure | Full end-to-end setup and creator at phone width | EN/FR parity without layout collapse | Profile, programme step(s), team, ready; creator steps | Required before Slice E is accepted |
| E Secondary | Each included surface binds only real reads and preserves reference grouping | Phone nav/detail views remain coherent | EN/FR parity for shipped surfaces | Directory/join, activity, reports, commercial only when authorized | Founder review before closure |

## 13. Founder Preview checkpoints

Preview is mandatory after each vertical slice and must run from its exact branch/head with stable URL, test identities, expected journeys, evidence pairs and known Product Truth adaptations. Founder acceptance is a package gate, not inferred from automated tests. The current branch preview is not accepted as the target experience and no preview was launched for this planning task.

## 14. Remaining decisions and blockers

Four former experience conflicts are resolved by `DEC-PROD-015`. One operational implementation detail remains a stop condition: the safe customer-controlled self-registration handoff must be selected from an existing mechanism or returned to Founder if no existing safe mechanism can meet the approved direction. Business commercial-standing data is separately authority-gated and remains Slice E. Business Review rejection reason/state representation must be derived from current domain constraints during a future authorized design task; do not invent new fraud criteria.

**Blocking before implementation:** programme authority reconciliation. Register the Experience Assembly stream and scoped vertical work packages in the Master Workflow, Engineering Implementation Programme and relevant prompt/authorization record, including dependencies and Founder start gate. Do not use the prior implementation prompt or existing code as authority. Until that controlled reconciliation is approved and merged, the plan is not `READY TO IMPLEMENT SLICE A`.

## 15. Recommended first implementation slice

Slice A — Customer Identity & Circle. It delivers the core customer experience vertically and provides the real identity/progress contracts needed by Slice B. It requires no change to customer verification rules. Include pending units as a separate projection, never as Verified Units.

## 16. Final status

**PROGRAMME AUTHORITY RECONCILIATION REQUIRED BEFORE IMPLEMENTATION.** Founder decisions are incorporated. The dependency-aware sequence and acceptance criteria are ready for Founder review, but the current programme records do not establish EA-BL-001-CORR-002 slice execution authority. No Slice A work was started.
