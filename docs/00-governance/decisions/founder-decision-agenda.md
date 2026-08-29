# 11thONUS Founder Decision Agenda

> **Purpose:** Your open decisions, in plain language, in the order that avoids rework. Full detail for every item is in the [Decision Register](decision-register.md) under its ID — if wording here and there ever differs, the register governs.
> **An entry below is still open unless it is explicitly marked decided/confirmed/resolved** (struck through, with an "✅ answered `<date>`" line and a Final decision citing the Decision Register). Where we say "recommended", that is only a recommendation — your choice is what counts, and you can also propose an option that isn't listed.
> **How to answer:** reply in chat in any form you like — e.g. *"B1: a but remind me what 'pending pot' shows the customer…"*. Each answer is then recorded in the register following the [decision update procedure](../decision-update-procedure.md), and we confirm back what was recorded before touching any document.
> *(Updated in Phase 3A: batches re-ordered A–E so that everything blocking the documentation freeze comes first. Updated in Phase 3B, 16 July 2026: Batch A recorded as CONFIRMED — 24 open decisions remain across Batches B–E. Updated 2026-08-29 (`DEC-LEGAL-002-FOUNDER-DISP-001`): B6 (DEC-LOY-011) recorded CONFIRMED — 23 open decisions remain across Batches B–E.)*

---

## Batch A — Freeze Blockers ✅ COMPLETE (recorded 16 July 2026, Phase 3B)

All four freeze-blocking decisions below are now **CONFIRMED**. Full text of each final decision is in the [Decision Register](decision-register.md). Kept here, struck through, as the permanent record of what was asked.

### ~~A1. Which rulebook order wins?~~ — DEC-GOV-001 ✅ answered 2026-07-16: **(a)** — Constitution amended to the newer hierarchy; no Vision & Product Strategy document.
- **Question:** Two documents list the "order of authority" differently. The Constitution's list includes a "Vision & Product Strategy" document that was never written; the TRD's newer list includes the Decision Register instead. Which list is official — and do you want a Vision & Product Strategy document at all?
- **Why it matters:** this order is the referee for every future disagreement between documents.
- **Options & consequences:**
  - **(a) Recommended:** update the Constitution to the newer list via a formal amendment → one controlled editing session, then done.
  - (b) Keep the Constitution's list and write the missing Vision document → commits you to authoring a new document before freeze.
  - (c) Leave both lists as they are → every future conflict has two referees; not advised.
- **Answering this does not itself change the Constitution** — it authorizes the amendment, which is then executed as its own controlled step.

### ~~A2. Approve the requirement-numbering repair plan~~ — DEC-GOV-006 ✅ answered 2026-07-16: **(a)** — approved; a complete Old ID → New ID mapping table must be maintained. **Executed in documentation Phase 4 (16 July 2026)** — see the [Requirement ID Mapping](../requirement-id-mapping.md).
- **Question:** Three different requirement sets accidentally share the "FR-RP" numbers, and two share "OP". May we renumber the clashing sets, keeping a public old→new mapping so nothing is ever lost?
- **Why it matters:** without unique numbers we cannot build the traceability register that links every requirement to code and tests. This is the gate for Phase 4.
- **Options:** **(a) Recommended:** approve the mapping plan as written in the ID audit; (b) ask for different prefixes first.
- **Consequence of (a):** purely mechanical renumbering with a lookup table; no meaning changes anywhere.

### ~~A3. Can customers reject several purchases at once?~~ — DEC-LOY-010 ✅ answered 2026-07-16: **(a)** — rejection stays individual, each with its own reason.
- **Question:** Customers can *verify* several purchases in one tap. Can they also *reject* several at once, or must each rejection be done one at a time with its own reason?
- **Why it matters:** two documents currently contradict each other, and the contradiction itself blocks the freeze.
- **Options & consequences:**
  - **(a) Recommended:** rejection stays individual, each with its own reason → protects businesses from accidental mass rejection; slightly more taps for the customer.
  - (b) Batch rejection with one shared reason → faster for customers, riskier for businesses.
  - (c) Batch rejection but a reason required per item → middle ground, more complex screens.

### ~~A4. Should recorded purchases carry a money amount?~~ — DEC-DATA-003 ✅ answered 2026-07-16: **(a), with a condition** — optional amount kept, but money is reporting metadata only and never influences loyalty progression unless a future decision says otherwise.
- **Question:** One document says each recorded purchase may include an optional price; the technical design has no money fields. Loyalty progress never uses money either way.
- **Options & consequences:**
  - (a) Keep an *optional* amount → businesses see value figures in their own reports; slightly more data entry and privacy surface.
  - (b) No money on purchases in the MVP → simplest recording flow; business reports show counts, not values.
- No single recommendation — both work; engineering advises (b) is simpler, some businesses may want (a).

## Batch B — Core Loyalty Behavior (7 decisions; needed for Phases 4–8)

### B1. What happens to "extra" verified purchases? — DEC-LOY-008 ⭐ the most important product decision
- **Story:** Maria is at 8 of 10 coffees. She verifies a purchase of 4. She has earned her reward — what happens to the 2 extra coffees?
- **Options & consequences:**
  - **(a) Recommended (already drafted in the TRD):** the 2 extras wait in a safe "pending" pot; when she redeems her free coffee, they automatically count toward her next cycle, oldest first → one reward at a time, nothing lost, easy to explain.
  - (b) The extras immediately start her next cycle even while the reward is unused → rewards can pile up; more generous, more complex, higher cost for businesses.
  - (c) Extras are lost → simplest to build, but breaks the "nothing you earned disappears" promise.

### B2. Is the reward always exactly one item? — DEC-LOY-009
- **(a) Recommended:** always 1 item/service in the MVP (the field for more already exists for the future); (b) let businesses configure "buy 10, get 2" now.
- **Consequence of (b):** more setup choices for businesses and more reward-cost exposure on day one.

### B3. Fixing a wrongly recorded purchase — DEC-PROD-008
- **Story:** the shop recorded 5 coffees; Maria only bought 4.
- **Options:** **(a) Recommended:** Maria disputes → the business sends a corrected record → she verifies the correction (clean history); (b) Maria can partially approve "4 of 5"; (c) she rejects everything and the shop re-records.
- **Consequence:** (b) is fastest for the customer but edits quantities behind the business's back; (a) keeps both sides in agreement.

### B4. Reminders and expiry for unverified purchases — DEC-PROD-009
- **Set the starting numbers:** first reminder after how long (e.g. 24h)? How often after that? Do pending purchases ever expire (e.g. after 60/90 days)?
- **Why it matters:** these numbers exist nowhere yet; reminder and expiry features cannot be built without them.

### B5. Is an expired pending purchase gone for good? — DEC-PROD-010
- **Options:** (a) expiry is final — the business may simply record it again if genuine; (b) expired purchases can still be verified within a window; (c) nothing expires in the MVP — reminders continue.
- **Consequence:** (c) means the customer's list can fill with stale items; (a) is cleanest but strict.

### ~~B6. Do earned rewards survive if the business stops paying us?~~ — DEC-LOY-011 ✅ answered 2026-08-29: **(a), qualified** — redeemable by default during suspension, subject to governed exceptions.
- **Options (as originally asked):** (a) customers can redeem earned rewards throughout suspension *(the documents lean this way — customer trust)*; (b) only during the grace period; (c) case-by-case; (d) frozen until the business pays.
- **Note (as originally asked):** whatever you choose, earned rewards are never *erased* — that's already confirmed.
- **Final decision (recorded in the Decision Register, `DEC-LEGAL-002-FOUNDER-DISP-001`, 2026-08-29):** Option (a) as the default, subject to governed exceptions. Valid rewards earned before suspension remain redeemable during suspension by default; suspension arising solely from the Business's commercial/subscription relationship with 11thONUS does not by itself block redemption; redemption may still be restricted, paused, or reviewed where the specific suspension reason (fraud, security/integrity, legal/regulatory, disputed validity, or another governed exception) makes continued redemption inappropriate or unsafe; the Business remains responsible for fulfilment; 11thONUS is not the guarantor/fulfiller. Full text in the [Decision Register](decision-register.md) `DEC-LOY-011` entry.

### B7. Program housekeeping — DEC-LOY-013 (+ B8. one word: DEC-UX-002)
- **B7:** Confirm that pausing a Reward Program keeps customers' progress and earned rewards safe (already implied — just confirm), and that moving customers between programs and "seasonal variants" are **not** in the MVP.
- **B8:** Which word do customers see everywhere: **"Verify"** or **"Approve"**? (One choice, also translated to French.)

## Batch C — Roles and Customer Lookup (2 decisions; needed for Phases 2 and 5)

### C1. How do manager permissions work? — DEC-ID-003
- **Question:** one document says owners/managers automatically get all lower-level permissions; another says permissions are granted individually.
- **Options:** **(a) Recommended:** automatic inheritance sets the *starting template*, and you can add/remove specific permissions per person — sensitive powers never automatic; (b) strict automatic inheritance; (c) everything granted by hand.

### C2. Can staff look up a customer by phone number? — DEC-ID-004
- **Options:** (a) no — QR code or loyalty number only; **(b) recommended:** yes, but only as a logged, permission-gated fallback for when a customer forgot their code; (c) freely (privacy risk — not advised).

## Batch D — Commercial Model and Customer Profile (9 decisions; needed before Phase 10, profile items with legal input)

### D1. Plan names — DEC-SUB-001: keep **Starter / Growth / Professional**, or different names?
### D2. Staff limits per plan — DEC-SUB-002: how many staff accounts does each plan include? *(numbers needed; the 5/20/unlimited seen in an old example was never approved)*
### D3. Trial — DEC-SUB-003: time-based, usage-based, or **"30 days or 100 verified purchases, whichever comes first"** (the drafted example)?
### D4. Prices and billing — DEC-SUB-008: BIF price per plan; monthly only or monthly+annual; grace period length (7/14/30 days); what happens mid-month when a business upgrades.
### D5. One owner, several businesses — DEC-SUB-009: **(a) recommended:** each business has its own subscription; (b) one combined bill per owner.
### D6. Report downloads — DEC-SUB-010: **(a) recommended:** CSV files + PDF receipts at launch, Excel later; (b) the full PDF/CSV/Excel set from day one (more build effort in Phase 11).
### D7. Gender field — DEC-PROD-012: keep the drafted optional list (female / male / non-binary / prefer not to say / other), shorten it, or drop gender from the MVP? *(No recommendation — take legal/cultural advice; it never blocks a customer either way.)* — **RESOLVED 2026-08-07: Founder chose to drop gender from the MVP (Option D). Gender is not collected at MVP and is removed from the MVP Customer Profile schema; a future governed release may reintroduce it additively under a separate decision. `DEC-PROD-012` is CLOSED — see the [Decision Register](decision-register.md) and the [implementation report](../../05-implementation/reports/DEC-PROD-012-implementation-and-eng-p2-001-02-unblock-2026-08-07.md).**
### D8. Birthdays — DEC-PROD-013: confirm businesses only ever get "birthday campaign eligibility" signals — never the actual date. *(Documented direction; formal confirmation needed before any birthday feature is built.)*
### D9. Legal work to commission (advisers answer, you accept): Burundi privacy rules & data retention (DEC-LEGAL-001) · customer/business terms incl. the duty to honour rewards (DEC-LEGAL-002) · e-billing rules (DEC-LEGAL-003) · minimum age & children's purchases (DEC-LEGAL-005) · **cross-border hosting (DEC-LEGAL-006 — commission first: it gates the server region choice in Phase 1)**.

## Batch E — Pilot and Public Scope (6 decisions; before Phases 12–16)

### E1. Public business pages — DEC-UX-003: **(a) recommended:** a minimal public page per business (name, category, its Reward Programs); (b) businesses visible only inside a customer's own activity.
### E2. Pilot cohort — DEC-PILOT-001: which categories (salon/barber, coffee/café, restaurant, car wash, bakery…), how many businesses, Bujumbura confirmed?
### E3. Launch bar — DEC-PILOT-002: adopt the TRD's pilot-exit gates as the go/no-go standard (documented minimum), and optionally add your own thresholds (e.g. minimum verification rate) — the stronger practice.
### E4. Free pilot plans — DEC-SUB-013: do pilot businesses pay? (A pilot-only complimentary plan via feature flags is the likely need.)
### E5. Owner "pause my business" button — DEC-ID-005: support in the MVP, or handled through support staff?
### E6. Admin team setup — DEC-GOV-007: which of the 11 designed admin roles exist at launch? **Recommended:** a small subset, keeping "one person edits, another approves" for Knowledge and Rules.

---

## Answer sheet (copy, fill, send)

```
A1: (a/b/c)   A2: (a/b)   A3: (a/b/c)   A4: (a/b)
B1: (a/b/c)   B2: (a/b)   B3: (a/b/c)   B4: reminder __h, repeat __, expiry __ days (or none)
B5: (a/b/c)   B6: (a/b/c/d)   B7: confirm? (yes/no)   B8: Verify / Approve
C1: (a/b/c)   C2: (a/b/c)
D1: names __   D2: limits __   D3: (time/usage/whichever-first + values)   D4: prices __, intervals __, grace __ days
D5: (a/b)   D6: (a/b)   D7: (keep/shorten/drop)   D8: confirm? (yes/no)   D9: commission legal? (yes/when)
E1: (a/b)   E2: categories __, count __   E3: (gates only / gates + thresholds __)   E4: (free/paid)   E5: (MVP/support)   E6: (subset/all)
```

**Not on your desk:** 15 engineering investigations, 7 provider selections, 6 legal reviews (you commission in D9, advisers answer), 10 deferred future items, 15 pilot assumptions ([assumptions register](assumptions-register.md)).
