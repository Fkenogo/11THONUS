> **Title:** ENG-P3-002-DESIGN-001 — Business Onboarding Architecture & Delivery Design
> **Version:** 2.0 · **Status:** Design package — `FD-P3-002` Onboarding Completion/Progress/Staff-Invitation/Subscription-Reward Program all DISPOSITIONED/APPROVED (§36); Terms-of-Service acceptance architecture DESIGNED (§37, resolving the former `FD-P3-002-5` gap — legal Terms *content*/versioning-authority remains `DEC-LEGAL-002`, unresolved, not this document's authority); NO architecture/governance blocker remains · **Classification:** Working (execution-layer architecture record)
> **Governing document:** [PRD3 — Business Registration, Subscription and Onboarding](../../01-product/prd/03-business-registration.md); [CDR-001 Capability 3](CDR-001-capability-delivery-roadmap.md#capability-3--business-identity); [Engineering Implementation Programme](../change-tracking/engineering-implementation-programme.md) Phase 3; [ENG-P2-002-DESIGN-001](ENG-P2-002-DESIGN-001-business-identity-architecture-delivery-design.md); [ENG-P2-003-DESIGN-001](ENG-P2-003-DESIGN-001-staff-membership-identity-architecture.md); [ENG-P2-004-DESIGN-001](ENG-P2-004-DESIGN-001-role-context-permission-resolution-architecture.md); [ENG-P3-001-DESIGN-001](ENG-P3-001-DESIGN-001-commerce-knowledge-architecture-delivery-design.md); [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-SUB-002`, `DEC-SUB-009`, `DEC-LEGAL-002`
> **Source-of-truth path:** `docs/05-implementation/roadmap/ENG-P3-002-DESIGN-001-business-onboarding-architecture-delivery-design.md`
> **Last controlled update:** 2026-08-21 v2.0 (`FD-P3-002` Founder dispositions recorded; Terms-of-Service acceptance architecture; final consistency sweep; implementation-decomposition re-evaluation — §36–§42)

# ENG-P3-002-DESIGN-001 — Business Onboarding Architecture & Delivery Design

**This document defines architecture only. It authorizes no implementation.** No production code, Firestore Rules, migration, client UI, callable/HTTPS endpoint, subscription/billing logic, Reward Program logic, Knowledge Studio logic, or deployment is created or modified by this document. No new permission identifier is added to `ordinaryPermissionCatalogue.ts` or `sensitivePermissionCatalogue.ts`. It is analogous in role to [ENG-P2-002-DESIGN-001](ENG-P2-002-DESIGN-001-business-identity-architecture-delivery-design.md), [ENG-P2-003-DESIGN-001](ENG-P2-003-DESIGN-001-staff-membership-identity-architecture.md), and [ENG-P3-001-DESIGN-001](ENG-P3-001-DESIGN-001-commerce-knowledge-architecture-delivery-design.md) for the Business Onboarding concern of Capability 3. It resolves the architecture-level prerequisites `ENG-P3-002` needs before a future implementation prompt can be authorized without a coding agent inventing wizard state, transport surfaces, or lifecycle mechanisms no governing source actually specifies.

---

## 0. Entry State

- **Entry `origin/main` SHA:** `ff322930332c5613ca32acdcc95820a9d51db287` (this document authored in a fresh worktree branched cleanly from this SHA at `/Users/theo/11THONUS/.claude/worktrees/agent-a316b87afa403fdd1`; the primary worktree at `/Users/theo/11THONUS` was left untouched).
- **`gh pr view 148`/`149`:** both `MERGED` — `ENG-P3-001C` (Business Classification Reference Validation Integration, merged `56643bc9`) and its tracking-closure sync. `ENG-P3-001` overall implementation is assessed **Complete with explicit downstream content deferrals** (`CDR-001` §5, Capability 3 entry).
- **Open PRs:** `gh pr list --state open` shows exactly one — #34 (`docs(tracking): ENG-P2-RES-ADMIN-003 — Post-Decision Synchronisation`), docs-only, unrelated to onboarding.
- **No overlapping branch or PR for `ENG-P3-002`/`ENG-P3-003`/onboarding exists.** `git branch -a` shows no such branch prior to this task's own `eng-p3-002-design-001`.
- **Capability 3 status:** `Open — partially implemented; not closed` (`CDR-001` §5, last entry 2026-08-21). `ENG-P2-002` (Business Identity), `ENG-P2-003` (Staff Membership), `ENG-P2-004` (Permission Resolution) concerns are all `Complete`. `ENG-P3-001` implementation is `Complete with explicit downstream content deferrals`. `ENG-P3-002` and `ENG-P3-003` both remain `Not started`, not authorized by any prior closure.
- **Callable transport, verified directly against `functions/src/index.ts` (631 lines, exhaustively grepped for every `export const`/`export function`):** exactly `ping`, `authenticate`, `linkAuthenticationProvider`, `unlinkAuthenticationProvider`, `recoverAuthenticatedIdentity`, `createBusiness`, `updateBusinessProfile`, `updateBusinessBranchProfile`, `submitBusinessForVerification`, `closeBusiness`. **No Staff callable exists** (no `createStaffInvitation`/`acceptStaffInvitation`/`revokeStaffInvitation`/any staff-membership endpoint). **No Commerce Knowledge callable exists** (no read, query, or list endpoint of any kind). Every Business callable is a **write**; there is no `getBusiness`/`getBusinessBranch`/`listBusinessesForOwner` read endpoint anywhere.
- **`firestore.rules` read directly:** deny-by-default. Four collections (`users`, `customerProfiles`, `loyaltyNumbers`, `qrIdentityRecords`) get an explicit, still-`false` rule block documenting the posture; the trailing `match /{document=**} { allow read, write: if false; }` catchall denies everything else, including `businesses`, `businessBranches`, `businessMembershipInvitations`, `businessMemberships`, `knowledgeNodes`, `knowledgeTranslations`, `knowledgeTags` — none of which has its own rule block at all. No direct client Firestore read of any Business, Staff, or Commerce Knowledge document is possible today.
- **Staff domain (`functions/src/domains/permissions/`) verified directly:** invitation domain contracts, membership write repository, and four fully-built, tested commands exist — `createStaffInvitationService.ts` (INVITE), `revokeStaffInvitationService.ts` (REVOKE), `acceptStaffInvitationService.ts` (ACCEPT), `staffMembershipLifecycleCommand.ts` (SUSPEND/REACTIVATE/REMOVE/role-change). `businessMembershipRepository.ts` exposes only `getBusinessMembershipByUserAndBusiness` and `getBusinessMembershipById` — **no "list memberships by business" or "list invitations by business" query exists anywhere in the repository layer**, only single-record lookups. This is a repository-layer gap, not merely a missing callable.
- **Commerce Knowledge domain (`functions/src/domains/commerceKnowledge/`) verified directly:** `knowledgeNodeRepository.ts`, `knowledgeTagRepository.ts`, `knowledgeTranslationRepository.ts`, plus the Burundi pilot seed manifest/loader, all exist and are seeded (6 Industries, 14 Business Categories, 7 Business Types under Salon only — `ENG-P3-001B`/`C` closure notes). All are server-side write/read repositories with no callable or HTTPS wrapper of any kind.
- **`apps/web` verified directly:** `App.tsx`'s only route is `/` rendering a literal placeholder (`"Phase 0 infrastructure scaffold. No product features are implemented yet."`) plus two `import.meta.env.DEV`-gated dev-only harness routes. Real, tested infrastructure already exists — `src/authentication/` (full multi-provider sign-in flow, `AUTH-CORR-003`), `src/infrastructure/firebase/` (app/auth/firestore/functions/storage/appCheck clients), `src/i18n/` (centralized i18next EN/FR, `I18N-001`) — but **zero Business-domain frontend code exists**: no onboarding route, no Business context, no Business/Branch/Staff/Commerce-Knowledge API client, no form. `react-hook-form`, `@tanstack/react-query`, `zod`, `react-router-dom` are installed dependencies (`apps/web/package.json`) but nothing in `src/` outside `authentication/`/`infrastructure/`/`i18n/`/`dev/` consumes them yet.
- **`Business.status`/`BusinessStatus` (`functions/src/domains/business/models/businessStatus.ts`) verified directly:** eight-value lifecycle (`draft`, `pending_verification`, `trial`, `active`, `suspended`, `expired`, `closed`, `archived`); `draft → pending_verification → trial` is the only forward path from creation; the module's own doc comment states plainly: *"`pending_verification` → `trial`: the verification mechanism gating this transition is explicitly ungoverned... not implemented, and must not be read as authorizing, any of the mechanisms behind a transition."* This is authoritative, not a prior-report inference — read from the actual model file.
- **Permission catalogues verified directly:** `ordinaryPermissionCatalogue.ts` (four entries: `business.updateProfile`, `businessBranch.updateProfile`, `business.submitForVerification`, `business.close`, all Owner-only by default) and `sensitivePermissionCatalogue.ts` (`staff.manage`, `staff.assignPermissions`, `staff.assignRole` confirmed present, among eight total sensitive entries). Both closed, Founder-approved sets — this document proposes no addition to either.
- **DEC-SUB-002/009 verified directly (`decision-register.md`):** both `OPEN_FOUNDER`, `Priority: D2`, `Required by phase: Phase 10` — i.e. staff-account plan limits and the multi-business subscription/billing model are explicitly deferred to a later commercial phase, not blocking for onboarding.
- **DEC-CKS-002 verified directly (`ENG-P3-001-DESIGN-001` §26):** **APPROVED** — "The Knowledge Studio editorial UI is **not** a prerequisite for first launch... `ENG-P3-003` may follow the initial onboarding capability."
- **This package's authorization:** design/architecture only, matching the constraint pattern `ENG-P2-002-DESIGN-001`, `ENG-P2-003-DESIGN-001`, and `ENG-P3-001-DESIGN-001` all operated under. Material entry state matches the task brief's pre-verification exactly — no STOP condition triggered.

## 1. Purpose

This document resolves the architecture-level prerequisites for `ENG-P3-002` (Business onboarding flow), the second of Capability 3's three remaining engineering work packages (`engineering-implementation-programme.md`, Phase 3 work-package table):

| Work Package | Title | Scope | Status (this entry) |
|---|---|---|---|
| `ENG-P3-001` | Commerce Knowledge seed data | Launch taxonomy exists and is queryable (server-side) | Complete, with explicit content deferrals |
| `ENG-P3-002` | Business onboarding flow | A business can complete setup using only governed taxonomy | Not started — this document is its architecture package |
| `ENG-P3-003` | Knowledge Studio MVP | Taxonomy can be authored/approved/published without code changes | Not started, not launch-blocking (`DEC-CKS-002`) |

`ENG-P3-002`'s programme-level objective (`engineering-implementation-programme.md:243`) is precise: *"A business can complete setup using only governed taxonomy."* This is a narrower promise than PRD3 §5's historical nine-step flow (§5 below) — it does not promise subscription activation, Reward Program creation, or full lifecycle progression to `trial`/`active`. This document is **not** an implementation authorization for `ENG-P3-002` itself — it produces the architecture a future `ENG-P3-002A`/`...` implementation prompt would consume, exactly as `ENG-P3-001-DESIGN-001` did for `ENG-P3-001A`/`B`/`C`.

## 2. Scope

### 2.1 What this document covers

- Reconciliation of PRD3's historical nine-step onboarding narrative against the current governed Capability-3 boundary (§5).
- The precise customer outcome `ENG-P3-002` must deliver (§6).
- The onboarding-completion boundary, distinct from verification and activation (§7).
- Whether onboarding progress needs persisted backend state (§8).
- The minimum Business read/query transport (§9) and its DTO shape (§10 partial; full DTO treatment folded into §9/§14).
- The frontend Business-context model (§10).
- The minimum Staff transport surface and its architectural ownership (§11), and the invite/acceptance journey boundary (§12).
- The minimum Commerce Knowledge read transport (§13) and its DTO shape (§14).
- The required frontend application shell (§15) and form architecture (§16).
- Localization requirements (§17).
- Business lifecycle mapping and post-submission UX language (§18).
- The subscription boundary (§19) and Reward Program boundary (§20) — both reconciled out of `ENG-P3-002`.
- The authorization matrix (§21) and transport/Rules architecture (§22).
- The frontend error model (§23) and React Query data-refresh design (§24).
- Security/tenant-isolation modeling (§25).
- Preview/manual-QA architecture (§26) and the `ENG-P3-003` boundary (§27).
- Founder decisions (§28), Engineering decisions (§29), implementation decomposition (§30), dependency graph (§31), Definition of Ready (§32), acceptance matrix (§33), risks (§34), and explicit deferrals (§35).

### 2.2 What this document explicitly does NOT do

| Concern | Owned by | Why excluded here |
|---|---|---|
| Frontend implementation (routes, components, forms) | A future `ENG-P3-002B`+ implementation package | This document specifies the shell/architecture conceptually (§15–§16), not working code |
| Callable/HTTPS endpoint implementation | A future `ENG-P3-002A`+ implementation package | This document specifies the required transport surface conceptually (§9, §11, §13), not `onCall` handlers |
| Firestore Rules changes | Not proposed | §22 confirms the existing server-mediated architecture is preserved; no Rules edit is designed or applied |
| Subscription-plan selection, billing, plan catalogue | `DEC-SUB-008`/Phase 10 (a later, separately-authorized capability) | §19 reconciles PRD3's Step 4 out of `ENG-P3-002`'s scope; this document does not design entitlement or billing mechanics |
| First Reward Program creation | `ENG-P4-001`/`002` (Phase 4, `Blocked`) | §20 reconciles PRD3's Step 6 out of `ENG-P3-002`'s scope; no Reward Program schema or UI is designed here |
| The `pending_verification → trial` mechanism | Explicitly ungoverned anywhere (`businessStatus.ts`'s own doc comment) | §7/§18 state plainly this document does not invent it; it is out of scope by direct instruction |
| Knowledge Studio editorial workflow | `ENG-P3-003` (not started, not launch-blocking per `DEC-CKS-002`) | §27 identifies the shared read surface only; no editorial/write API is designed |
| New permission identifiers | `ENG-P2-004`'s catalogues (`Complete`, frozen) | §21 maps operations onto the *existing* catalogues only; any genuine gap is flagged as a Founder/Engineering decision, not filled |
| Persisted onboarding-progress schema | Deliberately not introduced (§8) | Per the working design principles and this document's own Option-B recommendation, no new Firestore field/collection is proposed |

## 3. Governing Sources Actually Reviewed

Read in full, directly from the actual files in the clean `origin/main` worktree, not from the prior readiness assessment's summary:

- [PRD3 — Business Registration, Subscription and Onboarding](../../01-product/prd/03-business-registration.md) — full document, all 30 sections, read verbatim (§5 reconstructed exactly in §5 below).
- [CDR-001 Capability 3](CDR-001-capability-delivery-roadmap.md#capability-3--business-identity) and its full, append-only update history (all `[UPDATED ...]` entries through `ENG-P3-001C` closure).
- [Engineering Implementation Programme](../change-tracking/engineering-implementation-programme.md) Phase 3 profile and the `ENG-P3-001`/`002`/`003` work-package table.
- [ENG-P2-002-DESIGN-001](ENG-P2-002-DESIGN-001-business-identity-architecture-delivery-design.md) — Business/Branch bootstrap authority, `businessCode` policy, lifecycle-status precedent.
- [ENG-P2-003-DESIGN-001](ENG-P2-003-DESIGN-001-staff-membership-identity-architecture.md) — invitation/membership architecture, the seven `FD-*-STAFF` Founder dispositions, the explicit "callable-exposure is a future package's responsibility" boundary this document now resolves.
- [ENG-P3-001-DESIGN-001](ENG-P3-001-DESIGN-001-commerce-knowledge-architecture-delivery-design.md) — `DEC-CKS-001`/`002`/`003`, the §18 `ENG-P3-002` consumer-contract section (read directly — its wording was itself F3-corrected on 2026-08-21 to decouple reference-validity from translation-display-availability, which this document's §14 respects).
- [Decision Register](../../00-governance/decisions/decision-register.md) — `DEC-SUB-002` (staff limits per plan), `DEC-SUB-009` (multi-business subscription model), both read in full (context, options, current confirmed position, phase gate).
- `functions/src/index.ts` (full file) — the authoritative list of what callable transport exists today.
- `functions/src/domains/business/` (full tree: models, repositories, services, events) — `business.ts`, `businessBranch.ts`, `businessStatus.ts`, `businessBootstrapEndpointService.ts`, `authenticatedBusinessActor.ts`, `businessProfileCommand.ts`, `businessBranchProfileCommand.ts`, `businessLifecycleCommand.ts`, `businessClassificationValidation.ts`.
- `functions/src/domains/permissions/` (full tree) — invitation models, `businessMembershipRepository.ts`/`businessMembershipInvitationRepository.ts` (confirmed: single-record lookups only, no list query), the four staff commands, `ordinaryPermissionCatalogue.ts`, `sensitivePermissionCatalogue.ts`, `permissionId.ts`.
- `functions/src/domains/commerceKnowledge/` (full tree) — node/tag/translation models and repositories, the seed manifest/loader.
- `functions/src/shared/errors/errorCategories.ts` — the closed 14-category error taxonomy.
- `apps/web/` (full `src/` tree) — `App.tsx`, `src/authentication/`, `src/infrastructure/firebase/`, `src/i18n/`, `package.json` dependency list.
- `firestore.rules` — read directly, full file (49 lines).

Every conclusion below is labeled **GOVERNED REQUIREMENT** (a governing document mandates it), **EXISTING IMPLEMENTATION** (already true in the codebase, verified directly), **ENGINEERING DESIGN** (this document's own proposed architecture, not mandated), or **FOUNDER DECISION REQUIRED** (a genuine open fork this document cannot resolve on its own authority).

## 4. Repository Baseline

Restated concisely from §0/§3 for reference throughout the rest of this document:

| Area | State |
|---|---|
| Business write callables | `createBusiness`, `updateBusinessProfile`, `updateBusinessBranchProfile`, `submitBusinessForVerification`, `closeBusiness` — all exist, tested, merged |
| Business read callables | **None** |
| Staff callables | **None** — commands exist (`functions/src/domains/permissions/service/`) but zero `onCall`/HTTPS exposure |
| Staff "list" queries (repository layer) | **None** — only `getBusinessMembershipByUserAndBusiness`/`getBusinessMembershipById` exist |
| Commerce Knowledge callables | **None** — repositories exist, fully seeded, server-side only |
| Firestore Rules | Deny-by-default catchall; no Business/Staff/Commerce-Knowledge collection has its own rule |
| `apps/web` Business-domain code | **None** — `App.tsx` is a literal Phase-0 placeholder route |
| `apps/web` reusable infrastructure | Authentication flows, Firebase client wiring, i18n (EN/FR), all `Complete` and merged |
| Business lifecycle | 8-state model, `draft → pending_verification → trial` the only forward path from creation; `pending_verification → trial` mechanism explicitly ungoverned |
| Permission catalogues | Closed, four ordinary + eight sensitive entries; `staff.manage`/`staff.assignPermissions`/`staff.assignRole` confirmed present |
| DEC-SUB-002/009 | Both `OPEN_FOUNDER`, Phase-10-gated, non-blocking for onboarding |
| DEC-CKS-002 | APPROVED — Knowledge Studio not launch-blocking |

## 5. Historical PRD Reconciliation

PRD3 §5's nine-step flow, reconstructed **verbatim**:

> **Step 1.** Create owner account (or sign in).
> **Step 2.** Create business. Business Name / Business Category / Country / City.
> **Step 3.** Business contact information.
> **Step 4.** Select subscription plan.
> **Step 5.** Accept Business Terms.
> **Step 6.** Create first Reward Program.
> **Step 7.** Invite staff (optional).
> **Step 8.** Complete onboarding checklist.
> **Step 9.** Business becomes operational.

Classification of each step (1 = Implement in `ENG-P3-002`, 2 = Optional in `ENG-P3-002`, 3 = Defer to later capability, 4 = Superseded by current architecture, 5 = Requires governance decision):

| Step | Historical content | Classification | Disposition |
|---|---|---|---|
| 1 | Create owner account / sign in | **1 — Implement** | Already fully built (`AUTH-*` series, `AUTH-CORR-003`). `ENG-P3-002` only needs the authenticated-route boundary in front of onboarding — no new authentication mechanism. |
| 2 | Create business (Name, Category, Country, City) | **1 — Implement** (**4 — partially superseded**) | The `createBusiness` callable already requires `displayName`, `primaryCategoryId`, `countryCode`, `city` plus fields PRD3's Step 2 doesn't literally name (`currencyCode`, `timezone`, `contactPhone` — GOVERNED via `CreateBusinessRequest`/`ENG-P2-002-DESIGN-001`). Current architecture supersedes the literal four-field step: the actual required field set is larger and already governed by `ENG-P2-002`, not re-litigated here. |
| 3 | Business contact information | **1 — Implement** (**4 — partially superseded**) | `contactPhone` is already a required `createBusiness` field (not a separate step); `contactEmail` is optional. No separate "Step 3" screen is architecturally required — contact fields are simply part of the Step-2-equivalent Business-details form (§16). |
| — (Branch) | *(not a named PRD3 step, but structurally required)* | **1 — Implement** | `ENG-P2-002` already made a default Branch part of Business bootstrap and profile (`businessBranchProfileCommand.ts`, `updateBusinessBranchProfile` callable exist). PRD3 predates the Branch concept as a first-class entity; current architecture supersedes the literal step list here — Branch-profile completion is a required `ENG-P3-002` outcome even though PRD3 §5 never names it. |
| — (Business Type) | *(not a named PRD3 step)* | **2 — Optional** | `Business.businessTypeId` is an optional field in the existing schema (`business.ts:41`); PRD3 §5 doesn't ask for it, but PRD3 §7's category list and `ENG-P3-001`'s seed data (Business Types under Salon) make it a natural optional refinement, not a required one. |
| 4 | Select subscription plan | **3 — Defer to later capability** | `DEC-SUB-008` (plan catalogue: prices, intervals, grace, proration) is `OPEN_FOUNDER`, Phase-10-gated. No plan catalogue, pricing, or entitlement schema exists anywhere in the codebase. Cannot be implemented in `ENG-P3-002` without inventing commercial terms no governing source has approved. See §19. |
| 5 | Accept Business Terms | **5 — Requires governance decision** | No Terms-of-Service text, versioning mechanism, or acceptance-record schema exists anywhere in PRD3, TRD, or code. This is a real historical PRD step with no current architecture to implement it against — flagged as a genuine open item, not silently dropped (§28). |
| 6 | Create first Reward Program | **3 — Defer to later capability** | Reward Program schema is `ENG-P4-001`/`002`, `Blocked` (Phase 4). No `rewardPrograms` collection, model, or callable exists. See §20. |
| 7 | Invite staff (optional) | **2 — Optional** | PRD3 §5 itself labels this step "(optional)". `ENG-P2-003`'s full invitation architecture exists server-side; only callable exposure is missing (§11). Optional in `ENG-P3-002`, matching PRD3's own wording — see §12/§28 for whether "optional" needs Founder reconfirmation. |
| 8 | Complete onboarding checklist | **4 — Superseded by current architecture** | PRD3 §12's checklist (Business Profile, Subscription, First Reward Program, Staff Invitation, Logo, First Purchase Recorded, First Customer Verification) spans multiple future capabilities (Capability 4/5/6 items are literally on this list). A literal implementation would require Reward Program and purchase-verification features that don't exist. §8 designs a narrower, derivable onboarding-progress concept for what `ENG-P3-002` actually owns — it does not implement PRD3's full checklist. |
| 9 | Business becomes operational | **5 — Requires governance decision** (**reconciled in §7**) | "Operational" in PRD3's own §4 lifecycle language corresponds most closely to `active` (a paying, fully live subscription), not `pending_verification`. Since Step 4 (subscription) and Step 6 (Reward Program) are both deferred, the Business genuinely **cannot** reach `active`/fully-operational inside `ENG-P3-002`'s scope. §7 defines the actual `ENG-P3-002` completion boundary as reaching `pending_verification`, explicitly short of "operational" in PRD3's literal sense. This is not a silent scope cut — it is disclosed here and the working design principle (`ENG-P3-002` may finish at `pending_verification`) is confirmed consistent with what current governance actually supports. |

**Reconciliation conclusion:** PRD3 §5 is a **product narrative written before Capability 3 was decomposed into `ENG-P2-002`/`ENG-P2-003`/`ENG-P2-004`/`ENG-P3-001`/`002`/`003`**, and before subscription billing (Phase 10) and Reward Programs (Phase 4) were sequenced as later, independent capabilities. It is not wrong — it describes the eventual full experience — but its literal step sequence cannot be built as a single `ENG-P3-002` package without pulling in two entire unbuilt capabilities. This document does not rewrite PRD3; §28 proposes a narrow, optional wording clarification for a *programme* document (not PRD3 itself) if the Founder wants one, per the task's explicit instruction not to rewrite PRD history.

## 6. Capability-3 Onboarding Outcome

Assessing each candidate outcome named in the task brief:

| Candidate outcome | Classification | Basis |
|---|---|---|
| Authenticate | **REQUIRED** | GOVERNED REQUIREMENT — PRD3 Step 1; EXISTING IMPLEMENTATION already complete |
| Create Business | **REQUIRED** | GOVERNED REQUIREMENT — PRD3 Step 2; `createBusiness` callable exists |
| Complete Business profile | **REQUIRED** | GOVERNED REQUIREMENT — `Business` schema's required fields (`displayName`, `primaryCategoryId`, `countryCode`, `currencyCode`, `timezone`, `city`, `contactPhone`) must all be populated to bootstrap; `updateBusinessProfile` exists for post-bootstrap refinement |
| Complete default Branch profile | **REQUIRED** | GOVERNED REQUIREMENT — `ENG-P2-002`'s bootstrap always creates a default Branch (`ENG-P2-002-DESIGN-001` FD-1); `updateBusinessBranchProfile` exists |
| Select Business Category | **REQUIRED** | GOVERNED REQUIREMENT — `primaryCategoryId` is a non-optional `Business` field, validated against Commerce Knowledge (`ENG-P3-001C`) |
| Select Business Type | **OPTIONAL** | EXISTING IMPLEMENTATION — `businessTypeId` is an optional field; seed data only covers Salon today, so most categories have no Business Type to select yet |
| Invite initial Staff | **OPTIONAL** | GOVERNED REQUIREMENT — PRD3 §5 Step 7 itself says "(optional)"; `ENG-P2-003` invitation architecture supports it, transport is the only gap |
| Review entered information | **REQUIRED** | ENGINEERING DESIGN — no governing source names a literal "review screen," but submitting incomplete/incorrect data to `pending_verification` with no review step would contradict PRD3 §2's "minimise friction... avoid overwhelming users" only in the sense that friction should be *purposeful*; a review step is standard practice for a one-way submission and is recommended, not mandated |
| Submit Business for verification | **REQUIRED** | GOVERNED REQUIREMENT — `submitBusinessForVerification` callable and `business.submitForVerification` permission already exist; `draft → pending_verification` is the only forward transition from `draft` |
| Enter the Business application/dashboard context | **REQUIRED** | ENGINEERING DESIGN — the owner must land somewhere after submission; §15 defines this as a Business-context shell, not a full dashboard (dashboard widgets are PRD3 §13, out of this package's scope) |
| Select subscription plan | **OUT OF SCOPE** | See §5 Step 4, §19 |
| Create first Reward Program | **OUT OF SCOPE** | See §5 Step 6, §20 |

**Conclusion:** `ENG-P3-002`'s customer outcome, precisely: *an authenticated owner can create a Business, complete its required profile and default Branch, select its Business Category (and optionally Business Type), optionally invite initial Staff, review what was entered, submit the Business for verification (reaching `pending_verification`), and land in a Business context that reflects that state truthfully.* This matches the programme's own stated objective ("a business can complete setup using only governed taxonomy") and does not silently include subscription or Reward Program work.

## 7. Onboarding Completion Boundary

**GOVERNED REQUIREMENT (working design principle, confirmed consistent with source):** onboarding completion is not automatically the same as Business verification completion, and `ENG-P3-002` may legitimately finish with the Business in `pending_verification`.

Three distinct concepts, deliberately separated:

1. **Onboarding completion** (this package's boundary): the owner has submitted a Business that satisfies every currently-governed required field and reached `pending_verification` via `submitBusinessForVerification`. This is a **frontend/UX** milestone — "I finished the wizard" — not itself a persisted flag (§8).
2. **Business verification**: the mechanism by which a `pending_verification` Business becomes eligible to progress toward `trial`. **Explicitly ungoverned** (`businessStatus.ts`'s own doc comment, confirmed §0) — not designed by this document, per direct instruction.
3. **Business activation**: reaching `active` status, which PRD3 §4 associates with "Subscription valid. Business fully operational." Requires the (out-of-scope, §19) subscription mechanism to exist at all.

`ENG-P3-002` therefore owns only (1). The MVP boundary evaluated in the task brief — *Business created + required profile/branch/classification completed + optional Staff invited + Business submitted to `pending_verification` + owner enters Business context* — is confirmed as the correct boundary: it is the furthest state any current governed transport (`submitBusinessForVerification`) can reach, and going further (asserting `trial`) would require inventing the ungoverned verification mechanism. **Trial/active state is NOT required for onboarding completion** — this document does not assume it, consistent with the working design principle.

## 8. Onboarding Progress Model

Evaluating the three options the task brief names:

- **Option A — frontend-local wizard state only.** A `useState`/URL-step-param wizard that tracks "which screen am I on," discarded on tab close, no backend awareness beyond the calls each step already makes.
- **Option B — derive progress from existing Business/Branch/Membership state.** On load, fetch the owner's Business (if any) via the new read transport (§9); infer "which step to resume at" from which required fields are already populated and what `status` the Business is in.
- **Option C — persist explicit onboarding progress** (e.g. `onboardingStep`, `onboardingCompleted` fields on `Business` or a new collection).

**ENGINEERING DESIGN — recommendation: Option B, with Option A as the moment-to-moment UI mechanism.** Reasoning, evaluated against each named risk:

| Risk factor | Assessment |
|---|---|
| Refresh/resume within a session | Option A alone would lose progress on refresh unless paired with B. B answers "resume where?" from the already-persisted `Business`/`Branch`/membership documents themselves — no parallel state needed. |
| Cross-device resume | Only possible with server-derived state — Option B is the only one of the three that supports this, and it supports it for free, since Business/Branch data is already server-persisted the moment `createBusiness` succeeds. |
| Partial Business creation | `createBusiness` bootstraps a `draft` Business and default Branch atomically (`ENG-P2-002B`) — there is no "half-created Business" state to reconstruct; the first wizard step (before `createBusiness` succeeds) has genuinely nothing to derive from, which is fine — it is simply "no Business yet, show the create-Business screen." |
| Business lifecycle authority | `BusinessStatus` (`businessStatus.ts`) already answers "how far along is this Business" authoritatively. A second, parallel `onboardingStep` enum would either duplicate this (redundant) or drift from it (a genuine duplicate-state-machine risk the working design principle explicitly warns against). |
| Duplicate state-machine risk | This is the decisive factor. `Business.status` (`draft`/`pending_verification`/...) combined with which required fields are non-empty **already, deterministically** encodes "where is this owner in onboarding" — a second explicit `onboardingStep` field would be a second source of truth for the same fact, with no new information it could express that derivation cannot. |
| Analytics need | No governed requirement for onboarding-funnel analytics exists in any read source (PRD9/TRD22 reporting sections were not found to name onboarding-step analytics as MVP-required). If this becomes a real product need later, it is better served by client-side funnel events than a persisted server field. |
| Support/debugging | Support can already answer "where is this Business stuck" by reading `Business.status` plus which fields are populated — no additional field is needed for this either. |

**Conclusion: no new persisted onboarding-progress schema is proposed.** The frontend derives its resume point by reading the owner's Business (if one exists) and Branch via the new read transport (§9), and locally drives step-to-step UI transitions (Option A) atop that. This directly satisfies working design principle 5 ("do NOT add `onboardingStep`/`onboardingCompleted`... merely because the frontend uses multiple screens") and principle 4 (progress state remains frontend-local, informed by, not duplicating, governed backend state).

## 9. Business Read/Query Architecture

**EXISTING IMPLEMENTATION gap, confirmed directly:** every Business callable is a write. There is no way for the frontend to learn "does this owner already have a Business, and if so what does it look like" without a new read transport.

Minimum read operations required for onboarding hydration (task brief Phase G):

| Operation | Purpose | Notes |
|---|---|---|
| Get current owner's Business(es) | Resume detection (§8); multi-Business support (§10) | Server-derived from the authenticated actor's `ownerUserId`/membership — never a client-supplied Business ID lookup alone (§25) |
| Get Business by authorized context (`businessId`) | Hydrate the review screen, the post-submission context, and (later) the dashboard shell | Must re-verify the caller's authority over that `businessId` server-side, not trust the ID |
| Get default Branch for a Business | Hydrate Branch-profile step / review step | One Branch exists per Business at MVP (`DEC-SUB-005`, `CONFIRMED`) |
| Get Business lifecycle status | Drive post-submission UI copy (§18) and resume logic (§8) | Already a field on the Business read result — not a separate query |
| Get current Business classification (`primaryCategoryId`/`businessTypeId`) | Pre-fill the classification step on resume; drive review screen | Same read result, not separate |

**ENGINEERING DESIGN:** one bounded read/query surface, conceptually a `getOwnedBusinesses` (returns zero, one, or — per BR-097/DEC-SUB-009's confirmed-isolated-per-owner model — potentially several Business summaries) and a `getBusinessContext(businessId)` (returns the full onboarding-relevant Business + default Branch DTO, §14-style bounded shape, never a raw Firestore document). Both are **reads only** — no new write surface, no new permission needed beyond an authenticated-owner/authenticated-member check (§21). This document does not implement these as callables; it records that this transport is a genuine, previously-undesigned gap `ENG-P3-002`'s backend sub-package must close (§30).

## 10. Business Context

**ENGINEERING DESIGN.** The frontend needs a `BusinessContext` concept analogous to the pattern React/RHF/React-Query-based apps commonly use, evaluated against the specific questions the task brief raises:

- **How does an authenticated owner select/enter a Business?** Derived server-side from `getOwnedBusinesses` (§9) — if zero, the owner is routed into the create-Business flow; if one, it is auto-selected; if more than one (see below), an explicit selection UI is required. The frontend never invents a Business ID; it only ever selects among IDs the server already returned for that authenticated actor.
- **Are multiple-Business owners supported immediately?** **EXISTING IMPLEMENTATION supports it structurally** — PRD3 §28's own (unapproved-at-PRD-level, but since operationally confirmed) recommendation "one owner may manage multiple businesses, each with its own subscription" is echoed by BR-097 ("businesses isolated per owner," `CONFIRMED` in `DEC-SUB-009`'s context notes) and by `createBusiness` having no "one business per owner" guard anywhere in `businessBootstrapEndpointService.ts`/`businessRepository.ts`. `ENG-P3-002` does not need to build a full multi-Business switcher UI, but its Business-context model must not *assume* single-Business ownership, since nothing in the backend enforces that assumption.
- **`currentBusinessId` authority.** **ENGINEERING DESIGN, security-critical:** `currentBusinessId` is a client-side UI-convenience value only (e.g. which tab is active, which ID is in the URL) — it never independently confers access. Every read/write the frontend makes still re-derives authority server-side via the existing membership/permission architecture (`authorizeAndExecute`, `evaluatePermission.ts`) exactly as `updateBusinessProfile` already does today (`businessId` is a request parameter, but the *permission check* is what actually gates the write, not the parameter's mere presence). This is GOVERNED REQUIREMENT by existing precedent, not a new invention.
- **URL-derived, session-local, server-resolved, or another pattern?** **ENGINEERING DESIGN — recommend URL-derived for the onboarding flow itself** (e.g. `/onboarding/:businessId/...` once a Business exists, `/onboarding/new` before one does) so refresh/deep-link/resume all work without additional session state, backed by a `BusinessContextProvider` that re-validates the URL's `businessId` against `getOwnedBusinesses` on load rather than trusting it blindly. Session-local caching (React Query, §24) is layered on top for performance, not as the authority source.
- **Refresh behavior.** On every full reload, the Business context re-resolves from the server (§9), never from `localStorage`/`sessionStorage` alone — this avoids a stale-cache tenant-isolation risk (§25).

## 11. Staff Transport

**EXISTING IMPLEMENTATION, reconfirmed directly (`functions/src/domains/permissions/service/`):** `createStaffInvitation` (INVITE), `revokeStaffInvitation` (REVOKE), `acceptStaffInvitation` (ACCEPT) commands all exist, fully tested, `authorizeAndExecute`-gated on `staff.manage`. `staffMembershipLifecycleCommand.ts` (SUSPEND/REACTIVATE/REMOVE/role-change) also exists but is a **later Staff Management Dashboard concern, not an onboarding concern** — an owner does not suspend or role-change staff during initial onboarding.

Separating owner-onboarding needs from later dashboard needs:

| Operation | Owner onboarding need? | Basis |
|---|---|---|
| `createStaffInvitation` | **Yes** | PRD3 §5 Step 7 ("Invite staff (optional)") |
| `revokeStaffInvitation` | **Yes, narrowly** | An owner who mis-typed an invitation during onboarding should be able to undo it before finishing — small scope, same screen |
| List pending invitations (for the current Business) | **Yes** | Needed to render "who have I already invited" on the invite/review step — **repository-layer gap** (§0/§4): no list query exists yet, this is new transport work, not merely a new callable wrapping an existing query |
| List Staff/memberships (for the current Business) | **Yes, narrowly** | Needed for the review step to show "N staff invited/active" — same repository-layer gap |
| `acceptStaffInvitation` | **No — separate invitee journey** (§12) | Not something the *inviting owner* ever calls |
| SUSPEND/REACTIVATE/REMOVE/role-change | **No — later Staff Management Dashboard** | Not part of PRD3 §5's onboarding step; `ENG-P2-003-DESIGN-001` itself scoped these to management, not onboarding |

**Architectural ownership — evaluating the three options the task brief names:**

- **(A) `ENG-P3-002` prerequisite sub-package.** Would treat Staff transport as a blocking precondition, mirroring how `ENG-P3-001` was a precondition for `ENG-P3-002`/`003`.
- **(B) `ENG-P3-002` backend sub-package.** Would build Staff callable/list-query transport as one of `ENG-P3-002`'s own internal sub-packages, alongside the Business read transport (§9) and Commerce Knowledge read transport (§13).
- **(C) A separate `ENG-P2-003`-owned transport package** (e.g. `ENG-P2-003F`), closing the callable-exposure gap `ENG-P2-003-DESIGN-001` itself flagged as a future package's responsibility, independent of `ENG-P3-002`'s own timeline.

**ENGINEERING DESIGN — recommend (B).** Reasoning: the missing pieces (a `staff.manage`-gated INVITE/REVOKE callable pair, plus the new list-query repository methods) are small, already fully speced by `ENG-P2-003-DESIGN-001`'s own command layer, and exist for exactly one reason right now — onboarding needs them. Splitting them into a separate `ENG-P2-003F` package (Option C) would add sequencing overhead (a second Founder authorization, a second PR, a second review cycle) for functionality with a single current consumer. Option A (prerequisite package) is unnecessary ceremony for the same reason `ENG-P3-001-DESIGN-001` §18 found no direct schema/transport collision between `ENG-P3-002`/`003` — this gap is small enough to fold into `ENG-P3-002`'s own backend sub-package rather than gating it behind a separate package. If a second, independent consumer of Staff transport emerges later (e.g. a dedicated Staff Management Dashboard), that consumer can extend the same transport module without re-doing this work — nothing about Option B forecloses that.

## 12. Staff Invite/Acceptance Journey Boundary

**ENGINEERING DESIGN.** Invitation **creation** (owner-side) and invitation **acceptance** (invitee-side) are architecturally distinct journeys that happen to share one data record (`BusinessMembershipInvitation`):

- **Owner onboarding journey:** authenticated owner, already inside the Business-context shell (§10), calls `createStaffInvitation` with a role and a delivery target (phone/email — `InvitationDeliveryTarget`, EXISTING IMPLEMENTATION). The owner's onboarding does **not** wait for the invitee to accept — PRD3 §5 Step 7's own "(optional)" wording, plus `ENG-P2-003-DESIGN-001`'s FD-3-STAFF (three-part acceptance authority: the accepting identity's own verified `AuthenticationReference` must match the invitation's delivery target) confirm acceptance is inherently a separate, later, invitee-driven act the owner cannot force synchronously.
- **Invitee journey (separate, later):** the invited person authenticates (or registers, if new) independently, then calls `acceptStaffInvitation` — a wholly separate flow, likely reached via a notification/link rather than through the owner's onboarding wizard at all. This document does not design that journey's UI in detail (out of `ENG-P3-002`'s onboarding-wizard scope proper), only confirms it is architecturally separate and already has full backend support.

**How unfinished invitations affect onboarding completion:** **ENGINEERING DESIGN — they do not block it.** An owner may submit the Business for verification (§7) with zero, one, or several `invited`-status (not yet `accepted`) invitations outstanding. Requiring staff acceptance before submission would contradict PRD3 §5's own "(optional)" labeling and would make the owner's onboarding completion depend on a third party's independent action — a dependency no governing source imposes. Invitation records simply continue to exist, independently, past the moment the owner finishes onboarding.

## 13. Commerce Knowledge Read Transport

**EXISTING IMPLEMENTATION gap, confirmed directly:** `ENG-P3-001A`/`B`/`C` built and seeded a complete Commerce Knowledge domain (`functions/src/domains/commerceKnowledge/`) with zero callable or HTTPS exposure. `ENG-P3-001-DESIGN-001` §18 (its own consumer-contract section for `ENG-P3-002`, F3-corrected) anticipated exactly this gap without designing the transport itself.

Minimum UI query operations, evaluated against the task brief's list:

| Operation | Required? | Basis |
|---|---|---|
| List Business Categories | **Yes** | `primaryCategoryId` is a required Business field; the classification step must render selectable options |
| List Business Types under a selected Category | **Yes, conditionally** | `businessTypeId` is optional and only meaningful once a Category is chosen; seed data currently only populates Business Types under Salon — the UI must handle "zero Business Types available for this Category" gracefully, not treat it as an error |
| List Industries | **No, not directly** | Industries are the parent level of Business Categories (`ENG-P3-001-DESIGN-001` §6) but PRD3 §7's onboarding UI works at the Business-Category level, not Industry — Industries are not a field on `Business` at all (`business.ts` has no `industryId`). Listing Industries would expose a taxonomy level the UI doesn't need to render or write. |
| Retrieve display translation with EN fallback | **Yes** | `ENG-P3-001-DESIGN-001` §11's EN-required/FR-optional localization contract must be honored by whatever renders a category/type label |

**Search technology:** not needed. `DEC-TECH-008` (search implementation) is confirmed `OPEN_ENGINEERING`, non-blocking (`ENG-P3-001-DESIGN-001` §17) — onboarding's Category/Type lists are small, platform-governed, enumerable sets (14 Categories, a handful of Types), not a search problem.

**ENGINEERING DESIGN — transport shape:** a small set of bounded **read-only HTTPS/callable endpoints** (e.g. conceptually `listBusinessCategories`, `listBusinessTypesForCategory`), consistent with the existing server-mediated architecture (§22) — not direct Firestore reads, and not a general-purpose Knowledge Studio query API. These endpoints return the bounded DTO shape §14 defines, never raw `KnowledgeNode`/`KnowledgeTranslation` documents.

## 14. DTO/Read Models

**ENGINEERING DESIGN.** Two DTO families, both deliberately minimal:

**Commerce Knowledge option DTO** (for Category/Type selection lists):

| Field | Included? | Reasoning |
|---|---|---|
| `id` | Yes | Required to submit the selection back to `createBusiness`/`updateBusinessProfile` |
| `displayLabel` | Yes | The EN-fallback-resolved translation text (§17) — resolved server-side, not left to the client to reconstruct from raw translation records |
| `nodeType` | Yes | Distinguishes `business_category` from `business_type` when both are fetched together, and lets the UI validate it received the type of node it asked for |
| `parentId` | Yes, for Business Types only | Needed to confirm a selected Type belongs to the selected Category — mirrors the same consistency check `businessClassificationValidation.ts` already performs server-side (`ENG-P3-001C`) |
| `schemaVersion`, `status` (lifecycle), replacement/audit metadata, editorial workflow state | **No** | Internal governance/editorial fields (`ENG-P3-001-DESIGN-001` §9.4's canonical lifecycle) — the UI never needs to know whether a node is `active` vs. some other internal state; the read endpoint filters to `active` nodes server-side before the DTO is even constructed, so the field would be redundant noise, not a UI decision input |

**Business/Branch onboarding-hydration DTO:**

| Field | Included? | Reasoning |
|---|---|---|
| `businessId`, `businessCode`, `displayName`, `status`, `primaryCategoryId`, `businessTypeId`, `countryCode`, `city`, `contactPhone`, `contactEmail` | Yes | Directly needed to pre-fill/resume the wizard and render the review step |
| Default `branchId`, Branch `displayName`/`countryCode`/`city`/`address` | Yes | Same reason, Branch-profile step |
| `ownerUserId` | **No, not exposed as such to the client beyond confirming "this is your Business"** | The server already knows this from the authenticated actor; echoing it back is unnecessary and would be the kind of "raw Firestore document" exposure §9/Phase G's caution warns against |
| `subscriptionId`, `schemaVersion`, `createdAt`/`updatedAt` timestamps | **No, unless a genuine UI need emerges** | Not needed by any onboarding screen this document identifies; omit until a real consumer need is shown, consistent with "do not expose raw Firestore documents merely for convenience" |

Localization fallback (EN-required, FR-optional) happens in **one coherent layer — server-side, inside the Commerce Knowledge read endpoint** (not duplicated client-side), so every consumer (onboarding today, a future Staff dashboard or Knowledge Studio tomorrow) gets identically-resolved labels rather than reimplementing fallback logic per screen.

## 15. Frontend Application Shell

**EXISTING IMPLEMENTATION baseline, confirmed directly:** `apps/web/src/App.tsx` has exactly one real route (`/`, a placeholder) plus two dev-only routes. `react-router-dom`, `@tanstack/react-query`, `zod`, `react-hook-form` are installed but nowhere wired to a `QueryClientProvider`, a router-level auth guard, or any Business route.

**ENGINEERING DESIGN — required frontend foundation:**

| Piece | Belongs to `ENG-P3-002`? | Notes |
|---|---|---|
| Authenticated route boundary (redirect unauthenticated users to sign-in) | **Yes**, but as a reusable platform primitive | Wraps `App.tsx`'s router; consumes the already-built `src/authentication/` session state, does not reinvent it |
| `QueryClientProvider` wiring | **Yes**, platform-level | A one-time root-level addition; every domain (onboarding today, others later) shares one `QueryClient` instance |
| Business onboarding route(s) | **Yes**, `ENG-P3-002`-specific | `/onboarding/new`, `/onboarding/:businessId/...` per §10 |
| `BusinessContextProvider`/hook | **Yes**, but designed as a reusable platform primitive even though `ENG-P3-002` is its first consumer | Future Staff dashboard/Reward Program UI will need the same context — building it onboarding-specific now would create rework later |
| Business app/dashboard shell (post-submission landing) | **Partially** — a minimal "you're in, here's your status" shell belongs to `ENG-P3-002`; the full PRD3 §13 dashboard (widgets, reporting) does not | The task brief's Phase M explicitly asks which pieces belong to `ENG-P3-002` vs. a reusable shell — the dividing line here is: enough shell to prove the owner "arrived," not the full dashboard experience |
| Role-aware navigation foundation | **No, deferred** | With no Reward Program/purchase/verification UI to navigate to yet, a full role-aware nav has nothing real to link to; a stub is premature |
| Error/loading state primitives | **Yes**, platform-level | Standard React Query loading/error boundary patterns, reusable beyond onboarding |

## 16. Form Architecture

**EXISTING IMPLEMENTATION confirmed:** `react-hook-form` (`^7.81.0`), `@hookform/resolvers` (`^5.4.0`), `zod` (`^4.4.3`) are all installed dependencies (`apps/web/package.json`), unused outside auth today.

**ENGINEERING DESIGN — conceptual forms, one per onboarding concern, not one giant form:**

| Form | Fields (conceptual) | Validation notes |
|---|---|---|
| Business details | `displayName`, `primaryCategoryId`, `businessTypeId?`, `countryCode`, `city`, `contactPhone`, `contactEmail?` | Per-step Zod schema mirroring `createBusiness`'s server-side required-field set (never inventing client-only requirements the server doesn't also enforce — server remains authoritative) |
| Branch details | `displayName`, `countryCode`, `city`, `address?` | Same pattern against `updateBusinessBranchProfile` |
| Category/Type selection | `primaryCategoryId`, `businessTypeId?` | Options sourced from §13's read transport, not hardcoded; Type list re-fetches when Category changes |
| Staff invitation (optional) | `role`, delivery target (phone or email) | Reuses `InvitationRole`/`InvitationDeliveryTarget`'s existing validation shape conceptually, not a new client-invented rule |
| Review/submission | No new fields — read-only summary + a submit action | Calls `submitBusinessForVerification` |

- **Per-step validation:** each step's Zod schema validates before advancing, but the **server's own validation remains authoritative** — client validation is a UX convenience, never a substitute for the server rejecting an invalid `createBusiness`/`updateBusinessProfile` call.
- **Server validation:** every step's data is only durably saved when the corresponding callable succeeds; a client-side "next" button never silently accepts data the server would reject.
- **Resume behavior:** per §8, resuming re-hydrates each step's form defaults from the server-derived Business/Branch read (§9), not from any client-persisted draft.
- **Optimistic vs. confirmed transitions:** **ENGINEERING DESIGN — confirmed-only.** Given onboarding is a one-time, low-frequency flow with real backend side effects (`businessCode` reservation, Firestore writes), optimistic UI (advancing before the server confirms) is not recommended — each step waits for its callable's success before advancing, trading a small amount of perceived latency for never showing state the server hasn't actually accepted.
- **Error handling:** see §23.

## 17. Localization

**EXISTING IMPLEMENTATION baseline:** `apps/web/src/i18n/` (`I18N-001`, `Complete`/merged) provides centralized, namespaced, EN-required/FR-optional i18next resources already consumed by `src/authentication/`.

**ENGINEERING DESIGN — onboarding's localization surface:**

| Concern | Requirement |
|---|---|
| Field labels, help text, step titles | EN required, FR translated — new i18n namespace/keys added under the existing `I18N-001` pattern, not a new mechanism |
| Validation messages | Same pattern; messages map onto the closed error-category taxonomy (§23), not ad hoc strings per field |
| Onboarding guidance copy (PRD3 §2's "explain the value," §20's "a purchase is not yet loyalty" education) | EN/FR, but **content**, not architecture — this document does not draft final copy |
| Lifecycle/status copy (post-submission "Submitted"/"Pending verification" language, §18) | EN/FR |
| Staff invitation UI copy | EN/FR |
| Commerce Knowledge taxonomy labels | **EN fallback when FR is unavailable** — `ENG-P3-001B`'s seed loader confirmed **no French translation is seeded anywhere** (`apps/web/src/i18n/locales/fr.ts` checked directly — Commerce Knowledge labels are not even in that file's domain; taxonomy translations live in `knowledgeTranslations`, which is EN-only today). The read endpoint (§13) must apply this fallback server-side; this document does not invent French taxonomy content — flagged, not filled, per instruction. |

## 18. Business Lifecycle

Mapping onboarding actions to the existing, unmodified lifecycle (`businessStatus.ts`):

| Onboarding action | Lifecycle effect |
|---|---|
| `createBusiness` succeeds | Business created at `draft` (EXISTING IMPLEMENTATION) |
| Owner completes profile/Branch/classification | No status change — still `draft` until submission |
| Owner optionally invites Staff | No status change |
| Owner reviews and calls `submitBusinessForVerification` | `draft → pending_verification` (EXISTING IMPLEMENTATION, the only valid forward transition) |
| `pending_verification → trial` | **Explicitly ungoverned — not designed here** (§7) |

**Post-submission frontend copy — ENGINEERING DESIGN, simple customer language, not backend terminology:** recommend "Submitted — pending verification" or "Your business is under review" over exposing the literal `pending_verification` enum value to the owner. Exact final copy is a content/localization detail (§17), not frozen here; the design constraint is only: never surface raw backend status strings verbatim in the UI, and never claim a state (like "active"/"operational") the Business has not actually reached.

## 19. Subscription Boundary

**FOUNDER DECISION area, evaluated:** PRD3 §5 Step 4 ("Select subscription plan") and §9 (plan catalogue: Starter/Growth/Professional) describe a real product surface, but `DEC-SUB-008` (plan catalogue: BIF prices, billing intervals, grace, proration) is `OPEN_FOUNDER`, Phase-10-gated, and **no plan/entitlement schema exists anywhere in the codebase** — no `subscriptionPlans` collection, no `Business.subscriptionId` write path (the field exists on the model but nothing ever sets it), no billing provider integration.

Evaluating the three options the task brief names:

- **(a) Remove subscription-plan selection from Capability-3 onboarding entirely.**
- **(b) Show it as a non-functional future placeholder** (e.g., a disabled "coming soon" step).
- **(c) Defer it entirely, with no UI trace at all.**

**ENGINEERING DESIGN — recommend (a)/(c) combined: do not implement or display subscription-plan selection in `ENG-P3-002`.** Building even a "placeholder" step (option b) risks two failure modes this document should avoid: (1) implicitly implying plan options ("Starter/Growth/Professional") that are not Founder-approved commercial terms (`DEC-SUB-008` is explicitly unresolved on exact plan names/prices), and (2) creating a UI element with no backend to call, which either does nothing (confusing) or requires stub logic that later needs to be un-stubbed. `DEC-CKS-002`'s precedent (Knowledge Studio "not a prerequisite for launch," approved without needing a placeholder UI) supports the same treatment here: the capability simply does not include this step yet. **This is not "silently pulling subscription into scope to preserve the literal PRD3 step count" — it is the opposite: leaving it out, as instructed.**

**Recommended reconciliation of the historical PRD flow:** PRD3 §5 Step 4 is disposed as **DEFER TO LATER CAPABILITY** (§5's table), consistent with the Programme's own Phase 10 gate. No wording change to PRD3 itself is proposed; if a programme-level document (not PRD3) needs a clarifying note that onboarding's MVP boundary excludes subscription selection, that is a narrow, optional documentation item, not a PRD rewrite (§28).

## 20. Reward Program Boundary

**GOVERNED REQUIREMENT, confirmed:** Reward Program CRUD/lifecycle is `ENG-P4-001`/`002`, Phase 4, `Blocked` — no `rewardPrograms`/`rewardProgramVersions` collection, model, callable, or UI exists anywhere. PRD3 §5 Step 6 ("Create first Reward Program") and §14 ("Every business must create at least one active Reward Program before recording purchases") are both real, governed *eventual* requirements — but not implementable inside `ENG-P3-002` without building Phase 4's schema from scratch, which this task explicitly forbids.

**ENGINEERING DESIGN — Capability-3 boundary:** `ENG-P3-002` completes Business onboarding **without** Reward Program creation. PRD3's own BR-029/FR-BO-012 ("purchase recording prevented without an active Reward Program") remain true and enforced — but they are enforced at the *purchase-recording* layer (Phase 5, not yet built), not by blocking onboarding completion itself. A Business may legitimately finish `ENG-P3-002`'s onboarding (reach `pending_verification`) with zero Reward Programs; it simply cannot yet record purchases, which is already true for an entirely separate reason (Phase 5 doesn't exist yet either). Later, Capability 4 may extend the post-onboarding Business-context shell (§15) with a "create your first Reward Program" prompt — that extension point is left open architecturally (the Business-context shell is a reusable primitive, §15) but not designed here.

## 21. Authorization Matrix

Every identifier below is verified to actually exist in the read catalogues (`ordinaryPermissionCatalogue.ts`, `sensitivePermissionCatalogue.ts`) — none is invented by this document:

| Operation | Authority | Catalogue | Verified |
|---|---|---|---|
| Create Business | Bootstrap authority (authenticated, eligible Customer Identity — `active`/`dormant`; not a permission-catalogue entry at all, since no Business/membership exists yet to evaluate a permission against) | N/A — `authenticatedBusinessActor.ts`/`businessBootstrapEndpointService.ts` | EXISTING IMPLEMENTATION, confirmed directly |
| Update Business profile | `business.updateProfile` | Ordinary, Owner-only default | Confirmed present, `ordinaryPermissionCatalogue.ts` |
| Update Branch profile | `businessBranch.updateProfile` | Ordinary, Owner-only default | Confirmed present |
| Submit for verification | `business.submitForVerification` | Ordinary | Confirmed present |
| Invite Staff | `staff.manage` | Sensitive | Confirmed present, `sensitivePermissionCatalogue.ts` |
| Revoke a Staff invitation | `staff.manage` | Sensitive | Same permission governs both INVITE and REVOKE per `revokeStaffInvitationService.ts` |
| Read Business context (own Business) | **No existing catalogue entry — ENGINEERING DESIGN, not invented here as a new permission** | See below | Gap, not filled |
| Read Commerce Knowledge (Category/Type lists) | **No existing catalogue entry — read is platform-global, not Business-scoped** | See below | Gap, not filled |

**Read-authority gap, disposed as ENGINEERING DESIGN rather than a new permission-catalogue entry:** both catalogues govern *mutating* Business-scoped operations tied to a role within a specific Business. Reading one's own Business/Branch (§9) is not naturally a "permission" in that sense — it is closer to "any authenticated actor may read data about a Business they own or are a member of," which the existing `authenticatedBusinessActor`/membership-resolution mechanism (not the permission catalogues) already answers for writes and can answer identically for reads, by re-deriving the caller's relationship to the requested `businessId` server-side (owner match, or an active membership record) before returning any data — never by trusting a client-supplied ID alone (§25). Reading Commerce Knowledge is simpler still: it is **platform-global, not Business-scoped** — any authenticated actor (or arguably any caller at all, though this document recommends requiring authentication at minimum, §22) may read the canonical taxonomy, since it carries no business-specific or customer-specific data. Neither of these needs a new entry in `ordinaryPermissionCatalogue.ts`/`sensitivePermissionCatalogue.ts` — those catalogues are reserved for mutating within-Business authority, not general read-eligibility. This is recorded as an **Engineering Decision** (§29), not silently assumed.

## 22. Transport/Rules Architecture

**GOVERNED REQUIREMENT, confirmed directly:** `firestore.rules` is deny-by-default with a trailing catchall denying everything not explicitly listed. Every currently-implemented Business/Staff mutation goes through a server-mediated callable (Web → `onCall` → domain/repository), never direct Firestore access.

**ENGINEERING DESIGN — `ENG-P3-002` continues this architecture unchanged.** The new read transport (§9, §13) is designed as additional callable/HTTPS server endpoints, not as new Rules granting direct client Firestore reads on `businesses`/`businessBranches`/`knowledgeNodes`/etc. This is consistent with every prior Capability-2/3 package's own architecture and avoids introducing a second access-control mechanism (Rules-based) alongside the existing evaluator-based one (`authorizeAndExecute`) for the same data.

**Future option, recorded not decided:** `ENG-P3-001-DESIGN-001` itself does not propose direct Commerce Knowledge Firestore reads, and neither does this document — but since Commerce Knowledge is platform-global, read-only, and carries no tenant-sensitive data, it is *plausible* that a future package could safely grant `allow read: if request.auth != null` (or even unauthenticated read) directly on `knowledgeNodes`/`knowledgeTranslations` via Rules, bypassing a callable round-trip for a pure, cacheable, non-sensitive read. This document records this only as an **option for future consideration**, not an implementation decision — actually doing it would require its own Founder/Engineering review of the Rules change, which is explicitly out of scope for `ENG-P3-002` (constraint: "No Rules changes").

## 23. Error Handling

**ENGINEERING DESIGN, mapping onto the existing closed 14-category taxonomy** (`errorCategories.ts`, confirmed directly — `AUTH_REQUIRED`, `AUTH_FORBIDDEN`, `ACCOUNT_SUSPENDED`, `BUSINESS_INACTIVE`, `SUBSCRIPTION_LIMIT_REACHED`, `INVALID_STATE_TRANSITION`, `PURCHASE_ALREADY_RESPONDED`, `REWARD_NOT_AVAILABLE`, `REWARD_ALREADY_REDEEMED`, `IDEMPOTENCY_CONFLICT`, `VALIDATION_FAILED`, `RESOURCE_NOT_FOUND`, `TEMPORARY_UNAVAILABLE`, `INTEGRATION_FAILED` — no 15th category is proposed):

| User-facing case | Maps to category | Frontend treatment |
|---|---|---|
| Business already exists / `businessCode` collision | `IDEMPOTENCY_CONFLICT` / `VALIDATION_FAILED` (depending on which the actual `createBusiness` failure path returns — this document does not redefine the mapping, only routes to it) | Simple retry/duplicate-name guidance, never the raw category string |
| Invalid Category/Type selection | `VALIDATION_FAILED` (per `ENG-P3-001C`'s classification-rejection error factories) | Inline field error |
| Session expired | `AUTH_REQUIRED` | Redirect to sign-in, preserving intent to resume (§8) |
| Insufficient permission | `AUTH_FORBIDDEN` | Generic "you don't have access" — never expose which specific permission id failed |
| Staff invitation invalid (expired/wrong target) | `VALIDATION_FAILED` / `RESOURCE_NOT_FOUND` | Distinct copy for the invitee journey (§12), not the owner's onboarding screen |
| Transient server issue | `TEMPORARY_UNAVAILABLE` | Retry affordance |
| Submission unavailable (e.g. Business not in `draft`) | `INVALID_STATE_TRANSITION` | "This step isn't available right now" — never the raw enum |

EN/FR copy for each case follows §17's localization mechanism; this document does not freeze final wording, only the mapping structure and the principle that raw backend taxonomy/category names are never shown to the owner.

## 24. React Query / Data Refresh

**ENGINEERING DESIGN, conceptual query keys — no implementation:**

| Query key (conceptual) | Invalidated by |
|---|---|
| `["business", "owned"]` (the owner's Business list, §9) | `createBusiness` success |
| `["business", businessId]` (a single Business's onboarding-hydration DTO) | `updateBusinessProfile`, `submitBusinessForVerification` success for that `businessId` |
| `["businessBranch", businessId]` | `updateBusinessBranchProfile` success |
| `["commerceKnowledge", "businessCategories"]` | Never (platform-global, effectively static within a session — long `staleTime` is appropriate, no mutation in this package invalidates it) |
| `["commerceKnowledge", "businessTypes", categoryId]` | Never, same reasoning, keyed per-Category |
| `["staffInvitations", businessId]` | `createStaffInvitation`/`revokeStaffInvitation` success for that `businessId` |
| `["staffMemberships", businessId]` | Rarely, during onboarding (only relevant once acceptance happens, §12) |

No parallel client-side cache is invented — React Query is the single cache layer, consistent with it already being an installed, if unused, dependency. Each mutation's `onSuccess` invalidates exactly the query keys its own write could have changed, never a broad "invalidate everything" pattern.

## 25. Security / Tenant Isolation

**GOVERNED REQUIREMENT, restated and confirmed against existing architecture, not newly invented:**

- **Authenticated principal → Customer Identity:** already resolved by `resolveAuthenticatedCredential`/`authenticatedBusinessActor.ts`, reused unmodified.
- **Business context:** a client-side convenience value (§10) — never independently authoritative.
- **Membership/permission:** every write already re-derives authority via `authorizeAndExecute`/`evaluatePermission.ts`; the new read transport (§9, §13) must follow the identical pattern — re-derive the caller's relationship to the requested `businessId` server-side on every read, never trust a client-supplied `businessId` as proof of access.
- **One Business cannot hydrate another Business's profile:** enforced by the same server-side re-derivation — the read endpoint's authorization check is not a rendering-layer nicety, it is the actual boundary, exactly as it already is for `updateBusinessProfile`.
- **Staff/member queries are Business-scoped:** the new list-query repository methods (§11) must take `businessId` as a parameter validated against the caller's actual membership/ownership, not merely as a filter applied after an unscoped read.
- **Commerce Knowledge remains global read-only canonical data:** no Business-scoping needed for Category/Type lists — but the read endpoint still requires authentication (§22) to avoid becoming an unauthenticated platform surface, per this document's own recommendation (not a hard requirement — flagged as an Engineering Decision, §29).
- **Client Business IDs never independently confer access:** stated once here as the governing principle threaded through §9/§10/§21/§22 above — not repeated per-section as a new rule each time, but binding throughout.

## 26. Preview / Manual QA Architecture

**ENGINEERING DESIGN — completion-evidence forecast, no deployment performed by this document:**

- **Automated:** frontend unit tests (forms, `BusinessContextProvider`, per-step validation); callable unit tests (new read/query endpoints, new Staff INVITE/REVOKE callables, following the existing `functions` unit-test precedent every prior package used); Firebase Emulator Suite integration tests (tenant-isolation — one Business cannot read another's data; the full create→profile→branch→classify→[invite]→review→submit chain against a real emulator, not mocks, matching `ENG-P2-003E`'s own precedent for cross-package integration proof); EN/FR rendering tests (both locales render every onboarding screen without missing-key fallback-to-key-name failures).
- **Hosted preview:** owner signs in (reusing the existing `AUTH-CORR-003` multi-provider flow) → creates a Business → completes Business/Branch profile → selects Category/Type → optionally invites Staff → reviews → submits → reaches the post-submission Business context and sees truthful `pending_verification` copy (§18).
- **Manual Founder QA:** the English journey; the French journed (all copy, no untranslated fallback visible where FR exists); validation-error presentation; refresh/resume mid-wizard (§8); cross-Business isolation (a second Founder-owned test Business cannot see the first's data); mobile/responsive usability (PRD3 §2's "work comfortably on a smartphone" design objective).

No deployment is performed by this design document itself — this section forecasts what a future implementation package's own QA plan should include, per the task's explicit "do not deploy during this design task" instruction.

## 27. ENG-P3-003 Boundary

**GOVERNED REQUIREMENT, confirmed directly (`DEC-CKS-002`, APPROVED):** Knowledge Studio (`ENG-P3-003`) is not a prerequisite for `ENG-P3-002` or for launch. The shared surface between the two packages is narrow and one-directional: **the Commerce Knowledge read transport this document specifies (§13) is a consumer-side surface** (list Categories, list Types under a Category, resolve a display translation) that `ENG-P3-002`'s onboarding UI needs regardless of whether Studio ever exists — initial seed content is repository-controlled per `DEC-CKS-002`'s own disposition, with no editorial UI required.

**ENGINEERING DESIGN — do not broaden `ENG-P3-002`'s read transport for Studio's future benefit.** Studio will eventually need very different operations (create/edit/draft/review/publish taxonomy nodes, manage translations across lifecycle states, search across all nodes regardless of `active` status) that are structurally an editorial/write surface, not a read surface. Designing `ENG-P3-002`'s transport broadly "in case Studio needs it later" would risk exposing internal lifecycle/editorial fields the onboarding UI itself has no business seeing (§14's DTO already excludes them for exactly this reason) and would blur a boundary `ENG-P3-001-DESIGN-001` §19 deliberately kept separate ("this document does not design Studio's screens, roles, or review queue mechanics"). If Studio later needs its own read endpoint with a richer shape, it should define its own, consuming the same underlying repositories (`knowledgeNodeRepository.ts` etc.) directly rather than being forced through `ENG-P3-002`'s deliberately narrow onboarding-shaped DTO.

## 28. Founder Decisions

**Status update (2026-08-21, v2.0): `FD-P3-002-1` through `FD-P3-002-4` are now DISPOSITIONED/APPROVED — recorded formally in §36. `FD-P3-002-5` (Terms acceptance) now has a full architecture design — §37 — resolving the scheduling/mechanism question this section originally could only surface. The table below is left as originally authored (v1.0), for an accurate historical record of what this document recommended before Founder review; §36/§37 are the disposition of record.**

Evaluated against the task brief's four named candidate areas, plus one genuinely new item surfaced during PRD3 reconciliation (§5):

| # | Question | Options | Recommendation | Impact | Deferrable? |
|---|---|---|---|---|---|
| FD-P3-002-1 | Is onboarding completion at `pending_verification` (short of PRD3's literal "operational," §5 Step 9 / §7) the correct MVP boundary, given the ungoverned `pending_verification → trial` mechanism? | (a) Confirm `pending_verification` as the MVP completion boundary; (b) require the (currently nonexistent) verification mechanism be designed and built first, blocking `ENG-P3-002` entirely | **(a).** No governing source requires more, and the working design principle already anticipated exactly this outcome — this is a confirmation, not a new fork the Founder must invent an answer to. | Confirms the MVP scope this document assumes throughout §6–§7. | Yes — the document's own analysis already supports (a); the Founder may simply ratify it rather than deliberate it fresh. |
| FD-P3-002-2 | Persisted vs. derived/local onboarding progress (§8) | (a) Option A/B combination this document recommends (no new persisted field); (b) Option C, add `onboardingStep`/`onboardingCompleted` | **(a).** §8's full reasoning applies; the working design principles already lean this way. | Determines whether `ENG-P3-002A`'s backend sub-package needs any schema change at all (it would not, under (a)). | Yes — same reasoning as FD-P3-002-1. |
| FD-P3-002-3 | Is Staff invitation optional or mandatory during onboarding? | (a) Optional, matching PRD3 §5 Step 7's own wording; (b) mandatory | **(a).** PRD3 itself already says "(optional)" — this is not a genuine fork, it is confirming the PRD's own existing word choice hasn't been silently overridden. | Confirms §12's "unfinished invitations do not block submission" design. | Yes. |
| FD-P3-002-4 | Treatment of the historically-listed but now-deferred subscription-plan-selection and first-Reward-Program-creation steps (PRD3 §5 Steps 4/6) | (a) Leave both entirely out of `ENG-P3-002` (this document's recommendation, §19–§20); (b) build non-functional placeholders; (c) pull either capability forward into `ENG-P3-002` | **(a).** Building (b) risks implying unapproved commercial terms; (c) would require inventing schema this task explicitly forbids. | Confirms `ENG-P3-002`'s scope boundary directly. | Yes. |
| FD-P3-002-5 *(new, surfaced by §5's reconciliation, not pre-listed in the task brief)* | PRD3 §5 Step 5 ("Accept Business Terms") has no current Terms-of-Service text, versioning mechanism, or acceptance-record schema anywhere in the codebase or governing docs. Should `ENG-P3-002` include a Terms-acceptance step? | (a) Include a minimal Terms-acceptance checkbox/record as part of `ENG-P3-002`, with actual Terms text/versioning to be supplied separately; (b) defer Terms acceptance entirely to a later package, alongside subscription (since Terms are historically bundled with commercial signup in PRD3's own step order); (c) treat it as a legal/compliance question outside Engineering's authority to schedule at all | **No recommendation offered — this is a genuine, previously-unidentified gap this document surfaces rather than resolves.** Unlike FD-P3-002-1–4, no governing source (design principle, PRD3 elsewhere, decision register) already answers this one. | Determines whether `ENG-P3-002`'s form architecture (§16) needs a sixth form/step, and whether a Terms-acceptance-record schema is a genuine new backend need this design has not scoped. | **Not obviously deferrable** — if Terms acceptance is legally required before a Business may operate, deferring it silently could be a compliance gap, not merely a product-sequencing choice; but this document is not positioned to make that legal judgment, hence surfacing rather than recommending. |

No other Founder decision is manufactured — every other question the task brief poses is already answered by an existing governing source, cited inline throughout §5–§27.

## 29. Engineering Decisions

Documented explicitly, per instruction not to silently decide new transport/security architecture without recording it:

| # | Decision | Basis |
|---|---|---|
| ED-P3-002-1 | No new Firestore Rules; all new reads (§9, §13) go through server-mediated callables/HTTPS endpoints, continuing the existing deny-by-default architecture. | §22 |
| ED-P3-002-2 | Business/Staff-list reads are not modeled as new `ordinaryPermissionCatalogue.ts`/`sensitivePermissionCatalogue.ts` entries; authority is re-derived via the existing owner/membership resolution mechanism instead, since the catalogues govern mutating within-Business authority, not general read-eligibility. | §21 |
| ED-P3-002-3 | Commerce Knowledge read endpoints require authentication (not left fully public), even though the data itself is not tenant-sensitive, to avoid introducing the platform's first unauthenticated data surface without a specific product reason to do so. | §22, §25 |
| ED-P3-002-4 | Staff transport (INVITE/REVOKE callables plus new list-query repository methods) is built as part of `ENG-P3-002`'s own backend sub-package (Option B), not a separate `ENG-P2-003F` package or an `ENG-P3-002` prerequisite package. | §11 |
| ED-P3-002-5 | `BusinessContextProvider` is designed as a reusable platform primitive even though `ENG-P3-002` is its first and only current consumer, to avoid Reward-Program/Staff-dashboard rework later. | §15 |
| ED-P3-002-6 | EN/FR fallback for Commerce Knowledge translation resolution happens server-side, inside the read endpoint, as a single coherent layer — never duplicated client-side. | §14, §17 |
| ED-P3-002-7 | Confirmed-only (non-optimistic) step transitions in the onboarding wizard, given real backend side effects (`businessCode` reservation) and low flow frequency. | §16 |

## 30. Implementation Decomposition

Evaluating the task brief's suggested `A`/`B`/`C` split against what this document actually found, rather than adopting it merely for symmetry with `ENG-P3-001`:

The suggested split is **confirmed appropriate**, with one adjustment: the missing Staff/Commerce-Knowledge **read transport** is real, previously-undesigned backend work (§9, §11, §13) that must exist before any frontend can be built against it — so it is **not** optional scaffolding, it is a genuine `ENG-P3-002A` (backend) responsibility, sequenced strictly before `ENG-P3-002B` (frontend).

| Package | Responsibility | Inputs | Outputs | Dependencies | Exclusions | Test strategy |
|---|---|---|---|---|---|---|
| `ENG-P3-002A` | Backend read/query transport: Business-hydration read endpoints (§9), Staff INVITE/REVOKE callables + new list-query repository methods (§11), Commerce Knowledge Category/Type read endpoints with EN/FR-fallback resolution (§13–§14) | This document; `ENG-P2-002`/`003`/`ENG-P3-001` (all `Complete`) | New callables/HTTPS endpoints, new repository query methods, DTO types, unit + emulator tests | None beyond already-`Complete` packages | No frontend code; no Rules change; no new permission-catalogue entry | `functions` unit tests per endpoint; Firebase Emulator Suite tenant-isolation tests; no UI test surface yet |
| `ENG-P3-002B` | Frontend: `BusinessContextProvider`, authenticated route boundary, `QueryClientProvider` wiring, onboarding wizard (Business/Branch/Category-Type/Staff-invite/review steps), post-submission Business-context shell, EN/FR copy | `ENG-P3-002A`'s transport (real, not mocked, once available) | New `apps/web/src/` onboarding/business-context modules, component + hook unit tests | `ENG-P3-002A` complete | No backend changes; no subscription/Reward-Program UI (§19–§20) | Frontend unit tests (Vitest/Testing Library, matching `apps/web`'s existing convention); EN/FR rendering tests |
| `ENG-P3-002C` | Integration, hosted preview & manual QA closure | `ENG-P3-002A` + `ENG-P3-002B` merged | Full end-to-end emulator integration test (create→...→submit chain), hosted-preview validation, manual Founder QA sign-off, implementation report | `ENG-P3-002A`/`B` complete | No deployment beyond the existing staging pattern; no new scope introduced at this stage | Full-chain emulator integration test; hosted-preview manual walkthrough (§26) |

If the Founder later decides Staff transport should instead be a separate `ENG-P2-003F` package (Option C, §11, rejected here but not foreclosed), only `ENG-P3-002A`'s scope shrinks — `ENG-P3-002B`/`C` are unaffected either way.

## 31. Dependency Graph

```
ENG-P2-002 (Complete) ──┐
ENG-P2-003 (Complete) ──┼──► ENG-P3-002A (backend read/query transport)
ENG-P2-004 (Complete) ──┤          │
ENG-P3-001 (Complete) ──┘          ▼
                          ENG-P3-002B (frontend onboarding shell + wizard)
                                    │
                                    ▼
                          ENG-P3-002C (integration, hosted preview, manual QA)
                                    │
                                    ▼
                     Capability 3 status re-assessed (NOT auto-closed by this document)
                                    │
                     ┌──────────────┴──────────────┐
                     ▼                              ▼
        ENG-P3-003 (Knowledge Studio,       ENG-P4-001/002 (Reward Programs,
        not launch-blocking, DEC-CKS-002)   Phase 4, separately gated)
```

No cycle exists; `ENG-P3-003` and Phase 4 both remain independently sequenceable after `ENG-P3-002`, consistent with `ENG-P3-001-DESIGN-001` §18's own finding of "no direct schema/permission/transport collision" between `ENG-P3-002` and `ENG-P3-003`.

## 32. Definition of Ready

Before `ENG-P3-002A` may be authorized as an implementation package:

1. ~~This design document is Founder-reviewed; §28's Founder Decisions (at minimum FD-P3-002-1–4) are dispositioned, and FD-P3-002-5 (Terms acceptance) has at least a scheduling answer even if the legal content itself is deferred.~~ **Satisfied (2026-08-21, v2.0).** `FD-P3-002-1`–`4` are APPROVED (§36). `FD-P3-002-5` now has a complete mechanism/timing/versioning architecture (§37) — the only remaining open item is `DEC-LEGAL-002` (the Terms *content* itself: reward obligations, dispute language, liability), which is a legal-content decision this document was never positioned to make and does not block `ENG-P3-002A`'s schema/transport work (§37.5's externally-referenced `termsDocumentId` design absorbs that dependency cleanly — see §37.9).
2. No new architecture surfaces during Founder review that this document did not anticipate (if one does, this document is revised, not silently bypassed). **Confirmed — see §41's consistency sweep; no undisclosed new surface found.**
3. `ENG-P3-001`'s explicit content deferrals (additional Business Types, Reward Program Categories, French glossary) are reconfirmed non-blocking for `ENG-P3-002A`'s narrower Category/Type-list read transport — true today per `ENG-P3-001-DESIGN-001` §26/CDR-001, re-verified at authorization time. **Reconfirmed 2026-08-21 — unchanged.**
4. A fresh, separate Founder implementation authorization is issued — this document authorizes nothing. **Still the only remaining gate — a process/authorization step, not an architecture/governance blocker.**

**`ENG-P3-002A` is therefore architecturally ready but not authorized**, matching `ENG-P3-001-DESIGN-001`'s own precedent language (§26 of that document) at the analogous point in its lifecycle.

## 33. Acceptance Matrix

| # | Criterion | Status per this document |
|---|---|---|
| 1 | PRD3 §5's nine historical steps individually classified and reconciled | PASS — §5 |
| 2 | Capability-3 customer outcome precisely defined, REQUIRED/OPTIONAL/DEFERRED/OUT-OF-SCOPE assessed | PASS — §6 |
| 3 | Onboarding completion boundary distinguished from verification and activation | PASS — §7 |
| 4 | Onboarding progress model evaluated against all named risk factors; no new persisted schema proposed | PASS — §8 |
| 5 | Minimum Business read/query transport defined | PASS — §9 |
| 6 | Business context model (multi-Business, `currentBusinessId` authority, refresh) designed | PASS — §10 |
| 7 | Staff transport scoped to onboarding needs, architectural ownership recommended | PASS — §11 |
| 8 | Invite/acceptance journey boundary defined | PASS — §12 |
| 9 | Commerce Knowledge read transport scoped, search technology confirmed unnecessary | PASS — §13 |
| 10 | DTO shapes defined, internal/editorial fields excluded | PASS — §14 |
| 11 | Frontend shell pieces attributed to `ENG-P3-002` vs. reusable platform | PASS — §15 |
| 12 | Form architecture defined per step, server-authoritative validation confirmed | PASS — §16 |
| 13 | EN/FR localization requirements defined, no French taxonomy content invented | PASS — §17 |
| 14 | Lifecycle mapping done, `pending_verification → trial` explicitly not designed | PASS — §18 |
| 15 | Subscription boundary reconciled, no plan catalogue invented | PASS — §19 |
| 16 | Reward Program boundary reconciled, no schema invented | PASS — §20 |
| 17 | Authorization matrix verified against actual catalogue contents | PASS — §21 |
| 18 | Transport/Rules architecture confirmed consistent with existing server-mediated pattern | PASS — §22 |
| 19 | Frontend error model mapped onto the existing closed taxonomy | PASS — §23 |
| 20 | React Query keys/invalidation conceptually defined | PASS — §24 |
| 21 | Security/tenant-isolation model fully threaded through | PASS — §25 |
| 22 | Preview/QA architecture forecast, no deployment performed | PASS — §26 |
| 23 | `ENG-P3-003` boundary confirmed non-blocking, transport not over-broadened | PASS — §27 |
| 24 | Genuine Founder decisions listed, none manufactured | PASS — §28 |
| 25 | Engineering decisions documented explicitly | PASS — §29 |
| 26 | Implementation decomposed into sequenced, boundaried packages | PASS — §30 |
| 27 | Dependency graph produced | PASS — §31 |
| 28 | Definition of Ready stated | PASS — §32 |
| 29 | Risks identified | PASS — §34 |
| 30 | Explicit deferrals listed | PASS — §35 |
| 31 | Docs-only diff maintained (verified in §0 entry state and at validation time, §36) | PASS |
| 32 | No implementation performed by this document | PASS |

## 34. Risks

| Risk | Mitigation recorded here |
|---|---|
| A future implementation package silently reintroduces subscription/Reward-Program scope "to preserve the PRD3 step count" | §19–§20 explicitly forbid this; §5's reconciliation table is the disposition of record |
| A coding agent invents an `onboardingStep` field despite this document's recommendation | §8's reasoning and §28 FD-P3-002-2 are the explicit disposition to cite against that drift |
| The Staff-transport repository-layer gap (no "list by business" query exists) is underestimated as "just add a callable" | §0/§4/§11 flag it explicitly as new repository work, not merely a new `onCall` wrapper |
| FD-P3-002-5 (Terms acceptance) is silently dropped because it wasn't in the task brief's pre-listed decision set | §28 records it as a genuinely new, undeferred item requiring its own scheduling answer |
| A future package grants direct Firestore read access to Commerce Knowledge "since it's just taxonomy" without Founder/Engineering review | §22 records this only as a future option, explicitly not decided here |
| The EN-only Commerce Knowledge translation state is mistaken for a defect rather than a known, already-disclosed `ENG-P3-001B` deferral | §17 cites the existing disclosure directly, does not re-litigate it |
| A future reader assumes this document authorizes `ENG-P3-002A`/`B`/`C` implementation | §32's Definition of Ready and this document's own repeated "authorizes no implementation" framing exist precisely to prevent this |

## 35. Explicit Deferrals

Restated in one place for a Founder skimming only this section:

- Subscription-plan selection (PRD3 §5 Step 4) — deferred to Phase 10 (`DEC-SUB-008`).
- First Reward Program creation (PRD3 §5 Step 6) — deferred to Phase 4 (`ENG-P4-001`/`002`).
- ~~Terms-of-Service acceptance (PRD3 §5 Step 5) — surfaced as an unresolved gap, not designed (§28 FD-P3-002-5).~~ **Resolved (v2.0, §37):** a dedicated `BusinessTermsAcceptance` record (Option A), accepted before final submission (Option B timing), versioned by an externally-governed `termsDocumentId`/`termsVersion` reference (no in-repo legal-document CMS). What remains deferred is `DEC-LEGAL-002` itself — the actual Terms *content* (reward obligations, dispute language, business liability) — which is a legal-content decision outside this document's authority, not an architecture gap.
- The `pending_verification → trial` verification mechanism — explicitly out of scope per direct instruction and the `businessStatus.ts` model's own doc comment.
- PRD3 §12's full onboarding checklist (spans Capability 4/5/6 items) — not implemented as a literal checklist; a narrower, `ENG-P3-002`-owned notion of completion is defined instead (§7).
- PRD3 §13's full Business Dashboard (widgets, reporting) — only a minimal post-submission landing shell belongs to `ENG-P3-002` (§15).
- Knowledge Studio editorial UI (`ENG-P3-003`) — confirmed non-blocking (`DEC-CKS-002`), no editorial/write transport designed here.
- Role-aware navigation, full Staff Management Dashboard (SUSPEND/REACTIVATE/REMOVE/role-change UI) — later capability, not onboarding.
- Direct Firestore read access to Commerce Knowledge — recorded as a future option only (§22), not designed or applied.
- French taxonomy content — not invented; EN fallback is the designed behavior (§17).
- Multiple-Business switcher UI — the Business-context model does not assume single-Business ownership (§10), but a full switcher UI is not designed in detail here.

---

## 36. Founder Dispositions — `FD-P3-002` Onboarding Completion / Progress / Staff Invitation / Subscription-Reward Program, dated 2026-08-21, APPROVED

Recorded per the same convention `ENG-P3-001-DESIGN-001` §36 established for `DEC-CKS-003`: a dated Founder-disposition addendum on this design document, not a new `decision-register.md` entry and not a new standalone product-decision document. `decision-register.md` was checked directly (`grep -n "DEC-CKS-00[123]"`) and confirmed to contain none of the `DEC-CKS-00X` items either — the established, repeatedly-reused practice for a design-document-scoped disposition is to record it here only. The same pattern is followed for `FD-P3-002` below.

Each row confirms the exact scope §5–§20/§28 already analyzed; no row invents new architecture — Founder approval ratifies this document's own recommendation in every case, exactly as `DEC-CKS-001`/`DEC-CKS-002` ratified `ENG-P3-001-DESIGN-001`'s prior recommendations.

| Disposition | Founder text (verbatim, task authorization) | Effect on this document |
|---|---|---|
| **`FD-P3-002` — Onboarding Completion** | **APPROVED.** Capability-3 Business onboarding completes when the owner has completed the governed Business setup requirements and successfully submits the Business into `pending_verification`. Onboarding completion does NOT mean Business verification complete, trial status reached, or active status reached. The `pending_verification → trial` mechanism remains separately ungoverned and must NOT be invented by `ENG-P3-002`. After successful submission, the owner may enter the appropriate Business experience showing that verification is pending. | Confirms `FD-P3-002-1` (§28) and §6–§7's completion boundary exactly as recommended. §7's three-way separation (completion / verification / activation) is now Founder-ratified, not merely this document's own analysis. No section requires a text change — the boundary is stated, this disposition only removes the word "recommended." |
| **`FD-P3-002` — Onboarding Progress** | **APPROVED.** Do NOT add `onboardingStep`, `onboardingCompleted`, or another persisted onboarding-specific state machine. Onboarding progress/resume must be derived from authoritative existing state wherever possible (Business existence; Business profile completeness; default Branch state; Business classification; Business lifecycle/status; other persisted data the governed flow genuinely requires). Frontend wizard state may be local/session state for current navigation. The design must prove that a user can refresh, sign out/in, or resume later without requiring a persisted wizard-step field. | Confirms `FD-P3-002-2` (§28) and §8's Option-B recommendation exactly. The proof obligation ("must prove... resume... without a persisted wizard-step field") is discharged concretely in §38 below, now covering all seven of the task's named resume scenarios plus Terms acceptance — a stronger proof than §8's original narrative-only argument. |
| **`FD-P3-002` — Staff Invitation** | **APPROVED.** Inviting Staff during Business onboarding is OPTIONAL. A Business may complete onboarding with only its Owner membership — important for owner-operated businesses. Staff invitation should be available during onboarding where useful, but: no invitation is required to submit the Business; invite acceptance is never required for owner onboarding completion; the invitee acceptance journey remains a parallel Staff journey. | Confirms `FD-P3-002-3` (§28) and §11–§12 exactly as recommended, with the additional explicit confirmation that owner-operated (zero-Staff) businesses are a first-class, fully supported case — not merely an edge case tolerated by "optional" wording. §39 restates the minimum query surface in light of this confirmation. |
| **`FD-P3-002` — Subscription/Reward Program** | **APPROVED.** The historical PRD steps covering subscription-plan selection and creation of the first Reward Program are deferred to their owning later capabilities. They are NOT Capability-3 onboarding completion requirements. Do not create placeholders, fake plan selection, or premature Reward Program functionality merely to preserve the historical nine-step sequence. Record a clear reconciliation so future agents do not pull these capabilities forward again. | Confirms `FD-P3-002-4` (§28) and §19–§20 exactly as recommended (the "(a)/(c) combined — no placeholder" option). The reconciliation obligation ("record a clear reconciliation so future agents do not pull these forward again") is already discharged by §5's classification table, §19's option analysis, §20's boundary statement, and §35's Explicit Deferrals list — restated together, without new content, in §41's consistency sweep for a single-place forward-looking citation. |

**Status: all four `FD-P3-002` items are APPROVED. No further Founder disposition is owed for any of these four.** The fifth item this document originally surfaced (`FD-P3-002-5`, Terms-of-Service acceptance) is not a yes/no ratification of a pre-formed recommendation — it required new architecture, which §37 now provides in full.

## 37. Terms-of-Service Acceptance Architecture (resolves the former `FD-P3-002-5` gap)

### 37.1 Repository Research — What Actually Exists

Searched directly, case-insensitive, across `docs/` and `functions/src/` for `terms`, `consent`, `acceptance`, `policy`, `agreement`, `legal` (and the specific candidate identifiers `termsAccepted`, `termsVersion`, `termsDocument`, `consentLedger`, `consentRecord`, `privacyConsent`, `legalDocument`, `agreementAcceptance`, `policyAcknowledg*`) — not assumed from the prior design pass's own summary. Findings, precisely:

- **No dedicated Business-Terms acceptance mechanism exists anywhere** — no `businessTermsAcceptance`/`termsAcceptance` collection, model, repository, or callable. `functions/src/domains/business/` has no such field on `Business` (`business.ts` checked directly — `contactPhone`, `contactEmail`, `primaryCategoryId`, `businessTypeId`, `subscriptionId`, `logoUrl`, no terms-related field at all).
- **A real, governed, *implemented* precedent exists, but for a different legal event.** `functions/src/domains/identity/models/customerProfile.ts` (lines 52–54, 66, 220) defines and requires `ConsentVersions = { termsVersion: string; privacyVersion: string; acceptedAt: Date }`, embedded on `CustomerProfile`, required at write time (`requireConsent`, enforced in `createCustomerProfile`'s params). `functions/src/domains/identity/repositories/customerProfileDocument.ts` persists it under the same shape. This traces to TRD10 §10.6.2's `consentVersions: { termsVersion, privacyVersion, acceptedAt }` field on `customerProfiles`, and to TRD21 §21.7 ("Terms acceptance; Privacy Policy acknowledgement... where applicable" as part of *initial customer registration*). **This is Customer-registration Terms acceptance (PRD2/TRD21 §21.7) — a different legal event from PRD3 §5 Step 5's Business-registration Terms acceptance.** It is direct, useful shape-precedent (§37.3 below), not a mechanism `ENG-P3-002` can reuse as-is: it is scoped to the Customer Identity's own registration, embedded and *overwritable* (`UpdateCustomerProfileChanges.consentVersions?: ConsentVersions` — a later update replaces the field, with no built-in history of the prior value), and it says nothing about which Business, if any, the acceptance relates to — Business Terms are a distinct legal act (PRD3 §5 Step 5 exists as its own step, separate from PRD2's customer-registration Terms).
- **A richer, general-purpose consent schema is governed but never implemented.** TRD21 §21.21–§21.22 defines `ConsentRecord = { id, userId, consentType, purposeVersion, noticeVersion, status: "granted"|"withdrawn"|"expired", collectionMethod, languageCode, grantedAt?, ... }` and states consent "shall be granular" — Terms acceptance, Privacy Policy acknowledgement, marketing consent, personalization consent, etc. all distinguished, "one broad checkbox shall not be used to authorize unrelated purposes." TRD12 §12.45 restates the same distinction. **`grep` for `ConsentRecord`/`consentRecords` across `functions/src/` returns nothing** — this type is a governed *design*, never built as an actual Firestore collection, repository, or model anywhere in the codebase. It is aspirational TRD content, not an existing mechanism `ENG-P3-002` can call into.
- **`DEC-LEGAL-002`** (`decision-register.md`) — *"Consumer/loyalty terms and business reward obligations... Reward Program terms, business obligation to honour rewards, dispute language, platform liability, subscription terms"* — is `OPEN_LEGAL`, Priority D3, required by Phase 14/pilot, owned by Founder + legal adviser. **This governs the Terms *content*, not the acceptance *mechanism*.** This document does not resolve `DEC-LEGAL-002` and is not positioned to — no Terms text is drafted here, matching the task's explicit instruction not to invent the Terms document itself.
- **Conclusion:** none of Options A/B/C (task brief) can be answered "reuse an existing mechanism wholesale." A `BusinessMembershipInvitation`-style dedicated record (§37.3) is the closest fit to what the codebase actually does for "an identity did X, tied to a Business, at time Y" facts that need durable, auditable, non-overwritten history — not the `customerProfiles.consentVersions` embedded/overwritable pattern, and not the never-implemented `ConsentRecord` design.

### 37.2 Option Evaluation

| Criterion | **Option A — dedicated record** | **Option B — reuse `customerProfiles.consentVersions`-style pattern** | **Option C — `Business.termsAccepted: true`** |
|---|---|---|---|
| Auditability (who/which version/when) | Full — every field is a first-class column on a purpose-built record | Partial — the *shape* exists, but scoped to Customer registration, not Business Terms; would need to be duplicated/repurposed | **None** — a boolean answers none of who/which/when |
| Versioning (later Terms version doesn't erase earlier evidence) | Full — each acceptance is a new, immutable record; nothing is ever overwritten | **Fails as-is** — `consentVersions` is a single overwritable field (`UpdateCustomerProfileChanges.consentVersions?`); a later update destroys the prior value's history unless paired with an audit trail nothing today provides | **Fails outright** — a single boolean cannot even express "which version," let alone preserve history |
| Multi-owner/future-ownership implications | Clean — acceptance is keyed to `acceptingCustomerIdentityId`, independent of `Business.ownerUserId`; a future ownership transfer does not retroactively rewrite who accepted historically | Same identity-scoping strength as A if repurposed, but would conflate two distinct legal events (Customer Terms vs. Business Terms) under one field if literally reused | **Actively wrong per Founder policy** — a Business-level boolean cannot express *which individual* performed the legal act at all, exactly what the Founder policy forbids |
| Privacy | Class-2/operational-shaped (mirrors `permissionAuditEvent.ts`'s own `class_2_internal_operational` fixed classification for a similar "who did what when" fact) — no sensitive personal data beyond an identity reference already handled elsewhere | Same privacy shape, but bundling with Customer-registration consent risks conflating retention/consent-withdrawal semantics that TRD21 §21.21 explicitly requires kept granular | Trivial, but at the cost of losing the very facts privacy/audit governance requires |
| Query needs | Straightforward — `getTermsAcceptance(businessId, termsVersion)` or `(acceptingCustomerIdentityId, businessId)`, single-record lookup, mirrors `getBusinessMembershipByUserAndBusiness`'s existing shape | Would require a new query path anyway, since `customerProfileDocument.ts`'s reader is Customer-Identity-scoped, not Business-scoped | No query needed — but only because the fact isn't actually recorded |
| Idempotency | Clean — deterministic id (e.g. `${businessId}_${termsVersion}` or a `randomUUID()` with a uniqueness constraint on `(businessId, termsVersion)`), mirrors `duplicateKnowledgeNodeIdError`/`duplicateKnowledgeTagIdError`'s existing transactional-existence-check precedent (§`ENG-P3-001B`) | Same idempotency question as A, unresolved by reuse alone | N/A |
| Onboarding-transaction implications | Composable — can be written inside the same transaction as `submitBusinessForVerification` (or independently before it, §37.4) without redesigning `createBusiness`'s existing bootstrap transaction | Would require either forking `customerProfile`'s update path (risky — touches an unrelated, already-`Complete` domain) or building new transport anyway | N/A |

**Recommendation: Option A — a dedicated, purpose-built record**, shaped like `BusinessMembershipInvitation` (`functions/src/domains/permissions/models/businessMembershipInvitation.ts`): a small, framework-independent domain contract (construction + validation + a fail-closed Firestore-document reader, no runtime persistence logic baked into the model itself), not a repurposing of `customerProfiles.consentVersions` (wrong legal event, overwritable) and not a Business-level boolean (explicitly forbidden by Founder policy, and analytically the weakest option on every criterion above). This is the smallest architecture consistent with the platform's own existing pattern for "an identity did X, tied to a business context, at time Y, immutably" — the same pattern `BusinessMembershipInvitation` and `permissionAuditEvent.ts`'s audit-event shape already establish, reused conceptually, not copied verbatim (per the task's own instruction).

### 37.3 Recommended Schema (conceptual — ENGINEERING DESIGN, not applied, no model file created by this document)

A `BusinessTermsAcceptance` domain contract, conceptually:

| Field | Included? | Reasoning |
|---|---|---|
| `id` | Yes | Deterministic (e.g. derived from `businessId` + `termsVersion`) or generated (`randomUUID()`, mirroring `BusinessMembershipInvitation`'s own `id` field) — either is viable; the deciding factor is the idempotency policy (§37.7), not this field's own shape |
| `acceptingCustomerIdentityId` | Yes, required | The authenticated individual who performed the legal act — **never** a shared Business credential, per Founder policy. Mirrors `businessMembershipInvitation.invitedBy`'s existing "who performed this act" field pattern. |
| `businessId` | Yes, required | The registration/Business context of the acceptance — the Business the Terms apply to, not the identity's only relevant scoping key (Founder policy: "the Business may be the context of the acceptance, but the legal act is performed by an individual authenticated principal") |
| `termsDocumentId`/`termsVersion` | Yes, required (both, or `termsVersion` alone if a single external identifier suffices — see §37.5) | Which Terms document/version was accepted — the load-bearing field for future-Terms-update non-erasure |
| `acceptedAt` | Yes, required | When acceptance occurred — a `Date`/`Timestamp`, mirrors `invitedAt`/`acceptedMembershipId`-adjacent timestamp fields already used throughout `permissions/models/` |
| `languageCode` | Yes | Which language (EN/FR) the Terms were presented/accepted in — required by TRD21 §21.22's own `ConsentRecord.languageCode` field and by this document's own EN/FR UI contract (§37.6) |
| `collectionMethod` | Optional, recommended | Mirrors TRD21 §21.22's `ConsentRecord.collectionMethod` (e.g. `"onboarding_wizard"`) — cheap, future-proofs against a later second acceptance surface (e.g. a re-acceptance flow after a Terms update) without redesigning the record |
| `createdAt`, `schemaVersion` | Yes | Platform-standard fields present on every domain contract this codebase has built so far (`business.ts`, `businessMembershipInvitation.ts`, `knowledgeNode.ts` all carry `schemaVersion`) |
| `status` (`"granted"`/`"withdrawn"`) | **No, not at MVP** | TRD21's `ConsentRecord` design includes `"withdrawn"`/`"expired"` states, but no governing source names a Terms-withdrawal product flow for Business Terms at this scope — a Business either has or has not accepted the current Terms; withdrawal (if it ever means anything for a live, operating Business) is a future product question this document does not invent an answer to |
| `updatedAt`/mutation support | **No** | The record is **write-once** — a new acceptance (a new Terms version, or the same version re-accepted for a new registration context) is a **new record**, never an update to an existing one. This is the single design choice that directly satisfies "a later Terms version must not erase historical evidence that an earlier version was accepted" — mutability is exactly what would break that guarantee. |

This is deliberately **not** a full `ConsentRecord` (TRD21 §21.21-22) implementation — that broader, multi-`consentType` (marketing, personalization, data-sharing, etc.) schema remains unbuilt and is not this document's job to build; `ENG-P3-002` needs only the Business-Terms-acceptance slice of that eventual design, shaped consistently with it (same field vocabulary: version, timestamp, language, method) so a future platform-wide `ConsentRecord` migration, if one is ever built, would not have to invent a second incompatible vocabulary.

### 37.4 Timing / Transaction Boundary

Evaluating the three options the task brief names, informed directly by §8's already-approved (§36) derived-progress principle and by `businessBootstrapEndpointService.ts`'s actual transaction structure (verified directly: identity resolution happens *before* the bootstrap transaction is invoked; "no partial state is possible at this layer because nothing has been written yet" — the module's own doc comment):

- **(A) Acceptance required before `createBusiness`.** Would mean recording a `BusinessTermsAcceptance` with no `businessId` yet (none exists), then somehow associating it with the Business once created — either by passing an acceptance-record id into `createBusiness` (new required request field, coupling two otherwise-independent transactions) or by a second write immediately after bootstrap (a window where the acceptance exists but is not yet businessId-linked). Neither is clean, and — per §36's `FD-P3-002` Onboarding Progress disposition — this document should not invent a second write step that only exists to patch over sequencing, when a later boundary avoids the problem entirely.
- **(B) Business created as draft; Terms accepted before final onboarding submission.** The Business already exists (in `draft`, created via the existing, unmodified `createBusiness` bootstrap transaction) by the time Terms acceptance happens, so `businessId` is always known and the acceptance record is complete and self-consistent the moment it is written — no two-phase linkage, no orphan-record window. A Business sitting in `draft` with no Terms acceptance yet is not an orphan state at all — it is exactly the same kind of legitimate, resumable, `draft` mid-onboarding state §8/§38 already prove for profile/Branch/classification completeness. Terms acceptance simply becomes one more fact `submitBusinessForVerification`'s precondition can check, alongside required-field completeness.
- **(C) Another source-supported boundary.** No governing source (PRD3, TRD21, TRD12) names a boundary more specific than "Step 5, before the flow completes" — PRD3 §5's own step ordering (Step 2 Create Business → ... → Step 5 Accept Terms) already implies the Business exists by the time Terms are accepted, which is Option B, not Option A.

**Recommendation: Option (B).** Terms acceptance is required as a precondition of `submitBusinessForVerification` succeeding (a new, additive validation check inside that command's existing authority/prepare phase — no new transaction boundary invented, reusing the same `authorizeAndExecute`/transactional-command pattern `businessProfileCommand.ts`/`businessClassificationValidation.ts` already established for other submission-time preconditions), not a gate before `createBusiness` can even be called. This is directly consistent with `FD-P3-002` Onboarding Progress (§36): "has this Business's current owner accepted the current Terms version" is exactly the kind of fact derivable from existing persisted state (a `BusinessTermsAcceptance` record's existence, keyed on `(businessId, currentTermsVersion)`) — no `onboardingStep` field is needed to track whether this step is "done," mirroring precisely how profile/Branch/classification completeness are already derived (§8).

**Recovery/resume behavior, explicitly addressed:** no orphan Business state is created (a `draft` Business without a Terms-acceptance record is a normal, resumable mid-onboarding state, not an error condition) and no orphan legal-acceptance record is created (every `BusinessTermsAcceptance` record is written only once its `businessId` is already known, since the Business already exists by construction under Option B). §38 walks this through concretely as part of the full resume-scenario proof.

### 37.5 Versioning

**Does Terms content itself need a governed document registry, or does `ENG-P3-002` only need to reference an externally/version-controlled Terms identifier?** **ENGINEERING DESIGN — the latter; no in-repo Terms-document CMS is designed or required.** Reasoning:

- No governing source (PRD3, TRD, `decision-register.md`) proposes a Terms-authoring/editorial workflow — this would be a far larger surface than `ENG-P3-002`'s scope, and `DEC-LEGAL-002` (Terms content itself) remains `OPEN_LEGAL`, meaning there is no approved Terms text to register yet regardless.
- `ENG-P3-002` only needs a stable **reference** — a `termsVersion` string (e.g. `"2026-08-21"` or a semantic identifier like `"business-terms-v1"`) that the frontend displays/links to (§37.6) and the backend records verbatim at acceptance time. The actual Terms document can live wherever legal/product governance decides to host it (a static, versioned page; a CMS; a PDF under version control) — this document does not design that hosting mechanism, matching `DEC-CKS-002`'s own precedent of not building editorial tooling merely because content will someday need editing.
- **What this design *does* commit to:** the current Terms version must be a single, unambiguous, server-known value at acceptance time (not client-supplied) — the callable that records acceptance reads the platform's currently-configured `termsVersion` server-side and stamps it onto the record, rather than trusting whatever version string the client claims to have shown the user. This closes the one integrity gap a purely-external-reference design could otherwise have (a stale client showing an old Terms version but claiming acceptance of the current one) without requiring a document registry to close it — a simple server-side configuration value (however governance later chooses to source it — a config file, a Remote Config value, or a constant updated via normal code review) is sufficient.
- If a full governed document registry is ever needed (e.g., multiple simultaneously-active Terms documents per market, editorial review workflow), that is future scope, analogous to how `ENG-P3-001-DESIGN-001`'s Commerce Knowledge registry was itself built only when actually needed — not designed here speculatively.

### 37.6 UI Contract (minimum, conceptual — no final legal text drafted)

- **Display/link:** the current Terms document (wherever hosted, §37.5) is linked/displayed at the acceptance step, in the language currently active (§17's EN/FR mechanism, reused unmodified — no new localization mechanism invented).
- **Explicit affirmative acceptance:** a checkbox or equivalent affirmative control, defaulting to **unchecked** — no pre-checked consent, matching TRD21 §21.21's granular-consent principle and standard consent-UX practice.
- **Server confirms the accepted version:** the accept action calls a server command (conceptually `acceptBusinessTerms(businessId)`) that reads the current server-known `termsVersion` (§37.5) and writes the acceptance record — the client never supplies `termsVersion` as an assertion the server merely trusts.
- **Validation/error handling:** attempting to submit the Business (`submitBusinessForVerification`) without a current-version acceptance record fails closed, mapped onto the existing closed error taxonomy (§37.9) — never a silent pass-through.
- **EN/FR presentation:** the Terms link/display text and the acceptance-step copy follow §17's existing EN-required/FR-optional i18next pattern; if the Terms *document itself* has no French version yet (a real possibility, `DEC-LEGAL-002` unresolved), that is a content gap to disclose honestly (mirroring §17's own handling of the EN-only Commerce Knowledge translation state), not a reason to block the architecture — the UI must not silently claim a French Terms document exists if it does not.
- **What this document does not do:** draft final Terms text, choose the exact checkbox copy, or invent the Terms document's own content/versioning-authority process — all explicitly out of scope per the task's own instruction and `DEC-LEGAL-002`'s standing authority over Terms content.

### 37.7 DTO / Read-Transport Implications

The Business/Branch onboarding-hydration DTO (§14) gains one small, bounded addition — a Terms-acceptance-status projection, not the raw record:

| Field (addition to §14's Business/Branch DTO) | Reasoning |
|---|---|
| `termsAcceptance: { accepted: boolean; version?: string; acceptedAt?: string } \| null` | Lets the frontend resume-detect "has this Business's current acceptance record match the currently-required Terms version" without a separate round-trip — computed server-side (comparing the stored record's `termsVersion` against the server's current `termsVersion`, §37.5), never left for the client to reconstruct itself. If the Business has an acceptance record for an *older* version than current, `accepted` is `false` — the owner must re-accept the current version before submission, and the old record remains, untouched, as historical evidence (§37.3's write-once design). |

No new standalone read endpoint is required beyond this DTO addition — `getBusinessContext(businessId)` (§9) is extended to include this projection, consistent with §9's existing "one bounded Business-hydration read, not a scatter of micro-endpoints" design.

### 37.8 Authorization

`acceptBusinessTerms` is Owner-scoped, following the exact pattern §21 already establishes for `submitBusinessForVerification`/`business.submitForVerification` — re-derived server-side from the caller's actual relationship to `businessId` (owner match or active membership, never a client-supplied claim), not a new permission-catalogue entry (the same read/write-authority reasoning §21 already applies to Business-scoped operations that are not naturally a delegable "role permission" in the sensitive/ordinary-catalogue sense — accepting Terms is an act only the accountable Owner performs during onboarding, mirroring `business.submitForVerification`'s own Owner-only default rather than inventing a new catalogue entry for a single, narrowly-scoped onboarding action).

### 37.9 Error Handling Addition (extends §23's table)

| User-facing case | Maps to category | Frontend treatment |
|---|---|---|
| Submission attempted without a current-version Terms acceptance | `VALIDATION_FAILED` (or `INVALID_STATE_TRANSITION`, consistent with how §23 already routes "this step isn't available right now" cases — the exact choice is an implementation-time detail, not frozen here) | "Please accept the current Terms before submitting" — never the raw category string, matching §23's existing principle |
| Terms acceptance attempted twice for the same `(businessId, termsVersion)` | `IDEMPOTENCY_CONFLICT` (idempotent — the second call is a harmless no-op returning the existing record, not an error surfaced to the user) | Silent success — resubmitting an already-accepted step should never read as a failure |

No 15th error category is introduced — both cases fold into the existing closed 14-category taxonomy (`errorCategories.ts`), consistent with §23's own governing constraint.

## 38. Resume/Hydration Proof — All Seven Named Scenarios, Plus Terms

Constructing each scenario the task brief names, and showing precisely which authoritative backend reads (§9/§13/§37.7) reconstruct the correct UI state, with **no persisted onboarding-progress field of any kind** — directly discharging `FD-P3-002` Onboarding Progress's (§36) proof obligation:

| # | Scenario | Authoritative backend reads that reconstruct UI state | Persisted-state gap? |
|---|---|---|---|
| 1 | Authenticated owner, no Business yet | `getOwnedBusinesses` (§9) returns an empty list. Frontend routes to the create-Business screen (`/onboarding/new`, §10). Nothing to derive — there is genuinely no state yet, which is itself the correct signal. | **None.** |
| 2 | Business created, profile incomplete | `getOwnedBusinesses` returns exactly one Business (`status: draft`). `getBusinessContext(businessId)` returns the current field values — the frontend's per-step Zod validation (§16) checks which required fields (`displayName`, `primaryCategoryId`, `countryCode`, `city`, `contactPhone`, etc., §6) are populated vs. blank and resumes at the first incomplete field's step. | **None.** |
| 3 | Profile complete, Branch incomplete | Same `getBusinessContext` read additionally returns the default Branch's field values (§9's Branch-hydration read) — same derive-from-populated-fields logic, now applied to Branch fields. | **None.** |
| 4 | Business/Branch complete, classification incomplete | `getBusinessContext`'s `primaryCategoryId`/`businessTypeId` fields (already part of the same DTO — §14 notes these are *not* a separate query) show `primaryCategoryId` unset (or `businessTypeId` optionally unset, which is not a resume blocker per §6 — Business Type is optional). Frontend resumes at the classification step, pre-populated with §13's Category/Type option lists. | **None.** |
| 5 | Optional Staff invite skipped | `listInvitationsByBusiness(businessId)` (§39) returns an empty list. The review step (§16) renders "0 staff invited" — a true, derivable fact, not an assumption — and the review/submit step remains reachable regardless (§36's Staff-Invitation disposition: invitation is never required). | **None.** |
| 6 | Optional Staff invite sent but not accepted | `listInvitationsByBusiness(businessId)` returns the invitation(s) with `status: "invited"` (not yet `"accepted"`) — TRD10 §10.6.4a's own governed `InvitationStatus` vocabulary, already persisted by `createStaffInvitation` (§11, EXISTING IMPLEMENTATION at the command layer). The review step shows "N pending" truthfully. Submission remains unblocked (§12 — invitation acceptance is never an onboarding-completion precondition). | **None.** |
| 7 | Business submitted → `pending_verification` | `getBusinessContext(businessId)`'s `status` field reads `pending_verification` directly off the same `Business` document `submitBusinessForVerification` already writes (§18, EXISTING IMPLEMENTATION). The frontend renders the post-submission Business-context shell (§15) with the non-raw-enum copy §18 specifies ("Submitted — pending verification"). No wizard-step field is consulted — `Business.status` alone is authoritative. | **None.** |
| **Terms fit (§37.4's Option B)** | At any point after Business creation, before submission | `getBusinessContext`'s `termsAcceptance` projection (§37.7) is `null`/`{accepted: false}` until `acceptBusinessTerms` succeeds, then `{accepted: true, version, acceptedAt}` — exactly the same derive-from-existing-persisted-fact pattern as scenarios 2–4, not a separate mechanism. Resuming mid-onboarding after Terms were already accepted shows the review step's Terms line as already-satisfied, correctly, from this one read. | **None.** |

**Conclusion — the proof obligation is discharged in full.** Every one of the seven named scenarios, plus Terms acceptance, is reconstructible from `getOwnedBusinesses`/`getBusinessContext`/`listInvitationsByBusiness` (all read-only, all already-designed, §9/§13/§37.7/§39) and the existing, unmodified `Business`/`BusinessBranch`/`BusinessMembershipInvitation`/`BusinessTermsAcceptance` persisted documents. **No scenario requires a new persisted onboarding-progress field.** This document reports this honestly rather than hand-waving past it, per the task's own instruction — and finds no gap to report.

## 39. Staff List Query — Reconfirmed Gap & Minimum Query Surface

**Reconfirmed directly** (not merely re-cited from §0/§4/§11): `functions/src/domains/permissions/repositories/businessMembershipRepository.ts`, read in full again for this task, exposes exactly two functions — `getBusinessMembershipByUserAndBusiness` (single `(userId, businessId)` pair) and `getBusinessMembershipById` (single membership by its own id). **No "list by business" query exists for memberships.** The sibling invitation repository was checked for the same gap (`businessMembershipInvitationRepository.ts`, cited in §3/§0) — same finding: no list-by-business query for invitations either. This is the identical conclusion §0/§4/§11 already reported; this section exists to satisfy the task's explicit "verify directly" instruction, not to introduce a new finding.

**Separating owner-onboarding needs from a later staff-management dashboard need**, now sharpened by `FD-P3-002`'s explicit optionality confirmation (§36):

| Need | Owned by | Query shape required |
|---|---|---|
| Onboarding review step: "which invitations has this owner already sent, and are any still pending" | `ENG-P3-002A` (this document's scope) | `listInvitationsByBusiness(businessId, statusFilter?)` — a single Business's invitations, optionally filtered to `"invited"` (pending) status; **no pagination, sorting, or cross-Business query** — a Business's onboarding-time invitation count is small (a handful, not hundreds) |
| Onboarding review step: "how many Staff members does this Business currently have" | `ENG-P3-002A` (this document's scope) | `listMembershipsByBusiness(businessId)` — same bounded shape as above; used only to render a simple count/roster-so-far, not a management table |
| Post-invite confirmation: "did the invitee accept" (surfaced somewhere in the owner's post-submission Business context, not the onboarding wizard itself) | `ENG-P3-002A`, same query reused | The same `listInvitationsByBusiness` read, re-fetched (React Query invalidation, §24) — no new query shape needed |
| Full Staff Management Dashboard (search, sort, filter by role/status, bulk actions, pagination across a large roster) | **Not `ENG-P3-002`** — a later, separately-authorized Staff Management Dashboard capability | Explicitly **not designed here** — building this now, merely because it "may be useful later," would be exactly the over-building the task instructs against, now that Staff invitation is confirmed optional and therefore typically small-scale at onboarding time |

**ENGINEERING DESIGN — the minimum query surface `ENG-P3-002A` must add:** two new, narrowly-bounded repository methods (`listInvitationsByBusiness`, `listMembershipsByBusiness`), each taking `businessId` as a parameter re-validated against the caller's actual ownership/membership server-side (§25's tenant-isolation principle, unchanged), each returning a plain array with no pagination cursor, sort option, or filter beyond the one optional status filter named above. This is a strictly smaller surface than §11's original framing might have implied "list Staff/memberships" could grow into — this section exists specifically to pin that boundary down now that Staff invitation's optionality is Founder-confirmed, not merely engineering-recommended.

## 40. `ENG-P3-002A` Scope Reconciliation

Assessing each candidate backend surface the task names, tracing every inclusion to a specific onboarding need (no broad generic CRUD/query API is proposed):

| Surface | Include in `ENG-P3-002A`? | Traces to |
|---|---|---|
| **Business reads** — get/list current owner's Businesses; get authorized Business summary; get default Branch | **Yes** | §9 (`getOwnedBusinesses`, `getBusinessContext`) — resume detection (§38 scenarios 1–4, 7) and the review/post-submission screens |
| **Commerce Knowledge reads** — list usable Business Categories; list Business Types for Category; EN/FR display fallback | **Yes** | §13–§14 — the classification step (§38 scenario 4) cannot render selectable options otherwise |
| **Staff transport — create invitation** | **Yes** | §11 (`createStaffInvitation` callable exposure) — PRD3 §5 Step 7, `FD-P3-002` Staff Invitation (§36) |
| **Staff transport — revoke invitation** | **Yes, narrowly** | §11 — an owner correcting a mis-typed invitation during onboarding, same screen, small scope |
| **Staff transport — minimum invitation-status query** | **Yes** | §39's `listInvitationsByBusiness` — §38 scenarios 5–6 cannot be reconstructed without it |
| **Staff transport — acceptance transport (the parallel invitee journey)** | **No, not as part of `ENG-P3-002A`'s onboarding-wizard surface** | §12 — `acceptStaffInvitation`'s *command* already exists (`ENG-P2-003B`, `Complete`); whether it needs its *own* callable exposure is a fair question, but that callable serves the invitee's separate journey, not the owner's onboarding wizard — if it does not already have `onCall` exposure by the time `ENG-P3-002A` is scoped, that exposure is better owned alongside whatever package eventually builds the invitee-facing acceptance UI (plausibly a later, `ENG-P3-002`-adjacent but not `ENG-P3-002A`-internal addition, or folded in opportunistically if `ENG-P3-002A` is already touching `permissions/` callable exposure — an implementation-time judgment call, not a hard exclusion) |
| **Terms — acceptance persistence/command** | **Yes** | §37 — `acceptBusinessTerms` callable, `BusinessTermsAcceptance` model/repository, and the `termsAcceptance` DTO projection (§37.7) all fall out of the same "previously-undesigned onboarding backend transport" bucket §9/§11/§13 already established as `ENG-P3-002A`'s defining responsibility. This is a **small, additive extension of `ENG-P3-002A`'s already-scoped work, not a reason to create a new package** (§42 confirms this explicitly). |

**Every surface above traces to a specific `§38` resume scenario or a specific PRD3/`FD-P3-002` requirement — no surface is included "because it might be useful."** This directly satisfies the task's instruction to avoid broad generic CRUD/query APIs.

## 41. Final Design Consistency Sweep

The entire document (§0–§40) was re-read top to bottom for this task, checking each of the following claims. All PASS; where drift existed, it has already been corrected in place (the header status line, §28's introductory note, §32's Definition of Ready, and §35's Terms bullet, all edited above as part of this same revision) rather than left stale:

| Consistency check | Finding |
|---|---|
| Onboarding ends at `pending_verification`; trial/active is not required | **Confirmed throughout** — §6/§7/§18/§36 all state this consistently; no section claims otherwise |
| No persisted onboarding wizard state exists anywhere in the doc's own recommendations | **Confirmed** — §8/§36/§38 all recommend derivation only; §37's new Terms design also uses a derived-status projection (§37.7), not a wizard-step field — the new material introduced by this revision does not reintroduce the pattern §8 rejected |
| Staff invite is optional; Staff acceptance is parallel | **Confirmed** — §6/§11/§12/§36/§39 consistent; §40 preserves this in the scope table |
| Subscriptions are deferred; Reward Program creation is deferred | **Confirmed** — §5/§19/§20/§35/§36 consistent |
| Knowledge Studio is not a prerequisite | **Confirmed** — §27, `DEC-CKS-002` cited accurately, unchanged by this revision |
| No direct Firestore client workaround is introduced | **Confirmed** — §22 explicitly rejects this for existing surfaces; §37's Terms design follows the same server-mediated callable pattern (§37.6/§37.8), no Rules change proposed anywhere in the new material |
| Server-mediated transport remains authoritative throughout | **Confirmed** — §9/§10/§21/§22/§25 unchanged; §37.5/§37.6 explicitly design the Terms-version check as server-side, not client-trusted, extending the same principle rather than deviating from it |
| EN/FR requirements remain intact | **Confirmed** — §17 unchanged; §37.6 explicitly reuses §17's mechanism rather than inventing a second one |
| Capability 3 remains open | **Confirmed** — this document does not close Capability 3; §42/report explicitly restate this |
| `ENG-P3-002` remains unimplemented | **Confirmed** — no code, Rules, or deployment change is made anywhere in this revision; validated directly in §Validation of the closing report |
| Stale internal statements/cross-references (the original design predates these dispositions) | **Found and corrected:** the header status line ("no Founder decision yet dispositioned") was stale as of this revision — corrected. §28's table is left as an accurate historical record of the *original* recommendation (not rewritten in place, to preserve an honest record of what was recommended before Founder review) but is now prefixed with a status note pointing to §36 as the disposition of record — the same technique `ENG-P3-001-DESIGN-001` used for its own `DEC-CKS-003` addendum (leaving §26 as originally authored, adding a new dated section rather than rewriting history). §32's Definition of Ready and §35's Terms bullet were updated in place since they are forward-looking gating/status statements, not historical-recommendation records — updating them does not erase any history, it corrects a now-stale gate status. |

**No new architecture surface was discovered during this sweep that §0–§35 did not already anticipate** — the sweep confirms consistency, it does not uncover a new gap requiring further design work.

## 42. Implementation Decomposition Re-Evaluation

Re-evaluating §30's `ENG-P3-002A`/`B`/`C` decomposition now that the Terms architecture (§37) is finalized — **confirmed with one explicit, reasoned addition to `ENG-P3-002A`'s scope, no new package created:**

**Does Terms acceptance need its own small package?** **No — assessed and rejected, not assumed.** The same reasoning §11/`ED-P3-002-4` already applied to Staff transport applies here with equal force: the Terms mechanism (§37) is small (one domain contract, one repository, one callable, one DTO-field addition, one additional `submitBusinessForVerification` precondition check), has exactly one current consumer (`ENG-P3-002`'s own onboarding wizard), and splitting it into a separate package would add a second Founder authorization/PR/review cycle for functionality that exists for a single reason right now. If a second, independent consumer of Terms-acceptance transport ever emerges (implausible — Business Terms acceptance is inherently an onboarding-time act), that consumer could extend the same transport module later without redoing this work, exactly as `ED-P3-002-4`'s own closing sentence already anticipated for Staff transport.

| Package | Responsibility | Dependencies | Outputs | Exclusions | Acceptance criteria | Test strategy |
|---|---|---|---|---|---|---|
| `ENG-P3-002A` | Backend read/query + transport foundation: Business-hydration reads (§9, now including the `termsAcceptance` projection, §37.7), Staff INVITE/REVOKE callables + `listInvitationsByBusiness`/`listMembershipsByBusiness` (§11, §39), Commerce Knowledge Category/Type reads (§13–§14), **and** the new `BusinessTermsAcceptance` domain contract/repository + `acceptBusinessTerms` callable + the `submitBusinessForVerification` precondition addition (§37) | `ENG-P2-002`/`003`/`004`, `ENG-P3-001` (all `Complete`) | New callables/HTTPS endpoints, new repository query/write methods, new `BusinessTermsAcceptance` model, DTO types, unit + emulator tests | No frontend code; no Rules change; no new permission-catalogue entry; no Terms *content*/legal text (that remains `DEC-LEGAL-002`'s authority, referenced only by an external `termsVersion` identifier, §37.5) | Every read/write re-derives caller authority server-side (§25); `submitBusinessForVerification` rejects a submission with no current-version Terms acceptance; `BusinessTermsAcceptance` records are write-once (no update path); Staff list queries are Business-scoped and bounded (§39) | `functions` unit tests per endpoint/model; Firebase Emulator Suite tenant-isolation tests; a dedicated Terms-acceptance idempotency/concurrency test (same-`(businessId, termsVersion)` double-accept race), mirroring `ENG-P3-001B`'s own concurrent-create test precedent |
| `ENG-P3-002B` | Frontend: `BusinessContextProvider`, authenticated route boundary, `QueryClientProvider` wiring, onboarding wizard (Business/Branch/Category-Type/Terms-acceptance/Staff-invite/review steps), post-submission Business-context shell, EN/FR copy | `ENG-P3-002A`'s transport (real, not mocked) | New `apps/web/src/` onboarding/business-context modules, component + hook unit tests, a Terms-acceptance step (§37.6's UI contract) | No backend changes; no subscription/Reward-Program UI (§19–§20); no final Terms legal text (content supplied externally per §37.5–§37.6) | Resume works for all seven §38 scenarios plus Terms, purely from server reads, with zero client-persisted wizard-step field; no pre-checked Terms consent | Frontend unit tests (Vitest/Testing Library); EN/FR rendering tests, including the Terms-step copy |
| `ENG-P3-002C` | Integration, hosted preview & manual QA closure | `ENG-P3-002A` + `ENG-P3-002B` merged | Full end-to-end emulator integration test (create→profile→branch→classify→terms→[invite]→review→submit chain, now including the Terms step), hosted-preview validation, manual Founder QA sign-off, implementation report | No deployment beyond the existing staging pattern; no new scope introduced at this stage | Full chain, including Terms acceptance and resume/refresh at every point in §38's table, passes against a real emulator | Full-chain emulator integration test; hosted-preview manual walkthrough (§26, updated to include the Terms step) |

**Dependency graph (§31) is unaffected** — `ENG-P3-002A` still gates `ENG-P3-002B` still gates `ENG-P3-002C`, with no new package inserted and no new cross-package dependency introduced by folding Terms into `ENG-P3-002A`/`B`.

---

**This document defines architecture only. `ENG-P3-002` implementation remains unauthorized. Capability 3 remains `Open — partially implemented; not closed`.**
