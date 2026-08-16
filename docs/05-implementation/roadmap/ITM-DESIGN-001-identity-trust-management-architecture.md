> **Title:** `ITM-DESIGN-001` — Identity Trust Management (ITM) Design Package
> **Version:** 1.2 · **Status:** Design package — **all four Founder decisions (FDR-1–FDR-4) fully resolved**; zero remaining Founder decisions required to make the design implementation-ready; ITM-A–D implementation itself remains separately unauthorized (requires the standard fresh-authorization convention) · **Classification:** Working (execution-layer design record)
> **Governing document:** [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-IDENTITY-001`, `DEC-PROV-004` (point 7), `DEC-SEC-001`, `DEC-ID-003`; [`CDR-001` Capability 2](CDR-001-capability-delivery-roadmap.md#capability-2--customer-identity); [`ENG-P2-ARCH-001`](ENG-P2-ARCH-001-customer-identity-architecture.md) §8, §10; [`ENG-P2-004-DESIGN-001`](ENG-P2-004-DESIGN-001-role-context-permission-resolution-architecture.md); TRD10 §10.6; TRD11 §11.35; TRD21
> **Source-of-truth path:** `docs/05-implementation/roadmap/ITM-DESIGN-001-identity-trust-management-architecture.md`
> **Last controlled update:** 2026-08-16 (`ITM-DESIGN-001` v1.2 — Founder countersigns the `AD-ITM-1` band model (§6.6, §22): `unverified`/`provisional`/`established`, evidence conditions and 30-day threshold approved with an MVP policy clarification — the 30-day threshold is a Founder-approved policy boundary, not a statistically-validated or fraud-calibrated figure (§6.6.3); `established` means only "established under the current MVP trust-evidence model," never legal-identity verification, fraud clearance, financial credibility, or eligibility for standard participation (§6.6.3); precise elapsed-time semantics for the 30-day boundary recorded (§6.6.4). `FDR-1` is now fully resolved — no longer provisional. Combined with the already-resolved `AD-ITM-2`/`AD-ITM-3`/`AD-ITM-4` (v1.1), **zero Founder decisions remain open** in this design package. §6.6, §18, §19, §20, §22 updated in place; §15/§18's original analysis preserved unmodified as history per this repository's disposition convention (`ENG-P2-004-DESIGN-001` §17 precedent). Independent final consistency review performed (§23) — no contradictions found. No ITM code implemented; ITM-A–D implementation remains separately unauthorized.)

# ITM-DESIGN-001 — Identity Trust Management Design Package

**This document defines design only. It authorizes no implementation.** No production code, database schema change, API, UI, event consumer, or trust-computation logic is created or modified by this document. No Capability 3 work, no `AUTH-10`, no Firebase/deployment change, and no new permission identifier is authorized here. This document is the bounded ITM design package Founder Decision **FD-2** (task `CAP-P2-ITM-DESIGN-001`) requested: it makes ITM implementation-ready by defining its boundary, trust-record model, signal model, progression model, risk-gate contract, privacy posture, data architecture, failure model, MVP scope, and implementation decomposition — and surfaces the remaining Founder decisions genuinely required before implementation may begin.

---

## 1. Purpose

`DEC-IDENTITY-001` (2026-08-01) separated Customer Identity, Authentication, and Identity Trust Management (ITM) into three independent architectural concerns within Capability 2. [`ENG-P2-ARCH-001`](ENG-P2-ARCH-001-customer-identity-architecture.md) §8 subsequently defined the Customer-Identity-facing half of the ITM boundary (the Identity Aggregate holds a trust *reference*, never trust logic). `AUTH-08` (merged, PR #97) implemented the authentication-event emission side (`CustomerAuthenticated`, `AuthenticationRecoveryProofProvided` via the shared outbox) but explicitly left ITM's own consumer unwired, "leaving consumption to a future governed integration." No document has yet defined ITM's own internal shape: its trust-record model, its progression rules, its consumption contract, or its relationship to future risk-gated consumers (Reward Engine and beyond). This document closes that gap, per Founder Decision **FD-2**.

Founder Decision **FD-1** establishes that Capability 2 is the full capability — not Customer Identity alone — and that ITM remains a required Capability-2 concern not yet started. This document is the design prerequisite for that concern; it does not itself complete it.

---

## 2. Core Non-Negotiable Principles (per task Phase D)

These principles are restatements-with-consequences of `DEC-IDENTITY-001`'s Final Decision and `DEC-PROV-004` point 7 (Decision Register, cited above) — no new constitutional claim is introduced here.

1. **Identity exists independently of trust.** The Identity Aggregate (Internal Customer ID, Loyalty Number, QR) is created at `Registered` (`ENG-P2-ARCH-001` §3) with no trust precondition.
2. **Trust never creates, merges, splits, or replaces identity**, and never substitutes for authentication. Trust progression "can never retroactively create, merge, or split an Identity Aggregate" (`ENG-P2-ARCH-001` §8).
3. **Authentication events are signals only.** A successful authentication event is trust-relevant input, not a trust decision and not an identity-lifecycle transition (`ENG-P2-ARCH-001` §7, §9).
4. **Customer Identity contains only an opaque trust reference, not trust logic** (`ENG-P2-ARCH-001` §2, §8).
5. **Standard participation must not depend on trust score/level.** `DEC-IDENTITY-001`'s Standard Participation Principle: registration, earning, and redeeming the standard reward require no trust precondition.
6. **Trust may influence only explicitly governed risk-gated actions** — `DEC-IDENTITY-001`'s Risk-Based Verification Principle names large redemptions and account-ownership changes as future examples; `ENG-P2-ARCH-001` §9 places the first such consumer in the future Reward Engine (Capabilities 4–5).
7. **Downstream risk-gated consumers are expected in later capabilities**, not Capability 2 itself — ITM's job in Capability 2 is to exist and be consumable, not to gate anything yet (see §14 MVP scope).
8. **Trust state must be internally explainable and auditable** — every trust-record change must be traceable to the signal(s) that produced it.
9. **ITM is not a customer-facing social score.** `DEC-IDENTITY-001`: ITM is "internal-only, never customer-facing."
10. **Internal risk scoring is not exposed to customers** unless a separate governed decision authorizes it. Not decided here.

---

## 3. ITM Authoritative Boundary

### 3.1 What ITM owns

- The trust **record**: verification state (phone/email/future), a trust level/band (§6), and the continuous trust-progression signal history that produced it (`ENG-P2-ARCH-001` §8; `DEC-PROV-004` point 7).
- The **progression logic** that turns ingested signals into trust-record state changes (§7).
- The **risk-gate read contract** future domains call to ask "does this identity's trust satisfy this action's requirement" (§9).
- Its own internal audit trail for trust-record changes (§11).

### 3.2 What ITM must never own

- Identity existence, the identity lifecycle (`Guest`→…→`Archived`), the Loyalty Number, or the QR Identifier — all owned by Customer Identity (`ENG-P2-ARCH-001` §2–§5).
- Authentication credentials, provider tokens, OTP secrets, or session state — owned by Authentication/Firebase Auth (TRD10 §10.6.1: "Firestore shall not store passwords, OTP secrets or provider tokens").
- Role or permission authorization decisions — owned by `ENG-P2-004` (role-context and permission resolution). ITM answers a different question than `ENG-P2-004` (§9).
- Any customer-facing score, label, or number derived from trust state, unless separately governed (Principle 10 above).
- Any general-purpose participation gate. ITM may only gate an action that explicitly opts in at the action-definition level (§10).

### 3.3 What the persisted trust record represents

A per-identity record of **evidence accumulated about how confidently this platform can act on risk-sensitive requests attributed to this identity** — not a description of the customer, not a creditworthiness or social score, and not a substitute identity record.

### 3.4 How Customer Identity references ITM

Per `ENG-P2-ARCH-001` §2: the Identity Aggregate holds an opaque **trust reference** (a pointer to the ITM `trustRecordId`, keyed by Internal Customer ID) — never the trust level, verification state, or signal history inline. Customer Identity code never reads or interprets trust content; it only holds the pointer.

### 3.5 What signals ITM consumes

See §7 (Signal Model).

### 3.6 What outputs downstream domains consume

A bounded, versioned **risk-gate decision** (§9) — not the raw trust record, not the signal history, not a numeric score (unless §6 selects a numeric model, which this document does not recommend — see §6.5).

### 3.7 What actions trust may gate / must never gate

See §10–§11 (Standard Participation Protection; Risk-Gated Action Contract).

### 3.8 How trust evolves over time / what must remain deterministic and auditable

See §8 (Progression Model) and §11.

---

## 4. Boundary Table

| Concern | Owns | Consumes | Must not own |
|---|---|---|---|
| **Customer Identity** | Identity Aggregate, lifecycle, Loyalty Number, QR, profile, recovery orchestration | Nothing from ITM at runtime beyond holding the opaque `trustRecordId` reference | Trust logic, trust level, verification state, authentication credentials, role/permission decisions |
| **Authentication** | Authentication references (Firebase `authUid`s), session/access gating, sign-in/recovery orchestration | Customer Identity (resolves to it); emits trust-relevant events | Identity existence, trust level, role/permission decisions |
| **`ENG-P2-004` Permissions** | Role/permission catalogue, evaluation, override resolution, decision audit | Internal Customer ID as evaluation subject | Trust state, identity lifecycle, authentication credentials |
| **ITM** | Trust record, trust level/state, progression rules, signal ingestion contract, risk-gate read contract | Authentication events (`CustomerAuthenticated`, `AuthenticationRecoveryProofProvided`) and other governed signals (§7); Internal Customer ID as subject | Identity existence, authentication credentials, role/permission authorization, customer-facing scoring |
| **Reward Engine / future risk-gated consumers** | Their own domain state (redemptions, purchases) and the decision to *invoke* a risk gate on a specific action | ITM's risk-gate decision (§9) for actions they explicitly opt in | Trust computation, trust record, identity/authentication state |

**No-circularity check:** Customer Identity → holds an opaque reference to ITM (one-directional pointer, no read of content). Authentication → emits events ITM consumes (one-directional). ITM → never calls back into Customer Identity, Authentication, or Permissions to make its own decisions; it only reads the Internal Customer ID as a key and (optionally, for record creation) confirms the identity reference is valid via the same read-only lookup contract `ENG-P2-001-09` already exposes. Reward Engine → calls ITM's read contract; ITM never calls into Reward Engine. No cycle exists.

---

## 5. Trust Record Design

Minimum fields, each justified against §2's principles and the "avoid unnecessary PII" / "no speculative fields" instruction:

| Field | Type | Purpose | Notes |
|---|---|---|---|
| `trustRecordId` | opaque ID | Primary key, doc-ID-keyed | Never customer-facing |
| `customerIdentityId` | reference | The Internal Customer ID this record belongs to | Exactly one trust record per identity; 1:1, not 1:many |
| `verificationState` | closed enum set (e.g. `phoneVerified: boolean`, `emailVerified: boolean`; future signals additive) | Discrete verification facts, not a score | Booleans/enums only — no weighting stored here |
| `trustLevel` | closed enum/band (see §6 for the recommended model) | The current risk-gating input | Never a raw customer-facing number |
| `signalState` | bounded structured record of the *latest known state* of each governed signal category (§7), not a full event log | Supports explainability without duplicating the outbox | e.g. `accountAgeDays` (derived, not stored raw), `hasSuccessfulAuthentication: boolean` |
| `version` | integer, optimistic-concurrency token | Safe concurrent updates | Standard pattern already used elsewhere in the schema (`BaseMetadata`-style) |
| `status` | closed enum: `active` \| `frozen` \| `suspended` | Whether the record is currently usable for risk-gating (§8.3) | Distinct from Identity's own `Suspended`/`Locked` — see §5.1 |
| `reasonReferences` | bounded array of governed reason codes + correlation IDs pointing at the outbox events that produced the current state | Auditability (Principle 8) without re-storing event payloads | References, not copies |
| `createdAt` / `updatedAt` | timestamps | Standard metadata | Reuses `BaseMetadata` conventions |

**Explicitly excluded** (per task Phase E "avoid unnecessary PII," "do not duplicate Customer Identity profile data," "do not store raw authentication tokens or credentials," "if speculative, leave it out"):

- No raw phone number, email address, or device identifiers stored on the trust record (Customer Identity/Authentication already own or reference these; ITM stores only the *fact* that a signal fired, via `signalState`/`reasonReferences`).
- No credential material, OTP secret, or provider token (never permitted anywhere in Firestore per TRD10 §10.6.1).
- No numeric trust *score* field — see §6 recommendation against a numeric model at MVP.
- No demographic or protected-attribute field (Principle 10 / task Phase L).
- No `disputeStatus`/`correctionHistory` field — speculative at this stage; left out per Phase E instruction, flagged as a possible future field in §16.

### 5.1 Relationship to Identity's own `Suspended`/`Locked` states

`ENG-P2-ARCH-001` §3 defines `Suspended`/`Locked` as Identity-lifecycle-adjacent, Authentication-owned access-restriction states. The trust record's own `status` (`active`/`frozen`/`suspended`) is a **separate, ITM-internal** concept describing whether the trust record itself is currently trustworthy input for risk-gating (e.g., frozen while a dispute is investigated) — it does not restrict authentication or identity access, and Identity's `Suspended`/`Locked` do not automatically freeze the trust record. A future governed rule may link the two; this document does not assume one (Phase E "if speculative, leave it out").

---

## 6. Trust Level / Progression Model (Founder-sensitive — Phase F)

### 6.1 Options compared

| | A — Discrete levels/bands | B — Numerical score | C — Evidence/state model, no aggregate | D — Hybrid |
|---|---|---|---|---|
| **Explainability** | High — each level has a defined evidence bar | Low — a single number obscures which signals drove it | Highest — the record *is* the explanation | Medium — score exists but bands are the interface |
| **Auditability** | High — level transitions are discrete, loggable events | Medium — every micro-change needs its own audit entry | Highest — no computed aggregate to dispute | Medium |
| **Gaming/manipulation risk** | Low-medium — thresholds must be defined carefully but are few | Higher — weighted scores invite reverse-engineering and gaming | Lowest — no single number to target | Medium |
| **False precision** | Low | High — a "73" implies precision the underlying signals don't support | None | Medium |
| **Operational complexity** | Low | Medium-high — needs a weighting/decay policy, which is itself a Founder-sensitive product decision not yet made | Lowest | Highest |
| **Future extensibility** | Good — new levels can be inserted with a version bump | Good in theory, brittle in practice (reweighting is a breaking change) | Good — new evidence types add fields, not recompute logic | Good but carries B's downsides |

### 6.2 Recommendation: **Option A, discrete trust levels/bands**, with the level *derived deterministically* from the evidence-state fields in §5, not from a weighted aggregate.

This is the smallest MVP-safe model that satisfies §2 Principle 8 (explainable/auditable) and Principle 10 (no false precision), and it is the model `DEC-PROV-004` point 7 already gestures toward ("trust grows continuously through customer behaviour... rather than a fixed three-state ladder" — read together with `DEC-IDENTITY-001`'s Risk-Based Verification Principle, "verification requirements shall be proportional to risk," this supports an ordered small set of bands, not a single fixed ladder and not an opaque score).

### 6.3 Recommended bands (illustrative structure, not a Founder-binding enumeration)

A small ordered set — e.g., `unverified` → `provisional` → `established` — where each band's membership rule is a deterministic, auditable function of `verificationState`/`signalState` fields. The exact band count, names, and membership thresholds were a genuine product/policy decision, originally **not decided by this document** (Phase F instruction: "any scoring thresholds or weighting that are genuine product/policy decisions must be surfaced for Founder disposition") and surfaced as Founder Decision **FDR-1** in §18. **`FDR-1` is now fully resolved** — the Founder-countersigned model is recorded in §6.6, with its MVP policy clarification in §6.6.3–§6.6.4 and the disposition record in §22 `AD-ITM-1`.

### 6.4 Why not numerical scoring at MVP

A weighted numerical score requires the Founder to approve specific weights and decay curves before any implementation — a governance dependency this design does not want to silently create. A discrete, evidence-derived band requires only agreement on band boundaries expressed as *conditions on already-stored facts*, which is auditable by inspection ("why is this identity `established`?" → "because these three fields are true") rather than requiring score reconstruction.

### 6.5 Explicit non-recommendation of Option D (Hybrid) for MVP

A hybrid model inherits B's governance and gaming risks while adding A's operational surface. Revisit only if a future risk-gated consumer demonstrates a genuine need for finer-grained comparison than discrete bands provide (Phase P: defer to Capabilities 4–5 if needed).

### 6.6 Approved MVP Band Model — **FOUNDER-COUNTERSIGNED, 2026-08-16**

**Status: countersigned.** Per Founder disposition **`AD-ITM-1`** (§22, task "CAP-P2-ITM-DESIGN-001 — FDR-1 Founder Countersignature"), the band model below is **approved with the MVP policy clarification recorded in §6.6.3–§6.6.4**. `FDR-1` is **fully resolved** — no longer provisional. This subsection (originally proposed as a draft, per the earlier `AD-ITM-1` process approval) is preserved with its original derivation rationale intact; the countersignature narrows and clarifies its *meaning*, not its structure. **ITM-A and ITM-C implementation remains separately unauthorized** — countersignature of the *design* does not itself grant implementation authorization, which still requires the fresh-authorization convention already established for `AUTH-*`/`ENG-P2-004*` packages (§15, §18).

**Band names and ordering:** `unverified` < `provisional` < `established` (internal ordinal ranking; never customer-facing per Principle 9 and §6.6.3 below — no field in §5 or this proposal is read by any customer-facing surface).

**Rationale for three bands:** matches `DEC-PROV-004` point 7's existing, already-approved "Anonymous/Authenticated/Verified" reference points, reinterpreted as evidence-derived bands rather than a fixed ladder (§6.2) — `unverified` ≈ the pre-signal default; `provisional` ≈ "Authenticated" (a working credential exists); `established` ≈ "Verified" (evidence-backed, time-tested). No repository evidence was found that argues for more or fewer than three bands at MVP; per constraint 2 of the disposition prompt, three is proposed as the smallest useful structure.

**Entry / membership conditions** (deterministic; highest band whose conditions are satisfied wins — no band is assigned by weighting or accumulation):

| Band | Condition | Evidence used |
|---|---|---|
| `established` | `signalState.hasSuccessfulAuthentication == true` **AND** `accountAgeDays ≥ 30` (accountAgeDays derived at read time from Customer Identity's existing `Registered`-transition timestamp, per §7's "Account age" row — referenced, never duplicated) | Available now |
| `provisional` | `signalState.hasSuccessfulAuthentication == true` **AND** `established`'s conditions are not (yet) satisfied | Available now |
| `unverified` | Default — no `CustomerAuthenticated` event has yet been ingested for this identity (`signalState.hasSuccessfulAuthentication` absent/false) | Available now (absence of a signal, not a signal itself) |

`hasSuccessfulAuthentication` is set `true` the first time any `CustomerAuthenticated` event (§7, `AUTH-08`, merged) is idempotently ingested for the identity, and is never unset (append-only-derived, per §7.1's replay-determinism requirement) — consistent with `DEC-ID-003`'s Identity and Accountability Principle, this condition treats all three MVP-approved authentication providers (Google, Email/Password, Phone OTP) identically; **no per-provider weighting is proposed**, since `DEC-AUTH-001`/`AUTH-CORR-003` establish all three as equally approved MVP mechanisms and inventing an unweighted preference between them is exactly the kind of arbitrary weighting constraint 5 prohibits.

**30-day threshold — Founder-approved MVP policy boundary (see §6.6.4 for exact semantics; not a statistical or fraud-calibrated figure — see §6.6.3).** Rationale: long enough that a purely opportunistic register-then-immediately-attempt-a-risk-action pattern does not reach `established` on day one (there is currently no risk-gated consumer to attack, but the threshold is chosen with that eventual purpose in mind, per Principle 6/7); short enough that any genuinely returning customer reaches it automatically, without needing any unbuilt signal. Changing this number in a future revision requires no `signalState` migration (§6.6.2's version-bumped derivation model).

**Progression conditions** (how an identity moves between bands):

- `unverified → provisional`: automatic, the instant the first `CustomerAuthenticated` event is idempotently ingested (§7.1). In practice this window is brief but real: because `AUTH-08` emits `CustomerAuthenticated` on successful **registration itself** (not only on a later, separate sign-in), nearly every identity reaches `provisional` within the same registration flow — `unverified` is chiefly the state a trust record momentarily occupies between identity creation and the shared outbox's (at-least-once, not synchronous) delivery of that first event, or ITM's own lazily-created default (§13) before any event has landed.
- `provisional → established`: automatic and **purely time-based**, not event-triggered — no event fires "30 days later." This means `trustLevel` must be **recomputed, not merely read**, whenever accuracy matters (§6.6.1 below).
- **No band ever moves downward at MVP** — per Founder disposition **AD-ITM-3** (§22, resolves FDR-3): trust progression is monotonic non-decreasing.

**Current evidence used (available now):** `CustomerAuthenticated` events (`AUTH-08`, merged); Customer Identity's `Registered`-transition timestamp (existing, merged; referenced, not duplicated per §5's "avoid unnecessary PII/duplication" instruction).

**Future evidence explicitly excluded from these MVP thresholds (confirmed by Founder countersignature, `AD-ITM-1`, §22):** purchase history, merchant interaction history, device history, and future fraud/risk signals (§7 — none exist yet, none are made mandatory for any band above); `AuthenticationRecoveryProofProvided` (per Founder disposition **AD-ITM-2**, §22 — resolved neutral, never a band-membership condition); a per-provider verified-phone/verified-email distinction (deliberately excluded from thresholds, to avoid unweighted preferential treatment among the three equally-approved MVP providers — a considered exclusion, confirmed, not amended, by the Founder's countersignature, which approved the model exactly as proposed).

**Can any customer become permanently stuck?** **No.** Both signals used — "has ever successfully authenticated" and "elapsed account age" — are universally reachable by construction: every registered identity authenticates at registration (satisfying `provisional` immediately), and time passes identically for every identity (satisfying `established`'s second condition for anyone who remains registered 30 days). No band in this proposal depends on a signal that does not exist yet, satisfying constraint 4.

#### 6.6.1 Recomputed vs. persisted state

`trustLevel` (§5) is **derived state, not authoritative-when-persisted.** Because `established`'s second condition (`accountAgeDays ≥ 30`) advances purely with elapsed time and no event marks the crossing, a `trustLevel` value cached at the moment of the last signal-driven write (e.g., day 5) would silently go stale by day 30 if trusted as-is. The proposed rule: **ITM-C's read path always recomputes `trustLevel` from `signalState` + current server time** rather than trusting the persisted field as ground truth; the persisted `trustLevel` value (§5) is retained only as a **read-optimization cache**, refreshed opportunistically whenever a signal-driven write already has the record open, and is never relied upon between reads without recomputation. `signalState` (the append-only, ever-true-once-true facts) is the only field this proposal treats as authoritative source of truth; `trustLevel` is always reproducible from it plus the current band-rule version (§6.6.2).

#### 6.6.2 Versioned evolution without rebuilding identity

Because `trustLevel` is always re-derived from `signalState` (§6.6.1) rather than stored as an independent fact, changing a threshold (e.g., 30 days → 14 days), renaming a band, or adjusting the band count in a future revision requires only bumping a band-rule version and re-running the same deterministic derivation function against already-stored `signalState` — no `signalState` migration, no Customer Identity change, no re-ingestion of historical `AUTH-08` events, and no rebuild of any identity record. This mirrors §8.5's existing statement that "band boundaries are a version-bumped derivation rule, not stored per-record weights."

#### 6.6.3 Semantic boundary — what these band names mean, and do not mean (Founder clarification, `AD-ITM-1`)

**The term `established` is internal-only** (Principle 9) and means, precisely and only: ***established under the current MVP trust-evidence model*** — i.e., "ITM has recorded at least one successful authentication signal and at least 30 elapsed days since registration, per §6.6.4's precise semantics." It must **not** be represented, documented, coded, or reasoned about as meaning any of the following, none of which this MVP evidence model can support:

- verified legal identity;
- fraud clearance;
- financial credibility or reliability;
- customer quality or loyalty value;
- a risk-free account;
- eligibility for ordinary platform participation (participation is identity-gated only, per §10 — never trust-gated by default);
- a customer-facing status, badge, or label of any kind.

Likewise, the **30-day threshold is a Founder-approved MVP policy boundary, not a validated risk figure.** It must not be represented as statistically validated, fraud-calibrated, externally benchmarked, evidence of financial reliability, evidence of low fraud risk, or stronger proof of identity ownership than Authentication itself already provides (§8 Principle 3 — authentication events remain signals only; `established` does not elevate an authentication event into something authentication itself does not claim). It is a simple initial policy threshold for the Capability-2 ITM foundation; future governed ITM versions may change it through the versioned derivation mechanism (§6.6.2), and any such change is itself a policy decision, not an engineering optimization.

This semantic boundary is a documentation/design-review discipline, not a runtime control — it constrains how `TrustLevel` values may be named, documented, logged, and reasoned about in any future ITM-A–D implementation and in any future risk-gate consumer's own documentation, so that "established" is never silently read by a later engineer or product decision as meaning more than the MVP evidence model actually supports.

#### 6.6.4 Precise account-age (time) semantics

To make the 30-day threshold unambiguous for a future implementer's boundary tests, without writing any implementation code here:

- **Authoritative source:** the Customer Identity's existing `Registered`-transition timestamp (`ENG-P2-ARCH-001` §3) — referenced, never duplicated (§5).
- **Elapsed-time computation, not calendar-month arithmetic:** `accountAgeDays` is the number of whole 24-hour periods elapsed between the `Registered` timestamp and the current authoritative server time at the moment of derivation (§6.6.1) — i.e., `floor((currentServerTime − registeredAt) / 86400 seconds)`. This avoids ambiguous "calendar month" or "same day of month" semantics, which would produce inconsistent day-counts across months of different lengths.
- **`established`'s condition is `accountAgeDays ≥ 30`** — a closed, non-strict inequality; the boundary belongs to `established`, not `provisional`.
- **Deterministic boundary behavior a future implementation must test for:**
  - `accountAgeDays == 29` (just below 30 elapsed days) → `provisional` (assuming `hasSuccessfulAuthentication == true`), never `established`.
  - `accountAgeDays == 30` (exactly 30 elapsed days) → `established` (assuming `hasSuccessfulAuthentication == true`) — the crossing point belongs to `established`.
  - `accountAgeDays == 31` (just above 30 elapsed days) → `established`, same as the exact-30 case, confirming the condition is a simple threshold, not a narrow window.
- **Current time is authoritative, evidence is authoritative, rule version is authoritative — `trustLevel` is derived state** (§6.6.1, §22's Derivation Authority clarification). No scheduled job, cron, or event is required merely because an account crosses day 30 — the transition is observed the next time the record is read or re-derived, consistent with the "no scheduled transition event is required" instruction.

---

## 7. Signal Model

| Signal | Availability | Classification | Notes |
|---|---|---|---|
| `CustomerAuthenticated` event (successful sign-in/registration) | **Available now** — emitted by `AUTH-08`, merged | Supporting | Confirms a working, verified-by-provider credential; one input among several, never sufficient alone (Principle 6) |
| `AuthenticationRecoveryProofProvided` event | **Available now** — emitted by `AUTH-08`, merged | Supporting | **Resolved (`AD-ITM-2`, §22):** ingested and retained as auditable trust evidence (`reasonReferences`, §5) but is strictly **neutral** — it does not increase, decrease, or reset `trustLevel`, and never independently triggers progression. A successful recovery restores continuity, not trust (`ENG-P2-ARCH-001` §6); it is never used as a band-membership condition (§6.6). |
| Verified phone / verified email (provider-level fact) | **Available now** — derivable from the Authentication events' `referenceType`/provider verification state | Supporting | Categorical fact, not a score contributor with a fixed weight |
| Account age | **Available now** — derivable from Customer Identity's own `createdAt`/`Registered` timestamp | Supporting | ITM computes this at read time from a Customer-Identity-owned timestamp; it does not duplicate-store identity creation data beyond a reference |
| Purchase history | **Future** — depends on Capabilities 4–5 (Reward Engine) not yet built | Future / Supporting | Do not invent a data source that does not exist yet (Phase G instruction) |
| Merchant interaction history | **Future** — same dependency | Future / Supporting | As above |
| Device history | **Future** — no device-fingerprinting capability exists in the current architecture | Future / Supporting, potentially privacy-sensitive (Phase L) | Not designed further here |
| Future fraud/risk signals | **Future** — no fraud-detection capability exists yet | Future / Supporting | Not designed further here |
| Role/permission grants (`ENG-P2-004`) | Available now, but **explicitly out of scope as a trust signal** | **Prohibited from acting as identity/trust authority** | Role authorization and trust are separate dimensions per `DEC-ID-003`'s Identity and Accountability Principle: "trust level and role-based permissions remain separate dimensions and neither substitutes for the other" |

**No single signal is authoritative on its own** — Principle 6 (bands derived from a conjunction of facts, §6.3) already enforces this structurally; no signal is designed here to unilaterally set `trustLevel`.

### 7.1 Signal-ingestion contract (defined, no consumer built)

- **Input:** a governed domain event (initially: the two `AUTH-08` events) delivered via the existing shared outbox/processor infrastructure (TRD11 §11.8–11.9/§11.15/§11.17) — the same durable at-least-once delivery model `AUTH-08` already uses.
- **Idempotency:** ingestion must be idempotent on the event's own `eventId` (already deterministic and retry-stable per `AUTH-08` §7.2(c)) — processing the same event twice must not double-count or oscillate the trust record.
- **Out-of-order handling:** because `AUTH-08`'s outbox provides at-least-once, not ordered, delivery, ITM's ingestion must be commutative/idempotent per event rather than relying on arrival order — i.e., derive `signalState` fields as "has this fact ever been true," not as a sequence-dependent state machine.
- **Replay behavior:** replaying the full authentication-event history against an empty trust record must converge to the same `signalState`/`trustLevel` as the original processing — a testable determinism property, not merely a hope.
- **No consumer is built by this document** — per task Phase H, "do not implement the event consumer."

---

## 8. Authentication Event Consumption (Phase H) and Progression (Phase I)

### 8.1 Event → signal, not event → identity mutation

Consuming `CustomerAuthenticated`/`AuthenticationRecoveryProofProvided` updates only `signalState`/`verificationState`/`trustLevel` on the ITM trust record — it never writes to Customer Identity's own aggregate (Principle 2, 3).

### 8.2 Progression (increase)

Trust-band progression is a deterministic function of the evidence fields becoming true (§6.3) — e.g., crossing an account-age threshold, or a first verified-provider sign-in landing. No arbitrary weight is assigned to any single event (Phase I instruction: "do not assign arbitrary weights").

### 8.3 Regression, suspension/freeze, evidence expiry

- **Regression (trust band decreasing) — resolved (`AD-ITM-3`, §22): no regression at MVP.** Trust progression is **monotonic non-decreasing** for the Capability-2 ITM MVP; no downward-band transition, evidence-expiry regression, or fraud-trigger regression is authorized inside ITM-A–D. This is an **MVP scope decision, not a permanent declaration** — regression must be reconsidered before a future risk-gated consumer requires it, and only once governed signals and policy exist (no fraud-detection capability exists yet, §7).
- **Suspension/freeze** of the trust record itself (§5.1's `status` field) remains defined as a *state*, but the *triggers* that would set it (e.g., a fraud-review outcome) are **not authorized inside ITM-A–D at MVP**, consistent with the no-regression disposition above — no fraud-detection capability exists yet (§7).
- **Evidence expiry** (does a signal ever "age out"?) remains not designed here — flagged as a future consideration, not assumed to exist (Phase E "if speculative, leave it out"), and is itself a form of regression covered by the `AD-ITM-3` disposition above.

### 8.4 Recovery-related changes

Per `ENG-P2-ARCH-001` §6: "Identity Recovery... restores... trust state (the trust reference is preserved — ITM's own trust record is not reset by recovery)." A successful `AuthenticationRecoveryProofProvided` event therefore **must never reset or clear** the trust record — this was already a hard constraint, and is now further narrowed by **`AD-ITM-2`** (§22, resolves FDR-2): the event is ingested and retained as auditable evidence but is strictly **neutral** — it may **never** increase, decrease, or independently trigger progression of `trustLevel` at MVP (§6.6, §7).

### 8.5 Irreversible vs. reversible trust state

No trust-record field designed in §5 is irreversible by construction — `trustLevel`/`verificationState`/`status` are all recomputable from `signalState`, which is itself append-only-derived from outbox events. Per `AD-ITM-3` (§22, resolves FDR-3), no band transition moves downward at MVP by design decision, not merely by omission — trust is a one-way ratchet under the current disposition, reversible only insofar as a **future** governed regression policy could introduce a downward path, which would itself require a new Founder decision, not a reinterpretation of this document.

---

## 9. Risk-Gated Action Contract

**The question ITM answers:** *"Does current trust evidence satisfy the risk requirement for this specific, already-authorized action?"*

**The question `ENG-P2-004` answers:** *"Is this actor authorized by role/context to attempt this action at all?"*

Neither substitutes for the other. A future protected command that is both role-sensitive and risk-sensitive (e.g., a large redemption approval) calls both: `ENG-P2-004`'s `authorizeAndExecute` boundary (merged, `ENG-P2-004D`) for role authorization, and a separate ITM risk-gate read for trust sufficiency — composed by the *consuming* domain (Reward Engine), never by ITM or `ENG-P2-004` calling each other.

### 9.1 Contract shape (interface only, no implementation)

- **Input:** `customerIdentityId`, a `riskRequirement` identifier declared by the calling action (not a raw trust-level comparison the caller invents ad hoc — the requirement vocabulary is ITM-owned and closed, analogous to the closed 14-category error taxonomy, TRD11 §11.35).
- **Output:** a bounded decision (`sufficient` / `insufficient` / `unavailable`) plus a governed reason code — never the raw trust record, never a numeric score (§3.6).
- **Read-only, no side effects.** A risk-gate check must never itself mutate the trust record (mirrors `ENG-P2-004`'s evaluator being "read-only/pure," `ENG-P2-004B` implementation report).
- **Deterministic and versioned**, so that a decision is reproducible against the same input state — same discipline as `ENG-P2-004`'s deterministic evaluator (design §6.9 algorithm).

### 9.2 What this contract must never become

Not a general participation-authorization system, not a substitute for `ENG-P2-004`, and not callable with an arbitrary threshold supplied by the caller (that would let any future domain invent its own ad hoc trust policy — the requirement vocabulary must stay ITM-owned and closed).

---

## 10. Standard Participation Protection (Phase K)

Per `DEC-IDENTITY-001`'s Standard Participation Principle, the following must never be blocked merely for low trust (illustrative, not exhaustive — the general rule below governs):

- Registration and receiving a Loyalty Number/QR.
- Sign-in via any linked provider.
- Earning a qualifying purchase.
- Redeeming the **standard** 11th reward.
- Ordinary browsing, profile viewing/editing, and recovery-eligibility checks.

**No global gate is permitted.** The pattern `if trustLevel < X → reject everything` is explicitly disallowed by this design. Trust-gating is **opt-in at the action-definition level only** — an action must explicitly declare a `riskRequirement` (§9.1) to be gated at all; the default for every action, including all of those listed above, is "no trust requirement." This mirrors `ENG-P2-004`'s own "sensitive permissions require explicit assignment, never implicit" discipline (`DEC-ID-003`) applied to trust instead of role.

Ordinary participation remains available unless a *separate, legitimate* control applies (e.g., Identity's own `Suspended`/`Locked` states, which are Authentication/Identity-owned, not ITM-owned) — trust insufficiency is never that control for standard actions.

---

## 11. Privacy, Fairness, Explainability (Phase L)

- **Data minimization:** §5's field list already excludes raw PII beyond the identity reference; `signalState` stores derived facts, not raw event payloads (mirrors `AUTH-08`'s own "categorical fields only" payload discipline).
- **Retention:** no numeric retention period is governed anywhere in TRD21/TRD10 for identity-audit-adjacent records generally (`ENG-P2-001-10`'s implementation report already disclosed this as an open gap for identity audit) — the same gap applies to ITM's trust-record history and is **not resolved by this document**; flagged as a future governance item, not invented here.
- **Explainability:** the discrete-band model (§6) is explainable by construction — the answer to "why is this trust level X" is always a conjunction of stored boolean/enum facts, never a black-box computation.
- **Behavioral history use:** limited, at MVP, to the two governed authentication events (§7) — no purchase/device/merchant history exists to use yet.
- **False-positive impact:** because standard participation is never trust-gated (§10), a wrong trust assessment cannot block ordinary use — it can only affect an explicitly risk-gated action, bounding the blast radius of any false negative.
- **Customer-data exposure / internal operator visibility — resolved (`AD-ITM-4`, §22): no operator surface at MVP.** The trust record is internal-only (Principle 9); no customer-facing surface is designed here, and **no** ITM operator/support trust-visibility surface (endpoint, UI, exposed band, or new `ENG-P2-004` permission identifier/role) is authorized for the Capability-2 MVP. A future demonstrated operational requirement may trigger a separately governed design and permission decision — this document does not pre-authorize one.
- **Audit access:** trust-record changes should be discoverable through the same audit-query pattern `ENG-P2-001-10`/`identityAudit` already established (a read-side projection over the outbox), not a second parallel audit system — see §12.
- **Future correction/dispute considerations:** not designed here (§5's explicit exclusion of a `disputeStatus` field) — flagged in §16 as a future item.
- **No demographic/protected-attribute scoring; no inference of sensitive personal traits** — no signal in §7 is, or derives from, a protected attribute.

---

## 12. Data / Storage Architecture Recommendation (Phase M — recommendation only, TRD10 not modified by this document)

- **Collection ownership:** a new ITM-owned collection (illustratively `trustRecords/{customerIdentityId}`, doc-ID-keyed by the Internal Customer ID for O(1) lookup and to make the 1:1 invariant structurally enforced — no separate index needed to prevent duplicates, mirroring the doc-ID-as-value pattern already used for Loyalty Number/QR-reference uniqueness in `ENG-P2-001-05`).
- **Indexing:** none anticipated beyond the doc-ID key at MVP scope (§14) — no query pattern in this design requires a composite index; if a future risk-gate contract needs range/band queries, that is a follow-on schema task.
- **Transaction/idempotency strategy:** signal ingestion writes happen in a caller-owned Firestore transaction that reads-then-writes the trust record keyed by `customerIdentityId`, using the same "read target first, no-op if the specific event was already applied" idempotency pattern `AUTH-08`'s emitter already established for outbox writes — applied here to *consuming* an event exactly-once-effectively rather than *producing* one.
- **Update concurrency:** the `version` field (§5) provides optimistic-concurrency protection against two signals racing to update the same trust record.
- **Event processing semantics:** durable at-least-once consumption + idempotent-by-`eventId` application (§7.1) — consistent with the outbox's existing delivery guarantee, no new delivery model invented.
- This document **proposes** this shape; it does not amend TRD10. Per repository convention (`ENG-P2-ARCH-001`, `ENG-P2-004-DESIGN-001` precedent), a schema amendment is a follow-on implementation-package deliverable, not a design-document deliverable.

---

## 13. Failure / Error Model (Phase N)

Mapped to the existing closed 14-category taxonomy (TRD11 §11.35) wherever an existing category fits; no new category is proposed unless demonstrated unavoidable — none is:

| ITM failure | Mapped category | Notes |
|---|---|---|
| Trust insufficient for a risk-gated action | *(not itself an error at ITM's layer)* — ITM returns `insufficient` as a decision value, not a thrown error; the **calling** domain maps that decision to its own customer-facing error (likely `AUTH_FORBIDDEN` or a domain-specific category it already owns) | ITM's read contract is a decision function, not an error-throwing gate — mirrors `ENG-P2-004`'s evaluator, which returns decisions, not exceptions |
| ITM/trust-record store unavailable | `TEMPORARY_UNAVAILABLE` | Existing category, no change needed |
| Malformed/corrupt trust state read | `VALIDATION_FAILED` (fails closed) | Per the governed taxonomy's existing rule that non-idempotency conflicts map to `VALIDATION_FAILED` (F9B-DEC-001) |
| Missing trust record for a known identity | *(not an error)* — ITM must be able to lazily create a default (`unverified`) trust record on first read/first signal, since Customer Identity's `Registered` transition does not itself require ITM to pre-provision a record (Principle 1: identity exists independently of trust) | A missing record is expected steady state for a brand-new identity, not a failure |
| Caller unauthenticated | `AUTH_REQUIRED` | Existing category; ITM's read contract itself requires a resolved identity as input, consistent with every other identity-scoped read in this codebase |
| Identity suspended/locked (Authentication-owned state) | Not ITM's failure to report — the calling domain observes Identity's own state directly; ITM's trust-record `status` (§5.1) is a distinct concept and must not be conflated with it in error messaging | Keeps the boundary in §4 intact |

Customer-facing message copy is not decided here (Phase N instruction: "do not decide customer-facing messages yet unless already governed") — none of these failure paths reach a customer directly yet, since no risk-gated consumer exists at MVP (§14).

---

## 14. MVP ITM Scope (Phase P)

**What Capability 2 closure genuinely requires from ITM:** the **trust-record foundation and the signal-ingestion contract** — i.e., §5 (record model), §7 (signal model + ingestion contract), §12 (storage shape), and enough of §6/§8 to make the record meaningfully populated and explainable. This is sufficient to satisfy `ENG-P2-ARCH-001` §8's boundary contract and to let Customer Identity's trust *reference* point at something real.

**What is genuinely deferrable to Capabilities 4–5 (Reward Engine) or later:**
- The risk-gate **consumer** side (§9) — defining the contract shape is Capability-2 work; wiring an actual caller is not, because no risk-gated action exists yet in any built capability. Building a consumer with no caller would be premature (mirrors `AUTH-08`'s own explicit deferral of "a live ITM consumer/dispatcher... premature/out of scope").
- Purchase/merchant/device signals (§7) — no source capability exists yet.
- Regression/suspension/expiry policy (§8.3) — a Founder-sensitive product question better resolved once a real risk-gated consumer defines what it actually needs to protect against.
- Any operator-facing trust-inspection tool (§11) — not required for Capability 2 closure.

**Recommendation:** Capability-2 ITM completion should be scoped to the trust-record foundation + ingestion contract (a bounded "ITM-A"/"ITM-B" pair, §15) — not the full future trust engine. Reward Engine policy must not be pulled into Capability 2 (Phase P instruction).

---

## 15. Implementation Decomposition (Phase Q — bounded packages, not yet authorized)

**Re-confirmed after final Founder dispositions (`AD-ITM-1`–`AD-ITM-4`, §22) — no boundary change from the original decomposition; only the design inputs each package depends on have moved from "pending" to "resolved."**

| Package | Responsibility | Dependencies | Acceptance criteria (illustrative) | Explicit exclusions |
|---|---|---|---|---|
| **ITM-A — Contracts & trust-record model** | Pure domain layer: `TrustRecord`, `VerificationState`, `TrustLevel` (closed enum — `unverified`/`provisional`/`established`, Founder-countersigned §6.6), the signal/evidence contracts `signalState` is shaped from (§5, §7), value objects, domain errors reusing the 14-category taxonomy (§13). **No progression/derivation logic — that is ITM-C's responsibility, not ITM-A's.** | `ENG-P2-ARCH-001` (merged/reference); none from `ENG-P2-004` | Pure unit tests; no Firebase; no persistence; matches §5 field list and §6.6's band enum exactly | No event consumer; no persistence; no risk-gate contract; no band-derivation function |
| **ITM-B — Persistence & signal ingestion** | Firestore repository for `trustRecords/{customerIdentityId}` (§12); the outbox consumer for `CustomerAuthenticated`/`AuthenticationRecoveryProofProvided` implementing the idempotent/commutative ingestion contract (§7.1) — the **AUTH-08 event-consumption boundary**. Ingests and retains `AuthenticationRecoveryProofProvided` strictly as auditable evidence (`AD-ITM-2`), never as a `trustLevel`-mutating signal. | ITM-A; `AUTH-08` (merged); shared outbox/processor infrastructure | Real Firebase Emulator tests; replay-determinism test (§7.1) passes; duplicate-delivery test (same `eventId` twice → no double-count); out-of-order-delivery test; recovery event proven to never increase, decrease, or reset `trustLevel` (§8.4, `AD-ITM-2`) | No progression-band computation (ITM-C's responsibility); no risk-gate read contract yet |
| **ITM-C — Progression / trust-level derivation** | The deterministic function from `signalState` + current server time → `trustLevel` band, implementing §6.6's exact conditions and §6.6.4's precise elapsed-time semantics (`accountAgeDays = floor((currentServerTime − registeredAt) / 86400s)`, closed `≥ 30` inequality); recomputes-on-read per §6.6.1 rather than trusting a stale persisted value; **monotonic non-decreasing only** — no downward transition, no suspension, no evidence-expiry regression (`AD-ITM-3`); explainability surface (why a record is at a given band, via `reasonReferences`) | ITM-A, ITM-B; **`FDR-1` fully resolved (§6.6, `AD-ITM-1`)** — no longer a blocking dependency | Unit tests proving determinism (same `signalState` + same server time → same band, every time); explicit boundary tests at `accountAgeDays` = 29 / 30 / 31 (§6.6.4); explainability test (band change always traces to a `reasonReferences` entry); regression-impossibility test (no code path can decrease `trustLevel`) | No regression/suspension policy (confirmed excluded, `AD-ITM-3` — not "deferred pending a decision," the decision is made) |
| **ITM-D — Risk-gate read contract + closure validation** | The read-only `checkRiskGate(customerIdentityId, riskRequirement)` contract (§9.1); Capability-2-level validation/closure report for the ITM concern (mirrors `AUTH-09`'s pattern), including confirmation that no operator-visibility surface was built (`AD-ITM-4`) | ITM-A/B/C | Deterministic decision function; no side effects; concern-closure report matches `DEC-GOV-009`/`-010` criteria and confirms all four `AD-ITM-*` dispositions were respected | No actual caller wiring into Reward Engine (that belongs to the future capability that defines the first real risk-gated action); no operator endpoint/UI/permission (`AD-ITM-4`) |

No package here depends on unbuilt Reward Engine implementation — the dependency direction runs ITM → (future) Reward Engine consumption, never the reverse, preserving §4's no-circularity finding. **All four packages' design inputs are now fully specified; none is blocked on an open Founder decision. Implementation authorization for any package remains a separate, not-yet-granted step.**

---

## 16. Test Strategy

- **ITM-A:** pure unit tests (TDD), no Firebase — mirrors `ENG-P2-004A`'s "no runtime evaluator, no persistence" contract-only test discipline.
- **ITM-B:** real Firebase Emulator Suite tests for the repository and consumer, plus a dedicated **replay-determinism** test (§7.1) and a **duplicate-delivery** test (processing the same `eventId` twice produces no state change beyond the first application) — mirrors `AUTH-08`'s idempotent-enqueue test pattern.
- **ITM-C:** determinism and explainability unit tests as described in §15.
- **ITM-D:** contract-shape tests (no side effects; deterministic decision for a fixed input state) and the concern-closure validation report (full-suite green, per the `AUTH-09`/`ENG-P2-004D` precedent).
- Across all packages: no credential/token material in any test fixture or payload (mirrors every prior AUTH/`ENG-P2-004` package's stated invariant).

## 17. Acceptance Criteria (design-package level)

This document itself is complete when:
1. The ITM boundary (§3–§4) is internally consistent with `ENG-P2-ARCH-001` §8 and introduces no contradiction.
2. The trust-record model (§5) contains no speculative field and no PII/credential beyond what §5 explicitly justifies.
3. A trust-level model is recommended (§6) with the numeric-score alternative explicitly rejected for MVP, and every genuine threshold/weighting decision is surfaced to the Founder (§17 below), not silently chosen.
4. The signal model (§7) classifies every signal without inventing an unbuilt data source.
5. The risk-gate contract (§9) is clearly distinguished from `ENG-P2-004`'s role/permission contract, with no circular dependency (§4).
6. Standard participation is provably protected by construction (§10 — opt-in-only gating).
7. MVP scope (§14) is bounded to what Capability 2 closure requires, deferring Reward Engine-specific policy.
8. Every Founder-sensitive product/policy question is listed explicitly (§17) rather than resolved unilaterally.

---

## 18. Founder Decisions Required (Phase R)

**This section is preserved as originally presented** (repository convention: preserve prior analysis, do not rewrite — `ENG-P2-004-DESIGN-001` §17 precedent). **§22 records the actual Founder dispositions** and is authoritative wherever it differs from the Recommendation column below (it does not differ — the Founder approved every original recommendation as stated). The Disposition column is a pointer only.

| ID | Question | Options | Recommendation | Security implication | Product implication | Reversibility | MVP or future | Disposition |
|---|---|---|---|---|---|---|---|---|
| **FDR-1** | What are the exact trust-band names and membership thresholds (§6.3)? | (a) Founder names/defines bands directly; (b) Engineering proposes a specific 3-band structure for Founder countersignature, mirroring the `DEC-PROV-004`-point-7 "Anonymous/Authenticated/Verified" reference points reinterpreted as evidence-derived bands | (b) — smallest change from already-approved reference points, fastest path to unblock ITM-A | Low — bands are internal, not exposed | Medium — determines what "established" trust looks like to future risk-gated features | Reversible (band boundaries are a version-bumped derivation rule, not stored per-record weights) | MVP (blocks ITM-A) | **`AD-ITM-1` (§22): FULLY RESOLVED, Founder-countersigned 2026-08-16. Band model + MVP policy clarification approved in §6.6. Design decision resolved; ITM-A/ITM-C implementation remains separately unauthorized (fresh-authorization convention still required).** |
| **FDR-2** | Should a successful recovery-proof event (`AuthenticationRecoveryProofProvided`) count as neutral or cautionary trust input, given that account recovery is itself a moment of elevated fraud risk elsewhere in the industry? | (a) Neutral (no trust effect); (b) Cautionary (may not increase trust, may flag for future review-signal use) | (a) for MVP — avoids inventing an unreviewed fraud heuristic; revisit under **FDR-3** once regression/review policy exists | Medium — an unreviewed cautionary rule could be gamed or could unfairly flag legitimate recoveries | Low at MVP (no consumer acts on it yet) | Reversible | MVP-adjacent (affects ITM-C default, but not blocking ITM-A/B) | **`AD-ITM-2` (§22): Option A (neutral) APPROVED — resolved, Capability-2 MVP treatment.** |
| **FDR-3** | Should trust ever regress, and under what triggers (§8.3)? | (a) No regression at MVP — trust is monotonic non-decreasing until a future governed policy exists; (b) Define specific regression triggers now | (a) — regression policy is exactly the kind of "genuine product/policy decision" this document must surface, not silently choose; no fraud-signal source exists yet to trigger it responsibly | High if done wrong — a bad regression rule can unfairly restrict legitimate customers (false-positive impact, §11) | High — determines whether trust is a ratchet or a living state | Reversible now (deferring costs nothing); a later regression policy is itself reversible in principle but customer-impacting in practice | Future (not required for Capability-2 ITM-A/B/C MVP under Option A) | **`AD-ITM-3` (§22): Option A (no regression at MVP) APPROVED — resolved, MVP scope decision, not permanent.** |
| **FDR-4** | Should ITM eventually expose any trust-adjacent signal to internal operators (e.g., support tooling), and if so, gated by what permission? | (a) Defer entirely — no operator surface at MVP; (b) Define an operator read surface now, reusing `ENG-P2-004`'s permission model | (a) — no operator need has been demonstrated yet; inventing the surface speculatively risks exactly the "if a field is speculative, leave it out" anti-pattern this task warns against | Low-medium — an operator surface, if built carelessly, could leak internal risk scoring (Principle 10) | Low at MVP | Reversible | Future | **`AD-ITM-4` (§22): Option A (defer entirely) APPROVED — resolved.** |

None of FDR-1–FDR-4 authorizes engineering by itself — each still requires the fresh implementation authorization convention already established for `AUTH-*`/`ENG-P2-004*` packages before any ITM-A–D package may begin. **FDR-1/FDR-2/FDR-3/FDR-4 are all fully resolved (§22) — zero Founder decisions remain open in this design package.**

---

## 19. Capability-Closure Implications

Per Founder Decision **FD-1** (Capability 2 is the full capability) and **FD-4** (G2 sequencing correction), the governing sequence — once ITM eventually completes — is:

```
Customer Identity Complete
Authentication Complete
ENG-P2-004 Complete
ITM Complete
      ↓
G2 / Deployment / Preview Review / Manual QA   (a closure GATE — begins once the four concerns above are complete; does not itself require Capability 2 to already be closed)
      ↓
Capability 2 Complete
```

This document does not execute G2, does not close Capability 2, and does not mark ITM `Complete` or `In Progress` — it marks ITM **design now authorized**, moving it from "Not started — Unauthorised" to "Not started — design fully resolved; `FDR-1`/`FDR-2`/`FDR-3`/`FDR-4` all Founder-resolved (§22); zero remaining Founder decisions; implementation packages defined, none authorized to begin."

---

## 20. Explicit Exclusions

This document does not: implement any ITM code; implement or wire an authentication-event consumer; implement a risk-gate caller; modify TRD10, TRD11, or `firestore.rules`; authorize Capability 3; authorize `AUTH-10`; authorize G2/Release Readiness execution; invent a non-sensitive permission identifier; or reopen `ENG-P2-004`. `FDR-1`/`FDR-2`/`FDR-3`/`FDR-4` are all resolved (§22); **implementing ITM-A/B/C/D against any of the four remains separately unauthorized regardless** — design resolution is not implementation authorization.

---

## 21. Relationship to This Task's Constraints

Created under task `CAP-P2-ITM-DESIGN-001`, an explicit design/governance authorization that prohibits ITM runtime implementation, Capability 3 implementation, Release Readiness/G2 execution, `AUTH-10`, Firebase/deployment changes, and new permission identifiers. This document, the governance-currency reconciliation it accompanies (`CDR-001` §5, Engineering Implementation Programme, `documentation-changes-log.md`, `IMPLEMENTATION_CHANGES.md`), and no other files were touched to deliver it.

---

## 22. Founder Dispositions (Recorded 2026-08-16)

**Authority:** Founder, via task "CAP-P2-ITM-DESIGN-001 — Founder Disposition," 2026-08-16. Recorded here per this repository's established disposition convention (the same inline, dated, attributed pattern used in `ENG-P2-004-DESIGN-001` §17 for `AD-1`–`AD-5`) — **not** a new Decision Register (`DEC-*`) entry, and **not** a reopening of `DEC-IDENTITY-001`/`DEC-PROV-004`. This section is the authoritative disposition record for the four items originally raised in §18; §18 itself is preserved unmodified as history (its Disposition column added above is a pointer only, not a rewrite of the original analysis). The document body (§7, §8.2–§8.5, §11, §19, §20, and new §6.6) has been updated in place to reflect the governed outcome, not merely the recommendation.

### AD-ITM-1 — Trust-band names and membership thresholds (addresses FDR-1) — ~~PROVISIONALLY OPEN~~ **FULLY RESOLVED (Founder-countersigned, 2026-08-16)**

**Original process approval (preserved as history, not rewritten):** *"Approved: Option B (process only). Engineering shall propose the concrete MVP band structure and explicit evidence-based membership conditions for Founder countersignature. This does not yet constitute final approval of the actual band names or thresholds. `FDR-1` remains provisionally open until the concrete proposal is countersigned."* The concrete proposal, prepared per the Founder's ten stated constraints, was recorded in §6.6 — three discrete evidence-derived bands (`unverified` / `provisional` / `established`), no numerical score, grounded entirely in currently-available signals, no future-only signal made mandatory, no per-provider weighting, and a versioned-evolution mechanism (§6.6.2).

**[UPDATED 2026-08-16 — Founder countersignature, task "CAP-P2-ITM-DESIGN-001 — FDR-1 Founder Countersignature, Design Finalization, Final Review & Merge Gate"]** The Founder has reviewed and **countersigns** the §6.6 band model **with an MVP policy clarification**, now recorded in §6.6.3 (semantic boundary) and §6.6.4 (precise time semantics):

- The approved band model is exactly as proposed: `unverified` < `provisional` < `established`, determined by the highest satisfied condition (§6.6).
- The 30-day threshold is confirmed as a **Founder-approved MVP policy boundary** — explicitly **not** statistically validated, fraud-calibrated, externally benchmarked, evidence of financial reliability, evidence of low fraud risk, or stronger proof of identity ownership than Authentication itself provides (§6.6.3).
- The term `established` is confirmed **internal-only**, meaning precisely "established under the current MVP trust-evidence model" — and must **not** be read, documented, or coded as meaning verified legal identity, fraud clearance, financial credibility, customer quality, loyalty value, a risk-free account, eligibility for ordinary platform participation, or any customer-facing status/badge (§6.6.3).
- Derivation authority is confirmed: evidence (`signalState`), the current rule version, and current server time (for account age) are authoritative; `trustLevel` is derived state, never itself authoritative when stale (§6.6.1, §6.6.4). No scheduled transition event is required for the day-30 crossing.

**`FDR-1` is now fully resolved — no longer provisional.** Design countersignature does **not** itself authorize implementation: **ITM-A and ITM-C implementation remains separately unauthorized**, pending the fresh implementation-authorization convention already established for `AUTH-*`/`ENG-P2-004*` packages (§15, §18). ITM-B and ITM-D remain additionally blocked transitively (§15's dependency chain).

### AD-ITM-2 — Recovery-event trust treatment (resolves FDR-2)

**Approved: Option A — Neutral.** `AuthenticationRecoveryProofProvided` is ingested and retained as auditable trust evidence (`reasonReferences`, §5), but at Capability-2 MVP it:

- does **not** increase `trustLevel`;
- does **not** decrease `trustLevel`;
- does **not** reset trust (already a hard constraint per `ENG-P2-ARCH-001` §6, now additionally confirmed never to move `trustLevel` in either direction);
- does **not** independently trigger progression.

This is the Capability-2 MVP treatment. It may be reconsidered only under a future governed regression/fraud-policy decision (see `AD-ITM-3`) — not by a future engineer's unilateral reinterpretation of this document. §7 and §8.4 updated in place.

### AD-ITM-3 — Trust regression policy (resolves FDR-3)

**Approved: Option A — No regression at MVP.** For the Capability-2 ITM MVP, trust progression is **monotonic non-decreasing**. No downward-band transition, evidence-expiry regression, fraud-trigger regression, or suspension policy is authorized inside ITM-A–D.

**This is an MVP scope decision, not a permanent declaration** that trust can never regress. Regression must be reconsidered before a future risk-gated consumer requires it, and only once governed signals and policy exist. §8.3 and §8.5 updated in place.

### AD-ITM-4 — Operator visibility (resolves FDR-4)

**Approved: Option A — Defer.** No ITM operator/support trust-visibility surface is authorized for the Capability-2 MVP. Specifically prohibited without a separate governed decision: an operator endpoint; a support UI exposing trust state; exposing trust bands to staff; a new `ENG-P2-004` permission identifier for trust visibility; a trust-inspection role or permission.

A future demonstrated operational requirement may trigger a separately governed design and permission decision — this document does not pre-authorize one, and none of ITM-A–D's acceptance criteria (§15) require one. §11 updated in place.

### Summary — status after this disposition

| FDR | Disposition | Status |
|---|---|---|
| FDR-1 | `AD-ITM-1` — band model + MVP policy clarification, Founder-countersigned 2026-08-16 | **Fully resolved** — §6.6, §6.6.3, §6.6.4 |
| FDR-2 | `AD-ITM-2` — Option A (neutral) approved | **Resolved** |
| FDR-3 | `AD-ITM-3` — Option A (no regression) approved | **Resolved** (MVP scope, not permanent) |
| FDR-4 | `AD-ITM-4` — Option A (defer) approved | **Resolved** |

**Zero Founder decisions remain open in this design package.** `ITM-A/B/C/D implementation remains unauthorized` regardless — design resolution is not implementation authorization; each package still separately requires the fresh implementation-authorization convention already established for `AUTH-*`/`ENG-P2-004*` packages (§18's closing note, unchanged by this section). No Capability 3, `AUTH-10`, Firebase/deployment, or G2 work is authorized by this section.

---

## 23. Independent Final Consistency Review (2026-08-16)

Performed after `AD-ITM-1`'s countersignature, before recommending this design for Founder final review/merge, per task "CAP-P2-ITM-DESIGN-001 — FDR-1 Founder Countersignature, Design Finalization, Final Review & Merge Gate." Reviewed against `ENG-P2-ARCH-001`, `DEC-IDENTITY-001`, `DEC-PROV-004`, the Customer Identity trust-reference boundary, `AUTH-08`'s event contracts, `ENG-P2-004`'s permission boundary, Capability-2 closure requirements, the closed 14-category error taxonomy, and privacy/security requirements.

### A — Identity boundary

Verified: nothing in §2–§6.6 permits trust to create, merge, or split identity, or to replace authentication, or to become the identity identifier. §3.4 confirms Customer Identity holds only the opaque `trustRecordId` reference (§5); no field in §5 or §6.6 is read by Customer Identity code. **No violation found.**

### B — Authentication boundary

Verified: §7's signal table and §8.1 treat `CustomerAuthenticated`/`AuthenticationRecoveryProofProvided` strictly as signals, never as an authentication decision. §6.6.3 (new, this task) makes explicit that `established` must never be read as "proof of legal identity, fraud clearance, or financial reliability" stronger than Authentication itself already provides — directly satisfying this checkpoint by name. **No violation found.**

### C — Permissions vs. trust

Verified: §9's two-question framing ("Is this actor authorized by role/context?" vs. "Does trust evidence satisfy the risk requirement?") is unchanged by this task's dispositions and remains textually present and unmodified. No `AD-ITM-*` disposition touches `ENG-P2-004`'s boundary. **No violation found.**

### D — Standard participation

Verified: §10's "no global gate is permitted" rule and its explicit rejection of `if trustLevel < X → reject everything` are untouched by this task. §6.6.3 additionally reinforces that `established` must never be read as "eligibility for ordinary platform participation." Trust-gating remains opt-in per action (§9.1/§10). **No violation found.**

### E — Band model consistency

Verified against §6.6's conditions, applied to each required scenario:

| Scenario | Design outcome | Verified against |
|---|---|---|
| First `CustomerAuthenticated` evidence ingested | `hasSuccessfulAuthentication` becomes `true` → band is `provisional` (assuming `accountAgeDays < 30`) | §6.6 entry table; §8.2 |
| Account age < 30 elapsed days | Cannot produce `established` regardless of authentication evidence — `established`'s condition is a conjunction (`AND`), not satisfied by age alone or auth alone | §6.6 entry table; §6.6.4 boundary tests |
| Account age ≥ 30 elapsed days **and** `hasSuccessfulAuthentication == true` | `established` | §6.6 entry table; §6.6.4 |
| No authentication evidence at all, regardless of account age | `unverified` — age alone is never sufficient for `provisional` or `established` (both require `hasSuccessfulAuthentication == true` as a precondition) | §6.6 entry table (both non-`unverified` rows require the authentication condition) |
| Recovery event alone | Cannot cause progression — `AD-ITM-2` confirms strictly neutral, not a band-membership condition anywhere in §6.6 | §6.6 exclusions list; §22 `AD-ITM-2` |
| Provider type (Google/Email/Phone OTP) | Does not alter band — §6.6's `hasSuccessfulAuthentication` condition is provider-agnostic by design, explicitly reasoned in §6.6 ("no per-provider weighting is proposed") | §6.6 |
| Downward transition | Does not exist at MVP — `AD-ITM-3` (§22) and §8.5 both confirm monotonic non-decreasing; §6.6's progression rules state "no band ever moves downward at MVP" | §6.6; §8.3; §8.5; §22 |

The model is deterministic: given a fixed `signalState` and a fixed current time, exactly one band is produced by the highest-satisfied-condition rule (§6.6, "no band is assigned by weighting or accumulation"). **No inconsistency found.**

### F — Time / account-age semantics

§6.6.4 (added by this task) now defines `accountAgeDays` precisely as `floor((currentServerTime − registeredAt) / 86400 seconds)` — elapsed 24-hour periods from the authoritative `Registered` timestamp, not calendar-month arithmetic — and specifies the three required deterministic boundary behaviors (`accountAgeDays` = 29 / 30 / 31). This satisfies the Founder's instruction to define the threshold "precisely enough for implementation" without writing implementation code. **Satisfied.**

### G — Derived state

§6.6.1 (unchanged by this task, already present from the prior countersignature-pending draft) already states `trustLevel` is "derived state, not authoritative-when-persisted" and must be recomputed at read time; §22's `AD-ITM-1` finalization restates this as "Derivation Authority" — evidence, rule version, and current time are authoritative, `trustLevel` is derived. No design text anywhere treats a persisted `trustLevel` value as overriding current evidence. **No violation found.**

### H — Event idempotency

§7.1 (unchanged) requires ingestion to be idempotent on `eventId`, commutative/order-independent (`signalState` fields as "has this fact ever been true," not sequence-dependent), and to satisfy a replay-determinism property. ITM-B's acceptance criteria (§15, updated by this task) now explicitly require a duplicate-delivery test and an out-of-order-delivery test. **Satisfied** — no implementation performed, design requirement is explicit.

### I — Privacy / fairness

Verified against §11 (unchanged in substance, `AD-ITM-4` applied in place) and §6.6.3 (new): no protected/demographic attribute is used anywhere in the band model (§7's signal table lists only authentication-event and account-age facts); no customer-visible social score exists (`trustLevel` is internal-only, §6.6.3); no hidden behavioral-penalty model exists (`AD-ITM-3` — no regression at MVP, so no penalty mechanism exists to hide); no arbitrary numerical weight is used anywhere (§6.6's conditions are boolean conjunctions, not weighted sums, per §6.4's original rejection of numeric scoring); no speculative fraud inference is made (§6.6.3 explicitly disclaims "fraud clearance" as a meaning of `established`). **No violation found.**

### J — Future evolution

§6.6.2 (unchanged) confirms threshold/band changes require only a version-bumped derivation-rule change against already-stored `signalState` — no Customer Identity rebuild, no identity-ID change, no merge/split. This is structurally guaranteed by `trustLevel` never being authoritative-when-persisted (§6.6.1/§G above) — there is nothing in Customer Identity or the identity ID that a trust-rule change could ever need to touch. **Satisfied.**

### K — ITM-A/B/C/D decomposition

Re-confirmed and refined in §15 (updated by this task) with explicit responsibility, dependency, and acceptance-boundary clarifications matching the Founder's stated minimum: ITM-A holds contracts only (no progression engine); ITM-B owns persistence and the AUTH-08 idempotent ingestion boundary; ITM-C owns deterministic derivation, the §6.6.4 account-age semantics, recovery-neutral behavior, and monotonic progression; ITM-D owns the risk-gate read contract and concern-closure validation. No boundary change was needed beyond confirming and citing the now-resolved dispositions — the original decomposition (proposed before countersignature) already implied this exact split. **Confirmed, refined in place, no restructuring required.**

### L — Capability-2 closure sequence

§19 (unchanged in structure) still states: Customer Identity Complete → Authentication Complete → `ENG-P2-004` Complete → ITM Complete → G2/Deployment/Preview Review/Manual QA → Capability 2 Complete. This task does not alter that sequence, does not mark ITM `Complete`, and does not touch Capability 3 (§20's exclusions, updated in place, still list "authorize Capability 3" among what this document does not do). **Confirmed unchanged.**

### M — Stale references / decision completeness

Full-document search performed for: "pending FDR-1," "pending Founder guidance," "illustrative... bands," "thresholds TBD," "recovery classification TBD," "regression undecided," "operator visibility undecided," "Founder decisions remain open," "not yet approved," "awaiting Founder," "provisionally open," and similar phrasing.

**One genuinely stale reference found and corrected** (not introduced by this task's own dispositions, but discovered during this review): §6.3's original text read "See Founder Decision **FDR-1** in §17" — a leftover from a pre-renumbering draft; §17 is "Acceptance Criteria," not the Founder Decisions section (§18). Corrected to point to §18 (original framing) and to §6.6/§6.6.3–§6.6.4/§22 (the now-resolved outcome).

All other historical "not decided by this document" / "not designed by this document" phrasing found (e.g., §6.3's own preserved original sentence, §18's preserved original table) is **intentionally retained** per this repository's disposition convention — it describes what was true *when originally written*, and is superseded, not deleted, by the dated `AD-ITM-*` updates layered on top of it (§7, §8.2–§8.5, §11, §15, §18's Disposition column, §22). No further stale references found. **No historical analysis was removed.**

### Review outcome

No contradiction, circularity, or governed-principle violation was found. All thirteen items (A–M) checked pass. The design is internally consistent and fully resolved.
