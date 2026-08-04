> **Title:** ENG-P2-001-PLAN-001 — Customer Identity Engineering Decomposition Plan
> **Version:** 1.0 · **Status:** Planning record — proposed decomposition, awaiting mobilisation · **Classification:** Working (execution-layer planning record)
> **Governing document:** [`ENG-P2-ARCH-001` Customer Identity Architecture](ENG-P2-ARCH-001-customer-identity-architecture.md); [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-IDENTITY-001`; [`CDR-001` Capability 2](CDR-001-capability-delivery-roadmap.md#capability-2--customer-identity); [`ENG-P2-RES-000` §7](ENG-P2-RES-000-capability-2-resolution-plan.md#7-capability-authorisation-gate)
> **Source-of-truth path:** `docs/05-implementation/roadmap/ENG-P2-001-PLAN-001-customer-identity-decomposition-plan.md`
> **Last controlled update:** 2026-08-02 (`ENG-P2-001-PLAN-001` — created)

# ENG-P2-001-PLAN-001 — Customer Identity Engineering Decomposition Plan

**This document is a planning record. It authorizes no implementation, no schema, no Rules, no API, no UI, no authentication or ITM logic.** It proposes how the single `ENG-P2-001` work package should decompose into bounded, sequenced, independently reviewable child work packages, consistent with [`ENG-P2-ARCH-001`](ENG-P2-ARCH-001-customer-identity-architecture.md)'s architecture. No proposed package is marked `In Progress`; the roadmap's approved work-package count and capability numbering are unchanged (§9).

## 1. Scope Boundary

`ENG-P2-001` owns the **Customer Identity** concern only (per `DEC-IDENTITY-001`, `ENG-P2-ARCH-001` §2):

**In scope:** permanent internal customer identity; customer profile; loyalty number; QR identity; identity lifecycle/status; identity linking; identity recovery (identity-owned portion); identity permanence; identity ownership/attribution; identity data persistence; identity auditability.

**Out of scope (owned elsewhere, consumed only as an interface, §7):** authentication-provider implementation (any sign-in flow); verification and progressive trust (ITM); fraud scoring; reward accumulation/redemption logic; merchant customer-management features beyond a bounded identity lookup; customer-facing UX beyond what each slice's own Definition of Done requires.

## 2. Work-Package Catalogue

Ten proposed child work packages, `ENG-P2-001-01` through `ENG-P2-001-10`. Each is scoped to be independently reviewable — no package mixes domain modeling, persistence, an external-facing interface, and recovery/linking together.

### `ENG-P2-001-01` — Identity Domain Foundation

> **Updated 2026-08-02:** implemented at `functions/src/domains/identity/` — see the [Implementation Report](../reports/ENG-P2-001-01-implementation-report-2026-08-02.md). Test-first (68/68 tests passing), zero Firebase dependency (machine-enforced by a scoped `eslint.config.js` rule). Pending Founder-authorized review and merge. `ENG-P2-001-02` through `-10` and Capability 2 overall are unaffected — none advanced by this update.

- **Objective:** define the Identity Aggregate's domain shape, invariants, and error/event contracts in code, with no persistence yet.
- **Scope:** aggregate boundary (per `ENG-P2-ARCH-001` §2); Internal Customer ID generation strategy (opaque, server-side); ownership invariant (exactly one aggregate per natural person); status-model type (Identity Lifecycle, §6 below); domain-level errors (using the existing shared error-category contract, `ENG-P1-002`); domain events (using the existing shared event contract/outbox, `ENG-P1-002`); audit-event shape (no implementation of the audit *sink*, that is `-10`).
- **Exclusions:** persistence (`-05`), loyalty number/QR generation (`-03`/`-04`), profile fields (`-02`), any API/UI.
- **Governing requirements:** `DEC-ID-001`, `DEC-IDENTITY-001` Identity Principle, `AIR-001`/`AIR-005`/`AIR-006`.
- **Dependencies:** none (foundational).
- **Decision dependencies:** none additional — already-`CONFIRMED` decisions above.
- **Entry criteria:** none beyond this plan's own mobilisation gate (§10).
- **Deliverables:** aggregate type definitions, invariant-enforcing constructors/validators, domain error types, domain event types — all pure domain code, no Firestore/Firebase Admin SDK calls.
- **Tests required:** unit tests for every invariant (single-owner, immutable ID, valid status transitions per §6) and every domain error path.
- **Security/privacy requirements:** no PII in error messages or event payloads beyond the Internal Customer ID reference.
- **Exit criteria:** all invariants unit-tested; zero persistence code; zero external dependency beyond the existing shared `functions/src/shared` foundation.
- **Downstream consumers:** every other `ENG-P2-001-0x` package.
- **Implementation order:** 1st.
- **Parallelisation:** none (blocks everything).
- **Rollback boundary:** pure domain code, trivially revertable, no data.
- **Risks:** getting the Identity Lifecycle's data representation wrong here is expensive to unwind later — see §14 Ambiguity 1 (`Recovered`) before finalizing.

### `ENG-P2-001-02` — Customer Profile

- **Objective:** define and later implement the mutable, non-identity profile data attached to an Identity Aggregate.
- **Scope:** core attributes (name, display name, photo, country, preferred language — PRD2 §4 Identity 5, §10); required vs. optional fields (PRD2 §6, including the Phase-1-consolidated mandatory-language correction already recorded); contact attributes held as *data*, not as authentication or verification ownership; update rules; privacy boundaries (`PR-005` — public identifiers reveal nothing sensitive); profile lifecycle (created alongside Identity at `Registered`, mutable throughout `Active`/`Dormant`).
- **Exclusions:** the `gender` field's finalized enum/wording — **blocked on `DEC-PROD-012`** (see §14 Ambiguity 2); authentication references; trust/verification fields (ITM-owned).
- **Governing requirements:** PRD2 §4/§6/§10; TRD10 §10.6.2 `customerProfiles` (existing baseline shape).
- **Dependencies:** `-01` (Identity Aggregate must exist to attach a profile to).
- **Decision dependencies:** `DEC-PROD-012` for the `gender` field specifically only (see §14) — not for the rest of the profile.
- **Entry criteria:** `-01` complete.
- **Deliverables:** profile schema shape (mandatory vs. optional fields, `gender` field explicitly deferred/typed as forward-compatible), update-validation rules.
- **Tests required:** required-field validation, optional-field absence handling (Progressive KYC rule — "optional information shall remain absent rather than populated with false placeholders," TRD10 §10.6.2), privacy-boundary tests (no sensitive data in public-facing profile reads).
- **Security/privacy requirements:** consent-version tracking (TRD10 `consentVersions`) enforced at write time.
- **Exit criteria:** profile CRUD logic testable against the domain layer; `gender` field either typed as a deferred/nullable placeholder (recommended, see §14) or explicitly gated pending `DEC-PROD-012`.
- **Downstream consumers:** `-05` (persistence), any future customer-facing profile UI.
- **Implementation order:** parallel with `-03`/`-04` after `-01`.
- **Parallelisation:** yes, with `-03` and `-04`.
- **Rollback boundary:** additive field changes, low risk.
- **Risks:** schema churn if `DEC-PROD-012` resolves differently than the deferred placeholder assumes — mitigated by keeping `gender` optional/nullable from day one (Progressive KYC already requires this).

### `ENG-P2-001-03` — Loyalty Number Service

> **Updated 2026-08-04:** the domain-foundation layer implemented at `functions/src/domains/loyaltyNumber/` — see the [Implementation Report](../reports/ENG-P2-001-03-implementation-report-2026-08-04.md). Test-first (39/39 new tests passing), zero Firebase dependency (machine-enforced by a scoped `eslint.config.js` rule). Firestore persistence, unique indexing, transactions, and distributed collision handling — the concerns this section's own "Tests required" line names against the real Firebase Emulator Suite — remain deferred to a future persistence-layer task; this update covers the value object, provider-neutral generator/uniqueness ports, and the bounded in-memory-testable issuance algorithm only. Pending Founder-authorized review and merge. `ENG-P2-001-01`, `-02`, `-04` through `-10`, and Capability 2 overall are unaffected — none advanced by this update.

- **Objective:** implement loyalty-number generation exactly per `DEC-DATA-007`'s fully-specified Identifier Generation Principles.
- **Scope:** confirmed format `ABC-234` (alphabet excluding `I`/`O`, no checksum — `-X` variant explicitly deferred); server-side-only random generation; transactional uniqueness check at assignment time (same transaction, race-safe); collision handling (customer-invisible automatic retry, bounded max-retry, fallback alerting on exceed); idempotency (at most one immutable assignment per platform user; repeat calls return the existing result); permanence (never regenerated/rotated/reissued, including during recovery); retirement on account closure (never reassigned); audit-logging of every generation event; case-insensitive normalization to one canonical stored form, display formatting applied only at render time.
- **Exclusions:** QR encoding (`-04`, consumes this service's output); the exceptional-replacement policy named but not designed in `ENG-P2-ARCH-001` §4 (flagged, not resolved, §14 Ambiguity 3).
- **Governing requirements:** `DEC-DATA-007` (verbatim), `DEC-ID-001`, PRD2 §8, `AIR-003`.
- **Dependencies:** `-01` (assignment happens "only after canonical identity resolution," per `DEC-DATA-007`).
- **Decision dependencies:** none additional — `DEC-DATA-007` is fully `CONFIRMED` and self-contained.
- **Entry criteria:** `-01` complete.
- **Deliverables:** generation service using the existing shared idempotency contract (`ENG-P1-002`) for the "at most one assignment" guarantee, and the existing shared transaction/outbox pattern for the collision-retry-and-audit-log behavior.
- **Tests required:** uniqueness under real concurrent Firebase Emulator Suite writes (race condition per `DEC-DATA-007`'s own "prevent races between simultaneous registrations" requirement — this is exactly the class of test `ENG-P1-002`'s own concurrency-correction precedent established); collision-retry bounded-count test; idempotent-repeat-call test; format/alphabet compliance test; case-insensitive normalization test.
- **Security/privacy requirements:** no registration-date/country/sequence leakage (`DEC-DATA-007`'s own non-revealing constraint) — a dedicated test, not just a code review note.
- **Exit criteria:** all `DEC-DATA-007` principles individually test-covered against the real emulator, not mocked.
- **Downstream consumers:** `-04` (QR), `-05` (persistence), all later Reward/Loyalty capabilities (Loyalty Number is their lookup key).
- **Implementation order:** parallel with `-02`/`-04` after `-01`.
- **Parallelisation:** yes.
- **Rollback boundary:** generation logic only; no external side effects beyond the write itself.
- **Risks:** none beyond the already-disclosed codespace-exhaustion/alerting case `DEC-DATA-007` itself names as "not a design defect."

### `ENG-P2-001-04` — QR Identity Service

> **Updated 2026-08-04:** the domain-foundation layer implemented at `functions/src/domains/qrIdentity/` — see the [Implementation Report](../reports/ENG-P2-001-04-implementation-report-2026-08-04.md). Test-first (39/39 new tests passing), zero Firebase dependency (machine-enforced by a scoped `eslint.config.js` rule). Rate-limiting, image rendering, scanning, and Firestore persistence remain deferred to future packages. Pending Founder-authorized review and merge. `ENG-P2-001-01`–`-03`, `-05` through `-10`, and Capability 2 overall are unaffected — none advanced by this update.
>
> **Founder Review, 2026-08-04 (PR #59 held for clarification):** a textual tension between this section's own "same underlying reference" phrasing and its "prior reference fails to resolve" / "new resolvable reference" requirements (both in this same section, both faithfully inherited from `ENG-P2-ARCH-001` §5's own Regeneration/Invalidation rows) was reviewed at Founder request. Determination: not a genuine cross-document conflict or open policy question — `ENG-P2-ARCH-001` §5's own Invalidation row ("old codes must fail closed") is unimplementable if the reference literally never changes, so "relationship unchanged" is the only internally-consistent reading once read as the customer↔identity↔loyalty-number *association* persisting, not literal identity of the reference string. `ENG-P2-ARCH-001` §5's Regeneration row and this section's Scope bullet above have both been clarified accordingly (original wording preserved in git history). No code change was required — the implemented behaviour (`regenerateQrIdentity` issues a new reference value and invalidates the prior one) already matched the only consistent reading. Full analysis: [Implementation Report](../reports/ENG-P2-001-04-implementation-report-2026-08-04.md) §6. PR #59 remains unmerged pending this clarification's review.

- **Objective:** implement the QR-reference lifecycle per `DEC-DATA-007`'s QR Generation Principles and `ENG-P2-ARCH-001` §5.
- **Scope:** QR payload (plain opaque reference to the loyalty code — never a signed token, never personal data, per `DEC-DATA-007`); generation at `Registered` alongside the Loyalty Number; regeneration ([clarified 2026-08-04] new reference value, same underlying identity/loyalty-number association — `ENG-P2-ARCH-001` §5); invalidation of prior codes on regeneration (fail closed); mapping to customer identity; secure lookup with rate-limiting against enumeration.
- **Exclusions:** QR rotation/time-limiting — explicitly out of scope per TRD12 §12.42's own deferral, carried forward unchanged; scan-time business-side UI.
- **Governing requirements:** `DEC-DATA-007` QR Generation Principles, PRD2 §9, `ENG-P2-ARCH-001` §5.
- **Dependencies:** `-03` (a QR encodes a reference to an already-generated Loyalty Number).
- **Decision dependencies:** none additional.
- **Entry criteria:** `-03` complete.
- **Deliverables:** QR-reference generation/regeneration service; invalidation-on-regenerate enforcement.
- **Tests required:** regeneration produces a new resolvable reference; the prior reference fails to resolve after regeneration (the invalidation requirement `ENG-P2-ARCH-001` §5 flags as a security requirement); enumeration-resistance test (rate-limiting behavior); no-personal-data-in-payload test.
- **Security/privacy requirements:** rate-limiting against QR-reference enumeration is a hard requirement, not optional — test-covered.
- **Exit criteria:** QR lifecycle fully test-covered against the real emulator.
- **Downstream consumers:** `-05`, any future scan-based purchase-recording capability (Capability 4).
- **Implementation order:** parallel with `-02` after `-03`.
- **Parallelisation:** yes.
- **Rollback boundary:** regeneration is additive/reversible at the data level (old references simply stop resolving).
- **Risks:** none beyond the already-deferred rotation/time-limiting scope.

### `ENG-P2-001-05` — Identity Persistence

> **Updated 2026-08-04:** implemented at `functions/src/domains/*/repositories/` (and `functions/src/security/`) — see the [Implementation Report](../reports/ENG-P2-001-05-implementation-report-2026-08-04.md). Test-first, all new tests passing against the real Firebase Emulator Suite. Covers `users`, `customerProfiles`, `loyaltyNumbers`, and `qrIdentityRecords` — one collection wider than this section's own Scope bullet names (`loyaltyNumbers`/`qrIdentityRecords` were always implied by "persists all four domain shapes" but not spelled out as their own collections in the original bullet; corrected here, not a scope expansion). One disclosed divergence from this section's own Deliverables wording: "this package adds collection-specific allow rules" anticipated some direct client read/write being opened — the actual Founder task brief for this package instead required assessing whether any direct customer read was needed yet and explicitly prohibited granting broad access merely to satisfy tests. No UI consumer of this data exists yet (registration, profile, merchant lookup, and QR scanner are all still deferred), so the implemented Rules stay deny-by-default for all four collections with no allow branch — see the Implementation Report §"Firestore Rules" for the full reasoning. Pending Founder-authorized review and merge. `ENG-P2-001-06` through `-10` and Capability 2 overall are unaffected — none advanced by this update.

- **Objective:** implement the Firestore-backed persistence layer for `-01`/`-02`/`-03`/`-04`'s domain models.
- **Scope:** `users` and `customerProfiles` Firestore collections/documents (TRD10 §10.6.1–2 baseline shapes, extended per `ENG-P2-ARCH-001` §2 with Trust/Authentication *reference* fields — never trust or auth *data* itself); `BaseMetadata` usage (the already-`CONFIRMED`/conformant contract from `RES-005.2a`/`RES-005.2b`); indexes for the lookup patterns `-09` will need; converters; write-authority enforcement (only the Identity domain service writes these collections); transaction/idempotency requirements (reusing `-03`'s and the shared foundation's patterns); emulator and Security/Storage Rules coverage for this collection pair specifically.
- **Exclusions:** any collection or field belonging to Authentication or ITM (e.g., no `phoneVerified`, no trust-level field — those are ITM's own future persistence, referenced only, per `ENG-P2-ARCH-001` §2/§8).
- **Governing requirements:** TRD10 §10.6.1–2, `ENG-P2-ARCH-001` §2, the `BaseMetadata` contract.
- **Dependencies:** `-01`, `-02`, `-03`, `-04` (persists all four domain shapes).
- **Decision dependencies:** none additional (schema-level `DEC-PROD-012` exposure is isolated to the `-02` `gender` field, not this package as a whole).
- **Entry criteria:** `-01`–`-04` complete.
- **Deliverables:** Firestore converters, index definitions, Security Rules for `users`/`customerProfiles` (deny-by-default baseline already exists platform-wide per `ENG-P0-001`; this package adds collection-specific allow rules), a documented migration posture (none needed — no data exists yet to migrate).
- **Tests required:** real Firebase Emulator Suite integration tests (write authority, Rules allow/deny cases, index-backed queries, idempotent-write behavior) — consistent with this programme's established "real tests, not mocked" discipline.
- **Security/privacy requirements:** Rules must deny any client-side direct write to identity-defining fields (Internal Customer ID, Loyalty Number, QR reference) — server-authored only.
- **Exit criteria:** full Rules test suite green against the real emulator; no client write path to identity-defining fields exists.
- **Downstream consumers:** `-06`–`-10`.
- **Implementation order:** after `-01`–`-04` converge.
- **Parallelisation:** none (integration point).
- **Rollback boundary:** new collections only — no existing data to corrupt.
- **Risks:** Rules-coverage gaps are the highest-risk item in this entire decomposition (per this programme's own `ENG-SEC-001` precedent, formal Rules testing was previously deferred and flagged as follow-on risk) — this package must not repeat that deferral for its own collections.

### `ENG-P2-001-06` — Identity Lifecycle and Status Management

> **Updated 2026-08-04:** implemented at `functions/src/domains/identity/{models,services,repositories}/` — see the [Implementation Report](../reports/ENG-P2-001-06-implementation-report-2026-08-04.md). Test-first, all new tests passing against the real Firebase Emulator Suite. **Ambiguity 1 resolved**: per its own table row ("Founder input required? No"), `Recovered` is implemented as a transient transition/audit-event marker (`IdentityRecovered`) — never a persisted `IdentityStatus` value — exactly matching this package's own recommended resolution and the merged `-01` domain layer's own already-adopted enum (no `recovered` member). The one gap `-01` explicitly deferred (`→dormant` transitions emitting no event) is now filled with a new `IdentityBecameDormant` event, added narrowly to the existing, already-merged `customerIdentity.ts`/`identityEvents.ts` files. `Dormant`'s inactivity-threshold configuration point is deferred, not implemented — no automatic dormancy scheduling exists yet (explicitly out of this package's own scope, see the Deferred Items list in the report). Firestore Rules required no change: `-05`'s existing deny-all `users/{id}` block already covers every client-mutation path this package's own security requirements name. Pending Founder-authorized review and merge. `ENG-P2-001-01`, `-03`, `-04`, `-05` remain merged as previously recorded; `-02`, `-07` through `-10`, `ENG-P2-001` as a whole, and Capability 2 overall are unaffected — none advanced by this update.

- **Objective:** implement the Identity Lifecycle state machine (`ENG-P2-ARCH-001` §3).
- **Scope:** `Registered`→`Active` immediate transition (no verification gate, per `DEC-IDENTITY-001` Standard Participation Principle); `Active`↔`Dormant` (activity-based); `Closed`→`Archived` (retention-period-based); orthogonal `Suspended`/`Locked` risk-response states layered on `Active`/`Dormant`.
- **Exclusions:** the `Recovered` state's concrete data representation — **flagged, see §14 Ambiguity 1**; this package should implement whichever representation that ambiguity resolves to, not invent one silently.
- **Governing requirements:** `ENG-P2-ARCH-001` §3, PRD2 §7 (as corrected under `IDENTITY-ALIGN-001`), TRD10 `users.status`.
- **Dependencies:** `-01`, `-05`.
- **Decision dependencies:** resolution of Ambiguity 1 (§14) is a prerequisite for finalizing this package's exact scope, though the state-machine skeleton can be designed against either resolution.
- **Entry criteria:** `-05` complete; Ambiguity 1 resolved (or a placeholder representation explicitly adopted with a documented follow-up).
- **Deliverables:** status-transition enforcement (illegal transitions rejected at the domain layer, `-01`), `Dormant` inactivity-threshold configuration point (platform-defined, not hardcoded).
- **Tests required:** every legal transition; every illegal transition rejected; `Dormant`→`Active` requires no recovery step (per `ENG-P2-ARCH-001` §3's explicit distinction from `Recovered`).
- **Security/privacy requirements:** status changes must be audit-logged (`-10`).
- **Exit criteria:** full transition matrix test-covered.
- **Downstream consumers:** `-07` (Recovery consumes/produces the `Recovered` transition), `-09` (Lookup must respect status — e.g., a `Closed` identity's public loyalty-number lookup behavior needs an explicit, tested answer).
- **Implementation order:** after `-05`.
- **Parallelisation:** none (single state-machine owner).
- **Rollback boundary:** status is a field on an existing document; reversible.
- **Risks:** Ambiguity 1 unresolved risks rework here specifically — highest-priority item to resolve before this package starts (§15 recommended first task addresses this).

### `ENG-P2-001-07` — Identity Recovery (identity-owned portion)

- **Objective:** implement the identity-owned mechanics of recovery per `DEC-SEC-001`'s 8 Identity Recovery Principles and `ENG-P2-ARCH-001` §6.
- **Scope:** locating the existing identity; restoring access references (linking a new/updated Authentication reference — the *reference update*, not the authentication proof itself); restoring Loyalty Number and QR visibility (never regenerating them, per `-03`/`-04`'s permanence guarantees); preserving history/rewards/trust *references* (untouched, not reset); preventing duplicate-identity creation (Principle 3); recording recovery events (`-10`).
- **Exclusions:** authentication-credential verification itself (OTP/email/provider proof) — that is Authentication's own implementation, consumed here only through the interface boundary defined in `-08`/§7 below; risk-based gating of *which* recovery paths are permitted — that is ITM's own decision, consumed only as a reference.
- **Governing requirements:** `DEC-SEC-001` Identity Recovery Principles (verbatim), TRD12 §12.30–31, `ENG-P2-ARCH-001` §6.
- **Dependencies:** `-01`, `-05`, `-06` (recovery is itself a lifecycle transition).
- **Decision dependencies:** none additional — `DEC-SEC-001` is fully `CONFIRMED`.
- **Entry criteria:** `-06` complete.
- **Deliverables:** recovery orchestration that (a) locates the identity by an out-of-band recovery lookup, (b) validates no duplicate would be created, (c) accepts an already-proven Authentication reference (proof happens upstream, outside this package), (d) transitions status per `-06`'s state machine, (e) emits an audit event (`-10`).
- **Tests required:** duplicate-prevention test (Principle 3); continuity test (progress/purchases/rewards untouched, Principle 4); every-action-auditable test (Principle 7).
- **Security/privacy requirements:** recovery lookup must not be enumerable (same class of concern as `-04`'s QR rate-limiting).
- **Exit criteria:** all 8 Identity Recovery Principles individually test-traced.
- **Downstream consumers:** none further within `ENG-P2-001`; the Authentication work stream consumes this package's interface (§7 below) when it implements the actual credential-verification step.
- **Implementation order:** after `-06`.
- **Parallelisation:** can run parallel with `-08` (Linking) once `-06` is done — related but not identical concerns.
- **Rollback boundary:** status/reference updates only, no destructive data operation.
- **Risks:** the interface boundary to Authentication (§7) must be genuinely stable before this package starts, or rework follows once Authentication's actual implementation task begins.

### `ENG-P2-001-08` — Identity Linking and Duplicate Prevention

- **Objective:** implement the identity-owned side of multi-provider account linking.
- **Scope:** multiple Authentication references resolving to one Identity Aggregate (`AIR-001`, `ENG-P2-ARCH-001` §7); duplicate-account detection (heuristics only — e.g., matching contact attributes across separate registration attempts); manual-review boundary for ambiguous cases (per PRD2 §23's Support Review → Verification → Merge workflow); auditability of every link/merge decision.
- **Exclusions:** **automatic merge policy is explicitly not designed here** — per this task's own constraint ("do not invent an automatic identity-merge policy without governing approval"); this package implements detection and a manual-review queue only, not automated merging. Flagged as its own governance gap, §14 Ambiguity 4.
- **Governing requirements:** `AIR-001`/`AIR-004`, PRD2 §23, `ENG-P2-ARCH-001` §7.
- **Dependencies:** `-01`, `-05`.
- **Decision dependencies:** a future Founder/Engineering-Lead decision on automatic-merge authority is a prerequisite for anything beyond manual-review-queue detection (§14 Ambiguity 4).
- **Entry criteria:** `-05` complete.
- **Deliverables:** link-reference storage (multiple Authentication references per Identity Aggregate); duplicate-detection heuristic (flagging only, not auto-resolving); a support-review queue data shape.
- **Tests required:** linking preserves history (`AIR-004`); duplicate detection flags without auto-merging; no second Identity Aggregate is ever silently created for an already-linked provider.
- **Security/privacy requirements:** merge/link decisions must be attributable and auditable (`-10`).
- **Exit criteria:** linking and detection test-covered; merge execution explicitly out of this package's Definition of Done pending §14 Ambiguity 4's resolution.
- **Downstream consumers:** none further within `ENG-P2-001`.
- **Implementation order:** parallel with `-07` after `-06`.
- **Parallelisation:** yes, with `-07`.
- **Rollback boundary:** additive reference records; no destructive merge logic exists to roll back (deliberately excluded).
- **Risks:** the biggest risk in this package is scope creep into implementing merge execution before governance approves it — explicitly guarded against by this package's own exclusion.

### `ENG-P2-001-09` — Identity Query and Lookup Interfaces

- **Objective:** implement the bounded read interfaces downstream capabilities and support tooling need.
- **Scope:** lookup by Internal Customer ID (internal, server-to-server only); lookup by Loyalty Number (customer-quoted, e.g., friends-and-family use per PRD2 §12); lookup by QR reference (scan-based); lookup by an authorised contact reference (support-assisted recovery entry point); merchant-assisted search (bounded — a business looks up a customer only in the context of an active transaction, never a general directory).
- **Exclusions:** any lookup that would function as a public customer directory (privacy violation, `PR-005`); any lookup exposing authentication or trust data.
- **Governing requirements:** `PR-005`, `AIR-005`/`AIR-006`, PRD2 §12/§20 (customer privacy), `ENG-P2-ARCH-001` §2.
- **Dependencies:** `-05`.
- **Decision dependencies:** none additional.
- **Entry criteria:** `-05` complete.
- **Deliverables:** four bounded lookup callables/queries, each with its own access-control scope (internal-only, customer-self, business-transaction-context, support-context).
- **Tests required:** each lookup path tested for both success and unauthorized-access denial; enumeration-resistance for the QR/Loyalty-Number paths (shared concern with `-04`).
- **Security/privacy requirements:** every lookup path is access-scoped; no path returns more than the requesting context is authorized to see.
- **Exit criteria:** all four lookup interfaces test-covered for both correct results and access denial.
- **Downstream consumers:** future Purchase-recording (Capability 4, needs Loyalty Number/QR lookup), future business dashboard, future support tooling.
- **Implementation order:** after `-05`; can run parallel with `-06`.
- **Parallelisation:** yes, with `-06`.
- **Rollback boundary:** read-only interfaces; no data risk.
- **Risks:** the merchant-assisted search path is the highest-privacy-risk interface in this package — needs its own explicit access-scope test, not a general assumption.

### `ENG-P2-001-10` — Identity Audit and Observability

- **Objective:** implement the audit trail and privacy-safe diagnostics for every identity-domain event.
- **Scope:** identity events (creation, status transition, recovery, linking, profile update) recorded as audit entries; privacy-safe diagnostics (using the existing sanitization boundary from `ENG-P1-003`'s observability foundation — no PII in logs/breadcrumbs); correlation (reusing the existing shared correlation-context service, `ENG-P1-002`); support-evidence shape (what a support agent can see when investigating a recovery case, without exposing raw PII beyond what's necessary).
- **Exclusions:** general platform-wide Trust Event/audit-record design (a separate, cross-cutting Trust domain concern per the 15-domain model, Canonical Reference §5) — this package emits into that existing model, it does not redesign it.
- **Governing requirements:** `DEC-SEC-001` Principle 7 (every recovery action auditable), `ENG-P1-003`'s existing sanitization/correlation contracts.
- **Dependencies:** `-01` (event shapes), `-06`/`-07`/`-08` (the actual events they emit).
- **Decision dependencies:** none additional.
- **Entry criteria:** `-06` complete; can integrate `-07`/`-08` incrementally as they complete.
- **Deliverables:** audit-event sink wiring using the existing outbox/event infrastructure; sanitization-boundary compliance for every identity-domain log line.
- **Tests required:** no raw PII in any audit/log payload (reusing `ENG-P1-003`'s existing sanitization test pattern); every `-06`/`-07`/`-08` state change produces exactly one audit entry.
- **Security/privacy requirements:** this package's entire purpose is a security/privacy requirement — the sanitization-boundary test is its primary exit criterion.
- **Exit criteria:** every identity-domain mutation produces a correlated, sanitized audit entry; zero PII leakage confirmed by test.
- **Downstream consumers:** support tooling, future compliance/audit review.
- **Implementation order:** last (integrates everything above).
- **Parallelisation:** can start once `-06` exists, finishes after `-07`/`-08`.
- **Rollback boundary:** additive observability only, zero functional risk.
- **Risks:** none beyond keeping pace with the other packages as they land.

## 3. Work-Package Matrix

| Proposed ID | Work package | Objective | Dependencies | Blocks / blocked by | Entry status |
|---|---|---|---|---|---|
| `ENG-P2-001-01` | Identity Domain Foundation | Aggregate, invariants, error/event contracts | none | Blocks all others | **Implemented (2026-08-02), TDD, 68/68 tests passing — see [Implementation Report](../reports/ENG-P2-001-01-implementation-report-2026-08-02.md) — pending Founder-authorized review/merge** |
| `ENG-P2-001-02` | Customer Profile | Mutable profile data model | `-01` | `gender` field blocked by `DEC-PROD-012` (§14) | Awaiting Founder Authorisation (partial — non-`gender` scope) |
| `ENG-P2-001-03` | Loyalty Number Service | Generation per `DEC-DATA-007` | `-01` | Blocks `-04` | **Foundation implemented (2026-08-04), TDD, 39/39 new tests passing — see [Implementation Report](../reports/ENG-P2-001-03-implementation-report-2026-08-04.md) — pending Founder-authorized review/merge; persistence/uniqueness-index deferred to a future package** |
| `ENG-P2-001-04` | QR Identity Service | QR lifecycle per `DEC-DATA-007` | `-03` | — | **Foundation implemented (2026-08-04), TDD, 39/39 new tests passing — see [Implementation Report](../reports/ENG-P2-001-04-implementation-report-2026-08-04.md) — pending Founder-authorized review/merge; rendering/scanning/persistence deferred to future packages** |
| `ENG-P2-001-05` | Identity Persistence | Firestore collections, Rules, indexes | `-01`,`-02`,`-03`,`-04` | Blocks `-06`–`-10` | **Implemented (2026-08-04), TDD, all new tests passing (real Firebase Emulator Suite) — see [Implementation Report](../reports/ENG-P2-001-05-implementation-report-2026-08-04.md) — pending Founder-authorized review/merge** |
| `ENG-P2-001-06` | Identity Lifecycle and Status | State machine | `-01`,`-05` | Blocks `-07`,`-09` | **Implemented (2026-08-04), TDD, all new tests passing (real Firebase Emulator Suite) — Ambiguity 1 resolved (`Recovered` = transient marker, no Founder input required per its own table) — see [Implementation Report](../reports/ENG-P2-001-06-implementation-report-2026-08-04.md) — pending Founder-authorized review/merge** |
| `ENG-P2-001-07` | Identity Recovery | Identity-owned recovery mechanics | `-01`,`-05`,`-06` | Depends on Authentication interface (§7) stability | Awaiting Decision (Ambiguity 1, upstream) |
| `ENG-P2-001-08` | Identity Linking and Duplicate Prevention | Linking + detection (not auto-merge) | `-01`,`-05` | Merge execution blocked by Ambiguity 4 (§14) | Awaiting Founder Authorisation (detection-only scope) |
| `ENG-P2-001-09` | Identity Query and Lookup Interfaces | Bounded read interfaces | `-05` | — | Awaiting Founder Authorisation |
| `ENG-P2-001-10` | Identity Audit and Observability | Audit trail, sanitized diagnostics | `-01`,`-06`,`-07`,`-08` | — | Awaiting Founder Authorisation |

**Status vocabulary used:** `Proposed` (not yet reviewed at all — none of the above, all have at least a full plan), `Planned` (plan complete, no blocker — most of the above), `Awaiting Decision` (blocked on an ambiguity in §14), `Awaiting Founder Authorisation` (plan complete, no ambiguity, but implementation itself requires a fresh authorization per this task's own constraint), `Blocked` (a named decision dependency is open). No package is `In Progress`.

## 4. Dependency Graph

```
                         ENG-P2-001-01
                    (Identity Domain Foundation)
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
   ENG-P2-001-02      ENG-P2-001-03      (foundation only —
  (Customer Profile)  (Loyalty Number)    -02/-03 both need
            │                 │            only -01)
            │                 ▼
            │          ENG-P2-001-04
            │           (QR Identity)
            │                 │
            └────────┬────────┘
                      ▼
              ENG-P2-001-05
            (Identity Persistence)
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
ENG-P2-001-06   ENG-P2-001-08  ENG-P2-001-09
 (Lifecycle/      (Linking &      (Query/Lookup
   Status)      Dup. Prevention)   Interfaces)
        │             │
        ▼             │
ENG-P2-001-07 ◄────────┘
  (Recovery)
        │
        ▼
ENG-P2-001-10
(Audit & Observability)

External interfaces consumed (never implemented within ENG-P2-001):
  Authentication ──► (reference consumed by -07, -08)
  Identity Trust Management (ITM) ──► (reference consumed by -01, -06, -07 — never written)
```

## 5. Recommended Delivery Sequence

1. `ENG-P2-001-01` — Identity Domain Foundation (must be first; everything depends on it).
2. `ENG-P2-001-03` and `ENG-P2-001-02`, in parallel — Loyalty Number and Profile both only need `-01`.
3. `ENG-P2-001-04` — QR (needs `-03`'s output).
4. `ENG-P2-001-05` — Persistence (needs all four domain shapes to converge).
5. `ENG-P2-001-06` and `ENG-P2-001-09`, in parallel — Lifecycle and Lookup both only need `-05`.
6. `ENG-P2-001-07` and `ENG-P2-001-08`, in parallel — Recovery and Linking both only need `-06`.
7. `ENG-P2-001-10` — Audit (integrates events from `-06`/`-07`/`-08`, naturally last).

This validates the task brief's own suggested 8-step sequence against the live dependency graph: the brief's sequence is directionally correct but under-specifies parallelism (its steps 1–2 map to this plan's steps 1–3 combined, since Loyalty Number/QR and Customer Profile are independent of each other, not sequential) and folds "administrative and audit hardening" (its step 8) together with what this plan splits into Linking (`-08`) and Audit (`-10`) as separate reviewable packages.

## 6. Parallelisation Opportunities

- `-02` (Profile) ‖ `-03` (Loyalty Number) — both depend only on `-01`.
- `-06` (Lifecycle) ‖ `-09` (Lookup) — both depend only on `-05`.
- `-07` (Recovery) ‖ `-08` (Linking) — both depend only on `-06`.

No other pair is safely parallel — `-04` needs `-03`'s output; `-05` needs all of `-01`–`-04`; `-10` needs `-06`/`-07`/`-08`'s event shapes to exist first.

## 7. Authentication and Identity Trust Management Interface Boundaries

### Authentication (consumed, never implemented here)

- **Authenticated subject reference** — an opaque pointer (Firebase `authUid`) Authentication supplies after a successful sign-in; Identity resolves it to exactly one Identity Aggregate (`-01`'s ownership invariant, `AIR-001`).
- **Authentication-method link event** — Authentication tells Identity "this credential now resolves to this subject"; Identity records the reference (`-08`), never the credential itself.
- **Successful access context** — a claim Authentication asserts (this request is authenticated as subject X); Identity never re-verifies the authentication itself, only consumes the assertion.
- **Unlinking restrictions** — Identity may reject an unlink request if it would leave the Identity Aggregate with zero linked Authentication references (an identity must remain reachable); the actual unlink mechanics are Authentication's.
- **Recovery-access handoff** — Authentication (or its assisted-recovery flow) hands Identity a newly-proven subject reference; `-07` consumes it to update the identity's linked references, never performs the proof itself.

### Identity Trust Management (consumed, never implemented here)

- **Trust reference** — an opaque pointer on the Identity Aggregate (`-01`'s "Trust references" field) to ITM's own trust record; Identity never reads or interprets its contents.
- **Verification-state reference** — same pattern; Identity stores the pointer, ITM owns the value.
- **Risk-based capability decision** — a boolean/decision ITM returns when asked "is this identity's current trust level sufficient for action X" (e.g., account-ownership change); Identity's own packages never compute this, they only call out to it where the architecture (`ENG-P2-ARCH-001` §8) says a capability is risk-gated — and per `DEC-IDENTITY-001`, none of `ENG-P2-001`'s own packages are risk-gated (standard identity operations require no such call).
- **Verification event reference** — ITM may consume identity-lifecycle events (e.g., "this identity just completed recovery") as one of its trust-progression signals; this is an outbound notification from `-10`'s audit stream, not an inbound dependency.

These four/four boundaries are the complete interface surface `ENG-P2-001` needs from the other two concerns — no provider-specific or verification-method-specific logic appears on either side.

## 8. UX and Product-Design Dependencies

Reviewed [Moments That Matter](../../07-product-design/moments-that-matter.md) and both Stitch exploration directories (`exploration-v1/`, `exploration-v2/`).

- **§1 Registration** remains governing-document-only — no Stitch concept validates a registration screen (a gap already disclosed in `CDR-001` §9 and unchanged by this task). **No engineering slice in this plan is blocked by that gap** — `-01` through `-05` are domain/data-layer work with no UI dependency; a registration UI is a separate, later, UX-gated task.
- No Stitch concept covers Customer Profile, Loyalty Number/QR management, Identity Recovery, or Account Linking screens either — all customer-facing UI for this capability is unbuilt UX territory, consistent with `CDR-001`'s own disclosed Capability 2 gap.
- **Registered UX dependency:** before any *customer-facing* interface for `-02` (Profile), `-06` (status visibility), `-07` (Recovery), or `-09` (Loyalty Number/QR display) is implemented, a UX exploration pass equivalent to what exists for Capabilities 4–6 (`signature_verification_experience`, `loyalty_journey_verified_units`, etc.) is needed. This does not block `-01`–`-05`, `-08`, or `-10`, which are backend-only.
- Per the session's established principle — "Capability first; visual presentation follows the approved capability and journey requirements" — this plan defers all UI/UX work to follow-on tasks, consistent with this task's own "do not redesign screens" constraint.

## 9. Programme Model — Child Packages, Not a Roadmap Count Change

This decomposition creates **10 child work packages under the existing `ENG-P2-001` row**, not 10 new top-level roadmap entries. `CDR-001`'s Capability 2 → `ENG-P2-001` mapping (§8 of that document) is unchanged; the Engineering Implementation Programme's Phase 2 Work-Packages table gains a decomposition note under its existing `ENG-P2-001` row rather than 10 new rows, consistent with how this session has previously avoided unintended capability/work-package renumbering (`IDENTITY-ALIGN-001`'s Capability 2 restructuring used the identical non-renumbering rationale). No approved roadmap work-package count changes; no governance authority beyond this planning task was required or exercised.

## 10. Capability Entry and Mobilisation Gate

> **Resolved 2026-08-02 (`ENG-P2-GATE-001`):** the ambiguity this section originally flagged has been determined — see the [`ENG-P2-GATE-001` Determination](ENG-P2-GATE-001-dec-prod-012-scope-determination.md). `Gate item 6` has been scoped in place to `ENG-P2-001-02`'s `gender` field and the corresponding `-05` schema-freeze only; `-01`, `-03`, `-04`, `-06`–`-10`, and the non-`gender` portions of `-02`/`-05` are confirmed **not** blocked by `DEC-PROD-012`. `DEC-PROD-012` itself remains `OPEN_FOUNDER`, not closed or recorded. The original findings below are preserved as the record of the question this determination answered.

Per this task's explicit instruction, `DEC-PROD-012` is **not** closed or recorded by this task. Findings (as originally stated, 2026-08-02, before the `ENG-P2-GATE-001` determination above):

- **What it decides:** the optional-gender value set and localized wording for `customerProfiles.gender` (Decision Register `DEC-PROD-012` — "Optional gender values and wording"). Nothing else.
- **Which proposed work packages it blocks:** narrowly, only `-02`'s `gender` field finalization. Every other package (`-01`, `-03`–`-10`) has no dependency on `DEC-PROD-012` per the Decision Register's own `Blocks: profile schema freeze` field.
- **Which planning/foundation tasks can proceed without it:** all of them — `-01` through `-10`'s *planning* (this document) is complete regardless. For *implementation*, `-01`, `-03`, `-04`, `-06`–`-10`, and all of `-02` except the `gender` field, have no `DEC-PROD-012` dependency.
- **Whether `ENG-P2-001` implementation may begin partially before `DEC-PROD-012` closes:** **this is genuinely ambiguous under the current governing text — flagged, not resolved (§14 Ambiguity 2).** The Decision Register's own field scopes `DEC-PROD-012` to "profile schema freeze" (narrow). But `ENG-P2-RES-000` §7's Capability Authorisation Gate item 6 is worded as a blanket precondition: "`ENG-P2-001` — Customer Identity Implementation may begin only when **all** of the following are objectively verifiable... `DEC-PROD-012` status... is a Final Decision, or a formally recorded defer-and-omit adoption." Read literally, the Gate — an already-approved governance artifact — currently requires `DEC-PROD-012` to close (or be formally deferred) before **any** part of `ENG-P2-001` begins, not just the `gender` field.
- **Whether a fresh mobilisation gate is required:** **yes, if the Founder wants partial mobilisation** (e.g., authorizing `-01`/`-03`/`-04` to begin while `DEC-PROD-012` remains open). The current Gate text does not support that reading without either (a) `DEC-PROD-012` closing/deferring, or (b) a fresh governance action narrowing Gate item 6's scope to "Customer Profile `gender` field only." This task does not perform either action — it only surfaces the choice.

**Conclusion (updated 2026-08-02, `ENG-P2-GATE-001`):** Gate item 6 has been scoped in place — `DEC-PROD-012` (`OPEN_FOUNDER`, still open) now blocks only `-02`'s `gender` field and `-05`'s corresponding schema-freeze. `-01`, `-03`, `-04`, `-06`–`-10`, and the non-`gender` portions of `-02`/`-05` are confirmed not blocked by this item. This plan still does not mark Capability 2 (or any child package) implementation-ready on its own — a fresh Founder authorization to begin remains required (§11).

## 11. Recommended First Executable Work Package

**Recommendation: `ENG-P2-001-01` — Identity Domain Foundation.** It has zero blocking decision dependencies of its own, is the root of the entire dependency graph, and its scope (pure domain code, no persistence) means it can be fully designed and unit-tested without touching Firestore, Rules, or any external interface — the lowest-risk possible first slice.

**Before it can be executed, it requires:**
- **`DEC-PROD-012` closure:** **confirmed not required** for `-01` (per `ENG-P2-GATE-001`, 2026-08-02 — see §10) — the Gate-scope ambiguity that previously left this an open question at the package level has been resolved; `-01` is decision-clean under the now-scoped Gate item 6, not merely "technically" clean under an ambiguous one.
- **UX readiness:** not required — `-01` has no UI surface.
- **Schema preparation:** not required beyond what `-01` itself defines (it precedes persistence, `-05`).
- **Security review:** not required at this stage (no Rules, no external write path yet).
- **A fresh Founder authorisation:** **yes** — both because this plan's own constraint set prohibits any implementation under this task, and because of the Gate ambiguity above (§10). Recommend the Founder's next authorization either (a) close/defer `DEC-PROD-012` and authorize `-01` under the existing Gate, or (b) explicitly authorize `-01` as a narrow exception pending `DEC-PROD-012`, with the Gate-scope ambiguity resolved as part of that authorization.

## 12. Downstream Reward/Recognition Consumers

`CDR-001` Capabilities 4–6 (Reward Program, Purchase, Loyalty, Reward, Recognition) consume this capability's Loyalty Number (`-03`) and QR reference (`-04`) as their customer-lookup key, and its Lookup interfaces (`-09`) for scan/quote-based purchase recording. None of them require Authentication or ITM state directly from `ENG-P2-001` — consistent with `ENG-P2-ARCH-001` §9's capability relationship model.

## 13. Test Strategy

Every package above requires real Firebase Emulator Suite integration tests for anything touching persistence or concurrency (matching this programme's established discipline — `ENG-P1-002`'s own concurrency-correction precedent, `ENG-P0-001`'s deny-by-default Rules baseline). Pure-domain packages (`-01`) use unit tests only, no emulator dependency. No mocked Firestore in any test claiming to validate a security Rule or a concurrency guarantee.

## 14. Decision and Ambiguity Register

| # | Ambiguity | Ownership/authority | Affected work package(s) | Recommended resolution route | Founder input required? |
|---|---|---|---|---|---|
| 1 | ~~Whether `Recovered` is a persistent status, a transition, an event, or an audit marker~~ **RESOLVED 2026-08-04, `ENG-P2-001-06`** | Engineering-Lead-level architecture clarification (small addendum to `ENG-P2-ARCH-001` §3) | `-06`, `-07` | Implemented exactly as recommended: `Recovered` is a **transient transition marker** (`IdentityRecovered` domain event) — never a persistent `IdentityStatus` value. An identity that completes recovery lands back in `Active`, with the recovery *event* preserved permanently in the audit trail via the outbox, not as an ongoing status value. `-01`'s `IdentityStatus` enum already had no `Recovered` member (unaffected by this resolution). | No — this is an engineering-architecture clarification, not a constitutional or product decision; resolved directly per this row's own determination, no Founder decision recorded. |
| 2 | ~~`DEC-PROD-012`'s narrow "profile schema freeze" scope vs. `ENG-P2-RES-000` §7 Gate item 6's blanket "`ENG-P2-001` may begin" wording~~ **RESOLVED 2026-08-02, `ENG-P2-GATE-001`** | Engineering-level interpretation, evidence-supported (see determination) | Determined: only `-02`'s `gender` field and `-05`'s corresponding schema-freeze | Gate item 6 scoped in place — see the [`ENG-P2-GATE-001` Determination](ENG-P2-GATE-001-dec-prod-012-scope-determination.md). `-01`, `-03`, `-04`, `-06`–`-10` confirmed unblocked. | No — resolved from the governing documents' own already-stated text (§3 of the determination), not a new policy decision. |
| 3 | Loyalty Number / QR "exceptional replacement" policy (e.g., confirmed-fraud identity separation) | Founder-level product policy | `-03`, `-04` (named, not designed) | No action needed unless/until a real need arises — `DEC-DATA-007`'s permanence principle already covers the normal case fully; this is out-of-band exception handling, correctly deferred. | Only if/when a concrete need arises — not currently blocking. |
| 4 | Automatic identity-merge authority (vs. manual-review-only, per this task's own constraint) | Founder-level product/governance policy | `-08` (merge execution specifically; detection/queueing is unblocked) | Recommend a future, narrowly-scoped decision task defining merge authority (who may execute a merge, what evidence is required, whether it is ever automatic) before `-08`'s Definition of Done is extended beyond detection. | **Yes** — this task explicitly prohibits inventing this policy; a future decision task is required before merge execution (not detection) can be designed. |

## 15. Constraints Compliance

No application code, database schema, Firebase Rule, API, UI, authentication provider, ITM logic, or reward logic was implemented by this task. No unrelated file was modified. Current architecture preserved. No historical artefact touched. No existing capability renumbered — the roadmap's Capability 2 → `ENG-P2-001` mapping and work-package count are unchanged (§9). No product policy was silently invented — every open policy question is in §14, not decided. `DEC-PROD-012` was not closed or recorded. Capability 2 is not marked implementation-ready (§10).

## 16. Validation Results (13 required points)

1. **`ENG-P2-001` scope constitutionally aligned:** every in-scope item traces to `DEC-IDENTITY-001`/`ENG-P2-ARCH-001`; every excluded item is excluded for a cited constitutional reason (§1).
2. **Identity/Authentication/ITM boundaries distinct:** §7 defines exactly four interface points each way; no package implements provider- or verification-specific logic.
3. **Every work package has explicit scope and exclusions:** confirmed, §2.
4. **Dependencies complete:** confirmed against the graph, §4; matrix cross-checked against the graph for consistency.
5. **Sequence implementable:** §5's sequence was checked against the graph, not assumed from the task brief's own suggested order (which it corrects for parallelism).
6. **Work packages independently reviewable:** each package is single-concern (no package mixes domain+persistence+API+UI+recovery, per the task's own anti-pattern warning).
7. **UX dependencies identified:** §8; none block `-01`–`-05`, `-08`, `-10`.
8. **Security/privacy requirements present:** every package's own table includes a dedicated field; `-05`, `-09`, `-10` carry the highest-risk items.
9. **`DEC-PROD-012` impact accurately represented:** §10, including the genuine literal-text ambiguity, not resolved in either direction.
10. **No implementation occurred:** confirmed — this document and its two cross-references are the only artefacts.
11. **Historical artefacts unchanged:** confirmed — no `/reports/`, `/records/`, or `/evidence/` file touched.
12. **Programme references/links valid:** all links point to already-existing, verified sections.
13. **No unintended roadmap renumbering or count change:** confirmed, §9 — 10 child packages under the existing `ENG-P2-001` row, not a roadmap-level change.
