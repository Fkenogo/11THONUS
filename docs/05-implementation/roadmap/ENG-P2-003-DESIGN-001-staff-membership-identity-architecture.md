> **Title:** ENG-P2-003-DESIGN-001 — Staff Membership & Identity Architecture
> **Version:** 1.1 · **Status:** Design package — Founder dispositions recorded (§28); NOT an implementation authorization · **Classification:** Working (execution-layer architecture record)
> **Governing document:** [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-ID-002`, `DEC-ID-003`, `DEC-ID-004`, `DEC-SEC-003`, `DEC-SUB-002`, `DEC-SUB-009`; [`CDR-001` Capability 3](CDR-001-capability-delivery-roadmap.md#capability-3--business-identity); [`ENG-P2-002-DESIGN-001`](ENG-P2-002-DESIGN-001-business-identity-architecture-delivery-design.md); [`ENG-P2-004-DESIGN-001`](ENG-P2-004-DESIGN-001-role-context-permission-resolution-architecture.md); PRD1 (`01-accounts-roles-and-permissions.md`); PRD3 (`03-business-registration.md`); TRD10 §10.6.4; TRD11 §11.35 (error taxonomy); TRD12 §12.4.3/§12.11–12.16
> **Source-of-truth path:** `docs/05-implementation/roadmap/ENG-P2-003-DESIGN-001-staff-membership-identity-architecture.md`
> **Last controlled update:** 2026-08-18 (`ENG-P2-003-DESIGN-001` v1.1 — Founder dispositions FD-1-STAFF through FD-7-STAFF, plus DEC-SUB-002/DEC-ID-004/Capability-3-status cross-cutting items, recorded per §28. No implementation authorized or performed by this revision.)

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
| Business Identity (`ENG-P2-002`) | The `Business`/`BusinessBranch` aggregates, `ownerUserId`, bootstrap. `Business.ownerUserId` is set once at bootstrap and is the structural Owner-floor anchor `ENG-P2-002-DESIGN-001` defines. | Reassigning `ownerUserId` (ownership transfer is separately deferred, §11.4 below) |
| `ENG-P2-004` (role-context & permission resolution) | The **evaluator**: given a `businessMembership`, resolve role-template + override precedence into an allow/deny decision. Already `Complete`. | `ENG-P2-003` is a **producer** of the `businessMemberships` documents `ENG-P2-004` **reads**; it must never redesign `ENG-P2-004`'s evaluator, catalogue, or audit contracts — those are consumed unmodified |
| Subscription enforcement | Plan-level staff-count entitlement ceilings (once `DEC-SUB-002` resolves, §10). | Enforcing a concrete numeric limit before that policy exists |
| Frontend UX | Invite/list/suspend/remove/role-assignment screens, permission-override admin UI, shared-device staff-switcher UX. | Any UI — this package is docs-only, backend-architecture-only |

### 3.3 What `ENG-P2-003` does NOT create

Per `DEC-ID-002`'s "shared accounts prohibited" text and the accountability principle above, this package confirms the following are **structurally excluded**, matching the task's explicit non-authorization list:
- **No `StaffIdentity` aggregate.** A membership document referencing an existing Customer Identity `userId` is the entire staff-identity model.
- **No Business-specific authentication principal.** A staff member signs in through the same Authentication stream as any customer; the *membership* — not a separate credential — is what confers Business-context authority.
- **No shared-account model.** DEC-ID-002 is unconditional on this point; a shared-device convenience mechanism (`DEC-SEC-003`) must not weaken per-identity attribution (§15).

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

> **[2026-08-18 — Founder disposition, §28 FD-2-STAFF]** Resolved: FD-2-STAFF (Founder's authoritative numbering, §28 — see §28.0's numbering-reconciliation note for why this differs from this table's own placeholder `FD-3-STAFF` label below) approves the separate pre-acceptance invitation record (Option B, §7), so this ambiguity dissolves exactly as §21's own "resolves automatically under FD-2 = B" anticipated — **the `invited` state and its revoke/expire/consume terminal states live entirely on the new Business-scoped invitation record, never on `businessMembership`'s four-value status enum.** TRD10 §10.6.4's `BusinessMembershipDocument.status` enum (`invited`/`active`/`suspended`/`removed`) is **unchanged**; `businessMembership.userId` remains **non-nullable**, exactly as declared today — FD-2-STAFF explicitly rejects making it optional. A `businessMembership` (with `status: "active"` from creation, per §6 below) is created for the first time only on successful invitation acceptance; there is no `businessMembership` in an `invited` state under the resolved model. The `invited` value in TRD10's status enum is therefore not exercised by any invitation created under the resolved FD-2-STAFF model — it is preserved unmodified in the schema (`ENG-P2-004`'s reader is not touched) and is not repurposed. This is a design-local reconciliation only; TRD10 §10.6.4 itself is not amended by this document (§18/§26).

### 5.2 Per-transition table

| Transition | Initiator | Required permission | Prerequisites | Reversible? | Persisted timestamps | Audit/event |
|---|---|---|---|---|---|---|
| **INVITE** (— → `invited`) | An existing member with invite authority | `staff.manage` (§11) | Target not already an active/invited member of *this* Business (§16 `ALREADY_A_MEMBER`/`INVITE_ALREADY_PENDING`); Business itself in an operable status (`ENG-P2-004-CORR-001`'s pre-operational gate is the precedent this reuses, not redesigns) | N/A (creates the record) | `invitedBy`, `invitedAt` set; `createdAt`/`updatedAt` | `StaffInvited` (proposed, §17) |
| **ACCEPT** (`invited` → `active`) | The invited Customer Identity itself, authenticated, proving it is the intended recipient (§8) | None (self-service; the invitation *is* the authority — see §8's authority model) | A valid, unexpired, unrevoked invitation reference resolves to this membership and to the authenticated identity | N/A (one-way; a later removal is a separate REMOVE transition, not an "un-accept") | `acceptedAt` set | `StaffMembershipActivated` (proposed) |
| **SUSPEND** (`active` → `suspended`) | A member with suspend authority | `staff.manage` | Target is not the sole active Owner (§12 Owner Protection); target membership is `active` | **Reversible** via REACTIVATE | `updatedAt` | `StaffMembershipSuspended` (proposed) |
| **REACTIVATE** (`suspended` → `active`) | A member with suspend/reactivate authority | `staff.manage` | Target membership is `suspended`; Business itself operable | Reversible (via SUSPEND again) | `updatedAt` | `StaffMembershipReactivated` (proposed) |
| **REMOVE** (`active` or `suspended` → `removed`) | A member with remove authority | `staff.manage` | Target is not the sole active Owner (§12); historical record is retained, never deleted (TRD10 Membership Rule 3) | **Non-reversible** — a removed member must be re-invited (a fresh `invited` record, new `id`), never resurrected in place | `endedAt` set; `updatedAt` | `StaffMembershipRemoved` (proposed) |

Every governed transition above is grounded in TRD10's status enum (`invited`/`active`/`suspended`/`removed`) and its own Membership Rules — no transition is inferred solely from enum ordering; each is cross-checked against the "historical records remain" and "at least one active owner" rules, both of which directly constrain REMOVE and SUSPEND respectively.

> **[2026-08-18 — Founder disposition addendum, §28 FD-2-STAFF]** The **INVITE** row above (`— → invited` on `businessMembership`) is superseded by the resolved invitation model: INVITE now creates a **Business Membership Invitation** record (§7, not a `businessMembership`), with lifecycle states `pending → accepted / revoked / expired` (§7's addendum below). The **ACCEPT** row's mechanics are corrected accordingly: ACCEPT consumes a `pending` invitation and, in one atomic operation (§8's addendum below), creates the `businessMembership` document directly with `status: "active"` — there is no intermediate `businessMembership` row in an `invited` state. `invitedBy`/`invitedAt` are recorded on the invitation record and copied onto the created membership for historical continuity (matching TRD10's existing field names). The governed-permission requirement (`staff.manage` for INVITE) and every other constraint in the table (Owner-protection on SUSPEND/REMOVE, non-reversibility of REMOVE, etc.) is unchanged.

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

> **[2026-08-18 — Founder disposition, §28 FD-1-STAFF]** **Approved with clarification.** Option (b) — email/phone as a delivery/targeting address, with the Customer Identity bound only on governed acceptance — is confirmed as the MVP mechanism, **not** as a stand-alone policy but with the explicit clarification that email/phone is **never** authoritative 11thONUS identity under any circumstance; a Business may invite a prospective staff member who does not yet have a registered/resolved Customer Identity at all. Options (a) (existing-identity-only) and (d) (loyalty-number invitation) are not excluded as *additional*, narrower invitation-target conveniences a future package may add (e.g., once `DEC-ID-004` resolves, per §16.2's confirmed out-of-scope disposition below) — but they are not required for MVP and this package does not design them. Option (c) (bare invite code/link) is **not adopted**: FD-3-STAFF's acceptance-authority disposition (§8 addendum) requires more than possession of a reference/token.

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

> **[2026-08-18 — Founder disposition, §28 FD-2-STAFF]** **Approved: Option B, separate invitation record.** `businessMembership.userId` is confirmed **non-nullable**, unchanged from TRD10 §10.6.4's current declaration; Option C is explicitly rejected. A `businessMembership` is created only once an authoritative Customer Identity exists, through successful invitation acceptance — never before. The pre-acceptance record — a **"Business Membership Invitation"** — is a structurally separate, Business-scoped concept from `businessMembership`, defined below. This resolution does not reopen or alter `ENG-P2-004`'s membership-reader semantics (`businessMembershipDocument.ts` is untouched) — the completed `ENG-P2-004` invariant that a membership represents a known identity/Business relationship is preserved exactly.

### 7.1a Business Membership Invitation — conceptual data (proposal only, not a frozen schema)

Per the approved model, the minimum conceptual data a pre-acceptance invitation needs — proposed for the later `ENG-P2-003A` implementation package to formalize as an actual Firestore contract (§18), not frozen here:

| Field (conceptual) | Purpose |
|---|---|
| Invitation identity/reference | An opaque, unguessable identifier distinct from the eventual `businessMembership.id` — the reference an invitee's acceptance action names, never a client-supplied `userId` |
| `businessId` | The inviting Business — invitations are Business-scoped, matching the cross-Business isolation principle §13 already establishes for memberships |
| Intended role | `manager` or `staff` only — never `owner` (§11.4 unchanged; role assignment reconciliation §11.6 below) |
| Delivery target + type | The email address or phone number (and which kind) the invitation was targeted to — delivery/verification evidence, never identity (§6.2/§6.3 unchanged) |
| Inviter identity | The accepting-authority-holding member who issued the invitation (mirrors `invitedBy`) |
| Lifecycle state | `pending` / `accepted` / `revoked` / `expired` — see §7.2a below |
| Issued time | Mirrors `invitedAt` |
| Expiry | A time-limited boundary per FD-4-STAFF (§9 addendum) — the concrete duration is Engineering-owned, not frozen here |
| Terminal-state metadata | When/how the invitation reached a terminal state (accepted/revoked/expired), for audit/history — terminal records are retained, never hard-deleted (FD-4-STAFF) |
| Acceptance linkage | Once accepted, a reference to the `businessMembership` the acceptance created, so the invitation's history remains traceable |
| Schema/version metadata | If repository convention calls for it (matching `schemaVersion` on every other Capability 2/3 document) |

No field beyond this minimum is proposed. This is conceptual/proposed data only — not a frozen Firestore schema (§18 addresses the governance question of who formalizes it and when).

### 7.2a Invitation lifecycle (resolved)

```
              INVITE
  (none) ─────────────► pending
                            │
        ┌───────────────────┼───────────────────┐
        │ ACCEPT             │ REVOKE             │ (time elapses past expiry)
        ▼                    ▼                    ▼
     accepted             revoked              expired
   (terminal —         (terminal —          (terminal —
   businessMembership   retained, never       retained, never
   created, §8a)        hard-deleted)         hard-deleted)
```

- **`pending`** — the only non-terminal state; the invitation may be ACCEPTed or REVOKEd, or may lapse into `expired`.
- **`accepted`** (terminal) — set atomically with `businessMembership` creation on successful ACCEPT (§8a).
- **`revoked`** (terminal) — set when the same `staff.manage`-holding actor who could INVITE cancels a still-`pending` invitation before acceptance.
- **`expired`** (terminal) — set once the invitation's time-limited window has elapsed without acceptance; an expired invitation cannot be accepted (FD-4-STAFF, §9 addendum).
- **No fifth state is needed.** This package reviewed whether a distinct "consumed" state is required beyond `accepted` and found none — `accepted` already implies single-use consumption (FD-4-STAFF: single-use, incapable of reacceptance).
- **Resend/reissue** creates a **new** invitation record (new reference/id) rather than reactivating a terminal one (FD-4-STAFF) — mirrors the REMOVE-is-non-reversible pattern §5.3 already recommends for memberships, applied consistently to invitations.
- **Terminal records are retained** for operational/audit history, never hard-deleted — matching TRD10's existing "historical membership records shall remain after removal" principle, extended by this disposition to invitations.

---

## 8. Invitation Acceptance Authority (Phase I)

The task requires that acceptance not be authorized merely by possessing a membership ID or invitation reference. Consistent with the Authentication concern's already-governed pattern (AUTH-06's recovery-proof design: *"resolves it to its OWNING identity via the … resolver — recovery target derived from the proof, never client-supplied"*), this package recommends the analogous shape for invitation acceptance:

- The **authenticated principal performing ACCEPT** must be resolved via the existing Authentication→Customer-Identity resolution path (the same `-09` lookup AUTH-02/AUTH-06 already consume) — never a client-supplied `userId`.
- The **invitation reference** (an opaque, unguessable token/ID, not the human-readable delivery address) must independently resolve to exactly one pending invitation.
- **Authority to accept comes from proving control of the invitation's delivery address, not from the reference alone** — e.g., if delivered by email, the accepting identity's own verified email (or verified-provider claim) must match; if by phone, likewise. This mirrors AUTH-06's "proof resolves to its owning identity" pattern, applied to invitation delivery rather than a recovery credential.
- If the accepting identity's verified contact information does **not** match the invitation's delivery address, ACCEPT must fail closed (`RESOURCE_NOT_FOUND` or `AUTH_FORBIDDEN`, §16) — never silently accept on the invitation-reference alone (this is the exact anti-pattern the task calls out: "Do not authorize acceptance merely because someone possesses a membership ID").

**This is this package's design recommendation, grounded in the AUTH-06 precedent already Founder-approved for an analogous problem (recovery-proof authority) — it is not itself a Founder-ratified acceptance-authority policy**, since no `DEC-ID-*` decision addresses invitation acceptance specifically. Surfaced at §21 (FD-2-STAFF, bundled with the invitation-model decision since the two are inseparable).

> **[2026-08-18 — Founder disposition, §28 FD-3-STAFF]** **Approved with clarification.** ACCEPT requires all three of: (1) an authenticated Customer Identity (resolved server-side via the existing Authentication→Customer-Identity path, never client-supplied); (2) a valid invitation proof (the opaque reference resolving to exactly one `pending` invitation, per §7.2a); and (3) secure verification that the accepting identity is entitled to accept, where the invitation was targeted to an email address or phone number. **Possession of the invitation reference alone is confirmed insufficient** — this package's recommended "verified contact must match the delivery target" mechanism is one valid way to satisfy requirement (3), but the Founder's disposition leaves the exact secure mechanism **Engineering-owned** within these three constraints (e.g., a verified-claim match, a delivery-bound one-time confirmation step, or another mechanism achieving the same entitlement guarantee) — not frozen as the single literal design here. The client never chooses or supplies the authoritative membership `userId` under any mechanism. Email/phone remains delivery/verification evidence only and never substitutes for Customer Identity as platform identity (§6.2/§6.3 unchanged).

#### 8a. Acceptance consistency boundary (resolved)

A successful ACCEPT must atomically ensure all of the following, or fail closed with no partial effect:
1. The invitation still resolves and is `pending` (not already `accepted`/`revoked`/`expired`).
2. The principal is authenticated (Authentication→Customer-Identity resolution succeeds).
3. Acceptance authority is verified per FD-3-STAFF above (delivery-target entitlement check).
4. The authoritative Customer Identity is resolved (never client-supplied).
5. No duplicate active/invited membership already exists for this `(userId, businessId)` pair (mirrors §16.3's existing `ALREADY_A_MEMBER` handling).
6. The `businessMembership` document is created, `status: "active"`, `userId` populated from step 4, `invitedBy`/`invitedAt` copied from the invitation.
7. The invitation is marked `accepted` (terminal, §7.2a) and linked to the created membership.
8. Durable audit/outbox evidence is recorded (§17).

**Recommendation: yes, this requires a Firestore transaction.** Steps 5–7 constitute a classic check-then-act sequence (duplicate-membership check, membership creation, invitation consumption) across two documents (the invitation and the new membership) that must never be observed in a partial state — the same TOCTOU-safety concern `ENG-P2-004D`'s `authorizeAndExecute` boundary and `ENG-P2-002B`'s bootstrap transaction already establish as this platform's governed pattern for exactly this shape of multi-document, check-then-write operation. This package does not design the literal transaction code (that is `ENG-P2-003B`'s scope) — it records the requirement and the precedent it must follow.

---

## 9. Invitation Expiry / Replay / Revocation (Phase J)

No source reviewed (Decision Register, TRD10, TRD12, PRD1/PRD3) specifies an invitation expiry period, single-use semantics, or a revocation/resend workflow for staff invitations. This is a genuine gap, not an oversight of this review.

Recommended (unauthorized) minimum, modeled on already-governed idempotency/security patterns elsewhere in the codebase (`ENG-P1-002`'s shared idempotency-key pattern; AUTH-04's "idempotency key reused across transient retries" pattern):
- **Single-use**: an invitation reference is consumed exactly once on successful ACCEPT (mirrors AUTH-06's recovery-proof-reuse rejection).
- **Revocable**: the same `staff.manage`-holding actor who may INVITE may cancel a still-`invited`/pending invitation before acceptance.
- **Expiry**: no period is invented here — **explicitly surfaced as a Founder/Engineering policy gap** (§21, FD-5-STAFF), consistent with how `DEC-SUB-002`'s numeric staff-limit values are left open rather than guessed.
- **Reissue/resend**: a cancelled or expired invitation is re-created (new record/reference), not "revived" — consistent with §5.3's REMOVE-is-non-reversible recommendation.

None of the above is adopted as governed policy by this package.

> **[2026-08-18 — Founder disposition, §28 FD-4-STAFF]** **Approved.** Staff invitations shall be: time-limited; single-use; revocable before acceptance; incapable of acceptance after expiry, revocation, or consumption; reissued through a **new** invitation rather than reactivating a terminal one. Terminal invitation records are retained for operational/audit history, never hard-deleted (§7.2a). **Remaining Engineering-owned implementation details, not frozen by this disposition:** exact expiry duration; token entropy; token encoding; storage representation; bounded retry parameters. This package continues to invent no numeric value.

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

> **[2026-08-18 — Founder disposition, §28 FD-6-STAFF]** **Approved: new sensitive permission, recorded as an approved future catalogue entry.** The narrow reading (reading 2) is confirmed: `staff.manage` does **not** cover role assignment/change. A new sensitive permission identifier is approved: **`staff.assignRole`** — authority to change a Business membership's role between Staff and Manager. `staff.assignRole`'s actual runtime addition to `sensitivePermissionCatalogue.ts` is **not performed by this document** (it is out of scope for this docs-only package, per its own non-authorization list) — it is recorded here as an **approved future catalogue entry** for a later, separately-authorized implementation package (§22 recommends its home). `staff.manage` and `staff.assignPermissions` are **not** reinterpreted to include role-change authority — they remain exactly as `sensitivePermissionCatalogue.ts` defines them today, untouched.

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

### 11.6 Founder disposition — role policy and the two authoritative matrices (2026-08-18, §28 FD-5-STAFF/FD-6-STAFF)

**Every question in §11.5's table is now resolved.** `staff.assignRole` (§11.2's approved catalogue entry) governs role-change; `staff.manage` (unchanged) governs invite/suspend/reactivate/remove. Initial invitation role is **`manager` or `staff` only, never `owner`** (§7.1a's "Intended role" field; §11.4's Owner-assignment exclusion is unchanged and reconfirmed).

#### 11.6.1 Staff-management target matrix (`staff.manage` — invite/suspend/reactivate/remove)

| Actor \ Target | Owner | Manager | Staff | Self |
|---|---|---|---|---|
| **Owner** | N/A (structurally excluded, §12) | Allowed | Allowed | **Prohibited** (self-suspend/self-remove via staff-management commands) |
| **Manager holding `staff.manage`** | **Prohibited** (may never suspend/reactivate/remove a Manager or Owner) | **Prohibited** | Allowed | **Prohibited** |
| **Staff** | **Prohibited** (cannot administer memberships at all) | **Prohibited** | **Prohibited** | **Prohibited** |

Manager's `staff.manage` grant is narrowed by this disposition to **Staff-membership administration only** — a Manager may never suspend/reactivate/remove another Manager, and may never target the Owner. Self-action (self-suspend/self-remove through staff-management commands) is prohibited for every actor, not only Manager. This corrects §12.1's prior "not found in any source" self-action gap (§12 addendum below) and narrows §11.3's prior "Manager may invite only if explicitly granted `staff.manage`" wording — a Manager's `staff.manage` grant, once approved, carries this Staff-only target ceiling structurally, not merely by convention.

#### 11.6.2 Role-change target matrix (`staff.assignRole` — Staff↔Manager only)

| Actor \ Target | Owner | Manager | Staff | Self |
|---|---|---|---|---|
| **Owner** | **Prohibited** (`role=owner` assignment/reassignment is never in scope, §11.4; ownership transfer stays separately governed) | Allowed (Manager→Staff) | Allowed (Staff→Manager) | **Prohibited** |
| **Manager** | **Prohibited** | **Prohibited** (no role-change authority at MVP, non-delegable) | **Prohibited** (no role-change authority at MVP, non-delegable) | **Prohibited** |
| **Staff** | **Prohibited** | **Prohibited** | **Prohibited** | **Prohibited** |

`staff.assignRole` is **Owner-only and non-delegable to Manager at MVP** — unlike `staff.manage`/`staff.assignPermissions`, its catalogue entry (once added, §22) carries no `explicitGrantEligibleRole` for Manager. No actor may change their own role through this command, including Owner. `ENG-P2-003` may never assign `role: "owner"` through any command (§11.4 reconfirmed, §12 addendum). `staff.manage` and `staff.assignPermissions` are **not** reinterpreted as role-change authority — `staff.assignRole` is a fully distinct permission, consumed by a fully distinct command.

---

## 12. Suspend / Reactivate / Remove & Owner Protection (Phases N, O)

### 12.1 Per-action requirements

Already tabulated in §5.2. Restated here for the specific self-action/session-effect questions the task asks:

- **Required permission**: `staff.manage` for all three (§11.1).
- **Authorized roles**: Owner (default); Manager (if explicitly granted).
- **Self-action rules**: not found in any source — **not invented here**. Whether a Manager may suspend/remove themselves is a gap; recommended default (unauthorized) is to disallow self-suspend/self-remove for any membership that would leave the acting identity locked out of a Business it manages, but this is not grounded in a governed source (§21, folded into FD-6-STAFF).

> **[2026-08-18 — Founder disposition, §28 FD-5-STAFF]** **Resolved.** Self-suspend/self-remove through staff-management commands is **prohibited for anyone**, not only Manager (§11.6.1's matrix, "Self" column). Manager holding `staff.manage` may administer **Staff memberships only** — may **not** suspend/reactivate/remove another Manager, and may **not** administer Owner. Staff cannot administer memberships at all. This supersedes the "recommended default, not grounded" framing above — it is now governed policy.
- **Can Owner membership be targeted?** No — see §12.2 (Owner Protection).
- **Session effect**: none, by design (§12.3).

### 12.2 Owner Protection (machine-enforced invariant)

TRD10's Membership Rule — *"A business must retain at least one active owner"* — is the authoritative source for this invariant. This package's required design consequence: **SUSPEND and REMOVE must structurally refuse any target membership where `role === "owner"` and the target is the Business's sole active Owner**, exactly mirroring `permissionOverride.ts`'s already-implemented pattern (`permissionOverrideCannotTargetOwnerError` — an override can never target an Owner membership at all, full stop, not merely "the sole Owner"). Given the catalogue's `business.transferOwnership` entry is `explicitGrantRequired: false` (§11.4), this package recommends the **stronger** rule — Owner membership can never be targeted by ordinary SUSPEND/REMOVE/role-change commands at all, matching the override precedent's absolute exclusion, rather than a "count check" that only blocks removal of the *last* Owner. Ownership transfer (the only governed way an Owner's status could ever legitimately change) remains **separately deferred** — confirmed, not assumed, per §11.4.

> **[2026-08-18 — Founder disposition addendum, §28 FD-5-STAFF/FD-6-STAFF]** Owner Protection is reconfirmed, and now stated exhaustively across every command surface this package defines: the Owner membership can never be a target of `staff.manage` (invite is moot — Owner already exists; suspend/reactivate/remove), `staff.assignRole` (§11.6.2 — `role=owner` is never an assignable value, and Owner-as-target is prohibited outright, not merely "the sole Owner"), or `staff.assignPermissions` (§14, unchanged — `permissionOverrideCannotTargetOwnerError` already enforces this at the `ENG-P2-004A` contract level). Ownership transfer remains the sole, separately-governed exception path and stays entirely outside `ENG-P2-003`.

### 12.4 Operational Staff Roster Visibility (separate read-surface policy, §28 FD-5-STAFF)

> **[2026-08-18 — Founder disposition, §28 FD-5-STAFF]** Roster visibility is confirmed as a **separate policy from `staff.manage` administration**, not a byproduct of holding it. Active Business members may view the Business's operational staff roster **without** holding `staff.manage` — this is a read surface, distinct from the write/administration surface §11.6.1 governs. The roster view must expose only the **minimum operational information required** (e.g., name, role, status — the kind of information needed to operate day-to-day, not exhaustive identity data) and must **never** expose protected Customer Identity information (profile data, contact details, auth/trust internals, or anything `ENG-P2-004`'s `customer.viewProtectedProfile` sensitive permission would otherwise gate). **This package does not enumerate an exact roster DTO field list** — the precise fields are Engineering/frontend-owned and must be finalized during the relevant implementation/frontend package (§19), consistent with how `permissionSetId`'s serialization and expiry durations are left to their respective owning packages elsewhere in this document. The governing constraint recorded here is exclusionary, not a frozen inclusion list: whatever fields are chosen, they must exclude protected Customer Identity/auth/trust/permission-audit internals.

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

> **[2026-08-18 — Founder disposition addendum, §28 FD-6-STAFF]** Reconfirmed: `staff.assignPermissions` (override administration, this section) stays entirely separate from `staff.manage` (§11.1) and the newly-approved `staff.assignRole` (§11.2/§11.6.2). Role change is **never** modeled as a permission override — it is its own command, gated by its own sensitive permission, producing a `role` field mutation on `businessMembership`, never a `PermissionOverrideRecord` entry. `PermissionOverride`'s existing semantics (`permissionOverride.ts`, `ENG-P2-004A`) are unmodified by this disposition.

---

## 15. Shared-Device Authentication Disposition (Phase S)

`DEC-SEC-003` is confirmed **`OPEN_ENGINEERING`** (verbatim, §10 above) — not a Founder-blocking status, but not resolved either. Its "Current confirmed position" field already states: *"individual accountability mandatory (`DEC-ID-002`)"* — i.e., whatever shared-device mechanism is eventually chosen, it may **not** relax the individual-account principle.

Options the decision register itself lists (verbatim): *"(a) per-staff PIN switch on shared session; (b) full re-login per staff; (c) device-bound staff selection + PIN."* No option is selected; the register states *"needs UX/security prototyping."*

**Disposition (verified, not assumed):** `DEC-SEC-003`'s own "Blocks" field says *"staff app UX"* — not "staff membership backend architecture." Every membership-model, lifecycle, invitation, and authorization element this package designs (§4–§14) is defined entirely in terms of the `businessMembership` record and `ENG-P2-004`'s evaluator — neither depends on how a physical device authenticates a returning staff member. **`ENG-P2-003`'s backend membership contracts can therefore proceed independent of `DEC-SEC-003`'s resolution; the shared-device UX itself remains deferred**, confirming the task's stated likely disposition rather than merely assuming it.

> **[2026-08-18 — Founder disposition, §28 FD-7-STAFF]** **Deferred / non-blocking, confirmed.** Shared-device staff switching remains governed through `DEC-SEC-003` and does **not** block `ENG-P2-003A/B/C/D` backend implementation. Any future shared-device solution must preserve individual identity, individual authentication, and individual action attribution, and must never introduce shared staff accounts (unconditional, per `DEC-ID-002`, §3). **Confirmed by direct inspection of this package's own contracts:** no PIN, device-identifier, or session-switch field appears anywhere in the `businessMembership` schema (§4.1), the invitation conceptual data (§7.1a), the lifecycle transitions (§5), or the acceptance boundary (§8a) — shared-device UX is kept entirely outside the current backend Staff Membership packages, exactly as this disposition requires.

---

## 16. Subscription Staff Limits, Customer Lookup Disposition & Error Taxonomy (Phases T, U, Y)

### 16.1 `DEC-SUB-002` (staff limits per plan) — `OPEN_FOUNDER`, verified

Its "Current confirmed position" (verbatim): *"staff limits exist as plan entitlements (confirmed); values open."* — i.e., the *existence* of a staff-count entitlement ceiling is already confirmed policy; only the concrete numbers are open.

**Disposition:** the `businessMembership` domain (schema, lifecycle, authorization) can be fully designed and eventually implemented without concrete plan-limit numbers — exactly as `ENG-P2-002`/`ENG-P2-004` were implemented while `DEC-SUB-001/003/008` (plan names, trial structure, pricing) remained open. What **cannot** proceed without `DEC-SUB-002` resolving is the **INVITE command's entitlement-enforcement check** (comparing current active-membership count against a concrete plan ceiling) — that specific, narrow piece of INVITE must either (a) wait for `DEC-SUB-002`, or (b) ship INVITE without entitlement enforcement initially, with enforcement added as a later, additive correction once the plan catalogue exists. This package does **not** hardcode any plan-count value (per the task's explicit instruction) and recommends option (b) only as the smaller implementation-sequencing question, not as a policy decision — surfaced at §21 (FD-7-STAFF, low priority, safely deferrable).

> **[2026-08-18 — Founder disposition, §28 DEC-SUB-002 cross-cutting item]** `DEC-SUB-002` **remains open and non-blocking**, confirmed. No staff-count value is invented anywhere in this document. **Correction to the wording above:** option (b) is confirmed, but must not be read as "production invitation enforcement will *permanently* ignore subscription entitlements." The correct statement is: **entitlement enforcement is not implemented at MVP contract-design time; it is an integration requirement that must be added once `DEC-SUB-002`'s governed subscription-entitlement contract exists.** The specific, identified integration point is `ENG-P2-003B`'s **INVITE command** — it is the sole call site that would consume a not-yet-existing entitlement check (a staff-count-vs-plan-ceiling comparison) once that contract is governed. `ENG-P2-003B`'s package scope (§22) is updated to record this as a known future integration hook, not a permanently-omitted concern.

### 16.2 `DEC-ID-004` (customer phone lookup) — `OPEN_FOUNDER`, verified

As found in §10 above: `DEC-ID-004` governs point-of-sale customer lookup, a distinct feature from staff invitation. This package finds it affects Staff Identity **only conditionally** — if a future implementation chooses invitation Option 6.4(a) (existing-identity lookup) as the invitation mechanism, and specifically chooses to reuse the *same* lookup surface `DEC-ID-004` will eventually govern, rather than a separately-scoped staff-invitation lookup. **Recommendation: do not let `DEC-ID-004` block Staff Identity architecture** — it is unrelated to the membership model itself, matching the task's own stated expectation, now confirmed by direct comparison of the two decisions' text rather than assumed.

> **[2026-08-18 — Founder disposition, §28 DEC-ID-004 cross-cutting item]** **Confirmed out of scope.** Customer phone lookup is POS/customer-lookup functionality, not a Staff Membership architecture dependency. Staff invitation is **not** coupled to `DEC-ID-004` — FD-1-STAFF's approved mechanism (§6.4 addendum) is email/phone-as-delivery-address, which requires no customer-lookup capability at all. `DEC-ID-004` remains `OPEN_FOUNDER`, unmodified in `decision-register.md`, and unaffected by this disposition.

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

> **[2026-08-18 — Founder disposition addendum, §28]** Re-mapped against the now-resolved invitation/membership split and the FD-3/FD-4/FD-5/FD-6 dispositions — still zero new categories:

| Anticipated failure (post-disposition) | Category |
|---|---|
| Invalid/unresolvable invitation reference | `RESOURCE_NOT_FOUND` |
| Expired invitation (FD-4-STAFF) | `RESOURCE_NOT_FOUND` (an expired reference no longer resolves as acceptable — the ambiguity the original §16.3 flagged is resolved in favor of treating an expired invitation the same as a non-existent one for ACCEPT purposes; this remains an Engineering-owned mapping choice, not a taxonomy gap) |
| Revoked invitation | `RESOURCE_NOT_FOUND` (same reasoning — a revoked reference no longer resolves) |
| Consumed (already-`accepted`) invitation replayed | `IDEMPOTENCY_CONFLICT` (mirrors AUTH-06's recovery-proof-reuse rejection pattern §8) |
| Duplicate active/invited membership (§8a step 5) | `VALIDATION_FAILED` — unchanged from the original table |
| Cross-Business invitation reference used against the wrong Business context | `AUTH_FORBIDDEN` — mirrors §13's cross-business membership-mismatch mapping |
| Wrong accepting identity (FD-3-STAFF entitlement-verification failure) | `AUTH_FORBIDDEN` (or `RESOURCE_NOT_FOUND` if the reference itself does not resolve for that principal — an Engineering-owned choice between the two fail-closed categories, consistent with the pattern already accepted for expiry above) |
| Unauthorized staff-management target (§11.6.1 matrix violation — e.g., Manager targeting a Manager) | `AUTH_FORBIDDEN` — deferred to `ENG-P2-004`'s evaluator outcome, never a locally-thrown category |
| Target is Owner (`staff.manage`, `staff.assignRole`, or `staff.assignPermissions`) | `AUTH_FORBIDDEN` — unchanged |
| Role-assignment denied (§11.6.2 matrix violation — e.g., Manager attempting a role change, or self-role-change) | `AUTH_FORBIDDEN` |
| Subscription/staff-count limit reached (once `DEC-SUB-002`'s contract exists, §16.1 addendum) | `SUBSCRIPTION_LIMIT_REACHED` — future integration hook only, not exercised until that contract is governed |

---

## 17. Events / Audit Model (Phase X)

Reusing the shared outbox pattern already established by `ENG-P1-002` and consumed by `ENG-P2-002B` (`businessEvents.ts`'s `DomainEvent<T>`/`buildEventType` contract) and by AUTH-08 (durable, at-least-once, `eventId`-deduplicated outbox emission) — this package proposes, as **candidate names only, not Founder-approved facts**:

- ~~`StaffInvited`~~
- `StaffMembershipActivated`
- `StaffMembershipSuspended`
- `StaffMembershipReactivated`
- `StaffMembershipRemoved`
- `StaffRoleChanged`
- `PermissionOverrideChanged`

> **[2026-08-18 — Founder disposition addendum, §28 FD-2-STAFF]** `StaffInvited` (struck through above) is superseded by the resolved invitation/membership split: the invitation record's own lifecycle (§7.2a) now more accurately produces its own candidate event names — **`StaffInvitationCreated`**, **`StaffInvitationAccepted`**, **`StaffInvitationRevoked`**, **`StaffInvitationExpired`** — since an invitation is no longer a `businessMembership` state transition. `StaffMembershipActivated` is retained: it now fires at the point ACCEPT creates the `businessMembership` document (§8a), rather than at a separate "invited→active" transition. `StaffMembershipSuspended`/`Reactivated`/`Removed`/`StaffRoleChanged`/`PermissionOverrideChanged` are unchanged. Every name above remains a **candidate, Engineering-owned implementation-detail list**, not a Founder-approved/frozen event contract — nothing in `decision-register.md` or the FD-1…FD-7-STAFF dispositions governs literal event names, consistent with `ENG-P2-002-DESIGN-001` §24's own "Business events" disposition (event names are design-level recommendations, finalized during implementation).

Every payload should follow `BusinessCreatedPayload`'s already-approved privacy-minimal pattern (`businessEvents.ts`'s own comment: *"deliberately excluded — no governed necessity … already durably available on the … document itself"*) — carry only identifiers (`membershipId`, `businessId`, `userId`, categorical `role`/`status`), never contact details or permission-override content beyond identifiers. `ENG-P2-004`'s sensitive-permission-decision audit (already-Complete, `ENG-P2-004C`) stays entirely separate — these are lifecycle/domain events, not authorization-decision audit records, matching the task's explicit instruction.

---

## 18. Firestore / Data-Model Readiness (Phase W — proposal only, no schema amendment performed)

| Requirement | Current schema sufficiency |
|---|---|
| Active membership, suspension/reactivation, removal, role assignment | **Sufficient** — TRD10 §10.6.4's `businessMembership` schema already carries every field needed (§4) |
| Permission overrides | **Sufficient** — `permissions[]` (`PermissionOverrideRecord[]`) already carries grant/revoke records; only a **write command** is missing (§14), not a schema element |
| Invitations, if Option B (§7) is selected | **Insufficient as-is** — would require a new collection, tentatively named `businessMembershipInvitations` (delivery address, businessId, proposed role, invitedBy, expiry, status: pending/accepted/revoked/expired, opaque reference/token). **Proposal only** — this package does not amend TRD10, per the task's explicit instruction; a future, separately-governed TRD10 amendment (matching the precedent `ENG-P2-004D`'s 2026-08-15 correction note itself set — a documented, dated correction, not a silent rewrite) would be required before implementation |

No schema is amended by this document.

### 18.1 Governance-consequence finding (2026-08-18, grounded precedent investigation)

**Question:** now that FD-2-STAFF (§7 addendum) makes a separate Business Membership Invitation collection Founder-approved architecture, does `ENG-P2-003A` require a formal, standalone TRD10 amendment *before* it may define the invitation's persisted contract — or may the implementing package define its own additive, non-`businessMembership` collection with its own dated TRD10 tracking note, the same way other additive collections in this repository were introduced?

**Investigation performed:** direct search of TRD10 (`docs/02-technical/trd/10-firestore-data-architecture.md`) for `authenticationReferences`, `loyaltyNumbers`, `qrIdentityRecords`, `trustRecords`, `businessCodeReservations`, `idempotencyRecords`, `outboxEntries`, and `recoveryProofReferences` — **zero matches** for any of these collection names anywhere in TRD10's own text (confirmed by direct grep of the file, not assumed). Cross-checked against `CDR-001`'s own dated notes, which record the actual governance history in the implementer's own words:

- `CDR-001` §5 Capability 2 (`CAP-P2-ITM-B` independent review note, 2026-08-16, quoted verbatim): *"Independent review re-verified `ITM-DESIGN-001` §12's Firestore schema authority directly against TRD10 (found six other Capability-2 collections — `loyaltyNumbers`, `qrIdentityRecords`, `outboxEntries`, `authenticationReferences`, `idempotencyRecords`, `recoveryProofReferences` — already implemented and merged with zero TRD10 section, establishing clear precedent that a domain-design document, not a TRD10 amendment, governs a new collection's shape at this stage."*
- `engineering-implementation-programme.md`'s `ENG-P2-002B` independent-review note (2026-08-19, quoted verbatim) reaches the identical conclusion for `businessCodeReservations`: *"researched `businessCodeReservations` collection governance: confirmed legitimate reuse of the `loyaltyNumbers`/`qrIdentityRecords` doc-ID-as-value uniqueness precedent … TRD10 enumerates none of the existing implementation-infrastructure collections (`loyaltyNumbers`/`idempotencyRecords`/`outboxEntries`/`authenticationReferences`) either, so no schema amendment was required or made."*
- Every one of these collections was instead governed by its **own owning design document** (`ITM-DESIGN-001` §12 for `trustRecords`/`recoveryProofReferences`; `ENG-P2-002-DESIGN-001`/its implementation reports for `businessCodeReservations`) and later, where TRD10 *is* eventually amended, the amendment is delivered **as part of the implementing package itself**, dated and additive (the one confirmed exception found — TRD10 §10.6.4's own `permissions` field — was amended by `ENG-P2-004D`, the implementing package, via its "2026-08-15 correction" note, not by a prerequisite standalone TRD10-amendment package).

**Finding (grounded, not a guess):** the repository's own, consistently-applied precedent — independently established across at least two prior domains (ITM's `trustRecords` family and Business Identity's `businessCodeReservations`) and re-confirmed by two separate independent-review passes — is that **an implementing package may define an additive, non-conflicting collection's shape in its own governing design document, and may deliver the corresponding TRD10 section as part of that same implementation package's own delivery, with a dated addition rather than a silent rewrite.** No prerequisite, standalone "schema-correction" package preceded any of the four collections found. Applying this precedent directly: **`ENG-P2-003A` may define the Business Membership Invitation's persisted contract directly** (building on §7.1a's conceptual data above), **with the corresponding TRD10 §10.6.4a (or similar) addition delivered as part of `ENG-P2-003A`'s own implementation package**, exactly as `ITM-B` delivered `trustRecords`' TRD10 documentation and `ENG-P2-002B` delivered `businessCodeReservations`'. A separate, prerequisite docs/schema-correction package is **not required** by this finding. This is this package's own grounded conclusion, not a re-litigation of `ENG-P2-004D`'s already-Founder-approved `permissions`-field correction (§4.1, unchanged).

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

> **[2026-08-18 — Founder disposition addendum, §28]** Re-confirmed acyclic after incorporating every FD-1…FD-7-STAFF disposition. Two new edges are added by the dispositions, neither introduces a cycle:
> - **Invitation → Staff Membership** (new node, sits between Business Identity/`ENG-P2-004` and Staff Membership in the same position `businessMembership` occupied before — §7.1a/§7.2a's Business Membership Invitation record is consumed by ACCEPT to produce a `businessMembership`, a one-directional data flow with no reverse reference).
> - **`ENG-P2-004`-owned `staff.assignRole` catalogue addition → `ENG-P2-003C`'s role-change command** (§22 below) — this is a **forward** dependency only: the recommended bounded `ENG-P2-004`-owned correction package (§22) adds one new catalogue entry that `003C` consumes; the correction package has no dependency on any `ENG-P2-003` code or output, so no reverse edge exists and no cycle is created.
>
> Subscription's dependency on Staff Membership gains one specific, narrow edge (§16.1 addendum: `ENG-P2-003B`'s INVITE command as the future integration hook) — still forward-only, Subscription depends on Staff Membership existing, not the reverse. **Result: acyclic, reconfirmed.**

---

## 21. Founder Decisions Required (Phase AB — consolidated register)

> **[2026-08-18 — Founder disposition addendum, §28]** **All seven items below are now resolved.** This table is preserved unmodified as the historical record of the questions originally surfaced (matching this document's own additive/dated-supersession convention, §19's precedent) — it is **not** rewritten. The authoritative disposition for each item is recorded in **§28 Founder Dispositions**, which supersedes the "Recommendation"/open-question framing below in substance, not in text.

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

> **[2026-08-18 — Founder disposition addendum, §28]** §22/§23 above are preserved unmodified as history; both are superseded in substance by the following now that FD-1…FD-7-STAFF are all resolved.
>
> **Package decomposition, updated:**
> - **`ENG-P2-003A`** — Membership & Invitation Domain Contracts. Now unblocked: builds the invitation contract per §7.1a's approved conceptual shape and the membership lifecycle per §5 (as corrected by §5.1/§5.2's addenda). Its own TRD10 §10.6.4a addition ships as part of this package (§18.1 finding) — added scope, not new blocking dependency.
> - **`ENG-P2-003B`** — Invitation / Acceptance Persistence. Now unblocked: implements INVITE/REVOKE/EXPIRE against §7.2a's lifecycle and the ACCEPT transaction against §8a's consistency boundary. Carries the **future entitlement-integration hook** for `DEC-SUB-002` (§16.1 addendum) as a disclosed, non-blocking placeholder in its INVITE command — not implemented until that decision resolves.
> - **`ENG-P2-003C`** — Membership Lifecycle & Role Management. Now unblocked for SUSPEND/REACTIVATE/REMOVE (§11.6.1's matrix) and Owner protection (§12.2 addendum). Its **role-change command specifically requires `staff.assignRole` to exist in `sensitivePermissionCatalogue.ts` first** (§11.2's approved future catalogue entry) — this package's own explicit instruction to prefer `ENG-P2-004` ownership of permission-catalogue definitions is followed here: **the actual catalogue edit does not belong in `ENG-P2-003A/003C`.** Recommendation: a bounded, `ENG-P2-004`-owned correction package — by analogy to the existing `ENG-P2-004-CORR-001` precedent (a bounded, catalogue/evaluator-scoped correction package, not a full re-open of `ENG-P2-004`) — tentatively `ENG-P2-004-CORR-002`, scoped **only** to adding the single `staff.assignRole` catalogue entry (Owner-only, non-delegable, per §11.6.2's matrix). `ENG-P2-003C`'s role-change command then **consumes** that entry, exactly as `003D` already consumes `ENG-P2-004A`'s existing entries — never authoring it itself. `ENG-P2-004-CORR-002` is not authorized by this document; it requires its own future Founder implementation authorization, same as every other implementation package here.
> - **`ENG-P2-003D`** — Permission Override Administration. Unchanged; reconfirmed `staff.assignRole` is never modeled as an override (§14 addendum).
> - **`ENG-P2-003E`** — Integration / Closure. Unchanged in shape; its event-wiring scope now includes the corrected candidate event names (§17 addendum).
>
> **Implementation Readiness Matrix, updated:**
>
> | Package | Classification | Basis |
> |---|---|---|
> | `ENG-P2-003A` | **READY AFTER DESIGN MERGE** | FD-1/FD-2-STAFF resolved (§28); invitation contract shape and TRD10 addition path both settled (§7.1a, §18.1) |
> | `ENG-P2-003B` | **READY AFTER DESIGN MERGE** (depends on `003A`) | FD-3/FD-4-STAFF resolved (§28); `DEC-SUB-002` remains open but is explicitly non-blocking (§16.1 addendum) — INVITE ships without entitlement enforcement, integration hook only |
> | `ENG-P2-003C` | **READY AFTER DESIGN MERGE for SUSPEND/REACTIVATE/REMOVE** (FD-5-STAFF resolved, §11.6.1); **role-change specifically is BLOCKED BY SIBLING PACKAGE** — requires the recommended `ENG-P2-004-CORR-002` catalogue addition (above) to merge first | Owner-protection and target-matrix enforcement are fully specified; only the catalogue entry's existence is an external prerequisite |
> | `ENG-P2-003D` | **READY AFTER DESIGN MERGE** | Unchanged — no open Founder question was ever specific to `003D`'s own scope |
> | `ENG-P2-003E` | **DEFERRED** — cannot begin before `003A`-`003D` reach `Complete` | Sequencing dependency only, unchanged |
>
> "READY AFTER DESIGN MERGE" means: no remaining Founder-decision blocker: each package still requires its own, separate, fresh Founder **implementation** authorization before coding begins — this document authorizes no implementation, for any package, at any readiness classification (unchanged from §22/§23's own original framing).

---

## 24. Capability-3 Status Recommendation (restated from §1.4)

Recommend `CDR-001` §5 Capability 3 move from `Not started` to **`Open — partially implemented; not closed`**, via dated-supersession note (applied in §25 below), reflecting `ENG-P2-002A/B/C` and `ENG-P2-004-CORR-001` now merged and Capability 2's FD-3 sequencing gate now satisfied. `ENG-P2-003` itself remains **not started** — this design package does not change that.

---

## 25. Documentation / Tracking Updates Applied by This Package (Phase AE)

This package applies the minimal dated-supersession correction identified in §1 to two files:

1. `docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md` §5 Capability 3 — a new dated note appended after the existing `[UPDATED 2026-08-17 — ENG-P2-002A merged/closed]` note (not rewriting it), recording `ENG-P2-002B`/`ENG-P2-002C`/`ENG-P2-004-CORR-001` merges and the Capability-3 status recommendation from §24, and recording this design package's delivery.
2. `docs/05-implementation/change-tracking/engineering-implementation-programme.md` — a synchronized note added at the same point, per the Programme's own §A.6 "kept in sync" rule.

No historical report is rewritten. `decision-register.md` is **not modified** by this package — no pre-existing decision's content is altered, and no new pointer entry was found to be required by established convention (the design packages this one mirrors, `ENG-P2-002-DESIGN-001`/`ENG-P2-004-DESIGN-001`, do not add Decision Register pointer entries either — they cite decisions by ID from the roadmap document instead, the same pattern this package follows).

> **[2026-08-18 — v1.1 addendum]** This v1.1 revision applies one further dated-supersession note to the same two files listed above (§25.1 below), appended after the notes this section originally described — the same two-file footprint, not a new file. `decision-register.md` remains unmodified. `docs/05-implementation/11thonus-master-workflow.md` §17 is **not** touched by this v1.1 revision, consistent with the precedent `ENG-P2-002-DESIGN-001`'s own v1.1 Founder-disposition-recording pass set (its dispositions §24 touched only `CDR-001` and the Engineering Implementation Programme, not the Master Workflow) — the alternate precedent (`ENG-P2-004-DESIGN-001`'s v1.1 pass, which did add a Master Workflow §17 bullet) is disclosed here as a divergent precedent, not silently ignored, but this document follows its own §25's already-established two-file convention rather than switch footprints mid-document.

### 25.1 v1.1 tracking updates (applied by this revision)

1. `docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md` §5 Capability 3 — a new dated note appended after the `[UPDATED 2026-08-19 — ENG-P2-003-DESIGN-001, programme-currency correction]` note (not rewriting it), recording that Founder dispositions FD-1-STAFF…FD-7-STAFF and the three cross-cutting items are now resolved (§28) and the design is ready for final Founder review.
2. `docs/05-implementation/change-tracking/engineering-implementation-programme.md` — a synchronized note added at the same point in the P2 row's Notes cell.

---

## 26. Validation

Docs-only change. No `functions/`, `apps/web/`, Firestore Rules, or CI-configuration file is touched. Per repository convention for docs-only PRs (matching `ENG-P2-002-DESIGN-001`/`ENG-P2-004-DESIGN-001`'s own validation record), the applicable checks are: `prettier`/formatting (if configured for `docs/`) and the repository's standard CI, which is not path-filtered and therefore still runs on a docs-only PR — its result is recorded in the PR evidence, not fabricated here in advance.

---

## 27. Report Pointer

The full report required by the founder task specification is delivered as the task's final chat response (per the task's own instruction), not duplicated verbatim inside this document beyond the analysis above.

---

## 28. Founder Dispositions (Recorded 2026-08-18)

**Authority:** Founder, via task "ENG-P2-003-DESIGN-001 — Record Founder Dispositions and Prepare for Final Merge Review," 2026-08-18. Recorded here per this repository's established design-local disposition convention — the same inline, dated, attributed pattern already used by `ENG-P2-002-DESIGN-001` §24 (recording FD-1/FD-2/FD-3) and `ENG-P2-004-DESIGN-001` §17 (recording AD-1–AD-5) — **not** a new Decision Register (`DEC-*`) entry, and **not** a reopening of `DEC-ID-002`, `DEC-ID-003`, `DEC-ID-004`, `DEC-SEC-003`, `DEC-SUB-002`, or `DEC-SUB-009`, all of which remain unmodified in `decision-register.md` (verified: no edit made to that file by this revision). This section is the authoritative disposition record for the seven Founder Decisions this document's own §21 raised, plus three cross-cutting items; §21 itself is preserved unmodified as history (§21's own addendum note points here).

### 28.0 Numbering-reconciliation note (read this first)

The Founder's actual disposition task used its own canonical `FD-1-STAFF`…`FD-7-STAFF` numbering, given directly to this recording task. **This numbering does not map one-to-one onto §21's own placeholder `FD-1-STAFF`…`FD-7-STAFF` table**, which this document authored earlier, independently, before Founder disposition. The correspondence is:

| Founder's authoritative ID (used throughout this §28 and this revision's addenda) | Topic | §21's placeholder item covering the same or an overlapping topic |
|---|---|---|
| `FD-1-STAFF` | Invitation-target mechanism | §21 `FD-1-STAFF` (same topic — numbers align) |
| `FD-2-STAFF` | Invitation-persistence model (Option B) | §21 `FD-2-STAFF` (same topic — numbers align) |
| `FD-3-STAFF` | Acceptance authority (three-part requirement) | §21 bundled this under its own `FD-2-STAFF` (§8's own text: "surfaced at §21, FD-2-STAFF, bundled with the invitation-model decision"); the Founder's task gave it a dedicated number instead |
| `FD-4-STAFF` | Invitation lifecycle policy (time-limited/single-use/revocable/reissue-new) | Closest to §21's placeholder `FD-5-STAFF` (expiry/single-use/resend policy); also settles §21's separate placeholder `FD-4-STAFF` (REMOVE reversibility) by the same reissue-not-restore principle, extended by analogy from invitations to memberships (§5.3, unchanged) |
| `FD-5-STAFF` | Staff-management target restrictions + roster visibility | New scope not separately itemized in §21's placeholder table (closest overlap: §21's placeholder `FD-6-STAFF`'s self-action-rule sub-question) |
| `FD-6-STAFF` | New sensitive permission `staff.assignRole` | §21's placeholder `FD-6-STAFF` (same topic — numbers align) |
| `FD-7-STAFF` | Shared-device deferral/non-blocking confirmation | Not itemized in §21's placeholder table at all (§15 already treated this as a disposition-verified finding, not an open FD); §21's placeholder `FD-7-STAFF` (subscription-enforcement timing) is instead resolved by the separate `DEC-SUB-002` cross-cutting item below |

Every in-document addendum added by this v1.1 revision (§5.1, §6.4, §7.1/§7.1a/§7.2a, §8/§8a, §9, §11.2/§11.6, §12.1/§12.2/§12.4, §14, §15, §16.1, §16.2, §17, §18.1, §20.1, §22/§23) cites the **Founder's authoritative numbering** (this table's left column), not §21's placeholder numbering — this table exists precisely so the two are never confused.

### FD-1-STAFF — Invitation-target mechanism

**Approved with clarification.** Businesses may invite a prospective staff member who does not yet have a registered/resolved 11thONUS Customer Identity. Email and/or phone may be used as invitation delivery/targeting information. Email/phone is **not** authoritative 11thONUS identity. The authoritative staff identity remains Customer Identity and is bound only through the governed invitation-acceptance process. Full reconciliation: §6.4 addendum.

### FD-2-STAFF — Separate invitation record

**Approved.** Pre-acceptance staff invitations are represented separately from `businessMemberships`. `businessMembership.userId` is **not** made nullable. A `businessMembership` is created/bound only when an authoritative Customer Identity exists, through successful invitation-acceptance. The invitation record is Business-scoped. The completed `ENG-P2-004` invariant that a membership represents a known identity/business relationship is preserved; `ENG-P2-004`'s membership-reader semantics are not reopened. Full reconciliation: §5.1, §7.1/§7.1a/§7.2a addenda.

### FD-3-STAFF — Acceptance authority

**Approved with clarification.** Invitation acceptance requires: (1) an authenticated Customer Identity; (2) a valid invitation proof; and (3) secure verification that the accepting identity is entitled to accept, where the invitation was targeted to an email address or phone number. Possession of an invitation reference/token alone is not sufficient authority. The client never chooses or supplies the authoritative membership `userId`. Email/phone remains delivery/verification evidence, never platform identity. Engineering may determine the secure implementation mechanism within these constraints. Full reconciliation: §8/§8a addenda.

### FD-4-STAFF — Invitation lifecycle policy

**Approved.** Staff invitations shall be: time-limited; single-use; revocable before acceptance; incapable of acceptance after expiry, revocation, or consumption; reissued through a new invitation rather than reactivating a terminal one. Terminal invitation records are retained for operational/audit history, never hard-deleted. Exact expiry duration, token entropy/encoding, storage representation, and bounded retry parameters remain Engineering-owned; no numeric value is frozen by this document. Full reconciliation: §9 addendum.

### FD-5-STAFF — Staff-management target restrictions and roster visibility

**Approved with target restrictions.** `staff.manage` remains the sensitive permission governing invite/suspend/reactivate/remove. MVP target authority: Owner may administer Manager and Staff memberships. Manager holding `staff.manage` may administer Staff memberships only — may not suspend/reactivate/remove another Manager, may not administer Owner. Self-suspend/self-remove through staff-management commands is prohibited for anyone. Staff cannot administer memberships. Active Business members may view the Business's operational staff roster without holding `staff.manage`; roster visibility exposes only the minimum operational information required and must not expose protected Customer Identity information; this is recorded as a read-surface policy separate from `staff.manage` administration. Full reconciliation: §11.6.1 matrix, §12.1/§12.2/§12.4 addenda.

### FD-6-STAFF — New sensitive permission `staff.assignRole`

**Approved: new sensitive permission, recorded as an approved future catalogue entry.** Its runtime addition to `sensitivePermissionCatalogue.ts` is **not performed by this document** — that belongs to a later, separately-authorized implementation package (§22 addendum recommends a bounded `ENG-P2-004`-owned correction package, tentatively `ENG-P2-004-CORR-002`). Identifier: `staff.assignRole`. Meaning: authority to change a Business membership role between Staff and Manager. MVP policy: Owner-only; non-delegable to Manager at MVP; Staff→Manager and Manager→Staff both performable by Owner only; Manager cannot change another membership's role; no actor may change their own role through this command; `ENG-P2-003` may never assign `role: "owner"`; ownership transfer remains separately governed and outside `ENG-P2-003`. `staff.manage` and `staff.assignPermissions` are not reinterpreted as role-change authority. Full reconciliation: §11.2/§11.6.2 matrix, §14 addenda.

### FD-7-STAFF — Shared-device deferral, confirmed non-blocking

**Deferred / non-blocking.** Shared-device staff switching remains governed through `DEC-SEC-003`. It does not block `ENG-P2-003A/B/C/D` backend implementation. Any future shared-device solution must preserve individual identity, individual authentication, individual action attribution, and must never introduce shared staff accounts. No PIN/device/session-switch field appears anywhere in the `ENG-P2-003` membership or invitation contracts described in this document (verified, §15 addendum). Full reconciliation: §15 addendum.

### Cross-cutting item — `DEC-SUB-002` (remains open / non-blocking)

No staff-count value is invented anywhere in this document. `ENG-P2-003` contracts/architecture proceed without numeric plan limits. Production invitation enforcement is **not** permanently omitted — enforcement is an integration requirement to be added once `DEC-SUB-002`'s governed subscription-entitlement contract exists, with `ENG-P2-003B`'s INVITE command identified as the specific future integration hook. `DEC-SUB-002` itself remains `OPEN_FOUNDER`, unmodified in `decision-register.md`. Full reconciliation: §16.1 addendum.

### Cross-cutting item — `DEC-ID-004` (out of scope)

Customer phone lookup is POS/customer-lookup functionality, not a Staff Membership architecture dependency. Staff invitation is not coupled to `DEC-ID-004`. `DEC-ID-004` remains `OPEN_FOUNDER`, unmodified in `decision-register.md`. Full reconciliation: §16.2 addendum.

### Cross-cutting item — Capability 3 status vocabulary (approved)

**Approved.** "Open — partially implemented; not closed" is confirmed as established, long-standing programme-status terminology (already used for Capability 2 throughout `docs/05-implementation/11thonus-master-workflow.md` §17 since 2026-08-07 — independently verified as pre-existing vocabulary, not newly invented by this package). §1/§24's recommendation to apply this label to Capability 3 is approved; the stale `CDR-001`/Engineering Implementation Programme tracking is updated accordingly using normal dated-supersession conventions (§25.1) — appended, not rewritten.

### New unresolved item found during reconciliation

**None found that requires a new Founder decision gate.** This revision performed the internal-consistency sweep the task required (§28.0's numbering table plus every in-document addendum above) and did not surface a decision that is both new and unavoidable. The items that remain open after this revision are Engineering-owned implementation judgment calls **within** the now-resolved policy boundary, not additional Founder gates — specifically: (a) the exact secure mechanism satisfying FD-3-STAFF's entitlement-verification requirement (delegated to Engineering by FD-3-STAFF's own text); (b) the exact roster DTO field list under FD-5-STAFF (explicitly delegated to the relevant implementation/frontend package, §12.4); (c) the exact split between `RESOURCE_NOT_FOUND`/`AUTH_FORBIDDEN` for a few edge-case ACCEPT failures (§16.3 addendum, an Engineering mapping choice, not a taxonomy gap); (d) whether `ENG-P2-004-CORR-002` (the recommended catalogue-only correction package for `staff.assignRole`) itself requires a separate future Founder **implementation** authorization before it may begin — yes, exactly as every other implementation package in this document already requires (§22 addendum) — this is a sequencing note, not a new open design question, since FD-6-STAFF already fully specifies what that package must do.

### Status after this disposition

All seven Founder Decisions originally raised by this package's own §21 are now resolved, along with the three cross-cutting items. No `DEC-ID-002`, `DEC-ID-003`, `DEC-ID-004`, `DEC-SEC-003`, `DEC-SUB-002`, `DEC-SUB-009`, or other Decision Register entry was reopened or modified by this disposition. No implementation was performed; no `ENG-P2-003A`/`B`/`C`/`D`/`E`, `ENG-P2-004-CORR-002`, runtime code, Firebase configuration, or deployment change was made by this revision. This design package remains architecture only and does not itself authorize `ENG-P2-003` implementation — each package still requires its own, separate, fresh Founder implementation authorization before coding begins.

---

## 29. Founder Dispositions — ENG-P2-003D Permission Override Administration (Recorded 2026-08-20)

**Authority:** Founder, via task "ENG-P2-003D — Record Founder Dispositions and Resume Permission Override Administration," 2026-08-20. Recorded here per this repository's established design-local disposition convention (§28's own precedent). **Not** a new Decision Register (`DEC-*`) entry, and **not** a reopening of §28's seven `FD-*-STAFF` dispositions or any `DEC-*` entry — `decision-register.md` is unmodified by this addendum.

**Provenance.** ENG-P2-003D's independent implementation attempt (2026-08-20, pre-implementation) correctly halted at two genuine architecture gaps neither this document's §14 nor `ENG-P2-004A`'s contracts resolved: (1) replacement semantics when an override already exists for the same `(membership, permissionId)`; (2) which target-membership statuses (`active`/`suspended`/`removed`/`invited`) permit override administration. Both are resolved below.

### FD-003D-1 — Permission override replacement semantics

**Approved.** `businessMembership.permissions[]` is **current effective override configuration**, not a historical change log. For any one membership + `permissionId`, there is **at most one current `PermissionOverride`**. No existing override → insert the new one. Existing `grant` + a new valid `revoke` → the `revoke` atomically **replaces** the `grant`. Existing `revoke` + a new valid `grant` → the `grant` atomically **replaces** the `revoke`, provided the target's *current* role is eligible under the existing `ENG-P2-004A` contract (`createPermissionOverride`/`explicitGrantEligibleRole`). A repeated identical direction (grant-after-grant, revoke-after-revoke) must not create a second record — the current single record is retained/idempotently confirmed, not duplicated. Contradictory `grant`+`revoke` records for the same `permissionId` must never accumulate. Historical grant/revoke activity is preserved separately, through the existing outbox/event mechanism (§17), never by appending stale records to `permissions[]`. This does **not** change `ENG-P2-004B`'s evaluator precedence semantics (revoke-before-grant, §4.1.3/§4.1.5) — those remain unmodified; this disposition only governs what `ENG-P2-003D`'s write command persists, not how the evaluator reads it.

### FD-003D-2 — Target membership status policy

**Approved.** Override administration depends on the target membership's authoritative *current* status, read inside the same transaction as the mutation (never trusted from request-supplied data):

| Status | Grant | Revoke |
|---|---|---|
| `active` | Allowed, subject to the existing `PermissionOverride`/catalogue role-eligibility contract | Allowed, subject to the existing contract's `explicitRevocationSupported` gate |
| `suspended` | **Prohibited** — a suspended membership must never be used to stage new authority that becomes effective later upon reactivation | **Allowed** — suspension must permit authority to be *reduced* before reactivation |
| `removed` | Prohibited | Prohibited — the relationship is historical/terminal under normal administration |
| `invited` | Prohibited | Prohibited — `ENG-P2-003`'s invitation flow creates the `businessMembership` only after acceptance, so normal override administration never operates on a pre-active invited record |

**Security principle (stated explicitly, binding on implementation):** suspension may reduce authority; suspension must never be used to stage new authority for later activation. This is the asymmetry between the `suspended` row's Grant/Revoke columns above, and it is deliberate, not an oversight.

### Status after this disposition

Both architecture gaps ENG-P2-003D's pre-implementation halt identified are resolved. `ENG-P2-004A`'s `createPermissionOverride` contract, `ENG-P2-004B`'s evaluator, `ENG-P2-004C`'s audit integration, and `sensitivePermissionCatalogue.ts` are unmodified by this disposition — it governs only `ENG-P2-003D`'s own write-command behavior, consuming those contracts exactly as before. No `DEC-*` Decision Register entry is reopened. This addendum itself does not perform implementation; `ENG-P2-003D`'s separate Founder implementation authorization (already granted) governs the resumed coding work.

---

**FINAL GATE: ENG-P2-003 DESIGN — FOUNDER DISPOSITIONS RECORDED (v1.1) — READY FOR FINAL FOUNDER MERGE REVIEW**
