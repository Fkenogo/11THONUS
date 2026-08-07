> **Title:** CDR-001 — Capability Delivery Roadmap
> **Version:** 1.0 · **Status:** Active governance record · **Classification:** Working (execution-layer record)
> **Governing document:** [Product Foundation](../../01-product/prd/00-product-foundation.md); [Engineering Implementation Programme](../change-tracking/engineering-implementation-programme.md); TRD Chapter 22
> **Source-of-truth path:** `docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md`
> **Last controlled update:** 2026-08-07 (`CAP-P2-006` — Concern-Completion lifecycle classification added to §5 per `DEC-GOV-009`/`DEC-GOV-010` (Founder G1/G2); Customer Identity's two remaining bounded concern-completion items recorded (`-02` review coverage; `-02`→`-05` profile-field persistence); reporting status unchanged). Previously, same day: `CAP-P2-004` — concern-level completion reporting adopted per `DEC-GOV-008` (Founder Option C): §5 gains a Concern Status block (Customer Identity `Implemented — Validation/Closure Pending`; Authentication/ITM `Not started — Unauthorised`; overall Capability 2 `Open — not closed`); §2 row updated. Reporting granularity only — capability numbering/boundary unchanged; Concern Completion ≠ Capability closure). Previously, same day: `DEC-PROD-012` closure — Option D: Capability 2 §2 status and §5 updated — `DEC-PROD-012` CLOSED (gender omitted from MVP), `ENG-P2-001-02` no longer decision-blocked, technically authorised to begin pending fresh Founder authorization; new §5 dated note added. Previously, same day: `ENG-P2-ARCH-CORR-005` — Capability 2 status synchronised to the merged engineering state (Review-002 Finding R2-02): §2 status qualified and §5 validation-outcome corrected from "not started" to "partially implemented" — nine of ten `ENG-P2-001` packages merged, `-02` gated by open `DEC-PROD-012`, capability remains `Blocked`; historical text preserved). Previously: 2026-08-01 (`IDENTITY-ALIGN-001` — Capability 2's §5 definition restructured into three architectural concerns — Customer Identity, Authentication, Identity Trust Management (ITM, internal-only) — per `DEC-IDENTITY-001`; capability numbering, sequence, and all other capability definitions unchanged; see the note at the end of §5 Capability 2 for why no renumbering was performed). Previously: 2026-07-29 (`ENG-PROG-001A` — minor amendment: added §2 Capability Status Summary per Founder review feedback, all following sections renumbered by one; no capability description, work-package mapping, or authority relationship changed. Previously: `ENG-PROG-001` — created, following `ENG-P1-003`'s administrative closure)

# CDR-001 — Capability Delivery Roadmap

## 1. Purpose

The [Product Foundation](../../01-product/prd/00-product-foundation.md) defines *what* 11thONUS is and *why* it exists. The [Engineering Implementation Programme](../change-tracking/engineering-implementation-programme.md) defines *which technical work packages* build it, sequenced by TRD Chapter 22's 17 engineering phases (Phase 0–16). Neither document, by itself, answers a question every future implementation prompt needs answered: **in what order do customers actually gain new, usable capability, and which engineering work packages deliver each one?**

That gap is what this document closes. It does not redesign the Product Foundation or the Engineering Implementation Programme — it is a new, narrower **execution-layer** document that sits between them, re-expressing 42 of the Programme's 47 already-approved engineering work packages as a sequence of ten customer-facing (or platform-facing) **capabilities** (the remaining 5, covering end-to-end pilot validation and production launch, are milestone-level rather than capability-level — see §7), each traceable back to a specific product journey and forward to the specific work packages that build it.

**Problem this solves:** without it, "what should be built next" is answered purely by phase number (Phase 2, Phase 3, …) — a sequencing that is correct for engineering dependency order but says nothing about what a customer or business actually experiences at each step, and gives no single place where a future implementation prompt can state "this work package exists because it delivers *this* capability, validated by *this* journey." CDR-001 is that place.

**How it complements existing documentation:** it introduces no new requirements, no new work packages, and no new authority. Every capability in §5 is a re-grouping of existing, already-numbered `ENG-Pn-xxx` work packages (§8); every journey reference points to the already-approved [Moments That Matter](../../07-product-design/moments-that-matter.md); every requirement ID cited already exists in the [Requirements Traceability & Implementation Matrix](../../00-governance/requirements-traceability-matrix.md). Where this document and any of those disagree, the higher document governs and this one is corrected — the same rule the [Product Design section](../../07-product-design/README.md) already applies to itself.

**A note on terminology:** the Product Foundation already uses the word "Capabilities" for a different concept — the permission-scoped actions each role can take (§"Customer Capabilities," "Business Owner Capabilities," etc., `00-product-foundation.md` ~line 915). This document's "Capability" is a distinct, unrelated concept: a *delivery-sequencing unit* (a coherent slice of the product that becomes usable together), not a role permission. The two are never used interchangeably in this document.

## 2. Capability Status Summary

A snapshot only — where the programme currently stands, at a glance. This does not duplicate the [Engineering Implementation Programme](../change-tracking/engineering-implementation-programme.md) or the [Coding-Agent Prompt Register](../change-tracking/coding-agent-prompt-register.md): those remain the authoritative, work-package-level trackers (exact requirement IDs, decision dependencies, PR/commit evidence, per-package status). This table answers one question only — "where are we in capability delivery?" — at the capability level, nothing finer.

| Capability | Name | Status |
|---|---|---|
| 0 | Engineering Foundation | Complete |
| 1 | Platform Foundation | Complete |
| 2 | Customer Identity | Open — partially implemented; not closed. **Concern-level status (`DEC-GOV-008`):** Customer Identity `Implemented — Validation/Closure Pending` (all 10 `ENG-P2-001` packages merged); Authentication `Not started — Unauthorised`; ITM `Not started — Unauthorised` (internal). Concern Completion ≠ Capability closure — see §5. |
| 3 | Business Identity | Planned |
| 4 | First Verified Purchase | Planned |
| 5 | Progress Tracking | Planned |
| 6 | First Reward | Planned |
| 7 | Business Operations | Planned |
| 8 | Platform Operations | Planned |
| 9 | Platform Optimisation | Planned |

## 3. Relationship to Existing Documents

```
Product Definition (docs/01-product/)
   — Product Vision, ONUS Principles, Core Loyalty Model
        │
        ▼
User Journeys (docs/07-product-design/moments-that-matter.md, interaction-patterns.md)
   — the emotional/functional beats a customer or business actually experiences
        │
        ▼
Capability Delivery Roadmap  ◄── THIS DOCUMENT (CDR-001)
   — groups journeys into 10 sequenced, delivery-sized capabilities
        │
        ▼
Engineering Implementation Programme (docs/05-implementation/change-tracking/)
   — the 47 authoritative ENG-Pn-xxx work packages, TRD22-phase-sequenced
        │
        ▼
Engineering Work Package (an individual ENG-Pn-xxx row)
        │
        ▼
Technical Implementation (an Implementation Prompt → Coding Agent → PR)
        │
        ▼
Validation (Definition of Done, Technical Review, real tests — never assumed)
        │
        ▼
Milestone (§7 — a customer-observable, cross-capability outcome)
```

| Document | Authority | What it owns |
|---|---|---|
| Product Foundation, PRDs | Authoritative Product | What the product is, for whom, and why (vision, principles, rules) |
| Product Design section (UX Direction, Moments That Matter, Stitch) | Authoritative Product (design) | Approved journeys and UX direction — *reference*, not spec |
| **Capability Delivery Roadmap (this document)** | Execution-layer, non-authoritative | The delivery sequence and capability-to-work-package mapping |
| Engineering Implementation Programme | Authoritative engineering tracker | The 47 work packages themselves — objective, requirement IDs, decision dependencies, status |
| Requirements Traceability & Implementation Matrix | Authoritative traceability | Every requirement/rule/principle ID and its implementation status |

This document is **execution-layer, not authoritative** — it cannot create, remove, reorder, or re-scope a work package; it can only describe which existing work packages, taken together, deliver a given capability. Any change to a work package's own definition happens in the Engineering Implementation Programme, never here.

## 4. Guiding Principles

1. **Capability-first delivery.** Engineering sequencing follows customer-usable capability, not technical convenience — a capability is not "done" until a customer or business can actually use it end-to-end, not merely until its underlying code compiles.
2. **Customer outcome before implementation detail.** Every capability in §5 states the customer outcome first; the engineering work packages that deliver it are traced second, from outcome to implementation, never the reverse.
3. **Engineering work packages remain authoritative.** This document never overrides a work package's own objective, requirement IDs, or status as recorded in the Engineering Implementation Programme. It only re-describes the *sequence* in capability terms.
4. **Approved UX references guide implementation but do not replace product specifications.** Stitch artefacts (§9) show one validated way a screen or flow can look; the PRD and TRD remain the binding specification for what it must do.
5. **Capability completion requires end-to-end validation.** A capability is complete only when its full journey has been validated (§10) — not when its last work package merges. Code merging is necessary; it is not sufficient.
6. **No duplicated authority.** Where this document restates a fact already governed elsewhere (a requirement ID, a work-package status, a journey), it cites the governing document rather than copying and risking drift.

## 5. Capability Delivery Model

Each capability below groups one or more Engineering Implementation Programme phases into a single customer- or platform-facing delivery unit. Capabilities 0 and 1 are pure engineering foundation (no customer-facing journey); Capabilities 2–9 each map to a specific journey moment from [Moments That Matter](../../07-product-design/moments-that-matter.md) or [Interaction Patterns](../../07-product-design/interaction-patterns.md).

### Capability 0 — Engineering Foundation *(Completed)*

- **Objective:** a working, tested, CI-gated repository exists before any product code is written.
- **Customer outcome:** none directly — this capability exists so every later one can be built safely.
- **Primary user journey(s):** none (pre-product).
- **Major engineering work package(s):** `ENG-P0-001` (repository, tooling, test-framework scaffold), `ENG-P0-002` (CI pipeline, templates, change-tracking scaffold).
- **Dependencies:** none.
- **Validation outcome:** both work packages `Complete`; Phase 0 confirmed `Complete` (TRD22 §22.10 exit criteria satisfied) — see the [Engineering Implementation Programme](../change-tracking/engineering-implementation-programme.md) Phase 0 profile.
- **Milestone contribution:** foundational precondition for every milestone in §7.

### Capability 1 — Platform Foundation *(Completed)*

- **Objective:** the shared backend infrastructure, command contract, and operational observability every domain feature will depend on exist and are validated, before any domain feature is built on top of them.
- **Customer outcome:** none directly (customers never interact with this layer) — but every capability from 2 onward depends on it being correct.
- **Primary user journey(s):** none (platform infrastructure).
- **Major engineering work package(s):** `ENG-P1-001` (Firebase project init, App Check, client/admin SDK), `ENG-P1-002` (shared command contract — error/log/idempotency/outbox), `ENG-P1-003` (Security/Storage Rules deny-by-default posture + frontend operational observability).
- **Dependencies:** Capability 0.
- **Validation outcome:** all three work packages `Complete`; `ENG-P1-003` administratively closed 2026-07-29 — see the [Engineering Closure Report](../reports/ENG-P1-003-IMP-05-engineering-closure-report-2026-07-27.md) and [Operational Readiness Report](../reports/ENG-P1-003-IMP-04-operational-readiness-report-2026-07-27.md).
- **Milestone contribution:** foundational precondition for Milestone A and every later milestone.

### Capability 2 — Customer Identity

> **Updated 2026-08-01 (`IDENTITY-ALIGN-001`):** the Founder decision `DEC-IDENTITY-001` (2026-08-01) separates what this capability previously treated as one conflated concern into three independent architectural concerns: **Customer Identity**, **Authentication**, and an internal-only **Identity Trust Management (ITM)** concern. This capability's roadmap position, number, and customer-facing name are unchanged — Capability 2 still delivers "a customer can register and receive a loyalty identity" at the same point in the sequence, between Capability 1 and Capability 3. What changes is its internal composition (below) and, in a future engineering-design task, the decomposition of `ENG-P2-001` into separate work along these three concerns. No other capability is renumbered by this change; see the note at the end of this subsection for why a new top-level capability number was deliberately not introduced.
>
> **Updated 2026-08-02 (`ENG-P2-ARCH-001`):** the engineering architecture for the Customer Identity concern above — the Identity Aggregate, Identity/Loyalty-Number/QR lifecycles, recovery model, and the Authentication/ITM boundary contracts — is now defined in [`ENG-P2-ARCH-001` — Customer Identity Architecture Definition](ENG-P2-ARCH-001-customer-identity-architecture.md). Architecture only — no implementation authorized by that document or by this update.
>
> **Updated 2026-08-02 (`ENG-P2-001-PLAN-001`):** `ENG-P2-001`'s proposed decomposition into 10 bounded child work packages is now defined in [`ENG-P2-001-PLAN-001` — Customer Identity Engineering Decomposition Plan](ENG-P2-001-PLAN-001-customer-identity-decomposition-plan.md). Planning only — no child package authorized to begin; `ENG-P2-001`'s own row and this roadmap's approved work-package count are unchanged.
>
> **Updated 2026-08-02 (`ENG-P2-GATE-001`):** the `DEC-PROD-012` Capability Authorisation Gate scope question has been determined — see [`ENG-P2-GATE-001`](ENG-P2-GATE-001-dec-prod-012-scope-determination.md). Only the Customer Profile child package's `gender` field remains blocked; `DEC-PROD-012` itself remains open, not closed by this determination.
>
> **Updated 2026-08-07 (`DEC-PROD-012` closure — Option D):** `DEC-PROD-012` is now **CLOSED**. The Founder selected Option D — gender is not collected at MVP and the `gender` attribute is removed from the MVP Customer Profile schema (future-additive under a separate governed decision). The `gender`-field gate on `ENG-P2-001-02` is therefore discharged: **`-02` is no longer decision-blocked** and is technically authorised to begin, pending a fresh Founder implementation authorization. See the [Decision Register `DEC-PROD-012`](../../00-governance/decisions/decision-register.md) and the [implementation report](../reports/DEC-PROD-012-implementation-and-eng-p2-001-02-unblock-2026-08-07.md).

- **Objective:** a customer can register, obtain a permanent identity (Internal Customer ID, Loyalty Number, Customer QR Code), and authenticate using any supported provider — without authentication or verification state gating that identity's existence.
- **Customer outcome:** a new customer has an account and a loyalty number/QR code they can present at a business, from the moment they complete standard registration — not contingent on completing phone verification.
- **Primary user journey(s):** [Moments That Matter](../../07-product-design/moments-that-matter.md) §1 Registration *(governing-document only — no Stitch concept yet validates this screen)*.
- **Constituent architectural concerns** (per `DEC-IDENTITY-001`):
  1. **Customer Identity** — the permanent identity triad (Internal Customer ID, Loyalty Number, Customer QR Code), profile data, identity-linking, and recovery identity. Customer-facing.
  2. **Authentication** — authentication providers only (phone OTP, Google Sign-In, email, future providers). Authentication proves *a* returning credential; it does not own or gate trust. Customer-facing (as a sign-in mechanism), but must not be conflated with identity or verification in implementation or in product copy.
  3. **Identity Trust Management (ITM)** *(internal engineering capability name only — never exposed in customer-facing language)* — owns phone/email/future verification, progressive trust state, and trust-level progression used for risk-based feature gating (e.g., large redemptions, account recovery). ITM is not a numbered roadmap capability in this document; it is a cross-cutting internal concern that Capability 2's engineering work packages (and later, risk-based gating in other capabilities) depend on.
- **Concern Status** *(concern-level reporting per `DEC-GOV-008`, Founder-approved Option C, 2026-08-07 — reporting granularity only; capability numbering/boundary unchanged; **Concern Completion does not constitute Capability closure**):*
  - **Customer Identity concern — `Implemented — Validation/Closure Pending`.** All ten `ENG-P2-001` child packages (`-01`–`-10`) are implemented, TDD-tested, and merged to `main` (CI-green). Outstanding concern-level matters (per [`CAP-P2-002`](../reports/CAP-P2-002-capability-2-validation-and-closure-review-2026-08-07.md)): `ENG-P2-001-02` architecture/Technical Review; `-02` persistence wiring; programme/documentation currency. RTM Finding F11 is Founder-approved deferred work. **Not `Complete`** — concern-level *completion criteria* are not yet defined (their definition would be a separate Founder decision); this is the strongest evidence-supported status.
  - **Authentication concern — `Not started — Unauthorised`.** Separately governed; no packages implemented (`IDENTITY-ALIGN-001`).
  - **Identity Trust Management (ITM) concern — `Not started — Unauthorised`.** Internal architectural concern, never a numbered customer-facing capability; no packages implemented.
  - **Overall Capability 2 — `Open — partially implemented; not closed`.** Capability closure continues to require the existing capability-level completion criteria (including the Authentication and ITM concerns, `ENG-P2-004`, and deployment/Manual QA per [`CAP-P2-002`](../reports/CAP-P2-002-capability-2-validation-and-closure-review-2026-08-07.md)). Concern-level completion of any single concern does **not** close the capability.
- **Concern-Completion lifecycle classification** *(per `DEC-GOV-009`/`DEC-GOV-010`, Founder G1/G2, 2026-08-07 — clarifies how the work-package [Definition of Done](../../06-engineering-governance/definition-of-done.md) §2 applies to concern completion; the DoD itself is unchanged):*
  - **Concern Completion** — DoD §2.1–2.5, 2.7, 2.11, 2.12 (implementation, tests, validation, report, changes-tracking, commit/push, no-unrelated, rollback) **plus** §2.6 Technical Review coverage (per **G1**, satisfied by the capability-level Architecture Review for packages in its baseline; a package implemented after that baseline needs its own coverage) **plus** the concern's own persistence/data-layer delivery where an `ENG-P2-001` package owns it. No unresolved concern-level blockers.
  - **Capability Closure** — capability-level aggregation and remaining capability obligations (all concerns + `ENG-P2-004`).
  - **Release / Production Readiness** — DoD §2.8–2.10 (deployment, Preview Review, Manual QA) and TRD19 §19.52 Release Gates / TRD22 §22.45 MVP Exit Gate; per **G2** these are **not concern-completion criteria** for a domain-layer concern with no deployable customer-facing surface.
  - **Customer Identity — remaining concern-completion items** (per [`CAP-P2-006`](../reports/CAP-P2-006-concern-completion-policy-and-customer-identity-reassessment-2026-08-07.md)): (1) `ENG-P2-001-02` architecture/technical review coverage (G1); (2) wiring `-02`'s Customer Profile fields into `ENG-P2-001-05`'s `customerProfiles` persistence converter (persistence owned by `-05`, the Identity Persistence package; the profile fields were deferred at `-05`'s implementation only because `-02` did not yet exist). Both are bounded, ownership-defined engineering/review tasks — **no further Founder policy decision is required**; they await fresh Founder authorization to begin. Deployment/Preview/Manual QA and Authentication/ITM/`ENG-P2-004` are Capability-Closure / Release-Readiness (not concern completion); RTM Finding F11 is accepted deferred.
- **Major engineering work package(s):** `ENG-P2-001` (customer identity, authentication, and ITM — currently one work package; its decomposition along the three concerns above is engineering-design work for a future task, not performed here per this task's "do not begin implementation" constraint), `ENG-P2-004` (role context and permission resolution — shared with Capability 3).
- **Dependencies:** Capability 1; Decision Dependencies `DEC-SEC-001`, `DEC-DATA-007`, `DEC-PROV-004`, `DEC-ID-003`, `DEC-IDENTITY-001` — all `CONFIRMED` (Capability 2 Resolution Sprint, merged to `main` 2026-07-31; `DEC-IDENTITY-001` recorded 2026-08-01 — see the [Decision Register](../../00-governance/decisions/decision-register.md)).
- **Validation outcome (corrected 2026-08-07, `ENG-P2-ARCH-CORR-005`, resolving Review-002 Finding R2-02):** ~~not started~~ **partially implemented; the capability remains `Blocked` at the capability level.** `ENG-P2-001` is decomposed (`ENG-P2-001-PLAN-001`) into ten Customer-Identity child packages; **nine of ten (`-01`, `-03`–`-10`) are implemented, TDD-tested, and merged to `main`** (registration, loyalty-number issuance, QR identity, customer-profile shell, lifecycle/recovery, authentication-reference linking, identity lookup, and identity audit), validated by the merged [`ENG-P2-ARCH-REVIEW-001`](../reports/ENG-P2-ARCH-REVIEW-001-capability-2-customer-identity-architecture-review-2026-08-06.md) architecture review and its corrections `ENG-P2-ARCH-CORR-001`–`-004` plus the corrected-baseline review [`ENG-P2-ARCH-REVIEW-002`](../reports/ENG-P2-ARCH-REVIEW-002-corrected-baseline-architecture-review-2026-08-07.md) (PASS WITH CONDITIONS). **Remaining:** `ENG-P2-001-02` (Customer Profile) only, ~~**gated by `DEC-PROD-012`** (`OPEN_FOUNDER`)~~ **[UPDATED 2026-08-07] no longer decision-blocked — `DEC-PROD-012` CLOSED (Option D — gender omitted from MVP); `-02` is technically authorised to begin, pending a fresh Founder implementation authorization** per [`ENG-P2-GATE-001`](ENG-P2-GATE-001-dec-prod-012-scope-determination.md) (its `gender` field and `-05`'s corresponding schema-freeze — now resolved by omission). `ENG-P2-004` is not yet started. **Not authorised / separately governed:** the Authentication-provider and ITM concerns, and the future engineering-design decomposition of `ENG-P2-001` along the three concerns (`IDENTITY-ALIGN-001`), remain unauthorised. **Deferred:** RTM Finding F11 (`ENG-P2-001` traceability rows) remains Founder-approved deferred work. The capability is therefore **partially implemented but not complete and not production-ready** — `-02` (now unblocked, pending fresh authorization) and `-004` remain to land. `BaseMetadata` conformance (Gate item 7) is fully resolved (`RES-005.2a`/`RES-005.2b`, 2026-07-31).
- **Milestone contribution:** Milestone A, step 1.
- **Why no new top-level capability number:** `DEC-IDENTITY-001` separates *architectural concerns*, not customer-delivery sequencing — Authentication and ITM are not independently customer-observable milestones a customer reaches after Capability 2 and before Capability 3; a customer experiences them as part of the same registration moment. Introducing a new numbered Capability (renumbering Capabilities 3–9 to 4–10) would ripple into every other document that cites a capability number by position (the Requirements Traceability Matrix, Engineering Implementation Programme, Coding-Agent Prompt Register, Capability Authorisation Gate, and this document's own §2/§6/§7/§8) for a distinction that is architectural, not sequential — exactly the "unintended capability renumbering" this task's validation criteria require avoiding. If a future task determines Authentication or ITM warrants independent customer-facing delivery sequencing (rather than being sub-concerns of Capability 2), that renumbering decision belongs to a dedicated Founder-reviewed task, not to this alignment pass.

### Capability 3 — Business Identity

- **Objective:** a business can register, define its owner/staff structure, and describe what it sells, so it is ready to record purchases against.
- **Customer outcome:** a business owner has a working account, a branch profile, invited staff, and a seed catalogue of products/services.
- **Primary user journey(s):** no dedicated Moments That Matter entry (business-side onboarding is documented functionally in [PRD3 — Business Registration](../../01-product/prd/03-business-registration.md), not as an emotional journey moment).
- **Major engineering work package(s):** `ENG-P2-002` (business identity — create, owner, profile, branch), `ENG-P2-003` (staff identity — invite, membership, suspend/remove), `ENG-P2-004` (role context and permission resolution — shared with Capability 2), `ENG-P3-001` (Commerce Knowledge seed data), `ENG-P3-002` (business onboarding flow), `ENG-P3-003` (Knowledge Studio MVP).
- **Dependencies:** Capability 1; sequentially follows Capability 2 per the Programme's own Phase 2 → Phase 3 ordering.
- **Validation outcome:** not started — all listed work packages `Blocked`.
- **Milestone contribution:** Milestone A, step 2; precondition for Milestone "Business Operational Readiness" (placeholder, §7).

### Capability 4 — First Verified Purchase

- **Objective:** a customer's purchase at a business can be recorded and independently verified by both parties.
- **Customer outcome:** the customer's first purchase is recorded, they verify it themselves, and it is confirmed — the moment their loyalty record begins.
- **Primary user journey(s):** Moments That Matter §2 First Purchase *(governing-document only)* and §3 First Verification *(Stitch-validated — `signature_verification_experience`)*.
- **Major engineering work package(s):** `ENG-P4-001` (Reward Program CRUD and lifecycle), `ENG-P4-002` (versioning and plan-limit enforcement), `ENG-P5-001` (purchase recording UI flow), `ENG-P5-002` (server-side Purchase Record creation and idempotency), `ENG-P5-003` (offline queue and pending-sync display), `ENG-P6-001` (verification flow — "Waiting for You"), `ENG-P6-002` (individual rejection with reason), `ENG-P6-003` (dispute and business resolution workflow).
- **Dependencies:** Capabilities 2 and 3 (a customer and a business must both exist first). `ENG-P4-001`/`ENG-P4-002` are included in this capability, not merely a precondition to it: the Programme's own Phase Summary Table states Phase 5 is `Blocked (depends on P4)`, so a purchase cannot correctly be recorded against a Reward Program that doesn't yet exist — Phase 4 must complete before this capability's own Phase 5/6 work, and is grouped here accordingly (corrected from an earlier draft that treated Phase 4 only as a later precondition for Capability 5, which did not satisfy the Programme's actual sequencing).
- **Validation outcome:** not started — all listed work packages `Blocked`.
- **Milestone contribution:** Milestone A, steps 3–4.

### Capability 5 — Progress Tracking

- **Objective:** every verified purchase visibly and correctly advances the customer toward their next reward.
- **Customer outcome:** the customer can see, at any time, a concrete count of verified progress against a concrete target, and knows the moment a reward becomes available.
- **Primary user journey(s):** Moments That Matter §4 Progress *(Stitch-validated — `loyalty_journey_verified_units`)* and §5 Reward Earned *(Stitch-validated — `concept_4_reward_ready`)*.
- **Major engineering work package(s):** `ENG-P7-001` (Verified Unit issuance and uniqueness), `ENG-P7-002` (Loyalty Cycle progress and threshold calculation), `ENG-P7-003` (reward creation, availability, staff-notification support).
- **Dependencies:** Capability 4 (a purchase must be verified before it can count toward progress).
- **Validation outcome:** not started — all listed work packages `Blocked` (sequential — Phase 6 only, per the Programme's own Phase 7 profile).
- **Milestone contribution:** Milestone A, step 5.

### Capability 6 — First Reward

- **Objective:** an earned reward can be claimed by the customer, and the business's part in delivering that reward is recorded.
- **Customer outcome:** the customer redeems their first earned reward and the platform closes the loop it opened at Capability 4.
- **Primary user journey(s):** Moments That Matter §6 Reward Redeemed *(Stitch-validated — `the_on_us_moment_reward_redemption`)* and §7 Recognition *(Stitch-validated — same concept)*.
- **Major engineering work package(s):** `ENG-P8-001` (redemption flow — atomic, concurrency-safe), `ENG-P8-002` (redeemed-state persistence and On Us Moment history).
- **Dependencies:** Capability 5 (a reward must be earned before it can be redeemed).
- **Validation outcome:** not started — both work packages `Blocked`.
- **Milestone contribution:** Milestone A, step 6 — the milestone's completion point.

### Capability 7 — Business Operations

- **Objective:** a business can run its loyalty program day-to-day — see performance, receive and configure notifications, and manage its subscription.
- **Customer outcome:** none directly for the platform's *customer* role; the business owner/manager gets a working dashboard, notification system, and billing relationship.
- **Primary user journey(s):** no dedicated Moments That Matter entry (business-side operational flows; see [Interaction Patterns](../../07-product-design/interaction-patterns.md) §"business purchase recording" for the closest Stitch-validated business-facing pattern, which belongs functionally to Capability 4).
- **Major engineering work package(s):** `ENG-P9-001` (notification intent and template resolution), `ENG-P9-002` (delivery abstraction — push/email/SMS, preferences), `ENG-P9-003` (launch-critical template set, EN/FR), `ENG-P10-001` (plan catalogue, pricing, trial, entitlement), `ENG-P10-002` (payment provider adapter, webhook validation), `ENG-P10-003` (grace period, suspension, reactivation, billing admin), `ENG-P11-001` (business dashboard), `ENG-P11-002` (reporting foundation), `ENG-P11-003` (operational integrity — review queue, anomaly rules).
- **Dependencies:** Capability 6 (there must be a working loyalty cycle to report on and operate).
- **Validation outcome:** not started — all listed work packages `Blocked`.
- **Milestone contribution:** Milestone "Business Operational Readiness" (placeholder, §7).

### Capability 8 — Platform Operations

- **Objective:** the platform itself can be administered, with launch-configurable feature flags and support tooling in place, across all businesses, independent of any single business's needs.
- **Customer outcome:** indirect — a safer, more manageable platform for every customer and business, delivered by platform administrators rather than experienced as a direct feature.
- **Primary user journey(s):** none (platform-administration scope; builds on Capability 1's observability foundation).
- **Major engineering work package(s):** `ENG-P12-001` (administrator roles, MFA, support tooling), `ENG-P12-002` (Knowledge/Rules Studio launch functions, feature flags).
- **Dependencies:** Capability 7. The Programme's own Phase Summary Table states Phase 12 is `Blocked (depends on P2, P4, P11)` — P2 and P4 are already satisfied by the time Capability 7 (which requires P8–P11) is reached, so Capability 7 is this capability's binding precondition (corrected from an earlier draft that cited only Capability 1, which understated the real dependency and, combined with Capability 8 then also containing Phase 14, produced a circular Capability 8↔9 dependency — see Capability 9's note below).
- **Validation outcome:** not started — both listed work packages `Blocked`.
- **Milestone contribution:** precondition for Capability 9 (Phase 14 depends on Phase 12 completing, per the Programme).

### Capability 9 — Platform Optimisation

- **Objective:** the platform is complete enough — in language, accessibility, installability, security hardening, resilience, and compliance readiness — to be usable and safe for its actual target audience (Burundi, EN/FR) and ready to enter pilot.
- **Customer outcome:** the platform works fully in the customer's own language, is usable by customers with accessibility needs, installs/functions as a PWA on the low/mid-range Android devices the target market actually uses, and has undergone a final security/resilience/compliance hardening pass.
- **Primary user journey(s):** none singular (a hardening pass across every prior journey, not a new one).
- **Major engineering work package(s):** `ENG-P13-001` (complete EN/FR launch-critical copy), `ENG-P13-002` (accessibility review and remediation), `ENG-P13-003` (PWA hardening — manifest, offline shell), `ENG-P14-001` (security hardening — rules, App Check, rate limiting), `ENG-P14-002` (resilience — monitoring, backup/restore, rollback test), `ENG-P14-003` (privacy and compliance readiness), and the registered-but-unimplemented `OBS-OPS-001` (Frontend Diagnostics Operational Enablement).
- **Dependencies:** Capabilities 2–8. The Programme states Phase 13 is `Blocked (depends on core journeys existing, P2–P8)` and Phase 14 is `Blocked (depends on P0–P13 substantially complete)` — the latter includes Phase 12 (Capability 8), so this capability depends on Capability 8, not the reverse (corrected from an earlier draft that grouped Phase 14 with Phase 12 into Capability 8 while also making this capability depend on Capability 8, producing a circular dependency; Phase 14 is grouped here instead, resolving it).
- **Validation outcome:** not started — all listed work packages `Blocked`. Related successor/backlog packages already registered (not yet implemented): `ENG-SEC-001` (Firestore & Storage Security Rules Foundation, thematically aligned with `ENG-P14-001`'s Rules-hardening scope) and `ENG-CI-001` (Firebase Emulator CI Stabilisation) — see the [Engineering Implementation Programme](../change-tracking/engineering-implementation-programme.md) §C.1.
- **Milestone contribution:** precondition for Milestone "Pilot Readiness" (placeholder, §7) — Phase 15 depends directly on Phase 14, which is now this capability's own work.

## 6. Capability Timeline

Emphasis is on capability evolution, not phase numbers — Phase numbers are cited in §8 for traceability only.

```
Capability:   0            1              2         3          4                5              6           7            8            9
              Engineering  Platform       Customer  Business   First Verified   Progress       First       Business     Platform     Platform
              Foundation   Foundation     Identity  Identity   Purchase         Tracking       Reward      Operations   Operations   Optimisation
Status:       [Complete]───[Complete]────►[Blocked]►[Blocked]─►[Blocked]───────►[Blocked]─────►[Blocked]──►[Blocked]───►[Blocked]───►[Blocked]
                                              │         │           │                │              │
                                              └────┬────┘           │                │              │
                                                   ▼                │                │              │
                                            Milestone A "First Complete Loyalty Cycle"              │
                                            (Capabilities 2 → 6, customer-observable)                │
                                                                                                       ▼
                                                                                        Milestone "Business Operational
                                                                                        Readiness" (Capability 7, placeholder)
```

Capabilities 2 and 3 can proceed in parallel once their shared dependency (`ENG-P2-004`, role context) exists, per the Programme's own Phase 2 profile; Capability 4 requires both to be complete first, and now also includes Phase 4 (Reward Program Management) as its own leading work, since the Programme states Phase 5 is `Blocked (depends on P4)`. Capabilities 5 and 6 are strictly sequential (progress must exist before a reward can be earned; a reward must be earned before it can be redeemed). Capabilities 7, 8, and 9 are **not** parallel — the Programme's own dependency chain makes them sequential: Capability 7 needs Capability 6 (Phase 9–11 need Phase 8); Capability 8 needs Capability 7 (Phase 12 needs Phase 11); Capability 9 needs Capability 8 (Phase 14, now part of Capability 9, needs Phase 0–13 substantially complete, which includes Phase 12). This corrects an earlier draft that described Capabilities 7/8/9 as independently parallel, which combined with Phase 14 originally being grouped into Capability 8 produced a genuine Capability 8↔9 circular dependency — resolved by regrouping Phase 14 into Capability 9 (see §5) and stating the true linear chain here.

## 7. Milestone Structure

### Milestone A — First Complete Loyalty Cycle

**Definition:** one customer and one business complete a full, real loyalty cycle — register, transact, verify, progress, earn, and redeem — with every step server-validated, not simulated.

**Complete customer journey covered (per [Moments That Matter](../../07-product-design/moments-that-matter.md)):**

1. Registration (Capability 2) — customer creates an account and receives a loyalty identity.
2. *(Business Identity, Capability 3, is a precondition but not itself part of the customer's own journey.)*
3. First Purchase (Capability 4) — customer transacts at the business.
4. First Verification (Capability 4) — customer confirms their own purchase.
5. Progress (Capability 5) — the verified purchase visibly advances the customer's count.
6. Reward Earned (Capability 5) — the customer's count reaches its threshold.
7. Reward Redeemed (Capability 6) — the customer claims the earned reward.
8. *(Recognition, Moments That Matter §7, is part of the same redemption experience and is included in Capability 6's scope.)*

**Completion criteria:**
- Capabilities 2 through 6 are all individually complete per §10's Definition of Capability Completion.
- The full 8-step sequence above has been executed and validated end-to-end against real Firebase Emulator Suite tests (not mocked), consistent with this engineering programme's established testing discipline.
- No step in the sequence requires manual data seeding or an unimplemented workaround.

### Future Milestones *(placeholders — identified, not specified)*

The following milestones are named because §5 already traces specific capabilities toward them, but their completion criteria are **not** defined here — none is yet supported by approved repository documentation detailed enough to specify them without inventing scope. Each will be formalized in a future, separate task once the capabilities that feed it are further along.

- **Business Operational Readiness** — fed by Capability 7. Mapped work packages: Capability 7's own set (`ENG-P9-001..003`, `ENG-P10-001..003`, `ENG-P11-001..003`); no separate Phase-15/16 package feeds this milestone. Likely concerns: can a business owner run their loyalty program day-to-day without engineering support.
- **Pilot Readiness** — fed by Capability 9 (Phase 15 is `Blocked (depends on P14)` per the Programme, and Phase 14 is now part of Capability 9). Mapped work packages: `ENG-P15-001`, `ENG-P15-002`, `ENG-P15-003`. Corresponds to the Engineering Implementation Programme's own Phase 15 (End-to-End Validation and Burundi Pilot). Likely concerns: TRD22 §22.25's own pilot validation areas.
- **Production Readiness** — fed by the Pilot Readiness milestone completing (Phase 16 is `Blocked (depends on P15)` per the Programme — not directly by Capability 8, corrected from an earlier draft). Mapped work packages: `ENG-P16-001`, `ENG-P16-002`. Corresponds to the Engineering Implementation Programme's own Phase 16 (Production Launch). Likely concerns: TRD22 §22.26's own launch-readiness checklist (18 items) and production smoke test (9 items).

## 8. Engineering Work Package Mapping

Only existing, already-approved work packages from the [Engineering Implementation Programme](../change-tracking/engineering-implementation-programme.md) are listed. No new work package is created by this document.

| Capability | Engineering Work Package(s) | Customer Journey | Status |
|---|---|---|---|
| 0 — Engineering Foundation | `ENG-P0-001`, `ENG-P0-002` | — | Complete |
| 1 — Platform Foundation | `ENG-P1-001`, `ENG-P1-002`, `ENG-P1-003` | — | Complete |
| 2 — Customer Identity | `ENG-P2-001`, `ENG-P2-004` | Registration | Blocked — partially implemented (see §5) |
| 3 — Business Identity | `ENG-P2-002`, `ENG-P2-003`, `ENG-P2-004`, `ENG-P3-001`, `ENG-P3-002`, `ENG-P3-003` | — (business onboarding) | Blocked |
| 4 — First Verified Purchase | `ENG-P4-001`, `ENG-P4-002`, `ENG-P5-001`, `ENG-P5-002`, `ENG-P5-003`, `ENG-P6-001`, `ENG-P6-002`, `ENG-P6-003` | First Purchase, First Verification | Blocked |
| 5 — Progress Tracking | `ENG-P7-001`, `ENG-P7-002`, `ENG-P7-003` | Progress, Reward Earned | Blocked |
| 6 — First Reward | `ENG-P8-001`, `ENG-P8-002` | Reward Redeemed, Recognition | Blocked |
| 7 — Business Operations | `ENG-P9-001`, `ENG-P9-002`, `ENG-P9-003`, `ENG-P10-001`, `ENG-P10-002`, `ENG-P10-003`, `ENG-P11-001`, `ENG-P11-002`, `ENG-P11-003` | — (business operations) | Blocked |
| 8 — Platform Operations | `ENG-P12-001`, `ENG-P12-002` | — (platform administration) | Blocked |
| 9 — Platform Optimisation | `ENG-P13-001`, `ENG-P13-002`, `ENG-P13-003`, `ENG-P14-001`, `ENG-P14-002`, `ENG-P14-003`, `OBS-OPS-001` | — (cross-journey hardening) | Blocked |

This table accounts for 42 of the Programme's 47 work packages. The remaining 5 — `ENG-P15-001`/`002`/`003` and `ENG-P16-001`/`002` — are milestone-level, not capability-level, work: they validate and launch the whole assembled platform rather than deliver a single new customer capability, so they are mapped in §7 (Milestone Structure) to the two future-milestone placeholders instead of to a row here.

Every requirement ID, decision dependency, and status cell above is sourced directly from the live Engineering Implementation Programme and Coding-Agent Prompt Register at the time this document was written (2026-07-29) — not re-derived or assumed.

## 9. Stitch Usage Guidance

Approved Stitch explorations live at [`docs/07-product-design/stitch/exploration-v1/`](../../07-product-design/stitch/exploration-v1/) and [`exploration-v2/`](../../07-product-design/stitch/exploration-v2/), governed by the [Product Design section](../../07-product-design/README.md) and its [Design Decisions Register](../../07-product-design/design-decisions.md).

For engineering purposes, the following rules apply without exception:

- **Stitch artefacts are implementation references.** They show one already-reviewed way a screen or flow *can* look and feel, useful as a starting point for frontend implementation and as evidence that a UX direction has already been considered and approved.
- **They are not product specifications.** A Stitch concept's HTML/CSS is not binding markup, its exact copy is not binding copy, and its presence does not itself satisfy any PRD or TRD requirement — implementation must still satisfy the actual requirement IDs traced in §8 and the [Requirements Traceability & Implementation Matrix](../../00-governance/requirements-traceability-matrix.md).
- **Product Foundation documents remain authoritative.** Where a Stitch concept and the PRD/TRD appear to diverge, the PRD/TRD governs, exactly as the Product Design section's own README already states for itself; this document creates no exception.
- **Journey-to-Stitch traceability** for the concepts already used in §5: `signature_verification_experience` (Capability 4, First Verification), `loyalty_journey_verified_units` (Capability 5, Progress), `concept_4_reward_ready` (Capability 5, Reward Earned), `the_on_us_moment_reward_redemption` (Capability 6, Reward Redeemed and Recognition). Capabilities 2, 3, 7, 8, and 9 currently have no Stitch-validated concept — implementation for those capabilities proceeds from the governing PRD/TRD text alone until (if ever) a future exploration pass covers them, consistent with Moments That Matter's own disclosed gaps (§1 Registration, §2 First Purchase, §8 Customer Appreciation).

## 10. Definition of Capability Completion

A capability is complete only when **all** of the following are true — this extends, and does not replace, the existing [Definition of Done (Work Package Level)](../../06-engineering-governance/definition-of-done.md), which still governs each individual work package within the capability:

1. **Implementation complete** — every engineering work package listed for the capability in §8 has independently satisfied the Work-Package Definition of Done.
2. **Validation complete** — the capability's primary user journey(s) (§5) have been exercised end-to-end against real tests (Firebase Emulator Suite integration tests where server state is involved), not merely unit-tested in isolation.
3. **Documentation updated** — the Engineering Implementation Programme and Coding-Agent Prompt Register reflect every constituent work package's real status; this document's own §8 mapping is checked for staleness at that point.
4. **Engineering governance updated** — any Decision Dependency the capability required is `CONFIRMED` in the Decision Register; any Technical Review the capability's work packages required returned `Approved`.
5. **Customer journey validated end-to-end** — for capabilities with a primary journey (§5), a person (not only automated tests) has walked the actual journey moment described in Moments That Matter and confirmed the Success Criteria stated there are met.

A capability with zero constituent work packages `Complete` is **Blocked** or **Not Started**, matching whatever the least-advanced constituent work package's own status is — this document never reports a capability further along than its own work packages.

## 11. Future Engineering Prompt Standard

Every future implementation prompt for a work package mapped in §8 should open by stating the following seven items, in this order, before any technical detail:

1. **Capability** — which of the ten capabilities in §5 this work package belongs to.
2. **Customer Outcome** — the customer- or business-facing outcome this specific work package moves toward (drawn from that capability's own Customer Outcome in §5, narrowed to this work package's slice of it).
3. **Engineering Objective** — the specific technical objective, as already stated in the Engineering Implementation Programme's own work-package row.
4. **Dependencies** — both the capability-level dependency (§5) and the work-package-level Decision/Provider/Legal Dependencies already recorded in the Programme.
5. **UX References** — the specific Stitch concept(s), if any, per §9's journey-to-Stitch traceability, with the explicit reminder that they are references, not specifications.
6. **Validation Criteria** — the Required Validation already stated for this work package's phase in the Programme, plus (where applicable) the specific journey Success Criteria from Moments That Matter.
7. **Milestone Contribution** — which milestone (§7) this work package's capability feeds, and what specifically it moves closer to completion.

This does not replace the [Implementation Prompt Standard](../../06-engineering-governance/implementation-prompt-standard.md)'s own required structure — it is a mandatory preamble to it, giving every future prompt the same capability-first framing this document establishes.

## 12. Relationship to This Task's Constraints

For transparency: this document was created under an explicit constraint set (`ENG-PROG-001`) that prohibited modifying the Product Definition, the Engineering Implementation Programme, or any other existing approved document, and prohibited inventing any new engineering work package. Every fact in §5 and §8 above was sourced by reading the live Engineering Implementation Programme, Coding-Agent Prompt Register, Product Foundation, and Product Design documents as they stood on 2026-07-29 — none was assumed or invented. See the accompanying implementation report for the full validation record.
