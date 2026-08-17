> **Title:** ENG-P2-002-DESIGN-001 — Business Identity Architecture & Delivery Design
> **Version:** 1.1 · **Status:** Design package — Founder dispositions recorded (§24); NOT an implementation authorization · **Classification:** Working (execution-layer architecture record)
> **Governing document:** [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-ID-002`, `DEC-ID-003` (via [`ENG-P2-004-DESIGN-001`](ENG-P2-004-DESIGN-001-role-context-permission-resolution-architecture.md)), `DEC-SUB-005`, `DEC-FUT-005`; [`CDR-001` Capability 3](CDR-001-capability-delivery-roadmap.md#8-engineering-work-package-mapping); [ENG-P2-ARCH-001](ENG-P2-ARCH-001-customer-identity-architecture.md); [ENG-P2-004-DESIGN-001](ENG-P2-004-DESIGN-001-role-context-permission-resolution-architecture.md); PRD1 (`01-accounts-roles-and-permissions.md`); PRD3 (`03-business-registration.md`); TRD10 §10.6.3–10.6.4, §10.14.1, §10.3–10.4; TRD18 §18.11–18.13; TRD23 §23.14
> **Source-of-truth path:** `docs/05-implementation/roadmap/ENG-P2-002-DESIGN-001-business-identity-architecture-delivery-design.md`
> **Last controlled update:** 2026-08-17 (`ENG-P2-002-DESIGN-001` v1.1 — Founder dispositions FD-1/FD-2/FD-3 recorded, §24; original §17 register preserved as history)

# ENG-P2-002-DESIGN-001 — Business Identity Architecture & Delivery Design

**This document defines architecture only. It authorizes no implementation.** No production code, Firestore Rules, migration, client UI, or deployment is created or modified by this document. It is analogous in role to [ENG-P2-ARCH-001](ENG-P2-ARCH-001-customer-identity-architecture.md) (Customer Identity) and [ENG-P2-004-DESIGN-001](ENG-P2-004-DESIGN-001-role-context-permission-resolution-architecture.md) (Role-Context & Permission Resolution) for the Business Identity concern of Capability 3. It resolves the architecture-level prerequisites the Engineering Implementation Programme's `ENG-P2-002` row ("business identity — create, owner, profile, branch," `AP-003`, `AP-004`, `BR-007`, `BR-008`) needs before a future `ENG-P2-002A`/`002B`/`002C` implementation prompt can be authorized without a coding agent inventing business-identity semantics. **[UPDATED 2026-08-17]** The three items originally raised as an undispositioned Founder Decision Register (§17, preserved below as history) are now resolved — see §24 for the recorded Founder dispositions (FD-1/FD-2/FD-3) and the "Other Design Dispositions" they confirm (owner self-suspension and ownership-transfer scope deferral, `pending_verification`→`trial` treatment, business-event contract clarification). No `DEC-ID-005` Decision Register disposition is recorded by this document — only this package's own scope boundary is confirmed.

---

## 0. Entry State

- **Entry `origin/main` SHA:** `530e2573ff00a0011da0fc82bff1a06c2c86173d` (this document authored in the isolated worktree `docs/eng-p2-002-design-001`, branched cleanly from this SHA; the primary worktree at `/Users/theo/11THONUS` was left untouched).
- **Capability 2 (Customer Identity):** `Complete` — closed via `CAP-P2-G2-001` (2026-08-17); all four constituent concerns (Customer Identity, Authentication, `ENG-P2-004`, ITM) `Complete`.
- **Capability 3 (Business Identity):** `Not started`, awaiting fresh Founder authorization (`CDR-001` §8, `engineering-implementation-programme.md:284`). Constituent work packages: `ENG-P2-002` (business identity — create, owner, profile, branch), `ENG-P2-003` (staff identity — invite, membership, suspend/remove), `ENG-P2-004` (already `Complete`, shared with Capability 2), `ENG-P3-001..003` (Commerce Knowledge seed data, onboarding flow, Knowledge Studio).
- **`ENG-P2-002`:** `Blocked` (`coding-agent-prompt-register.md:52`). No implementation code exists anywhere in the repository (confirmed by repository-wide search — zero matches for `businessBranches`/`BusinessBranch` outside documentation; the only code touching the `businesses`/`businessMemberships` collections is `ENG-P2-004`'s narrow, read-only evaluator surface).
- **`ENG-P2-003`:** `Blocked`. Not designed by this package (§21 below explains why a separate `ENG-P2-003-DESIGN-001` is still expected).
- **This package's authorization:** design/architecture only, matching the same constraint pattern `ENG-P2-ARCH-001` and `ENG-P2-004-DESIGN-001` operated under.
- **[UPDATED 2026-08-17]** Founder dispositions recorded for FD-1/FD-2/FD-3 (§24). `ENG-P2-002` Status remains `Blocked` — this document still authorizes no implementation; a fresh Founder implementation authorization is required before `ENG-P2-002A` begins.

## 1. Authority & Provenance

This document is authorized as a **design package**, not an implementation package, under the same convention `ENG-P2-ARCH-001` (§12) and `ENG-P2-004-DESIGN-001` (title block) establish: it produces documentation only, inside `docs/`, and does not touch `functions/src`, Firestore Rules, CI configuration, or any decision record.

**What this document does:**
- Reconciles the `businesses`/`businessMemberships` schema already governed by TRD10 §10.6.3–10.6.4 against the current codebase (`functions/src/domains/permissions/models/businessDocument.ts`, `businessMembershipDocument.ts`) and the PRD/RTM text, flagging (not silently fixing) any mismatch.
- Investigates the `businessBranches` gap (§5) and records the Founder-approved minimum schema (FD-1, §24; originally proposed and flagged for confirmation at §17).
- Designs the business-creation **bootstrap** boundary against `ENG-P2-004`'s already-`Complete`, unmodified permission-evaluation contract (§10–§11), with the bootstrap mechanism now resolved (FD-2, §24).
- Recommends an implementation decomposition (`ENG-P2-002A`/`002B`/`002C`, §20) for a future, separately authorized implementation task.
- Records Founder dispositions for the three items originally raised as an evidence-grounded Founder Decision Register (§17, preserved as history) — see §24 for the recorded dispositions, with date and provenance.

**What this document explicitly does NOT do:**
- It does not authorize `ENG-P2-002A`, `002B`, or `002C` implementation. Each requires its own fresh Founder implementation authorization, exactly as every `AUTH-*` and `ENG-P2-004*` package required (`engineering-implementation-programme.md`, throughout).
- It does not modify `ENG-P2-004`'s evaluator, catalogue, override rule, or audit design — every reference to `ENG-P2-004` below is a **consumption** reference against the already-`Complete`, frozen contract (`ENG-P2-004-DESIGN-001` §6.1–§6.2, §8).
- It does not design the Customer Identity aggregate (already closed by `ENG-P2-ARCH-001`) or duplicate any of its boundary text.
- It does not design `ENG-P2-003` (Staff Membership) beyond the single minimum handoff contract §15 states is unavoidable (the initial Owner membership).
- It does not design Subscription/billing policy, Commerce Knowledge, or any frontend onboarding UI.
- It does not record a Decision Register disposition on `DEC-ID-004`, `DEC-ID-005`, `DEC-SEC-003`, `DEC-SUB-002`, `DEC-SUB-009`, or `DEC-UX-003` — those remain open in `decision-register.md`, unmodified. **[UPDATED 2026-08-17]** It now *does* record Founder dispositions on the three items this package itself raised (`businessBranches` schema authorship, bootstrap mechanism, `businessCode` generation) — see §24, recorded as an inline dated disposition in this design document, following the same convention `ENG-P2-004-DESIGN-001` §17 already established (not a new Decision Register entry, and not a reopening of any `DEC-*` item).
- It does not touch any file outside `docs/` and this document, the Engineering Implementation Programme, and `CDR-001`.

## 2. Scope & Boundary

### 2.1 What `ENG-P2-002` owns

Per the Programme's own description (`engineering-implementation-programme.md:159`, `:284`) and requirement traceability (`coding-agent-prompt-register.md:52`: `AP-003`, `AP-004`, `BR-007`, `BR-008`):

- The `Business` aggregate itself: creation, profile fields, lifecycle-state transitions that are within Capability-3 authority (§6), and the `businessCode`/`ownerUserId` identity binding.
- The **initial** Owner `BusinessMembership` created atomically alongside the business (§15) — creation only, not the ongoing staff-membership lifecycle.
- The `businessBranches` minimum architecture needed to satisfy `DEC-SUB-005`'s "one branch record created automatically or during onboarding" requirement (§5).
- Tenant-isolation enforcement for business-scoped reads/writes at the repository/query-surface level that `ENG-P2-004` does not already cover (§12).
- The bootstrap-authority design for the one operation that cannot itself be gated by `ENG-P2-004` because no business exists yet (§10).

### 2.2 What `ENG-P2-002` explicitly excludes

| Concern | Owned by | Why excluded here |
|---|---|---|
| Customer Identity Aggregate, Loyalty Number, QR, Identity Recovery | Customer Identity concern, `ENG-P2-ARCH-001` (`Complete`) | Already-closed, separate aggregate boundary; `ownerUserId` on `Business` is a *reference* to an existing Internal Customer ID, never a redefinition of it |
| Authentication (sign-in, sessions, providers) | Authentication concern, `AUTH-*` series (`Complete`) | `DEC-AUTH-001` D-A1 explicitly separates `AUTH-*` from `ENG-P2-002/003/004`; the business owner authenticates via the already-built Customer Authentication stream — no second auth system |
| Staff Membership lifecycle (invite, accept, suspend, remove; per-membership permission overrides beyond the one bootstrap Owner grant) | `ENG-P2-003` (not started) | `ENG-P2-004-DESIGN-001` §12.2 already states: "`ENG-P2-002`/`ENG-P2-003` (Capability 3) own *creating and mutating* `businessMemberships` records (invite, accept, suspend, remove...)" — ENG-P2-002's only membership-mutating action is the one bootstrap Owner grant (§15) |
| Permission evaluation, Sensitive Permission Catalogue, Override-Resolution Rule, audit mechanism | `ENG-P2-004` (`Complete`) | Frozen, consumed not modified (§10–§11) |
| Subscription/billing policy, plan entitlements, staff/branch/product limits (values) | Subscription domain (`DEC-SUB-*`, mostly `OPEN_FOUNDER`) | `Business.subscriptionId` is an optional reference field only (TRD10 §10.6.3); ENG-P2-002 never computes or enforces entitlement values (§13) |
| Commerce Knowledge (categories, taxonomy) | Commerce Knowledge domain, `ENG-P3-001` | `Business.primaryCategoryId`/`businessTypeId` reference Commerce Knowledge nodes; ENG-P2-002 stores the reference, never defines the taxonomy |
| Frontend onboarding flow/UI | `ENG-P3-002` (not started) | Backend contract only (§19) |

## 3. Principles

Derived only from already-governed text — no new product principle is invented:

1. **One business, one owner, at least one active owner always** (`BR-007`, TRD10 §10.6.4 Membership Rule: "A business must retain at least one active owner"). This is an invariant `ENG-P2-002` must enforce at creation and preserve through every lifecycle transition it owns.
2. **The Owner is an existing Customer/User identity, never a second identity system** (`AP-003`, "Separation of Customer and Business Identity" — read as: Business Identity is a *separate aggregate*, not a *separate person*; `ownerUserId` on `BusinessDocument` (TRD10 §10.6.3) is a reference into the already-`Complete` Customer/User identity space, exactly as `ENG-P2-ARCH-001` §2 frames Authentication references — a pointer, never a redefinition).
3. **Delegation flows from the Owner, never around them** (`AP-004`, "Business Ownership Controls Delegation"; `BR-008`, "Business owners control staff and manager access") — `ENG-P2-002` establishes the Owner as the root of delegation authority; it does not itself design the delegation mechanism (`ENG-P2-003`/`ENG-P2-004` own that).
4. **Business creation cannot require a permission inside the business it is creating** — a structural consequence of `ENG-P2-004-DESIGN-001` §6.9 step 3 ("look up the `businessMemberships` document... if none exists... deny"): before a business exists, no membership can exist, so the evaluator would deny by construction. Bootstrap must therefore be a distinct authority path (§10), never a call into the evaluator with a not-yet-existing `businessId`.
5. **Branch-ready, not branch-complete, at MVP** (`DEC-SUB-005`, CONFIRMED) — the architecture must not preclude future multi-branch operation, but MVP delivers exactly one branch per business.
6. **Reuse, never duplicate, platform infrastructure** — the same discipline `ENG-P2-004-DESIGN-001` §7.2/AD-3 applied to audit (reuse the shared outbox, don't build a second system) applies here to transactions, idempotency, and error taxonomy (§13, §18).
7. **Deny-by-default, fail-closed, no invented error category** — the same posture `ENG-P2-004-DESIGN-001` §6.10/§11 established; `ENG-P2-002` maps onto the existing closed 14-category taxonomy (`functions/src/shared/errors/errorCategories.ts`) without adding a 15th.

## 4. Business Aggregate / Current Schema Verification

### 4.1 TRD10 §10.6.3 `BusinessDocument` (verbatim structure, cited)

```
type BusinessDocument = {
  id: string;
  businessCode: string;
  legalName?: string;
  displayName: string;
  ownerUserId: string;
  primaryCategoryId: string;
  businessTypeId?: string;
  countryCode: string;
  currencyCode: string;
  timezone: string;
  city: string;
  address?: string;
  contactPhone: string;
  contactEmail?: string;
  logoUrl?: string;
  supportedLanguages: string[];
  status: "draft" | "pending_verification" | "trial" | "active" | "suspended" | "expired" | "closed" | "archived";
  subscriptionId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  schemaVersion: number;
};
```

### 4.2 Reconciliation against PRD3

PRD3 §4's eight lifecycle-state names (Draft, Pending Verification, Trial, Active, Suspended, Expired, Closed, Archived) match TRD10's `status` union **exactly**, word-for-word, in the same order. PRD3 §6's "Required Business Information" (Business Name, Business Category, Country, City, Business Phone, Owner, Subscription Plan, Business Address, Terms Acceptance; optional Website/Social/Logo/Description/Hours/Email/Tax/Registration Number) maps onto TRD10's fields as follows: `displayName`↔Business Name, `primaryCategoryId`↔Business Category, `countryCode`↔Country, `city`↔City, `contactPhone`↔Business Phone, `ownerUserId`↔Owner, `subscriptionId`↔Subscription Plan, `address`↔Business Address, `logoUrl`↔Logo (optional in both). **No mismatch found.**

**Gap, not mismatch:** PRD3 §6 lists "Terms Acceptance" and "Tax Number"/"Registration Number" as registration-flow fields; TRD10 §10.6.3 has no corresponding field (no `termsAcceptedAt`, `taxNumber`, `registrationNumber`). This is flagged, not silently resolved — a future TRD10 correction note may be needed once ENG-P2-002 is authorized to implement registration, but adding fields is outside this document's authority (§1).

### 4.3 Reconciliation against code

`functions/src/domains/permissions/models/businessDocument.ts` deliberately reads **only** `status` — its header states: "No other `BusinessDocument` field (`businessCode`, `ownerUserId`, etc.) is read or modeled here — 004B's evaluator has no use for them." This is not a discrepancy; `ENG-P2-004B` intentionally scoped its reader narrowly. **`ENG-P2-002` will need a full-shape `BusinessDocument` reader/writer** covering every field in §4.1 — this is new code the design decomposition (§20) accounts for, not a correction to existing code.

### 4.4 Reconciliation against RTM

`BR-007` ("A business shall always have at least one active owner") and `BR-008` ("Business owners control staff and manager access") — RTM (`requirements-traceability-matrix.md:209-210`) — both trace to TRD10 §10.6.4's Membership Rules and PRD1 §2's Core Access Principles, consistent with §4.1–4.2 above. RTM status for all `BR-027..036`/`FR-BO-001..015` rows is `Not Started`, consistent with §0's confirmation that zero implementation exists.

**Conclusion: no fabricated field, no unresolved contradiction between TRD10, PRD3, code, and RTM for the `businesses` collection itself.** The one true gap is `businessBranches` (§5).

## 5. `businessBranches` Investigation

**Finding: a hybrid of options (B) and (C) — resolved as (B).** The *policy* question is already Founder-decided; only the *data-architecture schema artifact* is missing.

### 5.1 Evidence the policy is already governed

- **`DEC-SUB-005` — Single branch at MVP; branch-ready architecture** (decision-register.md:733-742) is **CONFIRMED**: "MVP supports one operational branch per business (auto-created or onboarding-created); every Purchase Record and redemption references the branch; multi-branch operation deferred." Notes field: "multi-branch is `DEC-FUT-005`."
- **`DEC-FUT-005` — Multi-branch operation and franchises** (decision-register.md:1271) is **DEFERRED**: "Deferred to: Verified Business (Priority 4); data stays branch-ready (`DEC-SUB-005`)."
- **TRD23 §23.14 "Business Branch Scope"** restates the same policy in prose: "The data architecture is branch-ready. The Burundi MVP shall support: one operational branch per business; one branch record created automatically or during onboarding. Multi-branch operation, branch switching and consolidated branch reporting are deferred. The single launch branch shall still be referenced by Purchase Records and redemptions to preserve future compatibility."
- **PRD3 §9** ties this to plan tiers: Starter includes "Single branch"; Professional includes "Future multi-branch support" — confirming the product-level intent matches the technical decision.

### 5.2 Evidence the schema artifact is missing

- TRD10 §10.3 (top-level collection list, line 130) and §10.4 (ownership matrix, line 174) both list `businessBranches` as an Identity-owned collection ("Business location structure").
- **No `§10.6.x` subsection defines a `BusinessBranchDocument` type.** Every sibling Identity collection has one: `users` §10.6.1, `customerProfiles` §10.6.2, `businesses` §10.6.3, `businessMemberships` §10.6.4 — `businessBranches` alone has none (confirmed by a full section-heading scan of the file: `10.6.1`→`10.6.4`, then the next heading is `10.7.1`, no `10.6.5`).
- `purchaseRecords.branchId` (TRD10 §10.10.1) and `redemptions.branchId` (§10.12.2) are both required `string` fields with no format, cardinality, or foreign-key note beyond "string" — consistent with "referenced, never modeled."
- `subscriptions.branchLimit: number` (TRD10 §10.14.1) already anticipates plan-tier branch capacity, but nothing defines what a branch record itself contains.
- Zero code anywhere in `functions/src` reads or writes `businessBranches` (repository-wide grep, zero matches outside documentation).

### 5.3 Minimum architecture — Founder-approved MVP shape (FD-1, §24, recorded 2026-08-17)

**Resolved (FD-1, §24).** The shape below is the Founder-approved MVP `BusinessBranchDocument` — `ENG-P2-002B` implements against it directly. It supersedes the original proposal this section carried at v1.0, which additionally included `isPrimary`, `status`, and `timezone`; the Founder disposition (§24 FD-1) explicitly excludes all three from MVP (rationale: `isPrimary` is redundant while exactly one branch exists; `timezone` has no governed per-branch requirement distinct from the Business's own `timezone`; `status` would introduce an independent branch lifecycle that is not governed). Consistent only with what §5.1 already governs (auto-created, single-branch, `businessId`-scoped, referenced by `branchId`), no new product capability invented:

```
type BusinessBranchDocument = {
  id: string;                // immutable document identifier
  businessId: string;        // immutable tenant/Business reference (DAP-006)
  displayName: string;       // mutable; defaults to the business's own displayName at auto-creation (TRD23 §23.14)
  countryCode: string;       // required location context; initialized from the Business/onboarding authoritative value at creation
  city: string;               // required MVP branch-location field
  address?: string;          // optional MVP branch-location detail
  createdAt: Timestamp;
  updatedAt: Timestamp;
  schemaVersion: number;
};
```

This is the smallest Founder-approved shape that satisfies "one branch record created automatically" (TRD23 §23.14, per FD-1/FD-2's atomic-bootstrap disposition, §5.4) and gives `purchaseRecords.branchId`/`redemptions.branchId` something concrete to reference, without inventing multi-branch fields (no `parentBranchId`, no branch-level staff assignment, no branch-level reporting, no `isPrimary`, no independent `status` — all out of MVP scope per this disposition or explicitly `DEC-FUT-005` territory) and without inventing a `branchCode` (no such field is established anywhere in governance; §24 FD-3 explicitly does not establish a `branchCode` relationship). `isPrimary`, per-branch `timezone`, and an independent branch lifecycle `status` may be added later when actual multi-branch/lifecycle requirements are separately authorized (`DEC-FUT-005`).

### 5.4 Ownership and creation boundary

**Resolved (FD-1/FD-2, §24).** Branch auto-creation happens **inside the same atomic business-creation transaction** `ENG-P2-002B` designs (§13) — not a separate command, not a deferred onboarding-flow-UI step. TRD23 §23.14's literal wording ("created automatically **or** during onboarding") technically permitted reading "during onboarding" as a second, parallel MVP bootstrap path; the Founder disposition (§24 FD-1) resolves this ambiguity explicitly: onboarding-time creation is **not adopted as a second MVP bootstrap path**. Business creation must never leave a persistent `Business` with no branch — the auto-created branch is always part of the same bootstrap transaction as the business and its Owner membership (§13.1).

## 6. Business Lifecycle

TRD10 §10.6.3's eight `status` values, cross-referenced against PRD3 §4/§24/§25 and TRD18 §18.11–18.13, per transition:

| Transition | Allowed initiator | Preconditions | Reversible? | Downstream effect | Governed? | ENG-P2-002 ownership |
|---|---|---|---|---|---|---|
| — → `draft` | New Owner (via bootstrap, §10) | Authenticated Customer Identity exists (§10.3); no existing business with same `businessCode` | N/A (initial state) | None yet — business not operational | PRD3 §5 Step 2 ("Create business") | **Owns** — this is the bootstrap command |
| `draft` → `pending_verification` | Owner | Required registration fields complete (PRD3 §6 Mandatory list) | Yes, implicitly (owner may continue editing until submission — not explicitly governed either way) | None described | PRD3 §4 ("Required registration completed") | **Owns** |
| `pending_verification` → `trial` | System (platform verification, "where applicable" per PRD3 §4) | Verification step, if applicable — **not specified** which businesses require verification vs. proceed automatically | Not specified | Business may begin operating under trial rules (PRD3 §4) | Partially — PRD3 names the state, not the verification mechanism | **Owns the transition; does NOT own or invent the verification mechanism** (flagged gap, not designed here) |
| `trial` → `active` | System (subscription becomes valid) | Subscription plan selected and valid (PRD3 §5 Step 4; TRD10 `subscriptionId` populated) | Not specified | Business "fully operational" (PRD3 §4) | Yes, at the state-name level; trial *structure* (duration/volume) is `DEC-SUB-003`, `OPEN_FOUNDER` | **Owns the transition; does not own trial-length policy** |
| `active` → `suspended` | Platform administrator (TRD18 §18.12: "administrator authorization" required) **or**, per PRD1's role matrix, "Self-suspend only" by Owner (mechanism ungoverned, `DEC-ID-005`, `OPEN_FOUNDER`) | Administrator path: reason code, evidence, case reference (TRD18 §18.12) | Yes — "suspend or restore through governed workflows" (TRD18 §18.11) | Blocks new Purchase Records, staff access, Reward Program activation, subscription operations, public discovery (TRD18 §18.12); `ENG-P2-004`'s business-state gate (§4.1.1) already denies every permission the instant `status != active` | Administrator path governed (TRD18 §18.12); owner-self-suspend path **not governed** (`DEC-ID-005` open) | **Owns the `status` field/transition mechanics for the administrator path; explicitly excludes the owner-self-suspend variant** (§8) |
| `suspended` → `active` | Platform administrator (restore, TRD18 §18.11) | Governed workflow completion | N/A (this IS the reversal) | Restores full operation | Yes (TRD18 §18.11) | **Owns** |
| `active`/`trial` → `expired` | System (subscription lapse) | Subscription ends (PRD3 §4) | Not specified — likely reactivatable via re-subscription, not stated | "Operational features disabled" (PRD3 §4) | Named, mechanism not detailed | **Owns the transition; does not own subscription-lapse detection** (Subscription domain's responsibility to signal it) |
| any → `closed` | Owner (customer-requested) or administrator | "Closing a business shall prevent new purchases, prevent new rewards" (PRD3 §25); `BR-034` "Closing a business never deletes customer identity" | No — "permanently closed" (PRD3 §4) | Retain commercial history, audit history (PRD3 §25, `BR-035`) | Yes (PRD3 §25) | **Owns** |
| `closed` → `archived` | System (retention-period elapse, mirroring the same pattern `ENG-P2-ARCH-001` §3 uses for Customer Identity's `Closed`→`Archived`) | Retention period elapses | No (terminal) | "Historical records retained. No operational activity." (PRD3 §4) | Yes (PRD3 §4, by direct analogy to the already-governed Customer Identity pattern) | **Owns** |

**Explicit statement of ungoverned gaps** (not invented, flagged): (a) the exact verification mechanism gating `pending_verification`→`trial` is never specified beyond "where applicable"; (b) owner-initiated self-suspension has no governed workflow (`DEC-ID-005`, §8); (c) `expired` re-activation is never described. `ENG-P2-002` should implement the state *field* and the transitions that already have a governed initiator/effect, and explicitly not invent the ungoverned mechanisms.

## 7. Owner Model

- **One `Business`, one `ownerUserId`** (TRD10 §10.6.3) — a single required field, not an array, not a role list. This is the structural expression of `BR-007`'s "always... one active owner" combined with the Owner-floor invariant `ENG-P2-004-DESIGN-001` §3.6 already assumes exists upstream of it ("operationalizes the existing 'a business must retain at least one active owner' rule").
- **The Owner is an existing Customer/User identity** — `ownerUserId` is a reference into the Customer Identity Aggregate (`ENG-P2-ARCH-001` §2's Internal Customer ID), never a new identity type. There is no separate "business-auth principal" anywhere in governed schema — `AP-003`'s "Separation of Customer and Business Identity" separates the *aggregates* (Business vs. Customer), not the *person*: the same authenticated individual who has a Customer Identity becomes a Business's Owner by having a `businessMemberships` record with `role: "owner"` pointed at both their `userId` and the new `businessId`.
- **Owner membership relationship to `businessMemberships`**: exactly one `active`, `role: "owner"` membership must exist per business at all times (TRD10 §10.6.4 Membership Rule; `ENG-P2-004-DESIGN-001` §3.6 Owner floor). `ENG-P2-002` creates this membership once, at business-creation time (§15); it does not otherwise mutate memberships.
- **Minimum-one-active-owner invariant**: already governed (`BR-007`, TRD10 §10.6.4). `ENG-P2-002` must never create a business without simultaneously creating its Owner membership, and (per §15) any future transfer/removal workflow — explicitly out of scope here — would have to preserve this invariant too.
- **Atomicity of Business + Owner-membership creation**: **not previously governed as an explicit requirement anywhere** (no TRD10/PRD3 text states "these two writes must be atomic") — but it follows necessarily from `BR-007` read together with DAP-006 (Business Isolation, TRD10 §10.2) and the Owner-floor invariant: a business that transiently exists with zero owners violates `BR-007` even for a moment. §13 designs this as a single Firestore transaction, consistent with the platform's existing transactional-write conventions (`AUTH-03`'s registration atomicity, `functions/src/shared/outbox/outboxWriter.ts`'s same-transaction discipline).

## 8. DEC-ID-005 Analysis (Owner-Initiated Business Self-Suspension)

`DEC-ID-005` is `OPEN_FOUNDER` (decision-register.md:588-600). PRD1's role matrix (`01-accounts-roles-and-permissions.md:573`) already promises "Self-suspend only" in the Owner row for "Suspend business," but no workflow is defined anywhere — TRD18 §18.12 specifies only the *platform-administrator* suspension workflow (case-record, evidence, administrator authorization), and PRD3 §24 lists "Business request" only as one *reason code* an administrator might act on, not a self-service mechanism.

**Five-question analysis (options and recommendation only — no disposition recorded):**

1. **Does `ENG-P2-002` need to build owner self-suspension now?** No governed workflow exists to implement against; DEC-ID-005 has no Final decision text, only two named options ("(a) MVP supports owner pause... (b) defer to post-MVP, owner contacts support"). **Recommendation: not in ENG-P2-002's initial scope** — build the `suspended` state (administrator-reachable, §6) without the owner-facing trigger.
2. **What would the effects be if built?** DEC-ID-005's own Option (a) text: "blocks new records, preserves history/rewards per suspension rules" — this maps onto the *same* `suspended` `BusinessDocument.status` value every other suspension path already uses (§6); no second status value is implied by either option.
3. **Is it reversible?** Not specified by DEC-ID-005 itself. TRD18 §18.11 implies administrator-triggered suspensions are "restore[d] through governed workflows" — an owner-triggered pause would need its own resume rule, undesigned.
4. **Which actor/permission model would apply if built?** Structurally similar in shape to `business.transferOwnership` (Owner-only, high blast radius on the business's own operability) — but it is **not** in `ENG-P2-004-DESIGN-001`'s 8-row Sensitive Permission Catalogue (§3.2) today. Adding it would follow the catalogue's own extension mechanism (§3.9, "amending this catalogue's table under the same test via the normal documentation-governance change process") — not something `ENG-P2-002` may add unilaterally, since that would reopen `ENG-P2-004`'s frozen catalogue.
5. **Is this a blocker to `ENG-P2-002` closing?** No. The minimum viable business lifecycle (§6) — draft→pending_verification→trial→active, plus administrator-driven suspended/expired/closed/archived — does not require the self-suspend button. Recommendation: defer `DEC-ID-005` to whichever future package first builds a live "Suspend business" UI surface (most plausibly a Business-Operations/Capability-7 concern), not `ENG-P2-002`.

**Resolved — scope boundary confirmed (§24, "Other Design Dispositions" item 1, recorded 2026-08-17).** The Founder confirms owner-initiated self-suspension is **not** pulled into `ENG-P2-002A`; `ENG-P2-002` implements `suspended` as an administrator/system-reachable state only (§6), and does not invent the owner-facing trigger. **This is a scope-boundary confirmation for `ENG-P2-002`, not a `DEC-ID-005` Decision Register disposition** — `DEC-ID-005` itself remains `OPEN_FOUNDER` in `decision-register.md`, unmodified and unresolved by this design package.

## 9. Ownership Transfer Disposition

**Recommendation: explicit deferral for Capability-3 MVP — not required for `ENG-P2-002` to close.**

- `business.transferOwnership` **already exists** as a governed Sensitive Permission Catalogue entry (`ENG-P2-004-DESIGN-001` §3.2 row 3, implemented in `functions/src/domains/permissions/models/sensitivePermissionCatalogue.ts:104`): "Reassign the Owner role," Owner-only, not grantable, mandatory audit.
- **AD-1 (§17 of `ENG-P2-004-DESIGN-001`) already ruled out dual control** for MVP, explicitly citing this exact permission as the example future dual-control candidate: "No dual-control state machine... is designed anywhere in this package... Dual control remains a possible future addition, most plausibly attached to a future ownership-transfer workflow once one is actually built, and would require its own decision record at that time."
- No PRD/TRD/RTM text anywhere describes an actual transfer *workflow* (target-user resolution, atomic old-owner-demotion + new-owner-promotion, minimum-one-owner preservation during the transition window). `BR-007` constrains any future design but does not supply one.
- Nothing in `CDR-001`'s Capability 3 definition or the Programme's `ENG-P2-002`/`ENG-P2-003` rows lists ownership transfer as in scope.

**Recommendation:** `ENG-P2-002` preserves the existing `business.transferOwnership` identifier and the single-`ownerUserId` model exactly as already governed — no change needed, since it is already correctly modeled upstream in the (frozen) permissions domain — and does not design or implement a transfer command. This defers the workflow to a future package that would also need to resolve `DEC-ID-005`-adjacent questions (is a dual-control/second-approver step warranted for an ownership change specifically, revisiting AD-1's own stated reopening condition).

**Resolved — scope boundary confirmed (§24, "Other Design Dispositions" item 2, recorded 2026-08-17).** The Founder explicitly defers the Business ownership-transfer workflow; the single current `ownerUserId` and the `business.transferOwnership` sensitive-permission identifier are preserved unchanged, with the future ability to add a governed workflow left open. No dual control is designed, consistent with AD-1. Ownership transfer is not implemented in `ENG-P2-002A`/`002B`/`002C` unless separately authorized later.

## 10. Bootstrap Authority Integration with `ENG-P2-004`

### 10.1 The structural problem

`ENG-P2-004-DESIGN-001` §6.9's evaluation algorithm, step 3: "Look up the `businessMemberships` document for `(userId, businessId)`; if none exists... → deny." Business creation is, by definition, the operation that brings the first `businessMemberships` document (the Owner's) into existence for a not-yet-existing `businessId`. Calling the evaluator with a `businessId` that has no `businesses` document yet would hit step 2 first ("look up the business record; if inactive/suspended → deny") — either way, the evaluator **cannot** authorize business creation, by construction, and must not be asked to.

### 10.2 Operation classification

| `ENG-P2-002` operation | Classification | Authority source |
|---|---|---|
| Business creation (`draft` bootstrap, §15) | **Bootstrap command — pre-permission** | Authenticated Customer Identity only (§10.3); never calls the evaluator |
| Initial Owner membership creation (same transaction as above) | **Bootstrap command — pre-permission** | Same as above — the membership being created is the membership a later evaluator call would check for |
| Profile updates (`displayName`, `contactPhone`, etc.) on an existing business | **Owner-authorized** | `ENG-P2-004` evaluator, ordinary role-default permission (non-sensitive; no such permission id exists in the catalogue today — would inherit via role default like any other non-sensitive business-admin action, `ENG-P2-004-DESIGN-001` §6.6) |
| Lifecycle transitions this document assigns to "Owner" (§6) | **Owner-authorized** | `ENG-P2-004` evaluator |
| Lifecycle transitions assigned to "Platform administrator" (§6) | **Platform/admin-authorized** | Administration domain's own authority path (TRD18 §18.8–18.9, `DEC-SEC-002` Administrator MFA) — out of `ENG-P2-004`'s Business-role evaluator scope entirely, consistent with `ENG-P2-004-DESIGN-001` never modeling an admin role in its catalogue |
| Branch auto-creation (§5.4) | **Bootstrap command — pre-permission** (same transaction as business creation) | Same as business creation |

**No `ENG-P2-002` operation is "manager/staff-authorized"** — nothing in TRD10 §10.6.3's `BusinessDocument` fields or PRD3's business-registration flow names a manager/staff action on the business aggregate itself (staff act on *customers*/*purchases*, not on the business record). This is consistent with `ENG-P2-004-DESIGN-001` §12.4's own statement that staff invitation/override UI is `ENG-P2-003`/Capability-3 frontend scope, not this aggregate.

### 10.3 Bootstrap authority design

**Resolved (FD-2, §24, recorded 2026-08-17).** Business creation uses a **dedicated bootstrap command/service** — the same endpoint-service architecture already established and merged for `AUTH-03` (`functions/src/domains/authentication/services/authenticationEndpointService.ts`: a plain, dependency-injected function, testable without the Functions runtime, composing a domain orchestration function, with `index.ts` supplying the `onCall` transport seam). No exception, special case, or new branch is added to `ENG-P2-004`'s evaluator.

The bootstrap authority model, in order:

1. The request arrives through the normal authenticated callable boundary.
2. Firebase/authentication establishes the principal — a verified Firebase-Authentication-resolved `userId` must exist (the same `AIR-001` one-UID-to-one-platform-user resolution `ENG-P2-004-DESIGN-001` §6.3 already consumes, not redefines).
3. The authoritative Customer Identity is resolved server-side — the authenticated `userId` must resolve to an existing, non-`closed`/non-`archived` Customer Identity (`ENG-P2-ARCH-001` §3) via the Customer Identity concern's own repository — read-only consumption, no modification.
4. `ownerUserId` is derived server-side from that identity — the client cannot choose or override it (§11).
5. `ENG-P2-004` is **not** invoked to authorize creation of a Business that does not yet exist — because no `businessMemberships` document can exist yet for a business that does not yet exist, no permission check is required or possible; authority is "any authenticated Customer Identity may create a business and become its Owner," which is exactly what PRD3 §5 Step 1–2 already describes ("Create owner account (or sign in)... Create business").
6. The bootstrap command establishes the first valid Business context (business + Owner membership + branch, atomically, §13.1).

This resolves the choice this section originally posed as an open "Option A vs. Option B" architecture question (`ENG-P2-004`-evaluator-internal exception vs. dedicated pre-permission command) — Option A (dedicated command) is adopted, and no evaluator-internal exception is designed or authorized.

## 11. Bootstrap Security

- **Authenticated principal requirement**: mandatory (§10.3.1) — no anonymous/unauthenticated business creation, matching every other identity-mutating command in the codebase (`AUTH-03`'s registration orchestration pattern).
- **Customer Identity requirement**: mandatory (§10.3.2) — a business cannot be owned by a principal with no Customer Identity, since `ownerUserId` (TRD10 §10.6.3) has no meaning otherwise.
- **`ownerUserId` binding — client-supplied identity must never become authority merely because supplied**: the bootstrap command must derive `ownerUserId` from the **server-verified authenticated principal**, never from a client-supplied field in the request body — the same pattern `ENG-P2-004-DESIGN-001` §5.4/§9 abuse case 1 already establishes for `businessContextId` ("the client value is never trusted"). A request body that includes an `ownerUserId` field differing from the authenticated principal must be rejected (`VALIDATION_FAILED` or `AUTH_FORBIDDEN`, §18), never silently honored or silently overwritten without rejection.
- **Replay/idempotency**: the bootstrap command must use the same client-supplied idempotency-key discipline already established for other identity-mutating commands (`AUTH-03`'s "credential-keyed registration with durable id recovery," `TRD11 §11.17/§11.34`) — a retried business-creation request with the same idempotency key must return the same result, not create a second business.
- **Duplicate-business considerations**: `businessCode` uniqueness is now governed (FD-3, §24) — server-generated, globally unique, opaque, transactionally reserved as part of business creation (bounded collision retry, same category `DEC-DATA-007` established for the Loyalty Number, adopted independently for `businessCode` by this Founder disposition, not by `DEC-DATA-007` itself). Nothing in PRD3 limits one owner to one business — PRD3 §28 (referenced by `DEC-SUB-009`) explicitly discusses "one owner with several businesses," and `BR-097` (cited by `DEC-SUB-009`) confirms "businesses isolated per owner" — so one Customer Identity creating multiple businesses is allowed by governance; the bootstrap command must not artificially block it.
- **Transaction boundary**: business document write (including the transactionally-reserved `businessCode`, FD-3) + Owner membership document write + branch auto-creation write (FD-1) must be one atomic Firestore transaction (§13) — a partial write (business exists, no owner; or owner exists, no branch) would violate `BR-007` and `DEC-SUB-005` simultaneously.
- **Audit/event requirement**: a `BusinessCreated` (or equivalently named) domain event, emitted via the existing shared outbox in the same transaction (§13.3, reusing `functions/src/shared/outbox/outboxWriter.ts`'s pattern exactly as `AUTH-08`/`ENG-P2-004C` already do) — this is the natural business-identity analogue of `CustomerIdentityRegistered` (`ENG-P2-001`). This event name/contract is a design-level recommendation, not a pre-existing governed name (§14, §24 item 4).
- **Partial-failure handling**: Firestore transactions are all-or-nothing by platform guarantee — a failed transaction leaves no partial state; the caller must surface a retryable error (`TEMPORARY_UNAVAILABLE`, §18) on transient infrastructure failure, never a partially-created business.

## 12. Tenant Isolation

- **What `ENG-P2-004` already enforces** (consumed, not re-implemented): every *permission-gated* business-scoped operation (profile update, owner-authorized lifecycle transition) is isolated per `ENG-P2-004-DESIGN-001` §5.6's structural cross-business isolation rule — the evaluator's only membership input is the single record resolved for the requested `businessId`; no union across a user's memberships. `ENG-P2-002` inherits this for free on every operation that goes through the evaluator (§10.2).
- **What `ENG-P2-002`'s own repositories/query surfaces must additionally enforce** (not covered by the evaluator, since these operations either predate a membership existing or are list/enumeration queries the evaluator's single-record model does not address):
  - **Business lookup by id**: must not leak existence/non-existence differently to an unauthorized caller than to an authorized one — same enumeration-resistance posture `ENG-P2-004-DESIGN-001` §9 already establishes ("never revealing whether a business/membership exists to an unauthorized caller").
  - **Branch lookup**: must filter by the requesting context's `businessId`, never return another business's branch by guessable id.
  - **List-my-businesses (owner context)**: a query over `businessMemberships` filtered by the authenticated `userId`, returning only businesses where an `active` membership exists for that user — this is a **new** query pattern `ENG-P2-002`/`ENG-P2-003` introduce (no `ENG-P2-004` evaluator call needed, since it's a listing operation over the user's own memberships, not a single business-context permission check) — must never accept a client-supplied `userId` parameter (same principle as §11's `ownerUserId` binding).
  - **Cross-business enumeration resistance**: sequential/guessable `businessId`s must not allow probing (DAP-005/§10.5's "IDs shall be opaque and non-sequential" requirement, TRD10 §10.5, already governs this at the ID-generation level — `ENG-P2-002` must follow it, not re-derive it).

## 13. Transaction/Consistency Model

Reuses existing platform patterns exclusively — no second transaction/idempotency/outbox infrastructure is proposed, per `ENG-P2-004-DESIGN-001` §7.2/AD-3's own precedent and this document's Principle 6 (§3).

1. **Business creation transaction**: one Firestore transaction containing (a) `businessCode` transactional uniqueness reservation and the `businesses/{id}` document write (FD-3, §24), (b) the `businessMemberships/{id}` Owner-membership write, (c) the `businessBranches/{id}` auto-created branch write per the Founder-approved MVP shape (§5.3, §5.4, FD-1), (d) the outbox entry write (§13.3) — all in the same `transaction.set(...)` calls, mirroring the exact pattern `functions/src/shared/outbox/outboxWriter.ts`'s own header comment describes: "a future domain command handler combines its own domain write with this call in one transaction."
2. **Lifecycle transitions**: each transition (§6) is its own transaction, re-reading current `status` inside the transaction before writing the new one — the same TOCTOU discipline `ENG-P2-004-DESIGN-001` §6.13/§10.8 already requires of any protected mutating command ("protected mutating actions must re-verify authorization state within their own transaction rather than trusting a prior decision").
3. **Audit/outbox events**: reuse `functions/src/shared/outbox/outboxWriter.ts`'s `writeOutboxEntry(transaction, db, event)` function directly — the same durable-awaited, deterministic-`eventId`, same-transaction-as-the-domain-write discipline `AUTH-08` and `ENG-P2-004C` already established. No new outbox collection, no new processor.
4. **Idempotency**: reuse the existing idempotency-key pattern already established for other identity-mutating commands (`AUTH-03`'s credential-keyed registration idempotency, TRD11 §11.17/§11.34) — a business-creation request idempotency key derived from the client's request, checked before the transaction runs, returning the prior result on replay rather than creating a duplicate.
5. **Branch creation, if in scope**: covered by transaction item 1(c) above — not a separate transaction, since §5.4 requires it be atomic with business creation, not a follow-up step.

## 14. Events/Audit

**Clarified (§24 item 4, recorded 2026-08-17).** `BusinessCreated` and the per-transition lifecycle event names below are **design-level recommendations and contracts, not pre-existing named governed events** — verified: no PRD/TRD/RTM text names them. Their exact event contract (payload shape, precise name) may be finalized during `ENG-P2-002B` using the existing shared outbox conventions, the same way every other domain event in this codebase (`CustomerIdentityRegistered`, `IdentityRecovered`, etc.) was named and shaped during its own implementation package rather than pre-approved by a named Founder decision. No additional Founder decision is required for this, unless implementation uncovers a new product/governance semantic.

Only events actually required by already-governed architecture — no invented catalogue:

- **`BusinessCreated`** (or equivalently-named event) — the direct business-identity analogue of `CustomerIdentityRegistered`, required by the same "every domain write should be observable via the shared outbox" convention already established throughout `ENG-P2-001`/`AUTH-08`/`ENG-P2-004C`. Payload: `businessId`, `ownerUserId`, `createdAt`, `status: "draft"` — no PII beyond identifiers already treated as operational elsewhere (matching `ENG-P2-004-DESIGN-001` §7.3's own payload-minimization precedent).
- **Lifecycle-transition events**, one per governed transition in §6 that `ENG-P2-002` owns — mirroring the granularity `ENG-P2-004-DESIGN-001` §7.1 uses for permission decisions ("every decision on a sensitive permission is audited"): here, every business-state transition is operationally significant and should be observable, though **not** every transition rises to the "mandatory sensitive-permission audit" tier `ENG-P2-004` defines — ordinary structured logging (TRD11 §11.36) suffices for non-sensitive transitions; only `business.transferOwnership` (§9, deferred) would warrant the mandatory-audit tier if ever built, per its existing catalogue entry.
- **No new audit *subsystem*** — every event above is emitted via the existing shared outbox (`functions/src/shared/outbox/outboxWriter.ts`), exactly as §13.3 states.

## 15. Business Membership Handoff to `ENG-P2-003`

**Yes — business creation creates the initial Owner membership**, atomically, in the same transaction (§13.1). This is the one membership-mutating action `ENG-P2-002` performs; everything else about the membership lifecycle (invite, accept, suspend, remove additional Manager/Staff memberships) is `ENG-P2-003`'s exclusive responsibility, per `ENG-P2-004-DESIGN-001` §12.2's own boundary statement.

**Minimum contract `ENG-P2-003` may assume after `ENG-P2-002` closes:**
- Every `Business` document that exists has exactly one `active`, `role: "owner"` `businessMemberships` record, created atomically with the business itself (§7, §13.1).
- The Owner membership's shape matches TRD10 §10.6.4 exactly, including the corrected `permissions` encoding (`ENG-P2-004D`'s 2026-08-15 correction — `Array<{permissionId, direction, grantedBy, grantedAt}>`) — `ENG-P2-002` must not invent a different encoding for the one membership it creates.
- The Owner membership's `permissions` array is **empty at creation** — the Owner's full sensitive-permission set comes from the structural Owner-floor invariant (`ENG-P2-004-DESIGN-001` §3.6), never from explicit overrides `ENG-P2-002` would have to populate.
- `ENG-P2-003` (staff invite/accept/suspend/remove) never needs to create the *first* membership of a business — that precondition is always already satisfied by the time `ENG-P2-003` runs.

**Atomic consistency boundary**: the Owner-membership creation is inside `ENG-P2-002`'s own bootstrap transaction (§13.1), not a follow-up call into any future `ENG-P2-003` command — `ENG-P2-003`'s own atomicity concerns (invite→accept as a separate two-step flow, its own idempotency) begin only *after* this handoff point and are not designed here.

## 16. `ENG-P2-004` Integration

Already covered in full in §10 (bootstrap classification) and §12 (tenant isolation) — this section confirms no `ENG-P2-004` file is modified. `ENG-P2-002` is a **consumer** of the frozen `AuthorizationRequest`/`AuthorizationDecision` contract (`ENG-P2-004-DESIGN-001` §6.1–6.2, explicitly named in §12.1 of that document as the contract that "must be stable before Capability 3 starts"). Every owner-authorized operation in §10.2's table calls the evaluator exactly as any other protected command would (`ENG-P2-004-DESIGN-001` §6.16's "single shared server-side service, callable only from trusted Cloud Function contexts"); the bootstrap operations (§10.3) are the sole exception, by structural necessity (§10.1), not by choice.

## 17. Founder Decision Register (Original, v1.0) — RESOLVED, see §24

**Preserved unmodified as history.** All three items below are now resolved — see §24 for the recorded Founder dispositions (FD-1/FD-2/FD-3), dated and attributed. This section is retained exactly as originally drafted so the options/recommendation trail that led to the disposition remains visible; it is no longer the current authority on these three items.

Only decisions that materially **block** `ENG-P2-002` implementation. Three items — deliberately narrow, since most of the open decisions this investigation touched (`DEC-ID-004`, `DEC-SEC-003`, `DEC-SUB-002`, `DEC-SUB-009`, `DEC-UX-003`, `DEC-ID-005`) are safely deferred to later packages (§8, §18). **No disposition is recorded for any item below — options and a recommendation only, per this task's explicit constraint.**

| # | Decision | Governing context | Options | Recommendation | Package blocked | Consequence of deferral | Reversibility |
|---|---|---|---|---|---|---|---|
| FD-1 | Authorize the proposed minimum `BusinessBranchDocument` schema (§5.3) as the shape `ENG-P2-002B` implements against | `DEC-SUB-005` (CONFIRMED) already settles the *policy*; TRD10 has no `businessBranches` document-schema subsection at all (§5.2) | (a) Adopt §5.3's minimum shape as proposed, add it to TRD10 as a companion correction note (the same pattern `ENG-P2-004D`'s 2026-08-15 `businessMemberships.permissions` correction used); (b) request a different minimum shape; (c) treat branches as fully out of `ENG-P2-002`'s MVP scope and use a bare `branchId` string with no backing document until `DEC-FUT-005` is addressed | (a) — smallest shape that satisfies the already-confirmed policy, no new capability invented, follows an established correction-note precedent | `ENG-P2-002B` (creation/persistence — needs a branch document shape to write) | If undecided, `ENG-P2-002B` cannot create the auto-branch `DEC-SUB-005`/TRD23 §23.14 require, stalling the whole creation command | Fully reversible — a documentation-only schema note, no data exists yet |
| FD-2 | Bootstrap authority mechanism shape: evaluator-internal exception vs. dedicated pre-permission command path (§10.3) | `ENG-P2-004-DESIGN-001` §6.9's evaluator is frozen and Complete; bootstrap cannot call it as-is (§10.1) | (a) Dedicated bootstrap command that never calls the evaluator at all, authority resting solely on §10.3's three checks; (b) a narrowly-scoped, explicitly-named exception path recognized inside the evaluator's own call surface for the single "create business" operation | (a) — keeps `ENG-P2-004`'s evaluator completely unmodified (this document's own constraint, §1), avoids adding a special case to an already-`Complete`, security-reviewed component | `ENG-P2-002B` | If undecided, `ENG-P2-002B`'s creation-command authority boundary is ambiguous, risking an implementer inventing a shortcut that weakens `ENG-P2-004`'s frozen guarantees | Fully reversible — purely an implementation-shape choice, no data/schema consequence |
| FD-3 | `businessCode` generation and uniqueness authority | TRD10 §10.6.3 requires `businessCode: string` on every `BusinessDocument`; no PRD/TRD text specifies its generation algorithm or uniqueness mechanism (unlike `loyaltyNumber`, which has `DEC-DATA-007`) | (a) Platform-generated opaque code at creation time, transactional-uniqueness check mirroring `DEC-DATA-007`'s approach for Loyalty Numbers; (b) owner-chosen human-readable code (would need format/collision/change-policy rules); (c) derive deterministically from `displayName` + disambiguator | (a) — mirrors the one directly analogous already-governed precedent (`DEC-DATA-007`), least product-policy surface to invent | `ENG-P2-002B` | If undecided, the creation command cannot populate a required field, blocking implementation entirely | Fully reversible before any business exists; would require a migration note if resolved after data exists |

## 18. Error Taxonomy Mapping

Mapped onto the existing closed 14-category taxonomy (`functions/src/shared/errors/errorCategories.ts`, TRD11 §11.35) — **no new category is introduced**, following `ENG-P2-004-DESIGN-001` §11's own precedent and AD-4's explicit instruction that a data-integrity/edge condition should be remapped onto an existing category before a new one is ever proposed.

| `ENG-P2-002` condition | Taxonomy code | Rationale |
|---|---|---|
| Unauthenticated bootstrap attempt | `AUTH_REQUIRED` | Matches `ENG-P2-004-DESIGN-001` §11's own mapping for "no verified `userId`" |
| Authenticated but no Customer Identity resolvable | `AUTH_REQUIRED` | Same category as identity-resolution failure elsewhere (`ENG-P2-004-DESIGN-001` §11 "Identity unavailable / resolution failure") |
| Client-supplied `ownerUserId` differs from authenticated principal | `VALIDATION_FAILED` | Client-fixable input error — send a request without the mismatched field, matching AD-4's client-input-vs-server-data distinction |
| Invalid lifecycle transition (e.g., `active`→`trial` requested) | `INVALID_STATE_TRANSITION` | Category exists specifically for this in the closed taxonomy (`errorCategories.ts:15`) — reused directly, not remapped |
| Business not found (lookup by id) | `RESOURCE_NOT_FOUND` | Existing category (`errorCategories.ts:21`), reused directly |
| Business inactive/suspended (any operation gated by business state) | `BUSINESS_INACTIVE` | Existing category (`errorCategories.ts:13`) — the same code `ENG-P2-004`'s own business-state gate already uses (`ENG-P2-004-DESIGN-001` §11) |
| Duplicate/idempotency-key conflict on business creation | `IDEMPOTENCY_CONFLICT` | Existing category (`errorCategories.ts:19`), reused directly |
| Malformed/incomplete registration request | `VALIDATION_FAILED` | Existing category, ordinary client-input validation |
| Permission denied on an owner-authorized operation (non-bootstrap) | `AUTH_FORBIDDEN` | Delegated entirely to `ENG-P2-004`'s evaluator output — `ENG-P2-002` never computes this itself (§10.2) |
| Business/branch limit reached (subscription-tier enforcement) | `SUBSCRIPTION_LIMIT_REACHED` | Existing category (`errorCategories.ts:14`) — reused when `ENG-P2-002` consumes a Subscription-domain-supplied limit value (§13's boundary — `ENG-P2-002` does not compute the limit, only surfaces the denial) |
| Transient Firestore/infrastructure failure during bootstrap transaction | `TEMPORARY_UNAVAILABLE` | Existing category (`errorCategories.ts:22`), matching `ENG-P2-004`'s own transient-failure mapping (`businessRepository.ts`'s `"transient_failure"` internal kind → this client-facing code) |
| `businessCode` collision-retry bound exhausted (FD-3, §24) | `TEMPORARY_UNAVAILABLE` | Never surfaced as a caller-visible defect — a customer-invisible retry, same posture `DEC-DATA-007` established for the Loyalty Number ("an exceeded-retry event signals the codespace needs future expansion, not a design defect"), adopted independently for `businessCode` by this disposition |

**No condition encountered in this analysis required escalation for a 15th category** — every case maps onto the existing set without misclassification (the same care AD-4 in `ENG-P2-004-DESIGN-001` §11 modeled for the configuration-integrity mapping).

## 19. Frontend/Localization Boundary

- **EN/FR i18next infrastructure confirmed present**: `apps/web/src/i18n/` exists and is exercised by tests (`i18n.test.tsx`, and `SignInPanel.i18n.test.tsx` demonstrating the pattern already in production use for Authentication copy), consistent with `I18N-001`'s MERGED status (per the caller's own resume-state memory and the file's existence) — `ENG-P2-002`'s eventual frontend slice (owned by `ENG-P3-002`, out of scope here) can reuse this foundation directly; no new localization infrastructure is needed.
- **Backend contract needed for future onboarding UI** (not designed here, only identified): the bootstrap command (§10.3) needs a stable request/response shape — request: registration fields per PRD3 §6 (mandatory + optional), idempotency key; response: created `businessId`, initial `status: "draft"`, the auto-created `branchId` (§5.4). This shape is the seam `ENG-P3-002`'s onboarding UI will call against; its exact field-level contract is an `ENG-P2-002A`/`002B` implementation-level artifact, not fixed by this design document.

## 20. Implementation Decomposition

The prompt's starting hypothesis (`ENG-P2-002A` domain contracts/lifecycle, `002B` creation/persistence + owner bootstrap, `002C` profile/branch management) is **adopted with minor refinement** — evidence from this repo's own successful decomposition precedents (`ENG-P2-001`'s ten packages, `ENG-P2-004`'s four sub-packages A–D) supports a contracts-first, then-bootstrap, then-management split; refined only by folding branch *auto-creation* into `002B` (since §5.4/§13.1 require it be atomic with business creation, not a separable later step) while leaving branch *management* (any future update/list operations beyond the single auto-created record) in `002C`.

- **`ENG-P2-002A` — Business & Branch Domain Contracts.** **Responsibility:** `BusinessDocument`/`BusinessBranchDocument` value types and readers/writers (full shape, unlike `ENG-P2-004B`'s narrow status-only reader, using the Founder-approved MVP branch shape, §5.3), the lifecycle-state machine (§6, transitions this document owns only), domain-local errors reusing the closed taxonomy (§18), the `businessCode` value-object contract and policy constants (FD-3, §24 — opaque/non-sequential/immutable properties as a typed contract; literal alphabet/length/retry-bound delegated to Engineering Lead per the same disposition), the bootstrap request/response contract shape (§19). **Inputs:** TRD10 §10.6.3 (as-is) + the Founder-approved branch schema (§5.3, FD-1) + the `businessCode` policy (§24, FD-3). **Outputs:** pure contract/config layer, no runtime persistence, mirroring `ENG-P2-004A`'s own acceptance boundary ("this package is pure contract/config... no evaluator exists to call them yet"). **Dependencies:** none beyond the already-`Complete` Customer Identity concern (consumes the Internal Customer ID as `ownerUserId`'s reference type) and the already-`Complete` `ENG-P2-004` (consumes, does not modify, its permission-identifier/contract shapes). **Exclusions:** no Firestore reads/writes, no transaction logic, no bootstrap-authority enforcement yet, no literal `businessCode` alphabet/length decision (Engineering Lead, during this package, per FD-3). **Acceptance boundary:** contracts exist, are versioned, independently reviewable; no live business can yet be created. **Test strategy:** unit tests only, mirroring `ENG-P2-004A`'s own test shape (construction-time validation, state-machine transition-table coverage).
- **`ENG-P2-002B` — Business Creation, Owner Bootstrap & Persistence.** **Responsibility:** the atomic creation transaction (§13.1: `businessCode` reservation + business + Owner membership + auto-branch + outbox event), the dedicated bootstrap command/service per the AUTH-03 endpoint-service pattern (FD-2, §24, §10.3), bootstrap security enforcement (§11), tenant-isolation enforcement for creation/lookup-by-id (§12), idempotency (§11), `businessCode` generation and transactional-uniqueness reservation with bounded collision retry (FD-3, §24). **Inputs:** `002A`'s contracts, the already-`Complete` Customer Identity concern (existence check, §10.3.2), the already-`Complete` `ENG-P2-004`'s frozen contracts (consumed only for the Owner-membership shape it writes, §15, and explicitly never invoked to authorize creation, §10.3) and shared outbox infra (`functions/src/shared/outbox/*`). **Outputs:** a live, callable business-creation command; a business and its Owner membership and branch actually persist in Firestore, `businessCode` populated. **Dependencies:** `002A` (contracts), `ENG-P2-004` (Complete, consumed not modified), Customer Identity (Complete, consumed). **Exclusions:** no profile-update command, no lifecycle-transition commands beyond the initial `draft` creation, no ownership transfer (§9, deferred), no owner-self-suspend (§8, deferred), no `ENG-P2-004` evaluator modification (§10.3 resolved to Option A). **Acceptance boundary:** given a valid authenticated Customer Identity, a business can be created exactly once per idempotency key, always with exactly one Owner membership, one branch, and one unique `businessCode`, atomically, auditable via the outbox. **Test strategy:** unit tests for the transaction-construction logic; Firestore-emulator integration tests proving the atomicity (business+membership+branch+`businessCode` all exist or none do) and idempotency-replay behavior, mirroring `ENG-P2-004D`'s emulator-validation pattern.
- **`ENG-P2-002C` — Profile, Lifecycle-Transition & Branch Management Commands.** **Responsibility:** owner-authorized profile-update commands (calling `ENG-P2-004`'s evaluator per §10.2's table), the remaining lifecycle transitions this document assigns Owner/administrator authority to (§6) — **explicitly excluding `pending_verification`→`trial`**, whose verification mechanism remains ungoverned (§6, §24 item 3) and must not be implemented until separately governed — branch read/list operations (§12), tenant-isolation enforcement for these additional query surfaces (§12's "list-my-businesses" pattern). **Inputs:** `002A`+`002B`'s outputs, `ENG-P2-004`'s evaluator (consumed for every permission-gated operation here, per §10.2). **Outputs:** the remaining business-management surface a future onboarding/business-settings UI would call. **Dependencies:** `002A`, `002B`, `ENG-P2-004`. **Exclusions:** owner self-suspension (§8, deferred to a future package), ownership transfer (§9, deferred), the `pending_verification`→`trial` verification mechanism (ungoverned, §24 item 3), any subscription/billing logic (§2.2), any staff-membership mutation beyond the `002B`-created Owner record (`ENG-P2-003`'s scope). **Acceptance boundary:** every owner-authorized, currently-governed operation in §10.2's table is callable, evaluator-gated, tenant-isolated, and produces the correct audit trail (§14). **Test strategy:** unit tests for command logic; emulator integration tests for the full evaluator-gated call path (business A owner cannot affect business B, mirroring `ENG-P2-004-DESIGN-001` §13 item 6's cross-tenant test pattern).

## 21. `ENG-P2-003` Handoff

**A separate `ENG-P2-003-DESIGN-001` will still be required** — verified against governing docs, not assumed:

- `ENG-P2-004-DESIGN-001` §12.2 already states the staff-membership lifecycle (invite, accept, suspend, remove) is `ENG-P2-003`'s responsibility, entirely distinct from the one bootstrap Owner-membership grant `ENG-P2-002` performs (§15).
- `DEC-SEC-003` (shared-device staff authentication, `OPEN_ENGINEERING`) and `DEC-ID-004` (staff phone-lookup policy, `OPEN_FOUNDER`) are both staff-facing decisions with no bearing on business bootstrap (§18 of the research report), confirming `ENG-P2-003` carries its own independent, currently-unresolved decision surface that this document correctly does not attempt to close.
- `DEC-SUB-002` (staff limits per plan, `OPEN_FOUNDER`) gates `ENG-P2-003`'s invite-command entitlement enforcement specifically, not anything `ENG-P2-002` builds.
- The Programme's own `ENG-P2-003` row description ("staff identity — invite, membership, suspend/remove") names a materially different, independently-decisioned set of concerns (invitation UX/flow, per-membership permission-override UI, shared-device session handling) than anything resolved by this document.

**What `ENG-P2-003` may assume after `ENG-P2-002` closes** (§15's contract, restated): every business it encounters already has exactly one `active` Owner membership, correctly shaped per TRD10 §10.6.4's corrected `permissions` encoding, created atomically with the business. `ENG-P2-003` never needs to handle "a business with zero memberships."

## 22. Acceptance Criteria for the Design Itself

Mirroring `ENG-P2-004-DESIGN-001` §13's own self-certification pattern, adapted to this document's subject:

1. Every non-trivial claim above cites a specific governing file/section (TRD10, PRD3, decision-register.md line ranges, code file paths) — no fact is asserted without a citation.
2. The `businessBranches` investigation reaches exactly one of the four named outcomes (§5: a hybrid of (B)/(C), resolved as (B) with explicit evidence for both halves) rather than guessing a schema without evidence.
3. No lifecycle transition is asserted that PRD3/TRD18 do not describe (§6's explicit "ungoverned gap" callouts for verification mechanism, self-suspend, expired-reactivation).
4. `DEC-ID-005`'s five-question analysis (§8) presents options and a recommendation; the Founder has confirmed the `ENG-P2-002` scope boundary (§24 item 1) without recording a `DEC-ID-005` Decision Register disposition, which remains `OPEN_FOUNDER`, unmodified.
5. The ownership-transfer disposition (§9) is grounded in `ENG-P2-004-DESIGN-001` §3.4/AD-1's own text, not invented reasoning; the Founder has confirmed explicit deferral (§24 item 2).
6. The Founder Decision Register (§17, preserved as history) raised only items that block `ENG-P2-002` implementation specifically (3 items — `businessBranches` schema authorship, bootstrap mechanism shape, `businessCode` generation) — every other open decision touched is explicitly routed to a later package (§8, §21, research report §7) rather than listed here. **[UPDATED 2026-08-17]** All three are now resolved as Founder dispositions FD-1/FD-2/FD-3, §24.
7. No `ENG-P2-004` file, decision record, or DEC-ID/DEC-SUB/DEC-UX entry is modified by this document.
8. The error-taxonomy mapping (§18) introduces zero new categories.
9. The transaction/outbox design (§13–§14) reuses `functions/src/shared/outbox/outboxWriter.ts` directly rather than proposing a second mechanism.
10. `ENG-P2-003`'s continued need for its own design package is verified against `ENG-P2-004-DESIGN-001` §12.2 and the Programme's own row descriptions, not assumed a priori (§21).

## 23. Downstream Handoffs Summary

| Recipient | What this document hands off |
|---|---|
| `ENG-P2-002A` (future implementation) | Contract shapes (§4.1, §5.3 Founder-approved branch shape, §6's transition table, §18's error mapping, `businessCode` policy contract, FD-3) |
| `ENG-P2-002B` (future implementation) | Bootstrap security requirements (§11), transaction design (§13.1), the resolved FD-1/FD-2/FD-3 dispositions it implements against (§24) |
| `ENG-P2-002C` (future implementation) | The owner-authorized operation classification (§10.2), tenant-isolation requirements (§12), acceptance boundary (§20) — explicitly excluding `pending_verification`→`trial` until separately governed (§24 item 3) |
| `ENG-P2-003` (future design + implementation) | The Owner-membership handoff contract (§15); confirmation that a separate `ENG-P2-003-DESIGN-001` is still required (§21) |
| `ENG-P3-002` (business onboarding frontend, future) | The i18n-ready foundation confirmation (§19), the bootstrap request/response contract shape to build against once `002A`/`002B` fix it concretely |
| Founder | **[UPDATED 2026-08-17]** FD-1/FD-2/FD-3 now resolved and recorded (§24); `DEC-ID-005`/ownership-transfer scope-boundary confirmations recorded (§24 items 1–2, not Decision Register dispositions); `pending_verification` verification mechanism and `DEC-ID-005`/ownership-transfer's own future Decision Register resolution remain open, future Founder items, not blocking `ENG-P2-002` |
| Future Subscription-domain design work | Confirmation that `Business.subscriptionId` is a bare optional reference (§13 boundary, research report §6) — no entitlement logic expected from `ENG-P2-002` |

## 24. Founder Dispositions (Recorded 2026-08-17)

**Authority:** Founder, via task "ENG-P2-002-DESIGN-001 — Record Founder Dispositions FD-1 / FD-2 / FD-3 and Finalize Design," 2026-08-17. Recorded here per this design package's own governance convention — the same inline, dated, attributed disposition pattern already established in this repository for design-level Founder decisions (`ENG-P2-004-DESIGN-001` §17, recording `AD-1`–`AD-5`) — **not** a new Decision Register (`DEC-*`) entry, and **not** a reopening of `DEC-ID-005`, `DEC-SUB-002`, `DEC-SUB-009`, `DEC-ID-004`, `DEC-SEC-003`, or `DEC-UX-003`, all of which remain unmodified in `decision-register.md`. This section is the authoritative disposition record for the three items originally raised in §17; §17 itself is preserved unmodified as history.

### FD-1 — `businessBranches` MVP schema (resolves the original FD-1)

**Approved with MVP schema clarification.** A separate `businessBranches` collection is approved, implementing the already-governed single-branch/branch-ready architecture (`DEC-SUB-005`, TRD23 §23.14).

**MVP cardinality:** exactly one operational branch per Business; the branch is automatically created as part of Business bootstrap; Business creation must not leave a persistent Business with no branch; the "create later during onboarding" interpretation is **not** adopted as a second MVP bootstrap path (§5.4); multi-branch remains deferred under existing future governance (`DEC-FUT-005`).

**Approved MVP persisted shape** (recorded at §5.3):

```
type BusinessBranchDocument = {
  id: string;
  businessId: string;
  displayName: string;
  countryCode: string;
  city: string;
  address?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  schemaVersion: number;
};
```

`id`/`businessId` are immutable; `displayName`/`address` are mutable; `countryCode`/`city` initialize from the Business/onboarding authoritative value; `createdAt`/`updatedAt`/`schemaVersion` follow existing platform metadata conventions.

**Explicitly not included at MVP:** `isPrimary` (redundant while exactly one branch exists), branch-specific `timezone` (the Business already owns `timezone`; no governed MVP requirement establishes an independent per-branch value), independent branch `status` (would create an independent branch lifecycle that has not been governed). These may be added later when actual multi-branch/lifecycle requirements are authorized. No `branchCode` is introduced — no governed source establishes one, and none is invented here.

### FD-2 — Business creation bootstrap (resolves the original FD-2)

**Approved.** Business creation uses a dedicated bootstrap command/service, per the established `AUTH-03` endpoint-service architecture (`functions/src/domains/authentication/services/authenticationEndpointService.ts`) as implementation precedent. No bootstrap exception is added to `ENG-P2-004`.

**Bootstrap authority model** (recorded at §10.3): (1) the request arrives through the normal authenticated callable boundary; (2) Firebase/authentication establishes the principal; (3) the authoritative Customer Identity is resolved server-side; (4) `ownerUserId` is derived server-side from that identity — the client cannot choose or override it; (5) `ENG-P2-004` is not invoked to authorize creation of a Business that does not yet exist; (6) the bootstrap command establishes the first valid Business context.

The Business bootstrap transaction atomically establishes the required initial state: Business, initial Owner `businessMembership`, single default `businessBranch`, required same-transaction outbox evidence (§13.1). Existing platform idempotency, Firestore transaction, outbox, and error-taxonomy infrastructure is reused — no second infrastructure, no special-case weakening of the `ENG-P2-004` evaluator. The literal callable/service implementation belongs to `ENG-P2-002B`, not this design document.

### FD-3 — `businessCode` purpose and policy (resolves the original FD-3)

**Approved with MVP purpose clarification.** For MVP, `businessCode` is a permanent, system-generated, human-readable reference for a Business, suitable for internal operational and support use. It is **not** currently governed as a public business identifier, URL slug, authentication credential, customer lookup key, QR identifier, or commerce identifier — any later customer/public/commercial use requires separate governance.

**Approved properties:** generated server-side; globally unique; opaque; non-sequential; immutable once assigned; never recycled/reassigned after Business closure; transactionally reserved/validated as part of Business creation; bounded collision retry; one Business receives at most one permanent `businessCode`.

`DEC-DATA-007`/Loyalty Number is used as an **implementation precedent** for opacity, non-sequential generation, transactional uniqueness, bounded collision retry, and single immutable assignment — `DEC-DATA-007` does not itself govern `businessCode`; this Founder disposition independently adopts those principles for Business Code.

**Delegated to Engineering Lead during `ENG-P2-002A`/`002B`:** exact alphabet, exact length, separator/display formatting, bounded retry count. Engineering should prefer a human-readable format and avoid ambiguous characters, consistent with established platform conventions (e.g. the `loyaltyNumber` alphabet excluding `I`/`O`).

**Not encoded into `businessCode`:** country, category, date, owner, or sequence/order. No `branchCode` relationship is established.

### Other Design Dispositions

1. **Owner self-suspension / `DEC-ID-005`.** Not pulled into `ENG-P2-002A`. The Business lifecycle may contain `suspended` as already governed (§6). MVP owner-initiated self-suspension remains unresolved/deferred — the trigger is not invented here. A platform/admin-controlled suspension path may be handled under its existing governance (TRD18 §18.12). **`DEC-ID-005` itself remains `OPEN_FOUNDER` in `decision-register.md`** — this is a scope-boundary confirmation for `ENG-P2-002`, not a Decision Register disposition.
2. **Ownership transfer.** Explicitly deferred. The single current `ownerUserId` and the `business.transferOwnership` sensitive permission identifier are preserved, with the future ability to add a governed workflow. No dual control is designed. Ownership transfer is not implemented in `ENG-P2-002A`/`002B`/`002C` unless separately authorized later.
3. **`pending_verification` → `trial`.** The state values are kept (§6); the verification mechanism is not invented. This gap does not block `ENG-P2-002A` (the `status` enum is fully governed independent of the mechanism) or bootstrap creation in `ENG-P2-002B` (which only produces `draft`); it blocks only implementation of the actual verification transition in `ENG-P2-002C` (§20), which requires future governance before that transition is implemented.
4. **Business events.** `BusinessCreated`/lifecycle event names in this design are design-level recommendations/contracts, not pre-existing named governed events (§14). Their exact event contract may be finalized during the relevant implementation package using existing shared outbox conventions. No additional Founder decision is required unless implementation uncovers a new product/governance semantic.

### Status after this disposition

All three items originally raised as this package's own Founder Decision Register (§17) are now resolved. No `DEC-ID-005`, `DEC-SUB-002`, `DEC-SUB-009`, `DEC-ID-004`, `DEC-SEC-003`, `DEC-UX-003`, or other Decision Register entry was reopened or modified by this disposition. No implementation was performed; no `ENG-P2-002A`/`002B`/`002C`, `ENG-P2-003`, runtime code, Firebase configuration, or deployment change was made. This design package remains architecture only and does not itself authorize `ENG-P2-002` implementation — a separate implementation-authorization task is required before `ENG-P2-002A` coding begins.
