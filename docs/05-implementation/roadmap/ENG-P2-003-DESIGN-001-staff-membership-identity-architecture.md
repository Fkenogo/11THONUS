> **Title:** ENG-P2-003-DESIGN-001 — Staff Membership & Identity Architecture
> **Version:** 1.0 · **Status:** Design package — NOT an implementation authorization · **Classification:** Working (execution-layer architecture record)
> **Governing document:** [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-ID-002`, `DEC-ID-003`, `DEC-ID-004`, `DEC-SEC-003`, `DEC-SUB-002`, `DEC-SUB-009`; [`CDR-001` Capability 3](CDR-001-capability-delivery-roadmap.md#capability-3--business-identity); [`ENG-P2-002-DESIGN-001`](ENG-P2-002-DESIGN-001-business-identity-architecture-delivery-design.md); [`ENG-P2-004-DESIGN-001`](ENG-P2-004-DESIGN-001-role-context-permission-resolution-architecture.md); PRD1 (`01-accounts-roles-and-permissions.md`); PRD3 (`03-business-registration.md`); TRD10 §10.6.4; TRD11 §11.35 (error taxonomy); TRD12 §12.4.3/§12.11–12.16
> **Source-of-truth path:** `docs/05-implementation/roadmap/ENG-P2-003-DESIGN-001-staff-membership-identity-architecture.md`
> **Last controlled update:** 2026-08-19 (initial delivery)

# ENG-P2-003-DESIGN-001 — Staff Membership & Identity Architecture

**This document defines architecture only. It authorizes no implementation.** No production code, Firestore Rules, migration, client UI, or deployment is created or modified by this document. It is analogous in role to [`ENG-P2-002-DESIGN-001`](ENG-P2-002-DESIGN-001-business-identity-architecture-delivery-design.md) (Business Identity) and [`ENG-P2-004-DESIGN-001`](ENG-P2-004-DESIGN-001-role-context-permission-resolution-architecture.md) (Role-Context & Permission Resolution) for the Staff Identity concern of Capability 3. It resolves the architecture-level prerequisites `ENG-P2-003` needs before a future `ENG-P2-003A/B/C/…` implementation prompt can be authorized without a coding agent inventing staff-identity semantics.

This package does **not** authorize: staff invitation runtime code; membership persistence writers; invitation-token generation; staff accept/suspend/reactivate/remove commands; role-change commands; permission-override administration; shared-device authentication implementation; frontend UI; Firebase deployment; `ENG-P3-001/002/003`.

---

## 0. Entry State (Phase A — already verified, not redone)

- **Entry `origin/main` SHA:** `a4c178d32ee410d4b440bef1b59f27f33419f423`.
- **Worktree/branch:** `docs/eng-p2-003-design-001-staff-membership`, cleanly branched from the above SHA. The primary worktree at `/Users/theo/11THONUS` was not entered or modified by this task.
- **PR #128** (`ENG-P2-002C`, merge `8d16c744a76a3ae811e44b7979119ab0353363ea`) and **PR #129** (closure sync, merge `a4c178d32ee410d4b440bef1b59f27f33419f423`) confirmed merged and matching `origin/main` HEAD; post-merge CI on that SHA green.
- No open PR or branch other than this one touches `ENG-P2-003` or staff/membership work; `CAP-P2-003` (PR #78, merged) is confirmed by title/content inspection to be an unrelated capability-boundary-review document, a false-positive name match only.
- **ENG-P2-002A/B/C status, independently re-confirmed in this package (Phase B/C, not assumed):**
  - `ENG-P2-002A` (Business & Branch Domain Contracts) — merged PR #122, `8ff5eed39a9e18d3549f509c5dde761ba0986414`.
  - `ENG-P2-002B` (Business Creation / Persistence / Atomic Bootstrap) — merged, per `git log` (`6ac6d7b` closure sync commit) and the presence of `functions/src/domains/business/{repositories,services}/businessBootstrap*`.
  - `ENG-P2-002C` (Business Profile / Branch Profile / Governed Lifecycle) — merged PR #128, `8d16c744a76a3ae811e44b7979119ab0353363ea` (closure-sync commit `a4c178d`).
  - `ENG-P2-004-CORR-001` (bounded pre-operational Business-authorization correction) — merged PR #126, commit `ce2b026` (closure sync `bc44216`).
  - All four are `Complete` on `main` as of the entry SHA. Confirmed by direct repository inspection (`functions/src/domains/business/**` exists with models/repositories/services/events for `Business`, `BusinessBranch`, bootstrap, code reservation, profile/lifecycle commands) — not assumed from commit-message titles alone.

---

## 1. Programme Status Reconciliation (Phase B)

### 1.1 What was checked

- **`CDR-001`** (`docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md`) §5 Capability 3 section — read directly, not from memory.
- **Engineering Implementation Programme** (`docs/05-implementation/change-tracking/engineering-implementation-programme.md`) — its P2 phase-summary row and header change-log read directly.
- **`ENG-P2-002-DESIGN-001`** §0 Entry State — the precedent this package's own tracking-reconciliation approach follows.
- **`ENG-P2-004-DESIGN-001`** §0 Entry State — confirms the exact same "Capability 3: Not started" wording was already true and deliberately preserved on 2026-08-14, *before* any `ENG-P2-002` sub-package existed in code.

### 1.2 Finding: the tracking is stale

`CDR-001` §5 Capability 3's most recent dated note (`[UPDATED 2026-08-17 — ENG-P2-002A merged/closed]`) records only that `ENG-P2-002A` is merged, and states: *"`ENG-P2-002B`/`002C`/`ENG-P2-003` remain `Not started`. Capability 3 remains `Not started`."* This is now factually superseded: `ENG-P2-002B`, `ENG-P2-002C`, and `ENG-P2-004-CORR-001` have since merged (confirmed §0 above), none of which is reflected anywhere in `CDR-001` §5 or the Engineering Implementation Programme's P2 row. This is a **staleness gap**, not a disputed status — the underlying merge facts are unambiguous from `git log` and the repository tree.

### 1.3 What status vocabulary applies

`CDR-001` §4 Guiding Principle 5 states capability completion requires end-to-end journey validation, "not when its last work package merges. Code merging is necessary; it is not sufficient." Consistent with this, `ENG-P2-002-DESIGN-001` and `ENG-P2-004-DESIGN-001` both explicitly kept Capability 3 at **`Not started`** even after `ENG-P2-002A` (real, merged domain-contract code) landed — this is the repository's own established precedent for how a *first* merged sub-package is treated at the capability-status label.

However, two governance facts have changed since that precedent was set:

1. **Founder Decision FD-3** (quoted in `CDR-001` §5, Capability 2 section) established that *"Capability 3 remains governance-sequenced after Capability 2 closure"* — i.e., the reason Capability 3's label stayed pinned at `Not started` even as `ENG-P2-004` (a *shared* Capability 2/3 package) reached technical completion was an explicit sequencing gate tied to Capability 2's own closure, not a statement that no Capability-3 work had occurred.
2. **Capability 2 is now `Complete`** (`CAP-P2-G2-001`, 2026-08-17 — confirmed by direct read of `CDR-001` §2/§5). The FD-3 sequencing gate that justified holding Capability 3's label at `Not started` is therefore satisfied.
3. **Three additional Capability-3 sub-packages have since merged** (`ENG-P2-002B`, `ENG-P2-002C`, `ENG-P2-004-CORR-001`) — real, running domain code (Business lifecycle, branch profile, bootstrap, pre-operational authorization correction), well beyond the single-package state that previously justified `Not started`.

Given both changed facts, the same vocabulary already used for Capability 2 at an analogous point in its own lifecycle — **`Open — partially implemented; not closed`** — is the correct, already-governed status for Capability 3 today, not a newly invented phrase. `ENG-P2-003` itself is not started (no code exists anywhere in the repository for staff invitation/membership commands — confirmed by repository-wide search of `functions/src/domains/permissions/**` and `functions/src/domains/business/**`, which contain only `ENG-P2-004`'s read-only evaluator surface and `ENG-P2-002`'s Business/Branch aggregate, never a staff-invitation or membership-write command).

### 1.4 Recommendation (Phase B deliverable — not self-executed as a status *decision*, only as a tracking-currency correction)

Apply a **minimal, dated-supersession note** to `CDR-001` §5 Capability 3 and to the Engineering Implementation Programme's P2 row (§14 below), recording:
- `ENG-P2-002B`, `ENG-P2-002C`, `ENG-P2-004-CORR-001` merged (with their PR/commit evidence).
- Capability 3 status moves from `Not started` to **`Open — partially implemented; not closed`**, using vocabulary already established for Capability 2 at the same lifecycle point, per the reasoning in §1.3 above.
- This is a documentation-currency correction, not a new capability-boundary or numbering change, and does not itself authorize any `ENG-P2-003` implementation.

This recommendation is applied as the dated-supersession edit in §25 below (Phase AE), consistent with the task's instruction to correct stale tracking rather than leave it silently wrong, while **not** rewriting or deleting the prior dated notes (history preserved).

---

## 2. Authoritative Source Review (Phase C)

Sources read directly (not from memory or summary) for this package:

| Source | What was verified |
|---|---|
| `CDR-001-capability-delivery-roadmap.md` §5 (Capability 2 and 3) | Capability status vocabulary, FD-3, merge history through the entry SHA |
| `engineering-implementation-programme.md` header + P2 row | Programme-level currency (same staleness as `CDR-001`) |
| `ENG-P2-002-DESIGN-001-business-identity-architecture-delivery-design.md` | Business aggregate boundary, bootstrap design, `ownerUserId` derivation, precedent for this package's own structure |
| `ENG-P2-002A/B/C` implementation reports (titles/paths confirmed; `ENG-P2-002C` report referenced by CDR-001 dated note) | Confirmed scope: Business/Branch domain contracts (A), creation/persistence/bootstrap (B), profile/lifecycle (C) |
| `ENG-P2-004-DESIGN-001-role-context-permission-resolution-architecture.md` §0–§2 | `DEC-ID-003` reconstruction, Capability 3 status precedent, permission-resolution model |
| `ENG-P2-004-CORR-001` implementation report (title only, confirmed merged via `git log`) | Bounded pre-operational Business-authorization correction; does not touch staff/membership commands |
| TRD10 §10.6.4 (`docs/02-technical/trd/10-firestore-data-architecture.md:349-384`) | `BusinessMembershipDocument` schema — read verbatim, quoted in §5 below |
| PRD3 (Business Registration) — referenced via `CDR-001`/design precedents; staff-specific PRD1 sections referenced via the Decision Register's own "Affected documents" fields (`DEC-ID-002` → PRD1 AP-002/BR-002, PRD10 BR-095) | Staff/individual-account requirement grounding |
| `decision-register.md` — `DEC-ID-002` (line 549), `DEC-ID-003` (line 560), `DEC-ID-004` (line 574), `DEC-SEC-003` (line 638), `DEC-SUB-002` (line 694), `DEC-SUB-009` (line 780) | Exact status/text quoted verbatim in §3, §9, §10, §11 below |
| `functions/src/domains/permissions/models/businessMembershipDocument.ts` | Current membership reader/parser — exact field validation logic |
| `functions/src/domains/permissions/models/role.ts` | `Role = "owner" \| "manager" \| "staff"` closed union |
| `functions/src/domains/permissions/models/permissionOverride.ts` + `permissionOverride.test.ts` | `PermissionOverride` contract, Owner-target prohibition, sensitive-permission grant/revoke gating |
| `functions/src/domains/permissions/models/sensitivePermissionCatalogue.ts` | The 8-entry Sensitive Permission Catalogue, verbatim — quoted in §11 |
| `functions/src/domains/permissions/models/permissionErrors.ts` | Confirms `VALIDATION_FAILED` is the only category this domain currently uses; confirms the 14-category closed taxonomy is imported from `shared/errors/errorCategories.ts`, never extended |
| `functions/src/shared/errors/errorCategories.ts` | The exact, closed 14-category error taxonomy — quoted verbatim in §16 |
| `functions/src/domains/business/models/business.ts` | `Business.ownerUserId: readonly string` — confirms one immutable owner field per business, never client-supplied |
| `functions/src/domains/business/events/businessEvents.ts` | Confirms the shared `DomainEvent<T>`/`buildEventType`/outbox pattern (`ENG-P1-002`) already in use by `ENG-P2-002B`, the pattern this package's proposed events (§13) would reuse |

**Explicitly not independently re-verified in full text by this package** (referenced only via the sources above, not re-read line-by-line): the full text of PRD1/PRD10's staff role-matrix sections, the full RTM Business/Staff rows, and `ENG-P2-002B`'s/`ENG-P2-002C`'s implementation reports beyond their `CDR-001`-quoted dated notes. Where a claim below depends on one of these, it is marked **[not independently re-verified]** rather than asserted as directly quoted.

---

## 3. Staff Identity Boundary (Phase D)

### 3.1 Confirmed conceptual boundary

`DEC-ID-002` (CONFIRMED, D1) states verbatim: *"Every business user operates through an individual account; shared staff/manager accounts prohibited; every action attributable."* Its "Implementation consequences" field states: *"membership model"* — i.e., DEC-ID-002 already directs that staff identity be modeled as a **membership**, not a second account type. Its "Dependencies" field cites `DEC-SEC-003` (shared-device UX, §9 below), confirming the individual-account principle and the shared-device-UX problem are explicitly linked but separately governed.

`ENG-P2-004-DESIGN-001` §2.A (quoting `DEC-ID-003`'s Founder-approved text) states: *"platform permissions are exercised by verified identities acting within assigned roles. Roles organise permissions, but accountability always belongs to the underlying identity … a role is not an independent actor; every exercise of a permission must be attributable to an identity."*

Combined, these two Founder-confirmed decisions establish the boundary this package reconstructs, not invents:

> **A staff member is not a second identity aggregate.** Staff is: an existing Customer/User Identity (the same identity aggregate `ENG-P2-ARCH-001`/`ENG-P2-001` already own) **plus** a `businessMemberships/{id}` record binding that identity to a particular Business context, role, status, and permission overrides.

### 3.2 Boundary against adjacent concerns

| Concern | Owns | `ENG-P2-003` does NOT own |
|---|---|---|
| Customer Identity (`ENG-P2-001`) | The permanent identity triad, profile, recovery. One identity per person, portable across every Business. | Creating a second, Business-scoped identity type |
| Authentication (`AUTH-*`) | Proving *which* credential belongs to which identity (`DEC-AUTH-001` D-A5: *"Customer Authentication is independent from Staff Authentication … No staff-authentication scope shall enter the Customer Authentication stream"*). | Any provider/session logic — staff sign in exactly as customers do, via the same Authentication stream |
| Business Identity (`ENG-P2-002`) | The `Business`/`BusinessBranch` aggregates, `ownerUserId`, bootstrap. `Business.ownerUserId` is set once at bootstrap and is the structural Owner-floor anchor `ENG-P2-002-DESIGN-001` defines. | Reassigning `ownerUserId` (ownership transfer is separately deferred, §8 below) |
| `ENG-P2-004` (role-context & permission resolution) | The **evaluator**: given a `businessMembership`, resolve role-template + override precedence into an allow/deny decision. Already `Complete`. | `ENG-P2-003` is a **producer** of the `businessMemberships` documents `ENG-P2-004` **reads**; it must never redesign `ENG-P2-004`'s evaluator, catalogue, or audit contracts — those are consumed unmodified |
| Subscription enforcement | Plan-level staff-count entitlement ceilings (once `DEC-SUB-002` resolves, §10). | Enforcing a concrete numeric limit before that policy exists |
| Frontend UX | Invite/list/suspend/remove/role-assignment screens, permission-override admin UI, shared-device staff-switcher UX. | Any UI — this package is docs-only, backend-architecture-only |

### 3.3 What `ENG-P2-003` does NOT create

Per `DEC-ID-002`'s "shared accounts prohibited" text and the accountability principle above, this package confirms the following are **structurally excluded**, matching the task's explicit non-authorization list:
- **No `StaffIdentity` aggregate.** A membership document referencing an existing Customer Identity `userId` is the entire staff-identity model.
- **No Business-specific authentication principal.** A staff member signs in through the same Authentication stream as any customer; the *membership* — not a separate credential — is what confers Business-context authority.
- **No shared-account model.** DEC-ID-002 is unconditional on this point; a shared-device convenience mechanism (`DEC-SEC-003`) must not weaken per-identity attribution (§9).

---

## 4. Membership Model (Phase E)

### 4.1 Authoritative schema — TRD10 §10.6.4, quoted verbatim

```
type BusinessMembershipDocument = {
  id: string;
  userId: string;
  businessId: string;
  role: "owner" | "manager" | "staff";
  permissionSetId?: string;
  permissions: PermissionOverrideRecord[];
  status: "invited" | "active" | "suspended" | "removed";
  invitedBy: string;
  invitedAt: Timestamp;
  acceptedAt?: Timestamp;
  endedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  schemaVersion: number;
};

type PermissionOverrideRecord = {
  permissionId: string;
  direction: "grant" | "revoke";
  grantedBy: string;
  grantedAt: Timestamp;
};
```

TRD10's own **2026-08-15 correction note** (`ENG-P2-004D`, Founder-approved Option C) is load-bearing and must not be re-litigated by this package: `permissions` was originally declared `string[]` with no encoding ("undesigned since authoring"); it is now resolved as the structured `PermissionOverrideRecord[]` array above. `businessId`/`membershipId` are deliberately *not* fields on the record — an override is scoped to its containing membership document structurally, never persisted redundantly. This is already-resolved schema fact, not an open question for this package.

TRD10 §10.6.4 also states the **Membership Rules** verbatim:
- *"A user may have memberships in multiple businesses."*
- *"A business must retain at least one active owner."*
- *"Historical membership records shall remain after removal."*

### 4.2 Cross-check against the current code reader

`functions/src/domains/permissions/models/businessMembershipDocument.ts` (`ENG-P2-004B`, override parsing extended by `ENG-P2-004D`) independently confirms every field above at the parsing level:
- `MEMBERSHIP_STATUSES = ["invited", "active", "suspended", "removed"]` — exact match to TRD10.
- `role` validated via the shared `isRole` (from `role.ts`: `ROLES = ["owner", "manager", "staff"]`) — exact match.
- Each `permissions[]` element validated as `{permissionId, direction, grantedBy, grantedAt}` — exact match to `PermissionOverrideRecord`, with the code additionally noting `businessId`/`membershipId` are filled in from the containing document, never persisted per-element — matching TRD10's note precisely.
- A malformed element **fails the whole document closed** (returns `null`, mapped by the repository to a `"malformed"` read result the evaluator denies) — no partial acceptance.
- `permissionSetId`, if present, must be blank/empty — any non-blank value is currently rejected as malformed (its serialization remains explicitly undesigned, per the code's own comment). **This package does not design `permissionSetId`'s eventual serialization** — it is out of scope, same as it was for `ENG-P2-004D`.

### 4.3 Field mutability classification (this package's own analysis, grounded in the two sources above)

| Field | Classification | Basis |
|---|---|---|
| `id` | Immutable, server-derived | Document ID, never client-supplied |
| `userId` | Immutable after creation | Binds the membership to one Customer Identity for its lifetime — see §7/§8 for what happens *before* creation |
| `businessId` | Immutable after creation | A membership never moves between businesses (§12 cross-business isolation) |
| `role` | Mutable, governed transition only | Role change is a distinct, permissioned operation (§14) |
| `permissionSetId` | Reserved, undesigned | Out of scope — carried forward unresolved, not invented here |
| `permissions` (overrides) | Mutable, append/replace via governed override-admin command only | §15 |
| `status` | Mutable, governed state-machine only | §6 |
| `invitedBy` | Immutable, historical/audit-only | Set once at invite time, never revised |
| `invitedAt` | Immutable, historical/audit-only | Set once at invite time |
| `acceptedAt` | Mutable exactly once (unset → set) | Set on ACCEPT transition only |
| `endedAt` | Mutable exactly once (unset → set) | Set on the terminal REMOVE transition — see §6 |
| `createdAt` / `updatedAt` / `schemaVersion` | Standard `BaseMetadata`-pattern fields | Server-derived, mirrors every other Capability 2/3 document |

No field is invented beyond TRD10's own declaration.

---

## 5. Membership Lifecycle (Phase F)

TRD10's three Membership Rules (§4.1) directly govern this state machine: multi-business membership is allowed; at least one active Owner per business is structurally required; removal is never a hard delete.

### 5.1 State machine

```
        INVITE
(none) ────────► invited
                     │ ACCEPT
                     ▼
                  active ◄──────────┐
                     │  SUSPEND     │ REACTIVATE
                     ▼              │
                 suspended ─────────┘
                     │
           REMOVE (from active OR suspended)
                     ▼
                  removed  (terminal — historical record retained, never hard-deleted)
```

An `invited` membership may also be **revoked/cancelled** before acceptance (§8 below) — whether this is a distinct transition into `removed`, or a separate pre-acceptance-only state, is a **Founder decision surfaced in §21 (FD-3-STAFF)**, not resolved by this package, because TRD10's status enum has no fifth value and the transition's target is therefore ambiguous without a governed answer.

### 5.2 Per-transition table

| Transition | Initiator | Required permission | Prerequisites | Reversible? | Persisted timestamps | Audit/event |
|---|---|---|---|---|---|---|
| **INVITE** (— → `invited`) | An existing member with invite authority | `staff.manage` (§11) | Target not already an active/invited member of *this* Business (§16 `ALREADY_A_MEMBER`/`INVITE_ALREADY_PENDING`); Business itself in an operable status (`ENG-P2-004-CORR-001`'s pre-operational gate is the precedent this reuses, not redesigns) | N/A (creates the record) | `invitedBy`, `invitedAt` set; `createdAt`/`updatedAt` | `StaffInvited` (proposed, §17) |
| **ACCEPT** (`invited` → `active`) | The invited Customer Identity itself, authenticated, proving it is the intended recipient (§8) | None (self-service; the invitation *is* the authority — see §8's authority model) | A valid, unexpired, unrevoked invitation reference resolves to this membership and to the authenticated identity | N/A (one-way; a later removal is a separate REMOVE transition, not an "un-accept") | `acceptedAt` set | `StaffMembershipActivated` (proposed) |
| **SUSPEND** (`active` → `suspended`) | A member with suspend authority | `staff.manage` | Target is not the sole active Owner (§12 Owner Protection); target membership is `active` | **Reversible** via REACTIVATE | `updatedAt` | `StaffMembershipSuspended` (proposed) |
| **REACTIVATE** (`suspended` → `active`) | A member with suspend/reactivate authority | `staff.manage` | Target membership is `suspended`; Business itself operable | Reversible (via SUSPEND again) | `updatedAt` | `StaffMembershipReactivated` (proposed) |
| **REMOVE** (`active` or `suspended` → `removed`) | A member with remove authority | `staff.manage` | Target is not the sole active Owner (§12); historical record is retained, never deleted (TRD10 Membership Rule 3) | **Non-reversible** — a removed member must be re-invited (a fresh `invited` record, new `id`), never resurrected in place | `endedAt` set; `updatedAt` | `StaffMembershipRemoved` (proposed) |

Every governed transition above is grounded in TRD10's status enum (`invited`/`active`/`suspended`/`removed`) and its own Membership Rules — no transition is inferred solely from enum ordering; each is cross-checked against the "historical records remain" and "at least one active owner" rules, both of which directly constrain REMOVE and SUSPEND respectively.

### 5.3 What is NOT governed by any source found

- Whether SUSPEND has a mandatory reason code — not found in any source; **not invented here**.
- Whether REMOVE is reversible via a distinct "restore" transition (as opposed to re-invitation) — TRD10's "historical records remain" text is consistent with either "restore in place" or "new record, old one stays historical," and no source disambiguates. This package recommends **re-invitation (new record)** as the only governed path, because it is the only one requiring no new status value and it keeps the closed four-value enum intact — but flags this as a recommendation, not a confirmed fact (§21, FD-4-STAFF).

---

## 6. The Invitation Identity Problem (Phase G — primary design question)

### 6.1 The problem, precisely

TRD10 §10.6.4 declares `userId: string` as a **required, non-optional field** on `BusinessMembershipDocument`. `businessMembershipDocument.ts`'s reader enforces this: `if (typeof data.userId !== "string" || data.userId.length === 0) return null` — a document without a `userId` is not a valid membership document at all, by the currently-governed schema and its currently-governed reader.

This creates a structural tension the task explicitly asked this package to surface: **a Business may want to invite a specific person before that person's Customer Identity is necessarily known to the platform** (e.g., inviting by phone number or email before the invitee has registered) — but the authoritative schema's `userId` field cannot express "invited, identity not yet known."

### 6.2 What governed sources say about identity authority

`DEC-ID-002`/`DEC-ID-003` establish *who exercises permissions* (a verified identity, never a role in the abstract) but say nothing about *how an invitation names its intended recipient before that identity exists*. No `DEC-ID-*` decision defines email or phone as an "identity authority" mechanism — and per the Authentication concern's own governed principles (`DEC-SEC-001`'s Identity Recovery Principles, referenced via `AUTH-*`'s "no provider defines identity" rule, `AUTH-CORR-003`), **no contact method is ever authoritative for identity in this platform** — a Firebase-authenticated principal is. This package therefore does **not** treat email or phone as capable of standing in for `userId` on the authoritative membership record; it treats them only as **delivery addresses** for locating/notifying a prospective invitee, never as identity.

### 6.3 The required separation

> **INVITATION TARGET / DELIVERY ADDRESS** (how the Business names who it means — email, phone, or an existing Customer Identity lookup) is structurally distinct from **AUTHORITATIVE CUSTOMER IDENTITY BINDING** (the `userId` on the eventual `businessMembership` document, established only once an authenticated Customer Identity accepts).

This mirrors the same separation Authentication already enforces between a *credential* (phone/email/Google) and the *identity* it authenticates into — this package reuses that already-approved pattern rather than inventing a new one.

### 6.4 Options considered for the delivery mechanism (no governed selection exists — surfaced, not chosen)

| Option | Description | Governed support found |
|---|---|---|
| (a) Existing-identity-only invitation | Business searches/selects an already-registered Customer Identity (e.g., via `DEC-ID-004`'s phone-lookup mechanism, once resolved) and invites that `userId` directly | Requires `DEC-ID-004` (currently `OPEN_FOUNDER`, §10) to resolve a lookup mechanism first; would let `userId` be known at invite time, avoiding §7's problem entirely for this subset of invitations |
| (b) Email/phone invitation, identity bound on acceptance | Business supplies a delivery address; invitee registers/authenticates and the acceptance flow binds the resulting identity | No `DEC-ID-*` decision approves or defines this mechanism; consistent with the general "delivery address ≠ identity" principle above, but the concrete flow is undesigned |
| (c) Invite code/link (out-of-band) | Business generates a shareable code/link; whoever redeems it while authenticated becomes the member | No governed precedent found; raises the acceptance-authority question sharply (§8) — a bare code proves possession, not intended-recipient |
| (d) Loyalty-number invitation | Business invites by the invitee's already-issued Loyalty Number | Requires the invitee to already be a registered Customer (same identity-known precondition as (a)); not found governed anywhere as a *staff*-invitation mechanism specifically |

**No governed mechanism selection exists.** This package does not invent one. §21 (Founder Decision FD-1-STAFF) surfaces the choice explicitly.

---

## 7. Invitation Record / Token Model (Phase H)

Given §6's finding that `userId` is required by the current schema and its reader, three structurally distinct resolutions exist, none of which this package selects unilaterally:

| Option | Mechanism | Consequence |
|---|---|---|
| **A. Existing-identity-only invitations** | Only Option 6.4(a)/(d) invitations are supported; a `businessMembership` document is created immediately with a known `userId` and `status: "invited"` | No schema change needed; TRD10 stays exactly as declared today. Narrows what a Business can do at invite time (cannot invite by email/phone alone) until `DEC-ID-004` resolves |
| **B. Separate invitation record until acceptance** | A new, distinct Firestore collection (e.g., `businessMembershipInvitations`, proposed name only — §18) holds the pre-acceptance state (delivery address, inviting Business, role, expiry); a `businessMembership` document (with `userId` populated) is created only on ACCEPT | Requires a new collection design (§18) and a defined acceptance-time transactional write (creates the membership, marks the invitation consumed); keeps TRD10 §10.6.4's `businessMembership` schema untouched |
| **C. Nullable/unbound `userId` during `invited` state** | Amend TRD10 §10.6.4 to make `userId` optional while `status === "invited"`, populated only on ACCEPT | Requires a **governed TRD10 schema amendment** — not a decision this package can make; also requires `businessMembershipDocument.ts`'s reader to be relaxed for the `invited` case, which `ENG-P2-004B`/`004D` did not anticipate and would need its own review |
| **D. Other** | Not identified by any source reviewed | — |

### 7.1 Recommendation (not a final design decision)

Option **B** (separate invitation record) is recommended over C because it requires no amendment to the already-Founder-reviewed, already-implemented `businessMembership` schema or its evaluator-facing reader (`ENG-P2-004B`/`004D` stay untouched — respecting `ENG-P2-004`'s Complete, unmodified status), and over A because A would make `DEC-ID-004`'s resolution a hard blocker for any staff invitation at all, which seems disproportionate for a feature PRD3 describes as core to business onboarding. This is a **recommendation for Founder disposition**, not an authorized design — see §21 (FD-2-STAFF). If Option B is selected, the new collection is itself only a *proposal* (§18), not an authorized schema, per the task's explicit "do not amend schema yet" instruction.

---

## 8. Invitation Acceptance Authority (Phase I)

The task requires that acceptance not be authorized merely by possessing a membership ID or invitation reference. Consistent with the Authentication concern's already-governed pattern (AUTH-06's recovery-proof design: *"resolves it to its OWNING identity via the … resolver — recovery target derived from the proof, never client-supplied"*), this package recommends the analogous shape for invitation acceptance:

- The **authenticated principal performing ACCEPT** must be resolved via the existing Authentication→Customer-Identity resolution path (the same `-09` lookup AUTH-02/AUTH-06 already consume) — never a client-supplied `userId`.
- The **invitation reference** (an opaque, unguessable token/ID, not the human-readable delivery address) must independently resolve to exactly one pending invitation.
- **Authority to accept comes from proving control of the invitation's delivery address, not from the reference alone** — e.g., if delivered by email, the accepting identity's own verified email (or verified-provider claim) must match; if by phone, likewise. This mirrors AUTH-06's "proof resolves to its owning identity" pattern, applied to invitation delivery rather than a recovery credential.
- If the accepting identity's verified contact information does **not** match the invitation's delivery address, ACCEPT must fail closed (`RESOURCE_NOT_FOUND` or `AUTH_FORBIDDEN`, §16) — never silently accept on the invitation-reference alone (this is the exact anti-pattern the task calls out: "Do not authorize acceptance merely because someone possesses a membership ID").

**This is this package's design recommendation, grounded in the AUTH-06 precedent already Founder-approved for an analogous problem (recovery-proof authority) — it is not itself a Founder-ratified acceptance-authority policy**, since no `DEC-ID-*` decision addresses invitation acceptance specifically. Surfaced at §21 (FD-2-STAFF, bundled with the invitation-model decision since the two are inseparable).

---

## 9. Invitation Expiry / Replay / Revocation (Phase J)

No source reviewed (Decision Register, TRD10, TRD12, PRD1/PRD3) specifies an invitation expiry period, single-use semantics, or a revocation/resend workflow for staff invitations. This is a genuine gap, not an oversight of this review.

Recommended (unauthorized) minimum, modeled on already-governed idempotency/security patterns elsewhere in the codebase (`ENG-P1-002`'s shared idempotency-key pattern; AUTH-04's "idempotency key reused across transient retries" pattern):
- **Single-use**: an invitation reference is consumed exactly once on successful ACCEPT (mirrors AUTH-06's recovery-proof-reuse rejection).
- **Revocable**: the same `staff.manage`-holding actor who may INVITE may cancel a still-`invited`/pending invitation before acceptance.
- **Expiry**: no period is invented here — **explicitly surfaced as a Founder/Engineering policy gap** (§21, FD-5-STAFF), consistent with how `DEC-SUB-002`'s numeric staff-limit values are left open rather than guessed.
- **Reissue/resend**: a cancelled or expired invitation is re-created (new record/reference), not "revived" — consistent with §5.3's REMOVE-is-non-reversible recommendation.

None of the above is adopted as governed policy by this package.

---

## 10. Founder Decisions Referenced — Verified Current Status (Phases G/H/K/L/M/S/T/U — status only, not re-litigated)

Every decision below was read directly from `decision-register.md`, not assumed:

| ID | Status (verbatim) | Relevance to `ENG-P2-003` |
|---|---|---|
| `DEC-ID-002` | **CONFIRMED** — *"Every business user operates through an individual account; shared staff/manager accounts prohibited; every action attributable."* | Governs §3 (Staff Identity Boundary) and §15's shared-device disposition |
| `DEC-ID-003` | **CONFIRMED** (2026-07-30) — permission inheritance/override model, identity-accountability principle | Governs §11/§14 (role-change authorization must defer to `ENG-P2-004`, never local checks) |
| `DEC-ID-004` | **OPEN_FOUNDER** (D2) — *"May staff search customers by full phone number, or are QR and loyalty number the only normal methods…?"* | Affects **customer lookup at the point of sale**, a distinct concern from staff invitation. This package finds **no** structural dependency from `ENG-P2-003`'s own membership architecture on `DEC-ID-004`'s resolution — it matters only if invitation Option 6.4(a)/(d) (existing-identity lookup) becomes the chosen invitation mechanism. **Not a blocker to this package's architecture.** |
| `DEC-SEC-003` | **OPEN_ENGINEERING** (D2) — *"How do individual staff accounts work on one shared shop device … without weakening attribution?"* Current confirmed position: *"individual accountability mandatory (DEC-ID-002)."* | §15 below |
| `DEC-SUB-002` | **OPEN_FOUNDER** (D2) — *"Exact staff-account limits per plan?"* Current confirmed position: *"staff limits exist as plan entitlements (confirmed); values open."* | §16 below |
| `DEC-SUB-009` | **OPEN_FOUNDER** (D2) — *"One owner with several businesses — one subscription per business … or consolidated owner-level subscription?"* Current confirmed position: *"businesses isolated per owner (confirmed BR-097); billing model open."* | Affects the eventual staff-limit enforcement's billing unit (§16), not membership architecture itself |

---

## 11. Inviter Authorization & Role Assignment (Phases K, L, M)

### 11.1 Existing permission inventory (Phase K/Q — read directly from `sensitivePermissionCatalogue.ts`, not assumed)

The Sensitive Permission Catalogue (`ENG-P2-004A`, Founder-approved via `ENG-P2-004-DESIGN-001` §3.2) already defines, verbatim:

| Permission ID | Meaning | Default state | Inherit allowed? | Explicit-grant eligible role |
|---|---|---|---|---|
| `staff.manage` | *"Invite, suspend, remove staff/manager memberships"* | `owner_only` | No | `manager` |
| `staff.assignPermissions` | *"Grant/revoke another membership's permission overrides"* | `owner_only` | No | `manager` |

Both exist today and are exactly the identifiers the task's Phase Q/R asked this package to verify. **`staff.manage`'s governed meaning already covers INVITE, SUSPEND, and REMOVE** as one bundled permission — there is no separate `staff.invite`/`staff.suspend`/`staff.remove` identifier, and this package does not invent one, since the catalogue's own text already names all three actions under one entry. **`staff.assignPermissions`** is the existing, exact permission for override administration (§14).

### 11.2 Gap found: role assignment/change has no named permission

`staff.manage`'s catalogue text says "Invite, suspend, remove … memberships" — it does **not** say "change role" or "promote/demote." No catalogue entry names role-assignment explicitly. Two readings are possible:
1. Role assignment is implicitly part of "manage … memberships" (broad reading) — no new permission needed.
2. Role assignment is a distinct capability requiring its own identifier (narrow reading, matching how `staff.manage` and `staff.assignPermissions` are already kept structurally separate from each other despite both being "membership administration").

This package does **not** resolve this ambiguity by inventing an identifier (per the task's explicit instruction not to do so without surfacing it as new) — it is surfaced as **Founder Decision FD-6-STAFF** (§21).

### 11.3 Who may invite, and does the assigned role matter?

- **Owner** holds `staff.manage` by default (`owner_only` default state) — may invite any role.
- **Manager** may invite only if explicitly granted `staff.manage` (the catalogue's `explicitGrantEligibleRole: "manager"` — Manager is the only non-Owner role the catalogue permits to receive this grant at all; Staff can never hold `staff.manage`, granted or inherited).
- **Whether the role being assigned matters** (e.g., inviting as Staff vs. granting Manager) is **not disambiguated by the catalogue** — `staff.manage`'s single identifier does not distinguish "invite someone as Staff" from "invite someone as Manager." Per §11.2's gap and the Owner-floor concern below, this package recommends (not decides) that **assigning `role: "manager"` at invite time or via role-change should require the same authority that would be needed to *grant* `staff.manage` itself** (i.e., functionally Owner-level, since only Owner can grant `staff.manage` to a Manager) — but this is a recommendation surfaced for disposition (§21, FD-6-STAFF bundles this with the role-assignment-permission gap), not an assumption baked into this design.

### 11.4 Role assignment boundary — may `ENG-P2-003` ever assign `role: "owner"`?

**No — confirmed from sources, not merely the task's stated expectation.** `Business.ownerUserId` (`functions/src/domains/business/models/business.ts`) is a `readonly` field set once at bootstrap; TRD10's Membership Rule *"A business must retain at least one active owner"* presumes exactly one governed Owner-floor mechanism, which `ENG-P2-002`'s bootstrap already owns. `sensitivePermissionCatalogue.ts`'s `business.transferOwnership` entry is explicitly modeled as **`explicitGrantRequired: false`, `explicitGrantEligibleRole: null`** with the code comment: *"N/A (owner-only, not grantable) … no non-owner grant path is modeled anywhere in this catalogue for this entry."* Ownership transfer is therefore **structurally excluded from `ENG-P2-004`'s override mechanism entirely**, not merely policy-deferred — confirming the task's expected boundary. `ENG-P2-003` must never expose a role-assignment path that can set `role: "owner"`; ownership transfer remains a separately-deferred, distinct capability with its own (not-yet-designed) authority model.

### 11.5 Role-change authorization matrix (this package's derivation, since no source directly enumerates it)

| Question | Answer found in sources | Basis |
|---|---|---|
| Who can promote staff→manager? | Not explicitly stated; inferred to require the same authority as granting `staff.manage` itself — **Founder decision needed** (§21 FD-6-STAFF) | `sensitivePermissionCatalogue.ts` §11.2 gap |
| Who can demote manager→staff? | Same gap — not found | — |
| Can a Manager alter another Manager? | Not found; `staff.manage`'s catalogue text does not scope by target role | — |
| Can a Manager alter themselves? | Not found; no self-action rule exists anywhere reviewed | — |
| Can Owner alter all non-owner memberships? | Consistent with Owner's `owner_only` default holding of `staff.manage`, and with Owner being the unique accountable party per `DEC-ID-002`/`DEC-ID-003` — **yes, by strong inference**, though not stated as an explicit rule anywhere | `sensitivePermissionCatalogue.ts` default-state design |

**All of the above must be enforced by deferring to `ENG-P2-004`'s evaluator** (its already-Complete override-precedence and audit machinery) — `ENG-P2-003` commands must never implement a local, parallel authorization check. This mirrors `ENG-P2-004-CORR-001`'s own precedent: a "pre-operational Business authorization correction" that (per its title) corrected `ENG-P2-002`'s own commands to defer to `ENG-P2-004` rather than re-implement authorization locally — the same discipline applies here.

---

## 12. Suspend / Reactivate / Remove & Owner Protection (Phases N, O)

### 12.1 Per-action requirements

Already tabulated in §5.2. Restated here for the specific self-action/session-effect questions the task asks:

- **Required permission**: `staff.manage` for all three (§11.1).
- **Authorized roles**: Owner (default); Manager (if explicitly granted).
- **Self-action rules**: not found in any source — **not invented here**. Whether a Manager may suspend/remove themselves is a gap; recommended default (unauthorized) is to disallow self-suspend/self-remove for any membership that would leave the acting identity locked out of a Business it manages, but this is not grounded in a governed source (§21, folded into FD-6-STAFF).
- **Can Owner membership be targeted?** No — see §12.2 (Owner Protection).
- **Session effect**: none, by design (§12.3).

### 12.2 Owner Protection (machine-enforced invariant)

TRD10's Membership Rule — *"A business must retain at least one active owner"* — is the authoritative source for this invariant. This package's required design consequence: **SUSPEND and REMOVE must structurally refuse any target membership where `role === "owner"` and the target is the Business's sole active Owner**, exactly mirroring `permissionOverride.ts`'s already-implemented pattern (`permissionOverrideCannotTargetOwnerError` — an override can never target an Owner membership at all, full stop, not merely "the sole Owner"). Given the catalogue's `business.transferOwnership` entry is `explicitGrantRequired: false` (§11.4), this package recommends the **stronger** rule — Owner membership can never be targeted by ordinary SUSPEND/REMOVE/role-change commands at all, matching the override precedent's absolute exclusion, rather than a "count check" that only blocks removal of the *last* Owner. Ownership transfer (the only governed way an Owner's status could ever legitimately change) remains **separately deferred** — confirmed, not assumed, per §11.4.

### 12.3 Authentication/session separation (Phase V)

Per `DEC-AUTH-001` D-A5 (Customer Authentication independent from Staff Authentication) and the Customer-Identity/Business-Identity boundary (§3.2), **membership suspension/removal must never disable the underlying Firebase Auth account.** A removed/suspended staff member remains: an ordinary Customer; a member of any other Business (§13 cross-business isolation guarantees Business A's action cannot touch Business B's membership record); authenticated globally. `ENG-P2-003` controls **Business-context access only** — every command it defines must check membership status as an authorization gate on Business-scoped actions, never as an Authentication-layer gate. This is a design requirement this package imposes going forward, grounded directly in the already-Founder-confirmed `DEC-AUTH-001` D-A5 boundary.

---

## 13. Cross-Business Isolation (Phase P)

TRD10's *"A user may have memberships in multiple businesses"* rule, combined with `businessMembershipDocument.ts`'s reading `businessId` as an immutable, required field per document, already gives the structural basis for isolation: every membership record belongs to exactly one Business. This package's design requirement for `ENG-P2-003` commands:

- **Business A cannot read/manage Business B's membership** — every command (invite/accept/suspend/reactivate/remove/role-change/override-admin) must take an explicit `businessId` and verify the acting identity's *own* membership in *that* Business before acting, reusing `ENG-P2-004`'s already-Complete cross-business role-context isolation (its own design explicitly names this as a resolved concern, `ENG-P2-004-DESIGN-001` scope).
- **Membership IDs are Business-scoped** — a `membershipId` alone (without also verifying its `businessId` matches the command's context) must never be sufficient to authorize an action, matching the acceptance-authority principle already required in §8.
- **`userId` alone is never sufficient authority** — matches `ENG-P2-004`'s evaluator design, which resolves authority from `(userId, businessId)` → membership, never from `userId` in isolation.

No new mechanism is invented here — this section restates, for the staff-management command surface specifically, guarantees `ENG-P2-002`/`ENG-P2-004` already provide structurally and that `ENG-P2-003` commands must consume, not re-derive.

---

## 14. Permission Override Administration (Phase R)

`ENG-P2-004` already defines the persisted `PermissionOverride` contract (`permissionOverride.ts`) and its Firestore-mapped shape (`PermissionOverrideRecord`, TRD10 §10.6.4). Its own code comments are explicit that **serialization/persistence *reading* is `ENG-P2-004D`'s scope (done), but nothing in `ENG-P2-004A/B/C/D` implements a *write* command** — `ENG-P2-004B` is described everywhere as "the runtime evaluator," never a writer; no `functions/src/domains/permissions/**` file contains a grant/revoke command.

**Yes — `ENG-P2-003` owns the WRITE commands for grant/revoke override**, consistent with the task's framing and with `staff.manage`/`staff.assignPermissions` both being catalogued under `owningDomain: "Business membership"`. This package's design requirements, all directly derivable from already-approved `ENG-P2-004A` contract logic (not new policy):

- **Who may assign**: `staff.assignPermissions` holder (Owner by default; Manager if explicitly granted) — exactly as §11.1's catalogue table states.
- **Target-role eligibility**: `createPermissionOverride`'s existing validation already enforces per-permission eligibility (`entry.explicitGrantEligibleRole`) and **unconditionally rejects any override targeting `role === "owner"`** (`permissionOverrideCannotTargetOwnerError`) — `ENG-P2-003`'s write command must invoke this existing validation, never bypass or reimplement it.
- **Which permissions support grant/revoke**: exactly what `sensitivePermissionCatalogue.ts`'s `explicitGrantRequired`/`explicitRevocationSupported` flags already say per entry (e.g., `business.transferOwnership` supports neither) — `ENG-P2-003` must not expand this list.
- **Owner-target prohibition**: already structurally enforced by `permissionOverride.ts` itself — `ENG-P2-003`'s command need only call the existing constructor, not re-derive the rule.
- **Same-Business requirement**: per §13.
- **Audit consistency**: reuse `ENG-P2-004C`'s already-Complete permission-decision-audit integration unmodified — `ENG-P2-003` must not invent a second audit path.

`ENG-P2-003` must **consume** these 004A–D contracts exactly as written, per the task's explicit instruction not to redesign evaluator semantics.

---

## 15. Shared-Device Authentication Disposition (Phase S)

`DEC-SEC-003` is confirmed **`OPEN_ENGINEERING`** (verbatim, §10 above) — not a Founder-blocking status, but not resolved either. Its "Current confirmed position" field already states: *"individual accountability mandatory (`DEC-ID-002`)"* — i.e., whatever shared-device mechanism is eventually chosen, it may **not** relax the individual-account principle.

Options the decision register itself lists (verbatim): *"(a) per-staff PIN switch on shared session; (b) full re-login per staff; (c) device-bound staff selection + PIN."* No option is selected; the register states *"needs UX/security prototyping."*

**Disposition (verified, not assumed):** `DEC-SEC-003`'s own "Blocks" field says *"staff app UX"* — not "staff membership backend architecture." Every membership-model, lifecycle, invitation, and authorization element this package designs (§4–§14) is defined entirely in terms of the `businessMembership` record and `ENG-P2-004`'s evaluator — neither depends on how a physical device authenticates a returning staff member. **`ENG-P2-003`'s backend membership contracts can therefore proceed independent of `DEC-SEC-003`'s resolution; the shared-device UX itself remains deferred**, confirming the task's stated likely disposition rather than merely assuming it.

---

## 16. Subscription Staff Limits, Customer Lookup Disposition & Error Taxonomy (Phases T, U, Y)

### 16.1 `DEC-SUB-002` (staff limits per plan) — `OPEN_FOUNDER`, verified

Its "Current confirmed position" (verbatim): *"staff limits exist as plan entitlements (confirmed); values open."* — i.e., the *existence* of a staff-count entitlement ceiling is already confirmed policy; only the concrete numbers are open.

**Disposition:** the `businessMembership` domain (schema, lifecycle, authorization) can be fully designed and eventually implemented without concrete plan-limit numbers — exactly as `ENG-P2-002`/`ENG-P2-004` were implemented while `DEC-SUB-001/003/008` (plan names, trial structure, pricing) remained open. What **cannot** proceed without `DEC-SUB-002` resolving is the **INVITE command's entitlement-enforcement check** (comparing current active-membership count against a concrete plan ceiling) — that specific, narrow piece of INVITE must either (a) wait for `DEC-SUB-002`, or (b) ship INVITE without entitlement enforcement initially, with enforcement added as a later, additive correction once the plan catalogue exists. This package does **not** hardcode any plan-count value (per the task's explicit instruction) and recommends option (b) only as the smaller implementation-sequencing question, not as a policy decision — surfaced at §21 (FD-7-STAFF, low priority, safely deferrable).

### 16.2 `DEC-ID-004` (customer phone lookup) — `OPEN_FOUNDER`, verified

As found in §10 above: `DEC-ID-004` governs point-of-sale customer lookup, a distinct feature from staff invitation. This package finds it affects Staff Identity **only conditionally** — if a future implementation chooses invitation Option 6.4(a) (existing-identity lookup) as the invitation mechanism, and specifically chooses to reuse the *same* lookup surface `DEC-ID-004` will eventually govern, rather than a separately-scoped staff-invitation lookup. **Recommendation: do not let `DEC-ID-004` block Staff Identity architecture** — it is unrelated to the membership model itself, matching the task's own stated expectation, now confirmed by direct comparison of the two decisions' text rather than assumed.

### 16.3 Error taxonomy mapping (Phase Y)

The closed 14-category taxonomy (`functions/src/shared/errors/errorCategories.ts`, quoted verbatim):
```
AUTH_REQUIRED, AUTH_FORBIDDEN, ACCOUNT_SUSPENDED, BUSINESS_INACTIVE,
SUBSCRIPTION_LIMIT_REACHED, INVALID_STATE_TRANSITION, PURCHASE_ALREADY_RESPONDED,
REWARD_NOT_AVAILABLE, REWARD_ALREADY_REDEEMED, IDEMPOTENCY_CONFLICT,
VALIDATION_FAILED, RESOURCE_NOT_FOUND, TEMPORARY_UNAVAILABLE, INTEGRATION_FAILED
```

No new category is proposed — every anticipated `ENG-P2-003` failure maps onto an existing one:

| Anticipated failure | Category |
|---|---|
| Invite target not found (unresolvable delivery address / identity) | `RESOURCE_NOT_FOUND` |
| Invite already pending for this person/Business | `VALIDATION_FAILED` (structural conflict on the invitation record — mirrors how `permissionErrors.ts` uses `VALIDATION_FAILED` for every structural-invariant violation today) |
| Already an active/suspended member | `VALIDATION_FAILED` |
| Invitation expired | `RESOURCE_NOT_FOUND` (an expired reference no longer resolves) or `VALIDATION_FAILED` — genuinely ambiguous between the two existing categories; not resolved here, flagged as an implementation-detail choice, not a taxonomy gap |
| Unauthorized role assignment / insufficient permission | `AUTH_FORBIDDEN` — deferred to `ENG-P2-004`'s evaluator outcome, never a locally-thrown category |
| Target is Owner (protected) | `AUTH_FORBIDDEN` (mirrors `permissionOverrideCannotTargetOwnerError`'s use of a rejection, not a special category) |
| Membership inactive (acting on a `suspended`/`removed` membership) | `INVALID_STATE_TRANSITION` |
| Cross-business membership mismatch | `AUTH_FORBIDDEN` |
| Subscription/staff-count limit reached | `SUBSCRIPTION_LIMIT_REACHED` — already exists precisely for this purpose |

---

## 17. Events / Audit Model (Phase X)

Reusing the shared outbox pattern already established by `ENG-P1-002` and consumed by `ENG-P2-002B` (`businessEvents.ts`'s `DomainEvent<T>`/`buildEventType` contract) and by AUTH-08 (durable, at-least-once, `eventId`-deduplicated outbox emission) — this package proposes, as **candidate names only, not Founder-approved facts**:

- `StaffInvited`
- `StaffMembershipActivated`
- `StaffMembershipSuspended`
- `StaffMembershipReactivated`
- `StaffMembershipRemoved`
- `StaffRoleChanged`
- `PermissionOverrideChanged`

Every payload should follow `BusinessCreatedPayload`'s already-approved privacy-minimal pattern (`businessEvents.ts`'s own comment: *"deliberately excluded — no governed necessity … already durably available on the … document itself"*) — carry only identifiers (`membershipId`, `businessId`, `userId`, categorical `role`/`status`), never contact details or permission-override content beyond identifiers. `ENG-P2-004`'s sensitive-permission-decision audit (already-Complete, `ENG-P2-004C`) stays entirely separate — these are lifecycle/domain events, not authorization-decision audit records, matching the task's explicit instruction.

---

## 18. Firestore / Data-Model Readiness (Phase W — proposal only, no schema amendment performed)

| Requirement | Current schema sufficiency |
|---|---|
| Active membership, suspension/reactivation, removal, role assignment | **Sufficient** — TRD10 §10.6.4's `businessMembership` schema already carries every field needed (§4) |
| Permission overrides | **Sufficient** — `permissions[]` (`PermissionOverrideRecord[]`) already carries grant/revoke records; only a **write command** is missing (§14), not a schema element |
| Invitations, if Option B (§7) is selected | **Insufficient as-is** — would require a new collection, tentatively named `businessMembershipInvitations` (delivery address, businessId, proposed role, invitedBy, expiry, status: pending/accepted/revoked/expired, opaque reference/token). **Proposal only** — this package does not amend TRD10, per the task's explicit instruction; a future, separately-governed TRD10 amendment (matching the precedent `ENG-P2-004D`'s 2026-08-15 correction note itself set — a documented, dated correction, not a silent rewrite) would be required before implementation |

No schema is amended by this document.

---

## 19. Frontend / Localization Boundary (Phase Z)

Future customer/business-facing surfaces this package identifies (no UI implemented):
- Invite-staff form
- Pending-invitations list
- Staff list / membership management screen
- Role-assignment control
- Suspend / Reactivate / Remove actions
- Permission-override administration screen
- Invitation-acceptance flow (for the invitee)

Per I18N-001 (already merged, centralized `en`/`fr` foundation), every surface above requires both languages when built. No UI is implemented by this package.

---

## 20. Dependency Graph (Phase AA)

```
Customer Identity (Complete)
        |
        v
Authentication (Complete) --------------+
        |                               |
        v                               v
Business Identity (ENG-P2-002,   ENG-P2-004 role-context/
 A/B/C merged)                    permission evaluator (Complete)
        |                               |
        +---------------+---------------+
                         v
              Staff Membership (ENG-P2-003, this package)
                         |
        +----------------+----------------+----------------+
        v                v                 v                v
  Subscription       Shared-device     Frontend         Permission-Override
 (staff-count        UX (DEC-SEC-003,  backend UI/       Administration
  entitlement,        deferred, non-   localization       (consumes ENG-P2-004,
  DEC-SUB-002          blocking)        (deferred)         this package's write
  open, non-                                                commands)
  blocking)
```

### 20.1 Circularity check

No cycle exists. Staff Membership depends on Customer Identity, Authentication, Business Identity, and `ENG-P2-004` — all four already `Complete`/merged. It has no reverse dependency from any of those four (none of them reference `businessMembership`'s write-side; `ENG-P2-004` only *reads* the schema, a one-directional consumption already in place). Subscription, Shared-device UX, and Frontend all depend *on* Staff Membership, never the reverse. **Result: acyclic.**

---

## 21. Founder Decisions Required (Phase AB — consolidated register)

| ID | Question | Why needed | Options | Recommendation | Package blocked | Safely deferrable? | Security impact | Customer/operational impact | Reversibility |
|---|---|---|---|---|---|---|---|---|---|
| **FD-1-STAFF** | Which invitation-target mechanism(s) does MVP support — existing-identity-only, email/phone delivery-address, invite code/link, loyalty-number, or a combination? | §6.4 — no governed mechanism selection exists; blocks invitation-command design entirely | (a)-(d) per §6.4 | (b), email/phone delivery-address with identity bound on acceptance, gated by FD-2-STAFF's model choice | `ENG-P2-003A` | No — primary unresolved design question | Medium — wrong choice risks impersonation if acceptance authority (FD-2) is weak | High — determines how businesses onboard staff | Additive-extendable |
| **FD-2-STAFF** | Given `userId` is required by TRD10 §10.6.4's current schema, which invitation-persistence model resolves the identity-unknown-at-invite-time gap — A, B, or C? | §7 — structural schema conflict | A/B/C/D per §7 | **B** (separate invitation record) | `ENG-P2-003A`/`003B` | No | Low directly; Medium indirectly (acceptance-authority design depends on this) | High | B is least-disruptive/most-reversible |
| **FD-3-STAFF** | Is a pre-acceptance invitation cancellation a `removed`-transition or a distinct pre-acceptance-only deletion? | §5.1 — TRD10's closed 4-value status enum has no slot for this | Extend enum vs. model as invitation-record-only (resolves automatically if FD-2 = B) | Resolves automatically under FD-2 = B | `ENG-P2-003B` | Yes, bundled with FD-2 | Low | Low | Fully reversible pre-acceptance |
| **FD-4-STAFF** | Is REMOVE reversible via a "restore" transition, or only via re-invitation? | §5.3 — TRD10 silent | Restore-in-place vs. re-invite | Re-invite (keeps 4-value enum intact) | `ENG-P2-003C` | Yes | Low | Low | Re-invite is more conservative, fully-reversible |
| **FD-5-STAFF** | What invitation expiry period, single-use/resend policy? | §9 — no source specifies values | Any period; or no expiry (manual revoke only) | No period invented — needs explicit numeric policy | `ENG-P2-003B` | Yes, safely deferrable | Low-Medium | Low | Fully reversible (policy value only) |
| **FD-6-STAFF** | Does `staff.manage` already cover role assignment/change? Who may promote/demote, alter a peer Manager, or act on themselves? | §11.2-11.5 — catalogue text silent on role-change specifically | Broad reading vs. new identifier vs. narrower self-action rules | Broad reading as starting default, flagged for caution | `ENG-P2-003C` | No — affects whether a new catalogue entry is needed | Medium — privilege-escalation-adjacent | Medium | New-identifier path is additive/reversible |
| **FD-7-STAFF** | Should INVITE enforce `DEC-SUB-002`'s (still-open) staff-count entitlement at MVP, or ship without enforcement and add it later? | §16.1 | Wait for `DEC-SUB-002`; or ship first, enforce later | Ship first, enforce later (matches `ENG-P2-004D` FD-5 precedent) | `ENG-P2-003B` (INVITE only) | Yes, low-priority | Low | Low at MVP scale | Fully reversible/additive |

Not included as Founder-decision items (implementation trivia, per the task's instruction): exact Firestore field ordering, exact test-matrix structure, exact TypeScript type names — these belong to the eventual implementation package, not this design.

---

## 22. Package Decomposition (Phase AC)

Derived from the actual dependency structure found (§20), not mechanically copied from the task's illustrative shape, though it converges on a similar decomposition because the underlying dependency graph genuinely supports it.

### `ENG-P2-003A` — Membership & Invitation Domain Contracts
- **Responsibility:** Pure domain types/validation for `businessMembership` lifecycle transitions (§5) and the invitation record (once FD-2-STAFF resolves) — mirrors `ENG-P2-004A`'s "contracts only, no runtime evaluation, no persistence" pattern.
- **Dependencies:** `ENG-P2-002` (Business aggregate), `ENG-P2-004` (Role/permission contracts, consumed not modified) — both already `Complete`.
- **Exclusions:** No Firestore writes, no command orchestration, no event emission.
- **Acceptance boundary:** Type/validation unit tests only.
- **Test strategy:** Pure unit tests (no emulator).
- **Readiness:** Blocked only on FD-1/FD-2-STAFF.

### `ENG-P2-003B` — Invitation / Acceptance Persistence
- **Responsibility:** The invitation write path (INVITE, cancel/revoke), the acceptance command (proving recipient identity per §8), and the transactional creation of the `businessMembership` document on ACCEPT.
- **Dependencies:** `003A`; Authentication's identity-resolution path (`-09`, already-Complete, consumed not modified).
- **Exclusions:** Role-change, suspend/reactivate/remove, permission-override administration.
- **Acceptance boundary:** Real Firebase Emulator Suite integration tests for the invitation to acceptance to membership-creation transaction.
- **Test strategy:** TDD, unit + emulator, matching `ENG-P2-002B`'s bootstrap-transaction precedent.
- **Readiness:** Blocked on FD-1/2/3/5-STAFF.

### `ENG-P2-003C` — Membership Lifecycle & Role Management
- **Responsibility:** SUSPEND/REACTIVATE/REMOVE commands, role-change command, Owner-protection enforcement (§12.2), cross-business isolation enforcement (§13) — every command deferring authorization to `ENG-P2-004`'s evaluator, never re-implementing it.
- **Dependencies:** `003A`/`003B`; `ENG-P2-004` (consumed).
- **Exclusions:** Permission-override administration (`003D`); invitation/acceptance (`003B`).
- **Acceptance boundary:** Emulator-backed state-machine test matrix covering every transition in §5.2 plus Owner-protection adversarial tests.
- **Test strategy:** TDD, unit + emulator.
- **Readiness:** Blocked on FD-4/6-STAFF; FD-7-STAFF affects only `003B`'s INVITE, not `003C`.

### `ENG-P2-003D` — Permission Override Administration
- **Responsibility:** Grant/revoke commands consuming `ENG-P2-004A`'s already-approved `createPermissionOverride` validation and `ENG-P2-004C`'s audit integration, unmodified.
- **Dependencies:** `003A`; `ENG-P2-004A`/`004C` (consumed).
- **Exclusions:** Evaluator/audit redesign of any kind.
- **Acceptance boundary:** Emulator tests proving Owner-target rejection, catalogue-eligibility enforcement, and audit-record creation on every write.
- **Test strategy:** TDD, unit + emulator.
- **Readiness:** No open Founder dependency found specific to this package beyond the general staff-management authorization questions in FD-6-STAFF.

### `ENG-P2-003E` — Integration / Closure
- **Responsibility:** Cross-package validation, events (§17) wiring via the shared outbox, full-suite regression, concern-completion reporting (matching `CAP-P2-007`/`CAP-P2-008`'s precedent).
- **Dependencies:** `003A`-`003D`.
- **Exclusions:** Frontend, shared-device UX, subscription enforcement.
- **Acceptance boundary:** Full DoD §2.1-2.7/2.11/2.12 + G1 Technical Review coverage.
- **Test strategy:** Full-suite regression, no new tests of its own beyond integration coverage.
- **Readiness:** Blocked on `003A`-`003D` all reaching `Complete`.

---

## 23. Implementation Readiness Matrix (Phase AD)

| Package | Classification | Basis |
|---|---|---|
| `ENG-P2-003A` | **BLOCKED BY DESIGN** (FD-1/FD-2-STAFF unresolved) | Cannot finalize the invitation contract shape without the invitation-model decision |
| `ENG-P2-003B` | **BLOCKED BY DESIGN** (depends on `003A`) + **BLOCKED BY EXTERNAL DECISION** (FD-5-STAFF expiry policy, though safely deferrable) | |
| `ENG-P2-003C` | **BLOCKED BY DESIGN** (FD-6-STAFF role-change-permission gap) | Owner-protection and lifecycle transitions are otherwise ready-shaped once `003A`/`003B` exist |
| `ENG-P2-003D` | **READY AFTER FOUNDER DISPOSITION** of this package as a whole — its own specific dependencies (existing `ENG-P2-004A` catalogue) are already fully resolved | No open Founder question in §21 is specific to `003D`'s own scope |
| `ENG-P2-003E` | **DEFERRED** — cannot begin before `003A`-`003D` reach `Complete` | Sequencing dependency only |

No package is authorized to begin coding by this document. This matrix records readiness classification only.

---

## 24. Capability-3 Status Recommendation (restated from §1.4)

Recommend `CDR-001` §5 Capability 3 move from `Not started` to **`Open — partially implemented; not closed`**, via dated-supersession note (applied in §25 below), reflecting `ENG-P2-002A/B/C` and `ENG-P2-004-CORR-001` now merged and Capability 2's FD-3 sequencing gate now satisfied. `ENG-P2-003` itself remains **not started** — this design package does not change that.

---

## 25. Documentation / Tracking Updates Applied by This Package (Phase AE)

This package applies the minimal dated-supersession correction identified in §1 to two files:

1. `docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md` §5 Capability 3 — a new dated note appended after the existing `[UPDATED 2026-08-17 — ENG-P2-002A merged/closed]` note (not rewriting it), recording `ENG-P2-002B`/`ENG-P2-002C`/`ENG-P2-004-CORR-001` merges and the Capability-3 status recommendation from §24, and recording this design package's delivery.
2. `docs/05-implementation/change-tracking/engineering-implementation-programme.md` — a synchronized note added at the same point, per the Programme's own §A.6 "kept in sync" rule.

No historical report is rewritten. `decision-register.md` is **not modified** by this package — no pre-existing decision's content is altered, and no new pointer entry was found to be required by established convention (the design packages this one mirrors, `ENG-P2-002-DESIGN-001`/`ENG-P2-004-DESIGN-001`, do not add Decision Register pointer entries either — they cite decisions by ID from the roadmap document instead, the same pattern this package follows).

---

## 26. Validation

Docs-only change. No `functions/`, `apps/web/`, Firestore Rules, or CI-configuration file is touched. Per repository convention for docs-only PRs (matching `ENG-P2-002-DESIGN-001`/`ENG-P2-004-DESIGN-001`'s own validation record), the applicable checks are: `prettier`/formatting (if configured for `docs/`) and the repository's standard CI, which is not path-filtered and therefore still runs on a docs-only PR — its result is recorded in the PR evidence, not fabricated here in advance.

---

## 27. Report Pointer

The full 53-item report required by the founder task specification is delivered as the task's final chat response (per the task's own instruction), not duplicated verbatim inside this document beyond the analysis above.

**FINAL GATE: ENG-P2-003 DESIGN READY FOR FOUNDER DISPOSITION**
