> **Title:** Public Loyalty Code — Founder Decision Brief (DEC-DATA-007)
> **Version:** 1.0 · **Status:** Decision preparation — not approved · **Classification:** Working (governance record)
> **Governing document:** [Decision Register](decision-register.md) — this brief prepares, and does not modify, DEC-DATA-007
> **Source-of-truth path:** `docs/00-governance/decisions/loyalty-code-decision-brief.md`
> **Last controlled update:** 2026-07-17 (Engineering Transition Phase 0A — created)

# Public Loyalty Code — Founder Decision Brief

> **This is decision preparation only. Nothing in this brief is approved. The Decision Register has not been modified.**

## 1. Which Decision This Governs

**DEC-DATA-007 — Loyalty number and QR reference generation** is confirmed as the correct, and only, live record governing this question. Its current text (verbatim from the register):

> Decision question: Define the loyalty-number format/generation algorithm (opaque, non-sequential, non-revealing) and the QR opaque/signed reference scheme. Context: PRD2 §8 delegates the algorithm to the TRD; no TRD section specifies it (audit traceability gap §1); only constraints exist (no registration date/country/sequence disclosure; QR contains no personal data). Options identified: to be proposed (random alphanumeric + checksum; signed QR token). Current confirmed position: constraints confirmed; algorithm open. Founder decision required: No · Decision owner: Engineering Lead · Required by phase: Phase 2 · Blocks: customer identity issuance.

No other record in the register addresses loyalty-code or QR-reference generation. This brief proceeds against DEC-DATA-007 with no register changes.

## 2. Proposed Public Code Concept

A permanent, public, human-friendly loyalty code, separate from the internal Firebase UID or Firestore document ID.

**Preferred starting format:** `ABC-234`
**Possible checksum-enhanced format:** `ABC-234-X`

This is a proposal for founder and engineering review — not a confirmed design.

## 3. Required Design Characteristics

The code should be: easy to read; easy to quote verbally; easy to type; case-insensitive; non-sequential; randomly allocated; unique; permanent; generated server-side; never recycled; independent of name, phone, branch, country, or registration order; separate from authentication; accompanied by a QR code.

Every one of these characteristics is already implied by DEC-DATA-007's existing constraints ("opaque, non-sequential, non-revealing"; "no registration date/country/sequence disclosure") and by PRD1 §15.2's confirmed position that sharing a loyalty number never transfers account access. This brief does not introduce a new constraint — it operationalizes the ones already approved.

## 4. Character-Set Review

**Ambiguity-reduced alphabet.** Excluding `I` and `O` removes the two letters most easily confused with the digits `1` and `0` when read aloud or handwritten — a standard practice in human-facing code design (comparable systems: vehicle VINs, some airline/hotel confirmation codes).

**Further exclusion of `S` and `B`.** `S`/`5` and `B`/`8` are a secondary, market-dependent confusion pair (more relevant in some fonts/handwriting than others). Excluding them trades a smaller codespace for lower ambiguity. This is presented as an option, not a requirement — see the capacity trade-off in §5.

**Digits 2–9.** Excluding `0` and `1` removes the digit-pair most confusable with the letters `O` and `I` respectively, reinforcing the letter-side exclusion rather than duplicating protection against a different failure mode.

**Case-insensitivity.** The code should be stored and validated as case-insensitive (e.g. normalized to uppercase) since a quoted or handwritten code carries no reliable case information.

## 5. Capacity Analysis

Format: 3 letters + 3 digits (`ABC-234`), evaluated under three alphabets. All figures below are exact calculations, not estimates.

| Scenario | Letters used | Digits used | Codespace size |
|---|---|---|---|
| Full alphabet + full digits | 26 | 10 | 17,576,000 |
| **Exclude I, O; digits 2–9** *(recommended)* | 24 | 8 | **7,077,888** |
| Exclude I, O, S, B; digits 2–9 | 22 | 8 | 5,451,776 |

**Checksum character.** A 7th character (`ABC-234-X`) computed deterministically from the other 6 (e.g. a modulo check over the chosen alphabet) does **not** multiply the codespace — it is a function of the other characters, not an independent random component. Its purpose is error *detection* (catching a single mistyped or mis-heard character, and — depending on the algorithm chosen — adjacent-character transposition), not capacity expansion. If added, the effective random codespace remains as shown above; the checksum only changes how confidently a bad entry is caught before it reaches the server.

**Collision probability and retry behaviour.** Using the recommended codespace (7,077,888) and the birthday-paradox approximation for collisions expected while allocating *k* codes into a space of size *N* (`k²/2N`):

| Registered customers (k) | Expected collisions during generation | Effective retry rate |
|---|---|---|
| 10,000 | ≈ 7 | 0.07% |
| 100,000 | ≈ 706 | 0.71% |
| 500,000 | ≈ 17,661 | 3.53% |
| 1,000,000 | ≈ 70,643 | 7.06% |
| 5,000,000 | ≈ 1,766,064 | 35.32% |

Interpretation: a collision does not mean a customer receives a duplicate code — it means the server-side generator's transactional uniqueness check rejects that attempt and retries with a freshly generated random code (see §7). At Burundi-launch MVP scale (PRD0 §8, low thousands to low hundreds of thousands of customers), the retry rate stays under roughly 1%, which is operationally negligible — a generation request that requires a second attempt is invisible to the customer and adds no meaningful latency. At regional-expansion scale (Rwanda, Uganda, Kenya combined, PRD0 §8.2), approaching or exceeding 1–5 million customers, the retry rate climbs to a level worth revisiting — at that point, a 4th letter or 4th digit position (multiplying the codespace by 22–26×) would restore headroom without changing the code's readability character much. This is noted as a **future scaling consideration**, not a Phase 2 blocker — 3+3 is adequate for MVP and the near-term expansion markets.

## 6. Security and Privacy Boundaries

The following boundaries are already implied by existing approved documentation and are restated here explicitly because they directly shape the generator's design:

- **The loyalty code is an identifier, not a password.** It authenticates nothing by itself (Constitution/PRD1 §15.2–15.3, DEC-LOY-007's confirmed position).
- **Quoting the code never authenticates the person quoting it.** This is the same rule already CONFIRMED for the Shared Loyalty Number (DEC-LOY-007) — this brief does not change that rule, only the format of the code it applies to.
- **Lookup attempts must be rate-limited.** A staff member or system looking up a customer by code must be throttled to prevent enumeration (consistent with TRD22 Phase 14's "loyalty-number enumeration controls" deliverable).
- **Only minimal customer confirmation data may be shown** on a successful lookup (consistent with PRD5's customer-minimized confirmation requirement).
- **Full phone, email, cross-business history, and authentication information must not be exposed** through a code lookup, regardless of who performs it.
- **The code must not reveal registration order or user volume** — this is DEC-DATA-007's own existing constraint ("no registration date/country/sequence disclosure"), and is the reason the code must be randomly allocated rather than sequential or timestamp-derived.

## 7. Generation Requirements (Planning-Level Only)

These are requirements for a future generator service — **not an implementation**. No generator is built by this brief.

1. **Server-side generation.** The code is never generated client-side (consistent with DA-006, "critical client-side direct writes are prohibited").
2. **Transactional uniqueness checking.** Each candidate code is checked against existing assigned codes within the same transaction that assigns it, preventing a race condition between two simultaneous registrations.
3. **Retry on collision.** A collision (§5) triggers an automatic retry with a new randomly generated candidate — invisible to the customer, bounded by a small maximum-retry count with fallback alerting if that count is ever exceeded (which would itself signal the codespace needs expanding, per §5's future scaling note).
4. **Normalized storage.** The code is stored in one canonical form (e.g. uppercase, unformatted) with the display hyphenation applied only at render time.
5. **Formatted display.** The code is displayed with its separator (`ABC-234`) for readability; input fields accept the code with or without the separator and are case-insensitive.
6. **Immutable assignment.** Once assigned to a customer, the code never changes for the life of that account (supports "permanent" in §3).
7. **Retired-code non-reuse.** If an account is ever closed, its code is retired, not reassigned — consistent with PR-009 (historical commercial integrity preserved during account closure) and the general "nothing commercial is silently deleted" principle (OP-007).
8. **QR linkage.** The QR code encodes a reference to the loyalty code (or a signed token derived from it, per DEC-DATA-007's "signed QR token" option) — containing no personal data, consistent with TRD12's QR privacy constraint.
9. **Audit logging.** Every code generation and every lookup attempt is logged, consistent with the platform-wide accountability principle (Constitution Part II).
10. **Safe customer lookup.** Lookup-by-code returns only the minimal confirmation data permitted under §6, never a full customer record.

## 8. What This Brief Does Not Do

- It does not implement a generator.
- It does not modify DEC-DATA-007 or any other Decision Register entry.
- It does not select a specific checksum algorithm — only notes that one may be added without affecting capacity.
- It does not finalize the exact excluded-character set (§4 presents the ambiguity-reduction rationale for both the minimal exclusion I/O and the more conservative I/O/S/B exclusion; the choice between them is left open for engineering/founder review).

## 9. Recommended Next Step

This brief should be reviewed by the Founder and Engineering Lead alongside the [Engineering Transition D1 Agenda](engineering-transition-d1-agenda.md) §4 (DEC-DATA-007). Because DEC-DATA-007 is formally an Engineering-owned decision (Founder input not required per the register), the Engineering Lead may resolve it directly — but given the code's permanence, customer-facing visibility, and brand relevance (it will be quoted verbally, printed, and shared the way the Shared Loyalty Number already is), Founder review before resolution is recommended, not mandated. Resolution should update DEC-DATA-007 in the Decision Register through the normal [Decision Update Procedure](../decision-update-procedure.md) — not through this brief.

## 10. Relationship to Other Governance Documents

- [Decision Register](decision-register.md) — DEC-DATA-007 is the record this brief prepares.
- [Engineering Transition D1 Agenda](engineering-transition-d1-agenda.md) §4 — where DEC-DATA-007 sits alongside the other 10 D1 decisions.
- [Engineering Implementation Programme](../../05-implementation/change-tracking/engineering-implementation-programme.md) Phase 2, ENG-P2-001 — the work package this decision blocks.
