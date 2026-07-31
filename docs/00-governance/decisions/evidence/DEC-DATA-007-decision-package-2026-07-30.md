> **Title:** DEC-DATA-007 Decision Package — Loyalty Number and QR Generation
> **Version:** 1.0 · **Status:** Prepared for Engineering Lead consideration — NOT recorded, NOT approved
> **Task:** `RES-006` (Capability 2 Resolution Sprint, `ENG-P2-RES-000`)
> **Source-of-truth path:** `docs/00-governance/decisions/evidence/DEC-DATA-007-decision-package-2026-07-30.md`
> **Prepared:** 2026-07-30

---

## 1. Executive Summary

This package prepares — it does **not** record or approve — `DEC-DATA-007` ("Loyalty number and QR reference generation"), using `RES-005`'s completed [Dependency & Scope Analysis](DEC-DATA-007-dependency-scope-analysis-2026-07-30.md) as the authoritative scope boundary. It reviews the existing `loyalty-code-decision-brief.md` against the now-confirmed `DEC-PROV-004`, `DEC-SEC-001`, and `DEC-ID-003`, finds no conflict, and recommends **formally adopting the brief's core proposal** (format `ABC-234`, transactional uniqueness with retry-on-collision, immutable per-platform-user assignment), while identifying one genuinely open sub-choice (QR payload: plain reference vs. signed token) and two minor refinements (idempotency framing; character-set alphabet selection).

**No Founder review package is prepared.** Per `DEC-DATA-007`'s own Register entry and the Resolution Plan's Ownership Matrix (`RES-007`: Owner = Engineering Lead, no Founder decision required), and per this task's own instruction to prepare a Founder package only if a new constitutional or commercial policy issue is uncovered — none was. **Decision readiness: Ready for Engineering Lead decision** — see §13.

## 2. Pre-Change Analysis

*(Required "Before Making Changes" findings, reproduced here for the permanent record.)*

**Alignment of the existing brief with current repository decisions:** `loyalty-code-decision-brief.md` was authored 2026-07-17, before `DEC-PROV-004`, `DEC-SEC-001`, and `DEC-ID-003` were confirmed. Checked against all three: the brief's content operates entirely on customer-facing identifier format and generation mechanics (PRD2 §8–9, TRD12 §12.42–12.43 territory) and never touches authentication mechanism, identity recovery, trust level, or business-role permissions. No conflict, contradiction, or overlap was found with any of the three confirmed decisions.

**What requires confirmation:** the brief's core proposal — format (`ABC-234`, optional `ABC-234-X` checksum variant), transactional uniqueness checking with automatic retry-on-collision, and immutable per-platform-user assignment — is well-evidenced but has never been formally adopted through the Decision Update Procedure.

**What requires refinement:** (a) the idempotency framing carried forward from `RES-005` — corrected there from "invoked exactly once" to the accurate invariant, restated in §10 below; (b) selection between the brief's own two presented character-set alternatives (excluding `I`/`O` only, vs. also excluding `S`/`B`) — both viable, no repository evidence favors one over the other.

**What remains genuinely unresolved:** the QR payload sub-choice — plain opaque reference vs. signed lookup token — which TRD12 §12.42 permits either way and which the brief itself (§7.8, §8) leaves open.

## 3. Engineering Problem Statement

`DEC-DATA-007` exists to answer: **what is the concrete loyalty-number format and generation algorithm, and what is the concrete QR payload scheme, that together satisfy the repository's pre-existing constraints (opaque, non-sequential, non-revealing, non-authenticating, permanent, collision-resistant) and can be implemented by a future generator service?**

Per `RES-005` §3–§4, this is a narrow, self-contained engineering question with no Founder-level identity/trust/permission dimension, notwithstanding its sequencing role alongside three Founder-level decisions in the Capability Authorisation Gate.

## 4. Existing Repository Position

Reconfirmed directly from `RES-005`'s analysis, not re-derived:

- **Already settled, not reopened here** (per `RES-005` §5 "Already Resolved"): permanent/unique/non-reused loyalty number; no registration-date/country/sequence disclosure; not a secret, never authenticates; survives phone/email changes and recovery; QR contains no phone/email/credentials/profile/document-path; generation happens after canonical identity (Identity 1) resolution.
- **Register entry (live, unchanged by this package):** `Category: Data · Status: OPEN_ENGINEERING · Priority: D1`; `Founder decision required: No · Decision owner: Engineering Lead`; `Options identified: to be proposed` (stale relative to the brief — `RES-005` §6, finding 4).
- **Two inherited constraints from the now-confirmed decisions** (`RES-005` §4.1–4.2): issuance-timing precondition from `DEC-PROV-004`; permanence-through-recovery from `DEC-SEC-001`. No relationship to `DEC-ID-003`.

## 5. Review of the Current Loyalty-Code Decision Brief

`docs/00-governance/decisions/loyalty-code-decision-brief.md` is a mature, decision-preparation-only document (explicitly "not approved," has never modified the Register). Its content, verified section by section against the now-confirmed constraints:

- **§2 Format proposal** (`ABC-234`, optional `ABC-234-X`): satisfies "opaque, non-sequential, non-revealing" (PRD2 §8) and "easy to quote verbally... permanent... independent of registration order" (its own §3, itself derived from PRD2/AIR-003). No conflict with `DEC-PROV-004`/`DEC-SEC-001`/`DEC-ID-003`.
- **§4 Character-set analysis** (ambiguity-reduced alphabets): a readability optimization, not a governance question — presents two viable alternatives without resolving between them (see §11 below).
- **§5 Capacity analysis** (exact collision-probability table across five customer-count scenarios, with a future-scaling note tied to PRD0 §8's Burundi-launch and regional-expansion figures): quantitatively grounded, not qualitative guesswork. Directly answers `RES-005`'s "collision-handling strategy" prerequisite.
- **§6 Security/privacy boundaries**: restates AIR-005/AIR-006, TRD12 §12.42/§12.43, and TRD22 Phase 14's enumeration-control deliverable — no new claim, correct restatement of already-confirmed constraints.
- **§7 Generation requirements** (ten planning-level items: server-side generation, transactional uniqueness, retry-on-collision, normalized storage, immutable assignment, non-reuse on closure, QR linkage, audit logging, safe lookup): consistent with `ENG-P1-002`'s already-implemented idempotency-service and audit-logging patterns; introduces no new architecture.
- **§8 Explicit non-scope** (no generator implementation, no Register modification, no checksum algorithm selection, no final character-set choice): matches this package's own constraints exactly — the brief was already scoped correctly for a decision-preparation document.
- **§9 Recommended next step**: recommends Founder+Engineering Lead review "because of the code's permanence, customer-facing visibility, and brand relevance" but explicitly states this is **not mandated** — "Because `DEC-DATA-007` is formally an Engineering-owned decision... the Engineering Lead may resolve it directly." This package's own finding (§1, §13) is consistent with that non-mandatory framing: no new evidence surfaced here elevates this to a required Founder decision.

**Conclusion: the brief is sound, evidence-grounded, and requires no material correction — only formal adoption plus resolution of the one open sub-choice identified in §11.**

## 6. Engineering Options

The brief itself presents no competing end-to-end alternative to evaluate against — it is a single coherent proposal, not a multi-option menu, except for the two narrow sub-choices below. Per this task's own instruction ("Engineering options (if alternatives remain)"), only the genuinely open sub-choices are treated as options; the brief's core proposal is not re-litigated into artificial alternatives.

### Sub-choice A — QR payload: plain opaque reference vs. signed token

- **Option A1 — Plain opaque reference.** The QR encodes a random, unguessable reference string (e.g., the loyalty code itself or a separate opaque ID) that a scanning business looks up directly. Simpler to implement; no cryptographic signing/verification step; relies entirely on server-side rate-limiting (TRD12 §12.42/§12.43, already-confirmed) to resist enumeration.
- **Option A2 — Signed token.** The QR encodes a token cryptographically signed by the platform, verifiable without a database round-trip before lookup (useful for partial offline validation, per PRD2 §9's "work offline where practical"). Adds implementation complexity (signing key management, token expiry/rotation policy) for a benefit (offline partial validation) the MVP's own constraints do not clearly require — PRD2 §9 says QR should "work offline where practical," not that it must support full offline verification.

### Sub-choice B — Character-set alphabet

- **Option B1 — Exclude `I`, `O` only** (brief §4, "recommended"): codespace 7,077,888 (24 letters × 8 digits × 3+3 format). Higher capacity, still removes the primary ambiguity pair.
- **Option B2 — Exclude `I`, `O`, `S`, `B`** (brief §4, conservative alternative): codespace 5,451,776. Lower capacity, removes a secondary market/font-dependent ambiguity pair.

## 7. Trade-off Analysis

| Sub-choice | Option | Complexity | MVP fit (PRD0 §8 scale) | Repository-evidence support |
|---|---|---|---|---|
| A — QR payload | A1 Plain reference | Low | High — no cryptographic infrastructure needed at launch | TRD12 §12.42 permits either; PRD2 §9 does not require full offline verification |
| A — QR payload | A2 Signed token | Moderate–High | Low for MVP — adds key-management surface with no MVP-stage requirement driving it | TRD12 §12.42 permits either; brief's own §8 leaves this open, not decided |
| B — Character set | B1 Exclude I/O | Low | High — larger codespace, lower future-scaling pressure per brief §5's own table | Brief's own "recommended" framing (§4) |
| B — Character set | B2 Exclude I/O/S/B | Low | Adequate — smaller codespace, marginally lower ambiguity risk | Brief presents as viable alternative, not primary recommendation |

**Reading the table:** for Sub-choice A, nothing in the confirmed repository evidence requires signed-token complexity at MVP scale — TRD22 Phase 14's enumeration-control deliverable and TRD12's rate-limiting requirement already provide the abuse-resistance a plain reference needs. For Sub-choice B, the brief's own recommendation (exclude `I`/`O` only) is not contradicted by any evidence and preserves more codespace headroom against the brief's own §5 future-scaling note.

## 8. Recommended Engineering Direction

**Recommended: formally adopt `loyalty-code-decision-brief.md`'s core proposal (format, generation requirements, collision handling) as drafted, resolve Sub-choice A in favor of Option A1 (plain opaque reference), and resolve Sub-choice B in favor of Option B1 (exclude `I`/`O` only, the brief's own recommendation).**

**Basis:** the brief's core proposal is already evidence-grounded and uncontested by any of the three now-confirmed decisions (§5). Option A1 avoids introducing cryptographic-signing infrastructure the MVP's own constraints (PRD0 §8 scale, PRD2 §9's "where practical" offline language) do not require, consistent with this repository's general MVP-minimization pattern (PRD2 §6's "MVP should minimise registration friction"). Option B1 is the brief's own recommendation and is not contradicted by any evidence; it preserves the larger codespace, which the brief's own §5 table shows matters more at regional-expansion scale than the marginal ambiguity reduction Option B2 would add.

## 9. Identifier Generation Principles

Restated from the brief (§3, §7) and the now-reconfirmed dependency constraints (`RES-005` §4), as the principles a future generator service must implement:

1. Generated server-side only (consistent with DA-006, already-confirmed).
2. Randomly allocated within the chosen codespace (§8 above); never sequential, timestamp-derived, or otherwise order-revealing.
3. Permanent for the life of the customer account; never regenerated, rotated, or reissued — including during authentication recovery (`DEC-SEC-001`'s Identity Recovery Principles, `RES-005` §4.2; AIR-003).
4. Assigned only after canonical identity (Identity 1) resolution (`DEC-PROV-004`, `RES-005` §4.1) — never as part of resolving identity itself.
5. Case-insensitive, normalized to one canonical stored form; display formatting (hyphenation) applied only at render time.
6. Retired, never reassigned, if an account closes (consistent with the platform's general "nothing commercial is silently deleted" principle, already-confirmed elsewhere in the repository).
7. Every generation event audit-logged (consistent with the platform-wide accountability principle, already-confirmed).

## 10. QR Generation Principles

1. Encodes only a reference to the loyalty code (Option A1, §8 above) — never the code's underlying data, never personal information (TRD12 §12.42, already-confirmed).
2. Never contains phone number, email, authentication credentials, full profile, or a direct Firestore document path (TRD12 §12.42, already-confirmed — restated here for completeness, not newly established).
3. Supports secure lookup with rate-limiting against enumeration (TRD12 §12.42/§12.43, TRD22 Phase 14, already-confirmed).
4. Regeneration/rotation of the QR itself (as distinct from the underlying loyalty code, which never changes) remains explicitly out of scope for this decision, per TRD12 §12.42's own deferral ("may be introduced if static code abuse becomes material") — `RES-005` §5 "Out of Scope," reconfirmed here without alteration.

## 11. Collision and Uniqueness Considerations

Adopting the brief's §5 analysis without modification: at the recommended codespace (Option B1, 7,077,888), expected collision/retry rates range from ≈0.07% at 10,000 customers to ≈7.06% at 1,000,000 customers, using the birthday-paradox approximation. At Burundi-launch MVP scale (PRD0 §8, low thousands to low hundreds of thousands), retry rates stay under roughly 1% — operationally negligible, invisible to the customer, no meaningful latency impact.

**Uniqueness enforcement mechanism:** transactional uniqueness checking at assignment time (brief §7.2) — each candidate code is checked against existing assigned codes within the same transaction that assigns it, preventing a race condition between simultaneous registrations. A collision triggers an automatic, customer-invisible retry with a new random candidate, bounded by a small maximum-retry count with fallback alerting if exceeded (brief §7.3) — an exceeded-retry event itself signals the codespace needs future expansion, per the brief's own §5 scaling note, not a design defect.

**Future scaling consideration (not a Phase 2 blocker):** at regional-expansion scale (1–5 million customers, PRD0 §8.2), retry rates climb toward a level worth revisiting; a 4th letter or digit position (multiplying codespace 22–26×) would restore headroom without materially changing the code's readability character. Disclosed here, not designed further — out of this package's scope per its own MVP framing.

## 12. Idempotency Considerations

**Corrected framing, carried forward from `RES-005`'s own pre-merge correction (`RES-005` §7, "Inherited from Identity Recovery"):** idempotency does not mean the generator is invoked exactly once — it means repeated invocations produce the same effect. A registration flow that times out after the server has already assigned a loyalty number must still allow the client to retry without creating a second assignment.

**The correct invariant:** at most one immutable loyalty-number assignment per platform user, with repeat calls returning the existing result. This is directly consistent with `ENG-P1-002`'s already-implemented idempotency-service pattern (`functions/src/shared/idempotency`) — a future generator service should key its idempotency check on platform user ID, not on a per-request correlation ID alone, since the invariant being protected is "one assignment per user," not "one successful response per request."

## 13. Implementation Prerequisites

None of these are performed by this package (constraint: no identifier or QR generation implementation) — they are the concrete items a future `ENG-P2-001`/`ENG-P2-004`-scoped implementation task would need once `DEC-DATA-007` is recorded:

1. **Checksum algorithm selection** (if the `ABC-234-X` variant is adopted) — the brief explicitly leaves this open (§8); this package does not select one, consistent with its own "no implementation" constraint.
2. **Generation-service ownership and invocation point** within the registration flow (PRD2 §5 Step 6) — an implementation-design question, not a format/scheme question, out of this package's scope.
3. **Cross-business role-context isolation** and other `DEC-ID-003`-adjacent items remain entirely unrelated to this decision (`RES-005` §4.3) — noted here only to confirm no accidental scope bleed occurred.

## 14. Operational Conditions

- **Document corrections required (per the Register's own field, not performed by this package):** the Register's `Options identified` field should be updated to reference the adopted proposal once `DEC-DATA-007` is formally recorded — `RES-005` §6 finding 4, reconfirmed here, not corrected by this preparation-only package.
- **No production-readiness gate is introduced by this package** — unlike `DEC-PROV-004`/`DEC-SEC-001`, `DEC-DATA-007` has no external evidence dependency (`Dependencies: —`, `RES-005` §4 "Not a dependency").
- **Downstream tracker staleness** (Programme, RTM) — already disclosed by `RES-005` §6, findings 1–2; not re-disclosed in duplicate here, not corrected by this package.

## 15. Decision Readiness

**Ready for Engineering Lead decision.** The evidence in §3–§12 is sufficient for the Engineering Lead to adopt this package's recommendation directly, per the Register's own `Founder decision required: No` field and the Resolution Plan's Ownership Matrix. No Founder review package is warranted: nothing in this analysis surfaces a constitutional issue (no Constitution provision touched), a commercial-policy issue (no pricing, jurisdiction, or business-model question), or new scope beyond what the Register already assigns to Engineering. The brief's own §9 "Founder review... recommended, not mandated" framing is not overridden by anything found here.

**What remains explicitly unresolved, not assumed:** the two sub-choices resolved by this package's own recommendation (§6–§8) are engineering judgment calls within Engineering's own decision authority, not open Founder questions — they are recommended, not treated as already decided, and remain subject to the Engineering Lead's own review before `DEC-DATA-007` is recorded.

## 16. Files Created or Modified

**Created:** `docs/00-governance/decisions/evidence/DEC-DATA-007-decision-package-2026-07-30.md` (this document). **Modified:** `docs/changes/IMPLEMENTATION_CHANGES.md` (append). **Not modified:** the Decision Register; `loyalty-code-decision-brief.md`; `DEC-PROV-004`, `DEC-SEC-001`, or `DEC-ID-003`'s entries or decision packages; PRD2; TRD12; the Requirements Traceability Matrix; the Engineering Implementation Programme; any application code; any other document.

## 17. Commands Executed

Live re-read of `DEC-DATA-007`'s Decision Register entry; re-read of the corrected `RES-005` Dependency & Scope Analysis (`git show` against the unmerged `docs/res-005-dec-data-007-dependency-scope-analysis` branch, since `RES-005`'s PR had not yet merged to `main`); full re-read of `loyalty-code-decision-brief.md`; re-read of `DEC-PROV-004`/`DEC-SEC-001`/`DEC-ID-003`'s confirmed Register entries (`DEC-ID-003` read from the unmerged `docs/res-004a-dec-id-003-decision-recording` branch for the same reason); re-read of TRD12 §12.5–12.7, §12.42–12.43; re-read of PRD2 §4–§9; re-read of AIR-001–006; `git fetch`/`checkout main`/`pull --ff-only` before branching to confirm a clean, synced starting point.

## 18. Dependencies Added

None.

## 19. Configuration Changes

None.

## 20. Rollback Instructions

`git revert` of this task's own commit — a single new decision-package document plus one changes-log append.

## 21. Markdown Engineering Decision Package

This document: [`docs/00-governance/decisions/evidence/DEC-DATA-007-decision-package-2026-07-30.md`](DEC-DATA-007-decision-package-2026-07-30.md).

## 22. Changes Log

Updated: [`docs/changes/IMPLEMENTATION_CHANGES.md`](../../../changes/IMPLEMENTATION_CHANGES.md).
