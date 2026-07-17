# 11thONUS Documentation Audit — Complete Findings Register

**Audit date:** 16 July 2026
**Priority scheme:** P0 = freeze blocker · P1 = must fix before implementation · P2 = must resolve before the dependent phase · P3 = editorial/maintainability · EXT = external dependency
**Field key:** Blocks freeze / Blocks implementation are stated per finding. "Correction type" uses the TRD Consolidation Audit categories: Editorial, Normalization, Clarification, Decision Required, Material Change.

---

## P0 — FREEZE BLOCKERS

### DOC-P0-001 — Superseded Product Definition contradicts mandatory customer verification

- **Affected documents:** `11thONUS Product Definition.md` (root); conflicts with `PRD/PRD0_product foundation.md`, `PRD/PRD1_accounts Roles, Permissions.md`, `PRD/PRD5_ Purchase Verification Lifecycle.md`, `TRD/TRD#_Consolidation and Consistency Audit.md`
- **Exact sections:** Product Definition → "Fraud Controls" ("**Owner transactions are automatically approved.** Flagged staff transactions enter a review queue."), "Purchase Recording" (field "Approval Status"), "Fraud Controls" ("Customer confirmation requirements" listed as a business-configurable option); vs PRD0 §14.1–14.2 (Cardinal Rule), PD-013/PD-014, OP-013; PRD1 AP-005, BR-009; PRD5 BR-058; TRD Consolidation Audit §3.5 ("No actor is exempt from customer verification in the MVP")
- **Issue:** The Product Definition describes an earlier business-approval model in which owner-entered purchases bypass verification and customer confirmation is optional per business. Every later document makes customer verification mandatory for every recorder with no configurability. The document carries "Version 1.0" and no superseded label, so it reads as authoritative.
- **Why it matters:** This is a contradiction of the platform's single most important rule. An implementer or AI agent using this document could build a verification bypass — the exact failure mode (P0 example: "customer verification can be bypassed").
- **Recommended correction:** Add a prominent status header: "SUPERSEDED — historical reference only. Product behavior is governed by PRD0–PRD10; where this document conflicts, the PRD governs." Do not silently edit the content. Classify the file Historical Reference in the authority map.
- **Correction type:** Normalization (status labelling) — no product decision required
- **Governing document:** PRD (Stage 1/2); Constitution Pillar Two
- **Decision owner:** Founder (confirmation that the document is superseded)
- **Phase affected:** All (baseline)
- **Blocks freeze:** Yes · **Blocks implementation:** Yes

### DOC-P0-002 — Legacy data model describes a different product and instructs direct implementation

- **Affected documents:** `11THONUS-data-model.md` (root); conflicts with `TRD/TRD10_Firestore Data Architecture.md`, `PRD/PRD4`, `PRD/PRD5`, `PRD/PRD6`, `TRD/TRD#_Consolidation and Consistency Audit.md`
- **Exact sections:** Entire document, in particular: header ("Written for a development team to implement directly"); §3 `vendor_listing.redemption_threshold INT default 11` (configurable per listing); §4 `punch_record.punch_number INT 1 through 10`, `shopper_confirmed BOOLEAN`; §5 "System-enforced rate limit … **reject** or flag if a (shopper_id, vendor_id) pair already has a punch within the configured minimum interval"; SQL/ENUM schema throughout; `DECIMAL` price fields; vendor/shopper/punch/listing terminology; §7 open decision 2 (threshold as variable business setting)
- **Issue:** The document represents a superseded product generation: different actors (vendor/shopper), different mechanic (punches, threshold 11, configurable), a relational schema that contradicts the Firestore-first TRD, automatic rejection of purchases by rate limit (contradicting OP-011, BR-080, TRD Consolidation Audit §8.2 "shall not automatically be rejected"), a boolean confirmation flag instead of the Purchase Record lifecycle, and floating-point-style DECIMAL money (contradicting TRD10 §10.5/DA-015).
- **Why it matters:** It is the only document in the folder that explicitly invites direct implementation, and everything in it is wrong under the approved model — conflicting reward threshold, verification-weakening auto-rejection, wrong data architecture.
- **Recommended correction:** Label "SUPERSEDED — historical brainstorming. The authoritative data architecture is TRD Chapter 10." Classify Historical Reference. Consider moving to an `archive/` subfolder during consolidation (founder decision; this audit moves nothing).
- **Correction type:** Normalization (status labelling)
- **Governing document:** TRD Chapter 10
- **Decision owner:** Founder
- **Phase affected:** All (baseline)
- **Blocks freeze:** Yes · **Blocks implementation:** Yes

### DOC-P0-003 — Conflicting reward-threshold representations across the suite

- **Affected documents:** `11THONUS-data-model.md`; `11thONUS Product Definition.md`; `PRD/PRD6_ Reward Programs and LC management.md`; `TRD/TRD10_Firestore Data Architecture.md`; `TRD/TRD22_MVP Scope Implementation and Delivery.md`; `TRD/TRD#_Consolidation and Consistency Audit.md`; `11thONUS Rules Studio.md`
- **Exact sections:** data-model §3 (`redemption_threshold` default 11, per-listing configurable) and §7.2; Product Definition → "Loyalty Products" (per-product "Reward Rule / Reward Quantity / Reward Value") and "Loyalty Engine" ("Pay for 10, Receive the 11th" with future Buy-5/Buy-20 expansion); PRD6 §4.4 ("Verified Units Required = **10**"; architecture must support future configurable rules); TRD10 §10.9.2 (`requiredVerifiedUnits: number` — free numeric field); TRD22 §22.5 ("fixed 10-unit threshold"), §22.6 (configurable thresholds deferred); Consolidation Audit §4 (fixed 10, stored in versioned configuration, not business-editable); Rules Studio → "Reward Program Rules" ("Required Verified Units" listed as per-program configurable)
- **Issue:** Three incompatible positions coexist: (a) fixed platform threshold of 10 (canonical); (b) default 11 configurable per listing (legacy); (c) per-Reward-Program configurable "Required Verified Units" presented without the MVP-fixed caveat (Rules Studio). TRD10's schema stores the threshold as an unconstrained number without stating the MVP fixed-value rule at the schema site.
- **Why it matters:** "Conflicting reward threshold" is the canonical P0 example. The 10-vs-11 confusion also touches the brand promise ("Every 11th, on us" = 10 verified units + 11th on the business), which TRD23 §23.10 resolves — but the resolution is not propagated.
- **Recommended correction:** During consolidation, state the canonical rule once (10 Verified Units, fixed in MVP, position 11 is the reward; architecture supports future configurability without UI exposure) and annotate/correct: Rules Studio "Required Verified Units" (mark as future-configurable, MVP-fixed), TRD10 §10.9.2 (add MVP constraint note), and label the two legacy documents per DOC-P0-001/002.
- **Correction type:** Normalization + Clarification (the product decision is already approved — PD-006, Consolidation Audit §4.1)
- **Governing document:** PRD0 PD-006; TRD Consolidation Audit §4
- **Decision owner:** None required (already decided); founder confirms propagation
- **Phase affected:** Phase 4 (Reward Programs), Phase 7 (Loyalty)
- **Blocks freeze:** Yes · **Blocks implementation:** Yes

### DOC-P0-004 — Domain ownership conflicts inside the TRD (12-domain vs 15-domain models; multiple owners)

- **Affected documents:** `TRD/TRD1-7_Plartform Architecture.md`; `TRD/TRD10_Firestore Data Architecture.md`; `TRD/TRD23_Traceability and Completion Review.md`; `TRD/TRD#_Consolidation and Consistency Audit.md`
- **Exact sections:** TRD1-7 Chapter 4 (12 domains: no Reward Programs, Subscription or Integration domains; "Administration … Owns Subscriptions"; "Purchases" vs "Purchase" naming) and Chapter 6 Service Ownership Matrix; TRD10 §10.4 (rewardPrograms / rewardProgramVersions owned by **Loyalty**; businesses owned by **Identity / Administration** jointly; subscriptions owned by **Administration**; subscriptionPayments **Administration / Integration** jointly); TRD23 §23.7–23.8 (final 15-domain model with dedicated Reward Programs, Subscription and Integration domains; Identity owns business identity; joint ownership disallowed); Consolidation Audit §5 (same corrections, explicitly listed as required)
- **Issue:** The early TRD chapters and the TRD10 collection matrix assign several core concepts to different or multiple owners than the final model in TRD23. The corrections are documented but have not been applied to the source chapters.
- **Why it matters:** "Multiple authoritative owners" is a P0 example. A freeze today would freeze contradictory ownership; coding agents implementing Phase 1–4 from TRD1-7/TRD10 would build wrong boundaries (e.g., subscription logic inside Administration).
- **Recommended correction:** Apply TRD23 §23.7 to TRD1-7 Chapters 4–6 and TRD10 §10.4 during consolidation: Reward Programs as its own domain; Subscription as a dedicated domain; Integration as exclusive provider boundary; Identity as sole owner of business identity records; Administration owns workflows/interfaces only. Rename "Purchases" domain to "Purchase" for consistency.
- **Correction type:** Normalization (the decision is made in TRD23; application is mechanical)
- **Governing document:** TRD23 §23.7–23.8
- **Decision owner:** None required (already decided)
- **Phase affected:** Phases 1–12 (all domain implementation)
- **Blocks freeze:** Yes · **Blocks implementation:** Yes

---

## P1 — MUST FIX BEFORE IMPLEMENTATION

### DOC-P1-001 — Requirement-ID prefix collisions (FR-RP ×3, OP ×2, AP ×2)

- **Affected documents:** `PRD/PRD1` §18 (FR-RP-001..010 = authorization requirements); `PRD/PRD6` §25 (FR-RP-001..012 = Reward Program requirements); `PRD/PRD10` §19 (FR-RP-001..008 = RBAC requirements); `PRD/PRD0` §11 (OP-001..013 = ONUS Principles) vs `TRD/TRD20` §operational rules table (OP-001..? = operational rules); `PRD/PRD1` §2 (AP-001..010 = Access Principles) vs `PRD/PRD6` §27 (AP-RP-001..005 Architectural Principles — near-collision)
- **Issue:** `FR-RP-001` has three unrelated definitions. `OP-001` has two. Cross-references such as "FR-RP-004" are ambiguous.
- **Why it matters:** Traceability register cannot be built; TC-006 ("Duplicate requirement identifiers are prohibited") and FR-TRC-009 are violated within the suite itself.
- **Recommended correction:** Renumber with unique prefixes (suggestion: PRD1 §18 → FR-AUTHZ-xxx; PRD6 §25 keeps FR-RP-xxx as Reward Programs is the natural owner of the prefix; PRD10 §19 → FR-RBAC-xxx; TRD20 rules table → OR-xxx). Publish an old→new mapping table; do not delete old IDs silently.
- **Correction type:** Normalization · **Governing:** TRD23 §23.28 · **Owner:** Documentation maintainer, founder approves mapping · **Phase:** Pre-Phase 0 · **Blocks freeze:** Yes (as part of numbering audit) · **Blocks implementation:** Yes

### DOC-P1-002 — PRD state names diverge from canonical TRD state models

- **Affected documents:** `PRD/PRD5` §7 (Purchase states include **Draft** and **Recorded**; "Waiting for Customer Verification"); `PRD/PRD6` §14 (Loyalty Cycle states: **Current**, Reward Available, Reward Redeemed, Closed, **Historical**); `PRD/PRD7` §10 (Reward states: Available, Redeemed, Cancelled, **Historical** — no Expired); `PRD/PRD2` §7 (customer account: **Pending Verification** vs canonical `pending`); vs `TRD/TRD#_Consolidation and Consistency Audit.md` §7 canonical state tables and `TRD/TRD10` schemas
- **Issue:** The canonical Purchase Record model has 8 states beginning at `waiting_for_customer` (no draft/recorded); Loyalty Cycle canonical = active / reward_available / reward_redeemed / closed (no "Current"/"Historical"); Reward canonical = available / redeemed / cancelled / expired (no "Historical"). PRD7 §10 labels reward states "Redemption States", conflating the Reward entity (4 states) with the Redemption entity (completed/reversed).
- **Why it matters:** Engineers must know whether "Historical" is a stored state or UI wording; conflicting state names are the canonical P1 example.
- **Recommended correction:** Adopt Consolidation Audit §7 tables as canonical; annotate PRD states as UI vocabulary where they are display labels; correct PRD7 §10 heading to "Reward States" and reference redemption states separately. See the Terminology and State-Model Audit file for full tables.
- **Correction type:** Normalization · **Owner:** Founder approves canonical tables · **Phase:** Phases 5–8 · **Blocks freeze:** Yes · **Blocks implementation:** Yes

### DOC-P1-003 — TRD10 subscription status enum omits four canonical states

- **Affected documents:** `TRD/TRD10` §10.14.1 (`status: "trial" | "active" | "past_due" | "suspended" | "cancelled"`); vs `TRD/TRD17` §17.15–17.16 and Consolidation Audit §7.10 (canonical 10 states incl. `draft`, `grace_period`, `expired`, `archived`)
- **Issue:** The authoritative schema example contradicts the canonical lifecycle within the same TRD.
- **Recommended correction:** Align the TRD10 example with the TRD17/Consolidation Audit state list.
- **Correction type:** Normalization · **Phase:** Phase 10 · **Blocks freeze:** Yes · **Blocks implementation:** Yes (Phase 10)

### DOC-P1-004 — "Loyalty product" vs "Reward Program" used for the same concept, including inside MVP scope definitions

- **Affected documents:** `PRD/PRD0` (throughout: "loyalty products", PD-019), `PRD/PRD1`, `PRD/PRD2`, `PRD/PRD3` (§14 "Loyalty Product Creation", FR-BO-004/009/012, BR-029/031), `11thONUS Product Definition.md`; vs `PRD/PRD4` §3 (declares "Reward Program" official platform terminology), `PRD/PRD5`–`PRD/PRD10`, all TRD chapters, Consolidation Audit §3.3
- **Issue:** PRD0–PRD3 predate the official vocabulary of PRD4. The same commercial object is "loyalty product" in early sections and "Reward Program" thereafter. This is mostly editorial but becomes substantive where plan limits are defined (see DOC-P1-005).
- **Recommended correction:** Global normalization to "Reward Program" in authoritative documents, with a glossary note that early PRD sections used "loyalty product".
- **Correction type:** Normalization · **Phase:** Pre-freeze · **Blocks freeze:** Yes · **Blocks implementation:** No (with glossary)

### DOC-P1-005 — Subscription capacity basis conflict: "active loyalty products" vs "active Reward Programs"

- **Affected documents:** `PRD/PRD0` §18.2–18.3, PD-019; `PRD/PRD3` §9–10; `11thONUS Product Definition.md` ("Plans are determined primarily by the number of active loyalty products"); vs `TRD/TRD17` §17.7 (limits in active Reward Programs), Consolidation Audit §11.1
- **Issue:** One Reward Program may map multiple equivalent products, so "10 products" ≠ "10 Reward Programs". The unit of plan enforcement changes commercial meaning.
- **Recommended correction:** Adopt "active Reward Program limit" (already decided in Consolidation Audit §11.1) and update PRD0 §18/PRD3 §9–10 wording during consolidation.
- **Correction type:** Normalization (decision exists) with founder confirmation of commercial intent · **Phase:** Phase 10 · **Blocks freeze:** Yes · **Blocks implementation:** Yes (Phase 10)

### DOC-P1-006 — Batch rejection permitted by PRD, prohibited by TRD

- **Affected documents:** `PRD/PRD0` §14.3 ("reject selected purchases") and PRD1 §5.2 ("reject purchases" plural in batch context); vs `TRD/TRD#_Consolidation and Consistency Audit.md` §9.3 and `TRD/TRD23` §23.13 ("Rejections and disputes remain individual because they require record-specific reasons")
- **Issue:** Direct behavioral contradiction on a core customer workflow.
- **Recommended correction:** Founder decision; the TRD position (individual rejection with reason) is better supported by the trust model and should be treated as the default; PRD0 §14.3 corrected accordingly.
- **Correction type:** Decision Required → then Normalization · **Owner:** Founder · **Phase:** Phase 6 · **Blocks freeze:** Yes · **Blocks implementation:** Yes (Phase 6)

### DOC-P1-007 — Permission model: configurable delegation (PRD1) vs automatic role inheritance (PRD10)

- **Affected documents:** `PRD/PRD1` §7 (manager permissions "must be configurable"; AP-008 "Role Names Do Not Automatically Grant Unlimited Power"; §7.4 default manager cannot manage staff unless granted); vs `PRD/PRD10` §13 ("Business Owner inherits all Manager permissions. Manager inherits all Staff permissions.")
- **Issue:** Blanket inheritance conflicts with explicit-grant design. If a manager automatically inherits everything staff-level plus manager defaults, PRD1's configurable restrictions are ambiguous; owner-inherits-manager is harmless, manager-inherits-staff mostly harmless, but the two sections give implementers different permission-resolution algorithms.
- **Recommended correction:** Clarify: inheritance applies to the default permission template; explicit per-membership grants/revocations override; sensitive permissions never granted implicitly (align with TRD12 §12.11 permission resolution).
- **Correction type:** Clarification · **Owner:** Founder confirms · **Phase:** Phase 2 · **Blocks freeze:** Yes · **Blocks implementation:** Yes (Phase 2)

### DOC-P1-008 — Governance hierarchy differs between Constitution and TRD23

- **Affected documents:** `1_11thONUS Platform Constitution.md` Part VII (9-document hierarchy incl. "Vision & Product Strategy" at position 2; Design System above Operational Playbooks/Engineering Standards); `TRD/TRD23` §23.3 (10-document list incl. Decision Register and Implementation Change Log; no Vision & Product Strategy); uploaded audit brief hierarchy (13 items) differs again
- **Issue:** Governance precedence is the arbitration mechanism for every other conflict; it must itself be unambiguous. "Vision & Product Strategy" is referenced by the Constitution but does not exist in the folder.
- **Recommended correction:** Amend one list (recommend updating the Constitution Part VII, as a deliberate versioned amendment, to the TRD23 §23.3 list plus explicit placement of the Commerce Knowledge Standard) and state whether the Vision & Product Strategy will be authored or formally dropped.
- **Correction type:** Decision Required (constitutional amendment) · **Owner:** Founder · **Phase:** Pre-freeze · **Blocks freeze:** Yes · **Blocks implementation:** No

### DOC-P1-009 — Referenced "Business Rules Catalogue" does not exist

- **Affected documents:** `PRD/PRD0` §14.5 ("The exact expiry rules will be defined in the Business Rules Catalogue"); `PRD/PRD2` §18 ("Business Rules Catalogue will define defaults"); no such file exists
- **Issue:** Pending-purchase expiry, reminder timing and archival defaults are delegated to a missing document. TRD22 §22.31 relocates these to Rules Studio typed rules, but no default values exist anywhere.
- **Recommended correction:** Decide the home for these defaults (recommend: Rules Studio seed rules defined in the Decision Register / Engineering Standards) and correct the PRD references; record default values as open decisions until set.
- **Correction type:** Decision Required + Normalization · **Owner:** Founder · **Phase:** Phase 6/9 (reminders, expiry) · **Blocks freeze:** Yes (reference integrity) · **Blocks implementation:** Yes (Phase 6)

### DOC-P1-010 — Purchase Record commercial fields inconsistent between PRD5 and TRD10

- **Affected documents:** `PRD/PRD5` §5 (Purchase Record shall contain "Unit Value (optional), Currency", "Location (future)", "State History"); vs `TRD/TRD10` §10.10.1 (`PurchaseRecordDocument` has no unit value, currency or location fields; timeline is a subcollection §10.18)
- **Issue:** PRD mandates fields the authoritative schema does not carry. Money on Purchase Records also raises the integer-minor-units rule (DA-015) and privacy questions.
- **Recommended correction:** Decide whether unit value/currency are MVP Purchase Record fields (recommend: optional, integer minor units, non-authoritative for loyalty math) or remove from PRD5 §5; document timeline storage as subcollection.
- **Correction type:** Decision Required → Normalization · **Owner:** Founder + Engineering Lead · **Phase:** Phase 5 · **Blocks freeze:** Yes · **Blocks implementation:** Yes (Phase 5)

---

## P2 — MUST RESOLVE BEFORE RELEVANT PHASE

### DOC-P2-001 — Plan-name sets conflict across documents (Starter/Growth/Professional vs Bronze/Silver/Gold vs Entry/Mid/Advanced)

- **Affected:** `PRD/PRD0` §18.3 (Entry/Mid/Advanced, names TBD); `PRD/PRD3` §9 (Starter/Growth/Professional presented as the plans); `11thONUS Product Definition.md` (Starter/Growth/Professional); `11thONUS Rules Studio.md` (Bronze/Silver/Gold with different limits: 5/20/unlimited staff); `TRD/TRD17` §17.7 (Starter/Growth/Professional as working labels, "final names… shall be set"); Consolidation Audit §11.2 (Bronze/Silver/Gold "shall not be treated as approved"); TRD23 OPD-001
- **Issue:** Not just naming — Rules Studio attaches different staff limits and features (benchmarking, API) to its example tiers, which could be read as approved entitlements.
- **Correction:** Founder decision OPD-001/OPD-002; mark Rules Studio plan examples as illustrative. · **Phase:** Phase 10 · **Blocks freeze:** No (if marked open) · **Blocks implementation:** Phase 10 only

### DOC-P2-002 — Export formats conflict: PRD9 promises PDF/CSV/Excel; TRD22 approves CSV only

- **Affected:** `PRD/PRD9` §16 ("Initial support should include: PDF, CSV, Excel"); `TRD/TRD22` §22.21 ("CSV export where approved"); `TRD/TRD23` OTD-010 (PDF tooling open)
- **Correction:** Decide MVP export formats (recommend CSV at launch; PDF for receipts/invoices only per Phase 10; Excel deferred) and align PRD9. · **Phase:** Phase 11 · **Blocks freeze:** No · **Blocks implementation:** Phase 11

### DOC-P2-003 — Preferred language: optional at registration (PRD2) vs required (CKS, TRD22)

- **Affected:** `PRD/PRD2` §6 (Preferred language listed **optional**); `2_Commerce Knowledge Standard.md` Part XII (Preferred Language **required** at registration); `TRD/TRD22` §22.35 (language required); Consolidation Audit §17 (required)
- **Correction:** Make preferred language required-with-default (device/country default) or explicitly optional-with-fallback; align all four documents. · **Phase:** Phase 2 · **Blocks freeze:** No · **Blocks implementation:** Phase 2

### DOC-P2-004 — Taxonomy depth: fixed hierarchy (CKS) vs variable depth (TRD10) vs 3 levels (legacy data model)

- **Affected:** `2_Commerce Knowledge Standard.md` Part III ("I think this hierarchy should remain fixed" — 9 fixed levels); `TRD/TRD10` §10.7.1 ("The platform shall not hardcode exactly three taxonomy levels"; six nodeTypes); `11THONUS-data-model.md` §1 (3-level tree)
- **Issue:** Broadly reconcilable (fixed semantic levels, variable storage depth) but not stated; CKS levels (8–9 incl. tags/metadata) vs TRD nodeTypes (6) need mapping.
- **Correction:** Clarify in CKS that the semantic hierarchy is governed while storage supports variable depth; map CKS levels to TRD nodeTypes. · **Phase:** Phase 3 · **Blocks freeze:** No · **Blocks implementation:** Phase 3

### DOC-P2-005 — Gender enum fixed in TRD10 while OPD-009 says values await approval

- **Affected:** `TRD/TRD10` §10.6.2 (enum `female|male|non_binary|prefer_not_to_say|other`); `TRD/TRD23` OPD-009 (values and localized wording require product and privacy confirmation); `TRD/TRD21` §21.11
- **Correction:** Mark the TRD10 enum as provisional pending OPD-009. · **Phase:** Phase 2 (profile) · **Blocks freeze:** No · **Blocks implementation:** Progressive-profile work only

### DOC-P2-006 — Trial example presented as near-decision in PRD3 while formally open

- **Affected:** `PRD/PRD3` §11 ("30 Days or 100 Verified Purchases, whichever occurs first" as "possible example"); `TRD/TRD17` §17.11–17.14; `TRD/TRD23` OPD-003 (open)
- **Correction:** Keep open in Decision Register; ensure PRD3 wording clearly marks it unapproved. · **Phase:** Phase 10 · **Blocks freeze:** No · **Blocks implementation:** Phase 10

### DOC-P2-007 — Frontend stack: Product Definition asserts Tailwind CSS + Crashlytics; TRD leaves tooling open

- **Affected:** `11thONUS Product Definition.md` → "Technology Platform" (React, TypeScript, **Tailwind CSS**, **Firebase Crashlytics**); `TRD/TRD16` §16.3 (React + TypeScript approved; component/build tooling in OTD-001); `TRD/TRD22` §22.5 Technical Foundation (no Crashlytics; Performance Monitoring instead — Crashlytics does not apply to web PWAs)
- **Correction:** Resolve via OTD-001; treat Product Definition stack list as historical. · **Phase:** Phase 0 · **Blocks freeze:** No · **Blocks implementation:** Phase 0 tooling choice

### DOC-P2-008 — Business "self-suspend" in PRD1 matrix lacks workflow definition anywhere

- **Affected:** `PRD/PRD1` §11 matrix ("Suspend business — Owner: Self-suspend only"); `PRD/PRD3` §24 (suspension reasons include "Business request"); `TRD/TRD18` §18.12 (administrative suspension workflow only)
- **Issue:** Owner-initiated suspension is asserted but no PRD/TRD section defines its workflow, effects or reactivation.
- **Correction:** Define owner-initiated pause/suspension behavior or remove from the matrix. · **Phase:** Phase 12 · **Blocks freeze:** No · **Blocks implementation:** Phase 12

---

## P3 — EDITORIAL / MAINTAINABILITY

### DOC-P3-001 — Conversational first-person commentary in authoritative documents
`2_Commerce Knowledge Standard.md` (Part III "I think this hierarchy should remain fixed", Part IX "I recommend…", "Notice something."); `11thONUS Rules Studio.md` ("I think we've now identified…"); `TRD/TRD1-7` Chapter 4 ("I think this is now one of the most important diagrams…") and closing "One final recommendation before we continue"; `PRD/PRD3` §28 ("My recommendation:"); `PRD/PRD9` closing section ("One recommendation before we continue"). **Correction:** Convert to normative statements or move to an appendix/decision notes during consolidation. Blocks nothing.

### DOC-P3-002 — Product-category wording drift ("cloud-based loyalty platform")
`11thONUS Product Definition.md` (Executive Summary), `PRD/PRD0` §3 use "cloud-based loyalty platform" as the lead description; canonical is "Customer-Verified Loyalty Platform" (Constitution Art. 1; Consolidation Audit §3.1; TRD23 §23.9). PRD0 §2.5 does use the canonical positioning. **Correction:** Editorial normalization.

### DOC-P3-003 — File naming and organization defects
`TRD/TRD1-7_Plartform Architecture.md` (typo "Plartform"); `TRD/TRD#_Consolidation and Consistency Audit.md` (`#` in filename breaks some tooling/links); `TRD/TRD20_ Deployment…` (space after underscore); root file `11THONUS-data-model.md` (inconsistent capitalization); PRD filenames with inconsistent spacing/underscores (`PRD2_ Customer Registration andIdentity.md`). **Correction:** Rename during consolidation only (not during this audit).

### DOC-P3-004 — PRD2 fragmented prose formatting
`PRD/PRD2` throughout (single-word lines, broken sentences e.g. §9 "The QR shall represent / only / the customer loyalty identity."), `<br/>` artifacts in §14 lifecycle diagram (also PRD5 §6). **Correction:** Editorial reflow; content is sound.

### DOC-P3-005 — "Trust Ledger" vs "trustEvents" naming
`PRD/PRD4` §21 introduces the Trust Ledger; `TRD/TRD10` §10.13.1 implements it as `trustEvents` with no explicit mapping statement; Consolidation Audit §5.5 distinguishes Trust Event / audit record / security log. "Ledger" must also stay out of customer copy (customer-facing language rule). **Correction:** Add glossary mapping "Trust Ledger (concept) = trustEvents collection (implementation)".

### DOC-P3-006 — Duplicate permission/role definitions between PRD1 and PRD10
PRD10 §3–§10 restates roles, permission groups and a role matrix already defined in PRD1 §5–§12 with minor wording differences (beyond the substantive inheritance issue in DOC-P1-007). **Correction:** Consolidate to one authoritative role/permission chapter with cross-references.

### DOC-P3-007 — Mixed British/American spelling
"recognise/recognize", "authorised/authorized", "behaviour/behavior", "programme/program" vary across and within documents (e.g., PRD4 uses "programme" for Reward Program text where the canonical spelling is "Program"; Consolidation Audit §3.3 fixes "Reward Program"). **Correction:** Pick one variety (suite trends American in TRD, British in root docs); enforce "Reward Program" spelling regardless.

### DOC-P3-008 — PRD4 §19 and PRD9 functional requirements lack IDs
PRD4 §19 lists functional requirements as bullet prose ("The system shall: Generate Loyalty Cycles…") without FR IDs; inconsistent with every other PRD section and breaks traceability granularity. **Correction:** Assign IDs during renumbering (e.g., FR-CVLE-xxx).

### DOC-P3-009 — PRD9 header anomaly
`PRD/PRD9` line 1: "# 11thONUS Product Requirements Document-2.9" — stray artifact inconsistent with the section-numbering convention of the other PRD files. **Correction:** Editorial.

### DOC-P3-010 — 11thONUS capitalization variants
"11thONUS" (canonical), "11THONUS" (folder/filenames), "The 11th" (data-model title). TRD23 §23.29 requires a capitalization check. **Correction:** Editorial normalization in documents; folder renames are a founder choice.

---

## EXT — EXTERNAL DEPENDENCIES (grouped; full extraction in the Open Decisions file)

### DOC-EXT-001 — Product decisions already catalogued in TRD23 (OPD-001..OPD-010)
Plan names, staff limits, trial rule, reward quantity default, reward use during suspension, pending-unit allocation policy, customer phone lookup, public business profiles, gender values, birthday visibility. **Owner:** Founder. **Blocking effect:** each blocks its phase (see TRD23 §23.21); OPD-006 (overflow allocation) blocks Phase 7 and is also flagged in Consolidation Audit §8.3 as unresolved.

### DOC-EXT-002 — Technical decisions (OTD-001..OTD-012)
Frontend tooling, repository structure, Firebase region, phone-auth delivery in Burundi, search implementation, event delivery mechanism, idempotency storage, notification providers, Burundi payment provider, PDF generation, backup method, admin deployment isolation. **Owner:** Engineering Lead / Founder. OTD-003/OTD-004 carry country-availability risk flagged in TRD23 §23.20.

### DOC-EXT-003 — Provider selections (TRD23 §23.23 table)
Phone OTP, email, SMS, subscription payment (BIF mobile money), error monitoring, backup, domain/DNS. **Blocking:** per-phase deadlines already assigned in TRD23.

### DOC-EXT-004 — Legal and compliance dependencies (LCD-001..LCD-006)
Burundi privacy framework, consumer/loyalty terms, electronic billing, mobile-money agreement, customer age policy, cross-border hosting. **This audit makes no legal conclusions; all are classified legal-review dependencies and are launch blockers where relevant (TRD23 §23.24).**

### DOC-EXT-005 — MVP assumptions requiring pilot validation (A-001..A-015)
Documented in TRD23 §23.25; each must be validated during pilot planning. Not blockers for freeze if carried into the Decision Register as assumptions.

### DOC-EXT-006 — Suite-level decisions surfaced by this audit (not in TRD23)
(a) Formal supersession of Product Definition and data-model documents; (b) governance-hierarchy reconciliation and Vision & Product Strategy existence (DOC-P1-008); (c) Business Rules Catalogue disposition (DOC-P1-009); (d) batch-rejection policy (DOC-P1-006); (e) permission inheritance semantics (DOC-P1-007); (f) Purchase Record monetary fields (DOC-P1-010); (g) PRD open design questions never closed: PRD2 §28 (partial approval of multi-quantity records, transaction splitting, pending duration, reminder configurability, dispute evidence), PRD3 §28 (multi-business subscription model, franchise, inactive-product reporting, discovery), PRD6 §28 (pause with outstanding rewards, program migration, seasonal variants, threshold governance, gift conditions). **Owner:** Founder. These feed the Decision Register.

---

## Summary counts

| Priority | Count |
| --- | --- |
| P0 | 4 |
| P1 | 10 |
| P2 | 8 |
| P3 | 10 |
| EXT (grouped) | 6 groups (~45 individual items) |
| **Total findings** | **38 register entries** |
