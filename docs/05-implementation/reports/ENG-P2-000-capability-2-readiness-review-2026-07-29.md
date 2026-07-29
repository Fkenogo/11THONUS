> **Title:** ENG-P2-000 — Capability 2 Readiness Review — Customer Identity
> **Status:** Complete. Planning and validation exercise only — no code implemented, no governance document modified.
> **Date:** 2026-07-29
> **Classification:** Readiness review. Recommendation only — does not itself authorize implementation, resolve any decision, or change any tracker status.

# ENG-P2-000 — Capability 2 Readiness Review — Customer Identity

## 1. Executive Summary

Capability 2 — Customer Identity is **exceptionally well-specified at the product, data, and technical-architecture level**, and the engineering foundation it would build on (Capability 1 — Platform Foundation) is confirmed `Complete`. However, the Engineering Implementation Programme's own Phase 2 profile — not this review's own judgment — already states Phase 2 is `Blocked — depends on Phase 1 and 4 D1 decisions (the largest concentration of D1 blockers of any phase)`. This review independently verified that classification against the live Decision Register, the Engineering Blueprint, and the actual codebase, and confirms it: **four D1-priority Founder/Engineering decisions remain open**, one of which explicitly blocks the capability's own core deliverable (the loyalty number itself), and **one unresolved cross-document architecture conflict** (`BaseMetadata` field shape) blocks any Phase 2 work package from persisting a document at all. Separately, **zero approved Stitch UX references exist** for any Customer Identity screen (registration, sign-in, or profile) — a disclosed, pre-existing gap, not new information.

**Recommendation: Not Ready.** This is not a judgment call between comparably-ready options — it is a direct restatement of what the Programme's own Entry Criteria and Blocking Reason cells already say, independently re-verified against primary sources rather than assumed. Section 12 lists the exact five items that would need to resolve to move to Ready.

## 2. Repository Documents Reviewed

- `docs/01-product/prd/00-product-foundation.md` (headers/role-Capabilities section)
- `docs/01-product/prd/02-customer-registration-and-identity.md` (full, 770 lines)
- `docs/07-product-design/moments-that-matter.md`
- `docs/07-product-design/interaction-patterns.md`
- `docs/07-product-design/design-decisions.md`
- `docs/07-product-design/README.md`
- `docs/07-product-design/stitch/exploration-v1/` and `exploration-v2/` (directory listing, concept titles)
- `docs/02-technical/trd/12-security-and-access-control.md` (§12.1–12.35)
- `docs/02-technical/trd/10-firestore-data-architecture.md` (§10.6.1–10.6.2)
- `docs/00-governance/decisions/decision-register.md` (full search for Phase-2-relevant entries)
- `docs/00-governance/requirements-traceability-matrix.md` (FR-CI-*, AP-005, FR-AUTHZ-001, BR-005 rows)
- `docs/05-implementation/change-tracking/engineering-implementation-programme.md` (Phase 2 profile, Phase 1 status)
- `docs/05-implementation/change-tracking/coding-agent-prompt-register.md` (ENG-P2-001/004 rows)
- `docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md` (Capability 2 entry)
- `docs/05-implementation/reports/ENG-P1-002-merge-verification-report-2026-07-25.md` §12 (`BaseMetadata` conflict origin)
- `apps/web/src/` (directory tree, `infrastructure/firebase/auth.ts`, `package.json`)
- `functions/src/shared/metadata/baseMetadata.ts`

## 3. Product Readiness Assessment

**Status: Ready.**

`docs/01-product/prd/02-customer-registration-and-identity.md` is a dedicated, 770-line, 30-section PRD chapter exclusively for Customer Identity. It defines:

- **Objectives** (§2): simple, mobile-first, secure, fast, recoverable, unique, scalable, privacy-conscious; registration under two minutes.
- **Philosophy** (§3): the customer registers with 11thONUS, not a business — foundational and consistently applied throughout.
- **Five identity components** (§4): Internal Platform User ID, Loyalty Number, QR Code, Authentication Identity, Customer Profile — each with explicit characteristics.
- **Registration journey** (§5): a 7-step flow (Welcome → phone entry → verify → create account → complete profile → generate loyalty number/QR → dashboard).
- **Minimum registration information** (§6): mandatory vs. optional fields explicitly listed, including a disclosed Phase-1 editorial correction (preferred language moved to mandatory).
- **Account lifecycle** (§7): six explicit statuses (Pending Verification, Active, Suspended, Locked, Closed, Archived), each defined.
- **Loyalty number and QR rules** (§8–9), **profile** (§10), **dashboard** (§11), **friends and family model** (§12), **privacy** (§20), **phone/email changes** (§21–22), **duplicate accounts** (§23), **account recovery** (§24), **account closure** (§25).
- **14 functional requirements** (FR-CI-001..014) and **5 business rules** (BR-017..021), each atomic and testable.
- **Acceptance criteria** (§29) for the section itself, already satisfied by the section's own content.

Terminology is consistent throughout (loyalty number, loyalty identity, customer profile, platform identity) and consistent with the data schema (§7 below).

**One disclosed, non-blocking gap:** §8 explicitly states "Generation algorithm will be defined within the Technical Requirements Document" — the PRD deliberately defers the loyalty-number/QR algorithm to engineering, which is exactly the still-open `DEC-DATA-007` (§9 below). This is a disclosed handoff, not a missing specification.

## 4. Customer Journey Readiness Assessment

**Status: Ready with Conditions.**

| Journey | Coverage | Source |
|---|---|---|
| Registration | Fully defined, 7-step journey | PRD2 §5; Moments That Matter §1 |
| Sign in | Defined as technical requirements (supported methods, session issuance), not as a PRD-level narrative journey | TRD12 §12.4.1, §12.27 |
| Sign out | Fully defined (manual, device-level, all-device) | TRD12 §12.27 |
| Profile access | Fully defined (fields, editable areas) | PRD2 §10; TRD10 §10.6.2 |
| Account recovery | Fully defined (phone OTP, email, support, lost-phone procedure) | PRD2 §24; TRD12 §12.29–12.31 |

No journey was invented for this review — every row above cites an already-approved document. The one genuine observation: Sign In has no PRD-level narrative journey the way Registration does (PRD2 has no "sign in" or "log in" text at all — confirmed by direct search); it exists only as TRD12 technical requirements. The content is present and implementable; the *format* is inconsistent with Registration's own numbered-journey treatment. This is a documentation-consistency observation, not a missing requirement.

## 5. UX Reference Assessment

**Status: Not Ready (for visual reference).**

Approved Stitch material: `docs/07-product-design/stitch/exploration-v1/` (8 concepts) and `exploration-v2/` (5 refined concepts + `premium_verification_system` design-system spec). Every concept was checked by title and by its Design Decisions Register cross-reference (`design-decisions.md` §DEC-UX-001):

| Stitch concept | Actual subject | Relevant to Capability 2? |
|---|---|---|
| `concept_1_customer_home` / `refined_home_trust_first` | Post-login customer dashboard | No — post-authentication |
| `concept_2_purchase_verification` / `signature_verification_experience` | Purchase verification | No — Capability 4 |
| `concept_3_loyalty_journey` / `loyalty_journey_verified_units` | Progress tracking | No — Capability 5 |
| `concept_4_reward_ready` / `the_on_us_moment_reward_redemption` | Reward availability/redemption | No — Capability 5/6 |
| `concept_5_record_purchase` | Business purchase recording | No — Capability 4/7 |
| `concept_6_business_dashboard` | Business dashboard | No — Capability 7 |
| `concept_8_notification_center` | Notifications | No — Capability 7 |
| `concept_9_navigation_model` | Navigation (tested, not adopted per DEC-UX-002) | Indirectly — general nav pattern, not identity-specific |

**Zero approved Stitch concepts cover Registration, Sign In, or Profile screens.** This is not new information — [Moments That Matter](../../07-product-design/moments-that-matter.md) §1 already discloses "No Stitch concept currently validates this screen — a priority for the next exploration pass, since it is the customer's literal first impression of the platform's promise," and [Interaction Patterns](../../07-product-design/interaction-patterns.md) does not list Registration/Sign In among its 13 tracked patterns at all. Per [CDR-001](../roadmap/CDR-001-capability-delivery-roadmap.md) §9's own governing rule, implementation may proceed from the governing PRD/TRD text alone in the absence of a Stitch reference — this is a disclosed, accepted path, not a blocker, but it means Capability 2's very first customer-facing screens would be built with zero visual precedent, unlike five of the other nine capabilities.

## 6. Engineering Architecture Readiness

**Status: Ready, with one explicit blocking exception.**

Confirmed directly against the live codebase:

- **Application shell / composition root:** `apps/web/src/main.tsx`, `App.tsx` exist and are wired (error boundary, observability, correlation lifecycle already composed per `ENG-P1-003`).
- **Routing:** `react-router-dom` v7.18.1 is an installed dependency; `RouteTracker.tsx` already uses `useLocation()` for breadcrumbs. No route tree, pages, or screen components exist yet — expected, since no capability past 1 has begun implementation.
- **Authentication architecture:** `apps/web/src/infrastructure/firebase/auth.ts` (`getFirebaseAuth()`) is implemented, tested, and wired into the composition root; `ENG-P1-003`'s `registerAuthLifecycle()` already listens to real Firebase `onAuthStateChanged` events and clears correlation context on sign-out.
- **Shared UI / form tooling:** `react-hook-form`, `zod`, `@hookform/resolvers`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react` are all already installed — directly applicable to building the registration form.
- **State/data management:** `@tanstack/react-query` installed, not yet wired to any domain query.
- **Persistence:** Firestore/Cloud Functions shared command contract (`ENG-P1-002`) exists — error handling, correlation IDs, structured logging, idempotency, event outbox — the exact substrate an Identity Domain Service would build on.
- **Engineering foundations:** Firestore/Storage Rules deny-by-default posture confirmed in place since Phase 0, unmodified.

**The one explicit blocking exception:** the `BaseMetadata`/TRD10 §10.5 authority conflict, disclosed during `ENG-P1-002`'s own Technical Review (2026-07-25) and carried forward as a named Phase 2 entry criterion in the Programme itself (not an inference of this review): "the authority conflict between the Version 1 Engineering Blueprint §3.3 and TRD10 §10.5 over the shared `BaseMetadata` shape (field naming — `version` vs `schemaVersion` — audit-field nullability, and several scoped fields) must be resolved before any Phase 2 work package persists a document using `stampCreate`/`stampUpdate`/`BaseMetadata`." Confirmed the referenced module (`functions/src/shared/metadata/baseMetadata.ts`) exists and is exactly the mechanism `ENG-P2-001` would need to use. This conflict remains unresolved as of this review.

## 7. Data Readiness

**Status: Ready with Conditions.**

`docs/02-technical/trd/10-firestore-data-architecture.md` §10.6.1–10.6.2 defines fully-typed schemas for both collections Capability 2 needs:

- **`users`** (§10.6.1): `authUid`, `userType`, `displayName`, `primaryPhone`/`primaryEmail`, `preferredLanguage`, `countryCode`, `timezone`, `status` (6-value enum matching PRD2 §7 exactly), audit fields.
- **`customerProfiles`** (§10.6.2): `loyaltyNumber`, `qrReference`, `firstName`/`lastName`, optional `dateOfBirth`/`gender`/`city`, `profileCompletionPercent`, `interests`, `communicationPreferences`, `consentVersions`, `status`.

Cross-checked: `UserDocument.status`'s six values (`pending`/`active`/`locked`/`suspended`/`closed`/`archived`) match PRD2 §7's six account statuses exactly — a positive consistency signal, not assumed. Explicit rules present: authentication credentials never stored in Firestore; Progressive KYC rule (optional fields stay absent, never false-populated).

**Two genuine gaps, both already tracked as open decisions, not newly discovered:** (1) the loyalty-number/QR **generation algorithm** itself is undefined (`DEC-DATA-007`) — the schema has a `loyaltyNumber: string` field but no specification for what populates it; (2) the `BaseMetadata` conflict (§6 above) affects every document's audit fields, including these two collections.

## 8. Security Readiness

**Status: Not Ready.**

`docs/02-technical/trd/12-security-and-access-control.md` provides mature, detailed architecture: Identity Architecture (§12.3, Firebase Auth → platform user → role context → server authorization), Supported Authentication Methods (§12.4.1: phone OTP primary, email secondary, future Google/Apple), Account Identity Rules AIR-001–006 (§12.6), 5-layer Authorization Architecture (§12.10), Session Management (§12.27: issuance, refresh, sign-out at 3 scopes, revocation), Privileged Reauthentication (§12.29), Account Recovery (§12.30–12.31), Suspension (§12.33), Closure (§12.34).

**Resolved dependencies:** `DEC-ID-001` (portable identity, `CONFIRMED`), `DEC-ID-002` (individual accounts, no shared credentials, `CONFIRMED`), `DEC-ID-006` (preferred language mandatory, `CONFIRMED`). Firestore/Storage deny-by-default posture (`FR-SEC-006`) confirmed in place since Phase 0.

**Outstanding, blocking dependencies (all D1):**
- `DEC-SEC-001` — the customer authentication approach and fallback itself is **not yet confirmed**, only recommended (Firebase phone OTP + email fallback). Register status: `OPEN_ENGINEERING`.
- `DEC-PROV-004` — the OTP delivery route (Firebase-native vs. external SMS for Burundi numbers) is open; the Decision Register's own text states it "Blocks: customer authentication." Status: `OPEN_PROVIDER`.
- `DEC-ID-003` — the permission-inheritance algorithm (reconciling PRD10 and PRD1's differing role-inheritance descriptions) is open; Register states "Blocks: authorization implementation; freeze." Status: `OPEN_FOUNDER`.

**Implementation decisions that can safely be deferred:** the exact optional-gender value set (`DEC-PROD-012`, D2 — gender is already confirmed optional and non-blocking for participation, only the enum wording is open, and it blocks "profile schema freeze," not registration itself).

## 9. Founder Decision Dependency Review

Every decision below was located by direct search of the live Decision Register, not recalled or assumed; only approved repository evidence was used.

| Decision | Status | Priority | Effect on Capability 2 |
|---|---|---|---|
| `DEC-ID-001` — One portable loyalty identity | **CONFIRMED** | D1 | Informational — already resolved |
| `DEC-ID-002` — Individual accounts, no shared credentials | **CONFIRMED** | D1 | Informational — already resolved |
| `DEC-ID-006` — Preferred language mandatory | **CONFIRMED** | D2 | Informational — already resolved |
| `DEC-SEC-001` — Customer authentication approach and fallback | **Pending** (`OPEN_ENGINEERING`) | D1 | **Blocking** — blocks customer registration |
| `DEC-PROV-004` — Phone OTP delivery route | **Pending** (`OPEN_PROVIDER`) | D1 | **Blocking** — blocks customer authentication |
| `DEC-ID-003` — Permission inheritance semantics | **Pending** (`OPEN_FOUNDER`) | D1 | **Blocking** — blocks authorization implementation |
| `DEC-DATA-007` — Loyalty number / QR generation algorithm | **Pending** (`OPEN_ENGINEERING`) | D1 | **Blocking** — blocks customer identity issuance (the capability's own core deliverable) |
| `DEC-PROD-012` — Optional gender values and wording | **Pending** (`OPEN_FOUNDER`) | D2 | Deferrable — blocks profile schema freeze only, not registration |
| `DEC-LEGAL-005` — Minimum account age, children/family data | **Pending** (`OPEN_LEGAL`) | D2 per Register | See discrepancy below |

**A documentation discrepancy found and disclosed, not resolved by this review:** the Decision Register lists `DEC-LEGAL-005` as `Priority: D2`, `Required by: Phase 2 (registration policy) / Phase 14 gate`, `Blocks: registration policy text`. The Engineering Implementation Programme's own Phase 2 profile, by contrast, states: "**Legal Dependencies:** None direct (`DEC-LEGAL-005`, children/family data, is D3/pilot-tier, not a Phase 2 blocker)." These two governing documents disagree about both this decision's priority tier (D2 vs. "D3/pilot-tier," a tier that does not otherwise appear as a defined priority level in the Register) and whether it is a Phase 2 blocker at all. This review takes no position on which document is correct — it is flagged as a reconciliation item for the Founder/Engineering Lead, consistent with this task's constraint not to create new decisions or redesign either document.

## 10. Capability Dependency Review (CDR-001)

- **Capability 1 (Platform Foundation) dependency:** satisfied. Confirmed `Complete` — `ENG-P1-001`/`002`/`003` all `Complete`, `ENG-P1-003` administratively closed 2026-07-29 (this session's own prior work).
- **CDR-001's own Capability 2 entry** correctly lists its dependencies as Capability 1 plus the four D1 decisions (`DEC-SEC-001`, `DEC-DATA-007`, `DEC-PROV-004`, `DEC-ID-003`) — consistent with this review's own independent findings above. CDR-001 does not currently mention `DEC-PROD-012` or `DEC-LEGAL-005` in Capability 2's dependency list; both are lower-priority (D2) and non-blocking for the core registration path, so this is a minor completeness gap in CDR-001, not a readiness blocker.
- **Downstream dependencies correctly understood:** Capability 3 (Business Identity) shares work package `ENG-P2-004` with Capability 2 and sequentially follows it; Capability 4 (First Verified Purchase) depends on both Capability 2 and 3 being complete. No downstream capability is at risk of being started before its prerequisite.
- **No prerequisite capability overlooked:** Capability 0 (Engineering Foundation) and Capability 1 are the only two capabilities that precede Capability 2 in CDR-001's own sequence, and both are confirmed `Complete`.

## 11. Engineering Work Package Review

Reviewed `ENG-P2-001` (Customer identity — auth, profile, loyalty number, QR) and `ENG-P2-004` (Role context and permission resolution) against the Programme's Phase 2 work-package table.

- **Scoping:** both remain appropriately scoped — objective, requirement IDs, decision/provider dependencies, preconditions, expected files/areas, required validation, deployment requirement, and manual QA requirement are all defined, matching what §3–§8 above independently confirmed exists in governing documentation.
- **Readiness:** both correctly marked `Blocked`, with Blocking Reason cells that name the exact open decisions this review also found independently (`DEC-SEC-001`, `DEC-DATA-007`, `DEC-PROV-004` for `ENG-P2-001`; `DEC-ID-003` for `ENG-P2-004`).
- **Prerequisite gaps:** none beyond the decisions and the `BaseMetadata` conflict already identified in §6, §8, §9.
- **Sequencing:** `ENG-P2-002`/`003` (Business Identity) are correctly sequenced after `ENG-P2-001`; `ENG-P2-004` correctly depends on `ENG-P2-001..003` all completing first. No redesign proposed or performed.

## 12. Readiness Matrix

| Area | Status | Notes |
|---|---|---|
| Product | Ready | 770-line dedicated PRD chapter; one disclosed, non-blocking algorithm deferral (§3) |
| Customer Journeys | Ready with Conditions | Sign-in exists only as TRD technical requirements, not a PRD-level narrative journey (§4) |
| Moments That Matter | Ready with Conditions | §1 Registration explicitly disclosed as governing-document-only, no Stitch validation |
| UX References | Not Ready | Zero approved Stitch concepts cover Registration, Sign In, or Profile (§5) |
| Engineering Architecture | Ready with Conditions | Foundation solid; `BaseMetadata`/TRD10 §10.5 conflict explicitly blocks document persistence (§6) |
| Data | Ready with Conditions | Schema fully defined; generation algorithm (`DEC-DATA-007`) and `BaseMetadata` conflict open (§7) |
| Security | Not Ready | 3 of 4 D1 decisions directly gate authentication/authorization itself (§8) |
| Founder Decisions | Not Ready | 4 D1 decisions open; 1 documentation discrepancy found (`DEC-LEGAL-005`) (§9) |
| Capability Dependencies (CDR-001) | Ready | Capability 1 confirmed Complete; sequencing correctly understood (§10) |
| Engineering Work Packages | Ready with Conditions | Correctly scoped and correctly marked Blocked; no redesign needed (§11) |

## 13. Overall Recommendation

# Not Ready

This recommendation is a direct restatement of what the Engineering Implementation Programme's own Phase 2 profile already states — "Blocked — depends on Phase 1 and 4 D1 decisions (the largest concentration of D1 blockers of any phase)" — independently re-verified against the live Decision Register, the Engineering Blueprint's `BaseMetadata` conflict, and the actual codebase, rather than accepted at face value.

Supporting evidence, in order of severity:

1. **Four D1-priority decisions remain open** (`DEC-SEC-001`, `DEC-PROV-004`, `DEC-ID-003`, `DEC-DATA-007`), each explicitly named in the Register or Programme as blocking a specific piece of Capability 2 (customer registration, customer authentication, authorization implementation, and customer identity issuance respectively). `DEC-DATA-007` in particular blocks the capability's own literal core deliverable — the loyalty number.
2. **One unresolved cross-document architecture conflict** (`BaseMetadata`/TRD10 §10.5) is an explicit, named Phase 2 entry criterion that blocks any work package from persisting a document at all, independent of the decisions above.
3. **Zero approved UX references** exist for any Customer Identity screen — a disclosed, accepted gap under CDR-001's own fallback rule, but a real one nonetheless for the platform's literal first customer-facing moment.

None of these three are new discoveries — all were already disclosed somewhere in the repository (Programme, Decision Register, Moments That Matter). This review's contribution is independently re-verifying each one against primary sources, confirming none has silently resolved, and consolidating them into a single evidence-based recommendation rather than treating "mostly ready" as "ready."

**What would change this recommendation to Ready to Proceed** (or, at minimum, Ready with Conditions): Founder/Engineering resolution of `DEC-SEC-001`, `DEC-PROV-004`, `DEC-ID-003`, and `DEC-DATA-007`; Engineering-Led resolution of the `BaseMetadata` conflict (a technical reconciliation, not a Founder decision per the Programme's own framing); and reconciliation of the `DEC-LEGAL-005` discrepancy between the Decision Register and the Programme (§9). None of these require new engineering work packages or a CDR-001 redesign — they are exactly the items the Programme itself already names as Phase 2's entry gate.

## 14. Risks

- **None from this review itself** — read-only; no code, no governance document, no decision, no CDR-001 content changed.
- **Risk if Capability 2 were started before these items resolve:** authentication mechanism and loyalty-number format are exactly the two things every subsequent Capability 2 screen and data record would depend on; starting UI or backend work before `DEC-SEC-001`/`DEC-PROV-004`/`DEC-DATA-007` resolve would very likely require rework.
- **Risk if the `DEC-LEGAL-005` discrepancy is left unreconciled:** if the Decision Register's "Required by Phase 2 / blocks registration policy text" framing is correct rather than the Programme's "D3/pilot-tier, not a Phase 2 blocker," registration policy text could ship without required legal review of children/family data handling.

## 15. Assumptions

- `DEC-PROD-012` (gender enum) is treated as non-blocking for the core registration path because the Decision Register itself states gender "is optional and never blocks participation" — this is read directly from the Register, not assumed independently.
- Sign-in's presence only in TRD12 (not PRD2) is treated as an acceptable, if inconsistent, documentation split (PRD = product intent, TRD = technical mechanics) rather than a missing requirement, since the actual content (methods, session handling) is present and detailed. A different reviewer could reasonably treat this as a smaller product-journey-format gap; it does not change the overall "Not Ready" recommendation either way, since it was rated "Ready with Conditions," not "Not Ready," on its own.
- The `BaseMetadata` conflict's resolution owner is assumed to be Engineering (not the Founder), per the Programme's own framing ("Not an `ENG-P1-002` defect; not resolved by that work package") — this review does not resolve it, only confirms it remains open.

## 16. Commands Executed

`grep`/`find`/direct file reads across `docs/01-product/`, `docs/02-technical/trd/`, `docs/07-product-design/`, `docs/00-governance/decisions/decision-register.md`, `docs/00-governance/requirements-traceability-matrix.md`, `docs/05-implementation/change-tracking/`, `docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md`; `find apps/web/src` (directory tree); `grep`/direct reads of `apps/web/src/infrastructure/firebase/auth.ts`, `package.json`; `grep -rl "BaseMetadata\|stampCreate\|stampUpdate" functions/src`; cross-referencing every requirement ID, decision ID, and status cited against its live source before including it.

## 17. Files Modified

None. This is a read-only review; no existing document was edited.

## 18. Dependencies Added

None.

## 19. Configuration Changes

None.

## 20. Rollback Instructions

`git revert` of this task's own commit (this report plus the `IMPLEMENTATION_CHANGES.md` entry) — a pure documentation addition with no effect on any other file.
