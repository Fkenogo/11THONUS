> **Title:** ENG-P2-ARCH-001 — Customer Identity Architecture Definition
> **Version:** 1.0 · **Status:** Architecture definition — approved for reference, not implementation authorization · **Classification:** Working (execution-layer architecture record)
> **Governing document:** [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-IDENTITY-001`; [`CDR-001` Capability 2](CDR-001-capability-delivery-roadmap.md#capability-2--customer-identity); PRD2; TRD10; TRD12
> **Source-of-truth path:** `docs/05-implementation/roadmap/ENG-P2-ARCH-001-customer-identity-architecture.md`
> **Last controlled update:** 2026-08-02 (`ENG-P2-ARCH-001` — created)

# ENG-P2-ARCH-001 — Customer Identity Architecture Definition

**This document defines architecture only. It authorizes no implementation.** No production code, database schema change, API, UI, authentication mechanism, or trust logic is created or modified by this document. It is the reference future `ENG-P2-001` decomposition tasks (identity, authentication, ITM implementation prompts) must conform to — analogous in role to the [ENG-P1-002](../prompts/ENG-P1-002-engineering-blueprint-2026-07-25.md)/[ENG-P1-003](../prompts/ENG-P1-003-engineering-blueprint-2026-07-26.md) Engineering Blueprints for their respective work packages.

## 1. Purpose

`DEC-IDENTITY-001` separated Customer Identity, Authentication, and Identity Trust Management (ITM) into independent architectural concerns within Capability 2 (`IDENTITY-ALIGN-001`, 2026-08-01). That realignment restructured the *roadmap and governance* layer. It did not define the *engineering* shape of the Customer Identity concern itself — the aggregate boundary, lifecycle states, loyalty-number/QR lifecycles, recovery behavior, and the precise relationship contracts to Authentication and ITM. This document closes that gap.

## 2. Identity Aggregate

The Identity Aggregate is the permanent, authentication-independent representation of a customer. It is the "Customer Identity" concern named in `DEC-IDENTITY-001` and `CDR-001` §5.

| Field | Description | Source |
|---|---|---|
| **Internal Customer ID** | Immutable, globally unique, never exposed publicly. Primary identifier of the aggregate. | PRD2 §4 Identity 1; TRD10 `users.id` |
| **Loyalty Number** | Public, permanent, unique, quotable/printable/shareable, linked to exactly one customer. The customer-facing identity. | PRD2 §4 Identity 2, §8; TRD10 `customerProfiles.loyaltyNumber`; `DEC-ID-001`; `DEC-DATA-007` (generation algorithm) |
| **QR Identifier** | Represents the Loyalty Number for scan-based lookup; never exposes confidential data. | PRD2 §4 Identity 3, §9; TRD10 `customerProfiles.qrReference` |
| **Profile** | Name, display name, photo, country, language, notification preferences. Mutable, non-identity data. | PRD2 §4 Identity 5, §10; TRD10 `customerProfiles` |
| **Status** | The Identity Lifecycle state (§3) — a property of the aggregate itself, not of any authentication provider or trust signal. | This document §3 |
| **Trust references** | A pointer to the ITM-owned trust record for this identity (verification state, trust level, trust-progression signals). The Identity Aggregate holds a *reference*; it does not own or compute trust. | `DEC-IDENTITY-001` Progressive Trust Principle; §7 below |
| **Authentication references** | Pointers to the one or more linked authentication-provider credentials (Firebase `authUid`(s)) resolving to this identity. The Identity Aggregate holds *references*; it does not own authentication. | TRD12 §12.5 Account Linking, §12.6 `AIR-001`; §6 below |

**Explicitly excluded from the Identity Aggregate** (per `DEC-IDENTITY-001`'s Identity Principle): authentication credentials, provider tokens, OTP secrets (these remain in Firebase Authentication per TRD10 §10.6.1's existing Rules — "Firestore shall not store passwords, OTP secrets or provider tokens"); verification state and trust level (owned by ITM, §7); role/permission context (owned by the separate role-context concern, `ENG-P2-004`, `DEC-ID-003` — out of scope for this document).

**Note on "Authentication Identity" (PRD2 §4 Identity 4):** PRD2 names this a fifth identity component. Under this architecture it is reclassified as an *authentication reference* on the Identity Aggregate, not a sixth co-equal identity of the customer — consistent with `DEC-PROV-004` point (2), "authentication methods are independent mechanisms used to access the same customer identity." PRD2's own text is not contradicted (it already states "used only for account access... never used publicly"); this document makes the aggregate-boundary consequence explicit for engineering purposes.

## 3. Identity Lifecycle

```
Guest → Registered → Active → Dormant → Recovered → Closed
                         ↕
              (Suspended / Locked — orthogonal
               security states, not shown inline)
                         ↓
                      Archived (terminal, post-Closed)
```

The task-specified six states are a **trust/continuity lifecycle** — they describe whether an Identity Aggregate exists and is in continuous, interrupted, or terminated use. They are distinct from, and layered against, the **operational/security states** already defined in PRD2 §7 (`Suspended`, `Locked`) and TRD10 `users.status` (`suspended`, `locked`) — those are risk-response states that can interrupt `Active` or `Dormant` without ending the identity lifecycle itself. `Archived` (PRD2 §7, TRD10) is the terminal retention state reached after `Closed`, not a parallel lifecycle state.

| State | Definition | Transition in | Transition out |
|---|---|---|---|
| **Guest** | No Identity Aggregate exists. An unauthenticated visitor browsing the platform. Per `DEC-IDENTITY-001`'s Authentication Principle, browsing never requires authentication or identity. | — (initial state) | Registration (PRD2 §5 Steps 1–3) completes → **Registered** |
| **Registered** | The instant the Identity Aggregate is created — Internal Customer ID, Loyalty Number, and QR Identifier all assigned (PRD2 §5 Step 4). Momentary/transitional: per `DEC-IDENTITY-001`'s Standard Participation Principle, there is no gating step between identity creation and full participation. | PRD2 §5 Step 4 (account + identity created) | Immediately → **Active** (no intermediate approval or verification gate) |
| **Active** | Steady-state: the customer has a permanent identity and is transacting or eligible to transact — participating in Reward Programs, earning, redeeming, recovering — without any verification precondition for standard participation. | From **Registered** immediately; from **Dormant** on renewed activity; from **Recovered** on recovery completion | Extended inactivity → **Dormant**; customer-requested closure → **Closed**; risk-triggered restriction → **Suspended**/**Locked** (orthogonal, returns to **Active** on resolution) |
| **Dormant** | The identity exists and is fully intact (loyalty number, QR, history, rewards all preserved) but has had no customer-initiated activity for a platform-defined period. Not a restriction — a dormant identity may resume activity at any time without recovery. **New state — not yet present in TRD10 `users.status` or PRD2 §7; a downstream schema/product task must add it (§10).** | Extended inactivity from **Active** | Renewed activity → **Active** directly (no recovery step required, since access was never lost — only unused) |
| **Recovered** | Transitional state entered only via the Identity Recovery process (§6) — used when the customer has lost access to their authentication credential and must reprove ownership of an existing identity. Distinct from Dormant: Dormant means "inactive but reachable"; Recovered means "was unreachable, ownership just reproven." | Identity Recovery process completes (TRD12 §12.30–31; `DEC-SEC-001` Identity Recovery Principles) | Recovery finalized (new/updated authentication reference linked, prior sessions revoked) → **Active** |
| **Closed** | Customer-requested or administrative closure. Identity Aggregate fields (Internal Customer ID, Loyalty Number, QR, history) are retained, not deleted, per PRD2 §25 and data-retention policy. | Customer request (PRD2 §25) or administrative action | Retention period elapses → **Archived** (terminal) |

**Reconciliation with existing operational states:** `Suspended` and `Locked` (PRD2 §7, TRD10 `users.status`) are security/risk-response states that can apply while the identity is `Active` or `Dormant` — they restrict *access* (an Authentication-layer concern) without changing the underlying identity lifecycle. This matches `DEC-IDENTITY-001`'s separation: a suspension is an authentication/access decision, not an identity-existence decision. `Archived` is not a parallel state to the six above — it is what `Closed` becomes after the retention period, matching PRD2 §7's existing definition exactly.

## 4. Loyalty Number Lifecycle

| Phase | Definition |
|---|---|
| **Generation** | Assigned once, at `Registered` (§3), by the generation algorithm confirmed under `DEC-DATA-007` (opaque, checksum-deferred format). Never assigned before an Identity Aggregate exists (no pre-allocation, no reservation for Guests). |
| **Uniqueness** | Enforced platform-wide at generation time; collision handling per `DEC-DATA-007`'s confirmed transactional-uniqueness approach. |
| **Permanence** | Immutable for the life of the identity — survives phone changes, email changes, profile updates, authentication-provider changes, and Identity Recovery (PRD2 §8, §21–22; TRD12 `AIR-003`). Never regenerated as part of normal use. |
| **Replacement rules** | Not a normal operation. The only circumstance under which a Loyalty Number would be replaced is an exceptional administrative action (e.g., confirmed fraud investigation requiring identity separation) — out of scope for standard engineering flows and not designed by this document; flagged as a future policy decision if the need arises, not assumed to exist. |
| **Retirement** | On `Closed` → `Archived`, the Loyalty Number is retired with the identity — it is never reassigned to a different customer, matching PRD2 §8's "never be reused." |
| **Restoration** | Identity Recovery (§6) restores the *same* Loyalty Number to the *same* Identity Aggregate — recovery never generates a new number, per `DEC-SEC-001` Identity Recovery Principle 3 ("recovery must never create a duplicate account"). |

## 5. QR Lifecycle

| Phase | Definition |
|---|---|
| **Generation** | Created alongside the Loyalty Number at `Registered`, encoding a reference to it (PRD2 §9). One QR per identity at any given time. |
| **Regeneration** | Customer-initiated re-issuance of the QR *encoding* (e.g., if a printed/shared QR image is considered compromised). The underlying `qrReference`/Loyalty Number relationship is unchanged — regeneration produces a new scannable artifact for the same permanent identity, not a new identity. |
| **Replacement** | Same operation as regeneration from the identity's perspective — the customer replaces their presented QR image; the Identity Aggregate is untouched. |
| **Invalidation** | A prior QR image ceases to resolve successfully once regeneration completes — old codes must fail closed, not silently continue to work (a security requirement for the future implementation, not designed here). |
| **Recovery** | Identity Recovery (§6) restores QR scannability for the recovered identity — either by confirming the existing QR still resolves, or by triggering regeneration if the recovery context implies the prior QR may be compromised. Never creates a QR for a new identity. |

## 6. Identity Recovery

Recovery restores an existing Identity Aggregate; it never creates a replacement one (`DEC-SEC-001` Final Decision, "Identity Recovery" clause). Per the Decision Register's 8 Identity Recovery Principles (`DEC-SEC-001`) and TRD12 §12.30–31:

Recovery restores: **history**, **purchases**, **rewards**, **loyalty number**, **QR**, and **trust state** (the trust *reference* is preserved — ITM's own trust record is not reset by recovery; see §7).

- Identity belongs to the customer, never to the authentication provider (Principle 1) — consistent with Authentication being a reference on the aggregate, not its owner (§6 below).
- Recovery restores the *same* customer identity (Principle 2); must never create a duplicate account (Principle 3).
- Loyalty participation continues across recovery (Principle 4) — no reset of progress, cycles, or rewards.
- Verification requirements for the recovery process itself increase progressively according to risk (Principle 5) — an ITM/risk-gating concern (§7), not an Identity Aggregate concern.
- Recovery should be completable independently by ordinary users where risk allows (Principle 6); every recovery action must be auditable (Principle 7).
- Some protected capabilities may require verified identity even if earlier platform use did not (Principle 8) — again a risk-gating (ITM) concern layered on top of, not inside, the Identity Aggregate.
- Mechanically: TRD12 §12.31 (Lost Phone Number) — attempt recovery via linked email/provider, verify via approved support process, update the authentication reference, **retain the same platform user and loyalty number**, revoke prior sessions, record a security event. This is the concrete instance of the `Recovered` lifecycle state (§3).

## 7. Authentication Relationship

**Authentication provides access. Authentication does not own identity.**

- The Identity Aggregate holds one or more Authentication references (Firebase `authUid` values); it is never itself keyed by, or defined in terms of, any single authentication credential (`DEC-PROV-004` points 1–4).
- All supported providers (phone OTP, email, Google Sign-In, future providers) are equal — none is primary, none is the customer's identity (TRD12 §12.4.1, corrected under `IDENTITY-ALIGN-001`).
- Multiple linked providers resolve to the same Identity Aggregate (Account Linking, TRD12 §12.5) — linking must never create a second Identity Aggregate for the same customer.
- Browsing requires no authentication (**Guest**, §3); authentication is required only for identity-protected actions (`DEC-PROV-004` points 5–6).
- A successful authentication event does not, by itself, change the Identity Aggregate's lifecycle state beyond what §3 already defines (e.g., it does not advance `Dormant` → `Active` merely by a background token refresh — only customer-initiated activity does).

## 8. Identity Trust Management (ITM) Relationship

**Trust strengthens identity. Trust never creates identity.**

- ITM (internal-only, never customer-facing — `DEC-IDENTITY-001`) owns the trust *record*: verification state (phone/email/future), trust level, and the continuous trust-progression signals (`DEC-PROV-004` point 7 — account age, purchase history, device history, merchant history, and future signals).
- The Identity Aggregate holds a Trust reference to this record; it never computes or stores trust logic itself (§2).
- Trust progression can never retroactively create, merge, or split an Identity Aggregate — it only changes what risk-gated actions the existing identity is permitted to take (`DEC-IDENTITY-001` Risk-Based Verification Principle).
- Verification (a signal ITM consumes) is not identity and is not authentication — it is one input to trust level, exactly as `DEC-IDENTITY-001` separates the three concerns.

## 9. Capability Relationship Model

```
Customer Identity  →  Authentication  →  Identity Trust Management  →  Reward Engine  →  Recognition  →  Future capabilities
   (this document)      (§7 boundary)         (§8 boundary; ITM)       (Capabilities        (Capability      (Capabilities
                                                                         4–5: Purchase,        6: On Us         7–9: Business
                                                                         Loyalty)              Moments)         Ops, Platform
                                                                                                                 Ops, Optimisation)
```

- **Customer Identity → Authentication:** every authenticated action resolves through an Authentication reference back to exactly one Identity Aggregate (§6).
- **Authentication → ITM:** authentication events (e.g., a verified phone sign-in) are one of several signals ITM consumes to progress trust level (§7, §8) — authentication does not gate identity, but successfully verifying via a provider is trust-relevant input.
- **ITM → Reward Engine:** the Reward Engine (Reward Program, Purchase, Loyalty domains — `CDR-001` Capabilities 4–5) may consult ITM's trust level only for specifically risk-gated actions (per `DEC-IDENTITY-001`'s Risk-Based Verification Principle examples — large redemptions, account-ownership changes); it never consults ITM to determine whether standard participation (earning, redeeming the standard reward) is permitted, since Standard Participation is identity-gated only, not trust-gated.
- **Reward Engine → Recognition:** On Us Moments and redemption history (`CDR-001` Capability 6) reference the same permanent Identity Aggregate (Loyalty Number) throughout — recognition is never authentication- or trust-state-dependent.
- **→ Future capabilities:** Business Operations, Platform Operations, and Platform Optimisation (`CDR-001` Capabilities 7–9) consume the Identity Aggregate read-only (e.g., reporting by loyalty number) and do not participate in the identity/authentication/trust boundary directly.

## 10. Downstream Engineering Dependencies (identified, not redesigned)

| Task / area | Dependency on this architecture |
|---|---|
| `ENG-P2-001` (future decomposition) | Must implement the Identity Aggregate (§2), Lifecycle (§3), and the Authentication/ITM boundary contracts (§7–§8) as separate services/modules, not one conflated implementation |
| `ENG-P2-004` (role/permission resolution) | Consumes the Identity Aggregate's Internal Customer ID as its subject; unaffected by, but sequenced after, Identity existing |
| A future Authentication-provider design task | Must implement the reference-only relationship in §7 — providers resolve to, never define, the Identity Aggregate |
| A future ITM design task | Must implement the trust-record/reference split in §8, and the continuous trust-progression model (`DEC-PROV-004` point 7) |
| A future TRD10 schema-design task | Must add: a `dormant`/`recovered`-capable status representation reconciling with the existing `users.status` enum (§3); trust-reference and authentication-reference fields; no `phoneVerified`-as-identity field (already-flagged gap from `IDENTITY-STRATEGY-001`) |
| `ENG-P4-001`–`ENG-P8-002` (Reward Program through Redemption, `CDR-001` Capabilities 4–6) | Must resolve every purchase/progress/reward record against the permanent Loyalty Number (§4), never against an authentication credential or trust level |
| A future Identity Recovery implementation task | Must implement §6 exactly — restore, never duplicate; trust state preserved, not reset |
| A future QR-regeneration implementation task | Must implement §5's invalidation requirement (old codes fail closed) |

## 11. Validation Results (7 required points)

1. **Identity consistency:** the Identity Aggregate (§2) and Lifecycle (§3) are consistent with `DEC-ID-001` (one portable, permanent identity) and PRD2's identity components — no contradiction found; PRD2 Identity 4 reclassified as an Authentication reference, explained in §2, not silently changed.
2. **Constitutional consistency:** every boundary defined (§6–§8) traces directly to `DEC-IDENTITY-001`'s principles and the amended `DEC-PROV-004`/`DEC-SEC-001` text — no new constitutional claim was invented.
3. **Capability consistency:** §9's model maps onto `CDR-001`'s existing, unrenumbered capability sequence (Capability 2's three concerns, then Capabilities 4–9) without introducing a new capability number.
4. **Engineering consistency:** §10's dependency list matches the current Engineering Implementation Programme's `ENG-P2-001`/`ENG-P2-004` scope and the Capability Authorisation Gate; no work-package status was changed.
5. **No implementation introduced:** this document contains no code, no schema migration, no API contract, no UI, no authentication or trust logic — architecture description only.
6. **Cross-reference integrity:** all links point to already-existing sections in the Decision Register, `CDR-001`, PRD2, TRD10, and TRD12, verified live before citing.
7. **Traceability:** every lifecycle state, loyalty-number rule, QR rule, and recovery principle is sourced to a specific governing document/decision, not asserted independently.

## 12. Relationship to This Task's Constraints

Created under an explicit constraint set prohibiting production code, database implementation, API implementation, UI implementation, authentication implementation, and trust implementation. No file other than this one, and two single-line cross-references (§13), was touched.
