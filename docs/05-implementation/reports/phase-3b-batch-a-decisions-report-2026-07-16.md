# 11thONUS Documentation Consolidation — Phase 3B Implementation Report

**Date:** 16 July 2026
**Phase:** 3B — Record the Approved Batch A Decisions
**Agent:** Claude (AI documentation agent)
**Scope discipline:** record and propagate exactly four founder-approved decisions — **no additional decision approved, no product behavior invented, no requirement IDs modified, Phase 4 not begun, no documentation migrated, Git not initialized, no unrelated file modified.**

---

## 1. Executive Summary

The Founder approved Batch A in full: DEC-GOV-001 (document hierarchy / Vision & Product Strategy), DEC-GOV-006 (requirement-ID renumbering plan), DEC-LOY-010 (individual purchase rejection) and DEC-DATA-003 (optional, reporting-only monetary fields). All four are now **CONFIRMED** in the Decision Register with Final decision, Decision date and Approved by populated. The Constitution was formally amended (Part VII, version 1.0 → 1.1) per DEC-GOV-001. Every document the register flagged as "Document corrections required" was corrected following the Decision Update Procedure. **All four D0 freeze-blocking decisions are now resolved — zero D0 decision blockers remain.** Phase 4 was **not** started; it is ready to begin on explicit founder instruction.

## 2. Files Reviewed

Decision Register (all four target records plus §1 and §5), founder agenda Batch A, Decision Governance Workflow, Decision Update Procedure, Platform Constitution (Preamble, Part VI, Part VII), TRD23 §23.3 and §23.13, PRD0 §14.3, PRD1 §5.2, PRD5 §5, TRD10 §10.5 and §10.10.1, Canonical Reference §3, §9, §11, docs/README.md, root README.md, decisions/README.md, phase tracker.

## 3. Pre-Work Analysis (as required before changes)

**3.1 How founder decisions currently flow through the documentation.** Per the Phase 3A Decision Governance Workflow: identified → registered (OPEN_*) → founder review via the agenda → approved (Final decision / Decision date / Approved by recorded, status → CONFIRMED) → affected documents corrected per the record's *Document corrections required* field (Constitution only via a formal Part VI amendment) → Canonical Reference synchronized in the same change set → Documentation Changes Log entry → decision becomes implementation authority.

**3.2 Ambiguity check.** None found for the four Batch A answers — each answer maps to a listed option (DEC-GOV-001 option (a); DEC-GOV-006 option (a); DEC-LOY-010 option (a); DEC-DATA-003 option (a) with an added condition permitted under Approval Rule 4, "conditional or partial approvals"). No stop-and-report was triggered.

**3.3 Propagation plan confirmed before editing:**
- DEC-GOV-001 → register CONFIRMED → **Constitution Part VII amendment** (Amendment Record entry, version 1.0→1.1) → preamble line 33 (drop Vision & Product Strategy reference) → TRD23 §23.3 register note (light, non-substantive — TRD23's list was already the adopted target) → Canonical Reference §9 (hierarchy list + resolve OPEN marker) → docs/README.md hierarchy section → changes log.
- DEC-GOV-006 → register CONFIRMED, condition ("maintain a complete mapping") recorded in *Final decision* → **no document text changes** (renumbering itself is Phase 4 execution, explicitly out of scope) → docs/README.md and phase tracker updated to show the plan is approved but not yet executed → changes log.
- DEC-LOY-010 → register CONFIRMED → PRD0 §14.3 (remove "reject selected purchases"; replace OPEN editorial note with a CONFIRMED note) → PRD1 §5.2 (clarify wording) → TRD23 §23.13 left unchanged (already stated the confirmed position) → Canonical Reference §3 (new confirmed Trust Principle) → changes log.
- DEC-DATA-003 → register CONFIRMED with its stated boundary condition → PRD5 §5 (confirmed note on Unit Value/Currency) → TRD10 §10.10.1 (add optional `unitValueMinorUnits`/`currencyCode` fields + new "Monetary Metadata Rule" stating these are never read by loyalty logic) → Canonical Reference §3 (new confirmed Trust Principle) → changes log.

No step in this plan required guessing; all four proceeded.

## 4. Task 1 — Decision Register Updated

All four records: Status `OPEN_FOUNDER` → **`CONFIRMED`**; *Final decision*, *Decision date* (2026-07-16) and *Approved by* (Founder — Kenogo) populated with the founder's instruction faithfully quoted/paraphrased, including DEC-DATA-003's explicit boundary condition and DEC-GOV-006's mapping-table requirement. §5 Register Summary updated: CONFIRMED 33→**37**, OPEN_FOUNDER 28→**24** (total unchanged at 103). §1 gained an operational-process note recording the Phase 3B pass and linking this report.

## 5. Task 2 — Document Corrections Executed

### 6. Constitution Amendment (DEC-GOV-001)

`docs/00-governance/platform-constitution.md`:
- Version **1.0 → 1.1**; metadata block and body version line updated; *Last controlled update* records the amendment and cites DEC-GOV-001.
- Preamble (previously listing "the Vision & Product Strategy" among documents that must conform) corrected to drop that reference.
- **Part VII** hierarchy list replaced with the TRD23 §23.3 list (Constitution → PRD → TRD → Commerce Knowledge Standard → Platform Design System → Engineering Standards → Operational Playbooks → API & Integration Guide → Decision Register → Implementation Change Log). Vision & Product Strategy removed — **it will not be authored**.
- New **Amendment Record** subsection added to Part VII (permanent, append-only log of constitutional amendments) documenting this change: date, description, authority (DEC-GOV-001, Founder-approved), version transition. This satisfies Part VI's "deliberate, documented, versioned, backward-conscious" requirement and gives future amendments a fixed place to be recorded.

`docs/02-technical/trd/23-traceability-and-completion-review.md`: a short register note added immediately above §23.3 confirming DEC-GOV-001 is CONFIRMED and pointing to the Constitution amendment — **no change to TRD23's own hierarchy list**, since it was already the adopted target.

## 7. PRD/TRD Changes

**DEC-LOY-010 (individual rejection):**
- `docs/01-product/prd/00-product-foundation.md` §14.3 — removed the "reject selected purchases" bullet; "reject one purchase" clarified to "reject one purchase at a time, providing a reason for that purchase"; the Phase 1 editorial (OPEN) note replaced with a Confirmed note citing DEC-LOY-010 and the founder's stated rationale (different purchases may have different rejection reasons).
- `docs/01-product/prd/01-accounts-roles-and-permissions.md` §5.2 — "reject purchases" clarified to "reject one purchase at a time, each with its own reason (DEC-LOY-010)".
- `docs/02-technical/trd/23-traceability-and-completion-review.md` §23.13 — **unchanged**; it already specified individual, record-specific rejection and is now the confirmed platform-wide position.

**DEC-DATA-003 (monetary fields, reporting-only):**
- `docs/01-product/prd/05-purchase-verification.md` §5 — Confirmed note added directly under the Unit Value/Currency fields stating they are optional reporting metadata, never read by the Loyalty Engine, and pointing to the TRD10 schema.
- `docs/02-technical/trd/10-firestore-data-architecture.md` §10.10.1 — `PurchaseRecordDocument` gains two optional fields, `unitValueMinorUnits?: number` and `currencyCode?: string` (naming and standards consistent with §10.5's existing `currencyCode` convention and the integer-minor-units rule). A new **"Monetary Metadata Rule (DEC-DATA-003)"** subsection states explicitly that these fields are optional, use ISO 4217 / integer minor units where present, and must never be read by Verified Unit issuance, Reward Program progression, Loyalty Cycle calculation or reward eligibility logic — unless a future founder decision introduces amount-based Reward Programs.

**DEC-GOV-006 (requirement-ID renumbering approval):** no PRD/TRD text changes. The approval authorizes the Phase 4 renumbering plan (Requirements ID Audit §5); execution — and the Old ID → New ID mapping table the founder required — is explicitly deferred to documentation Phase 4, which has **not** been started.

All four documents' metadata blocks (*Last controlled update*) were updated to record the specific correction made and cite the relevant DEC ID.

## 8. Canonical Reference Changes

`docs/00-governance/canonical-reference.md`:
- §9 Document Hierarchy — list replaced to match the amended Constitution (10 items, Vision & Product Strategy removed, Decision Register and Implementation Change Log added); the OPEN marker for DEC-GOV-001 replaced with a CONFIRMED note.
- §3 Trust Principles — two new confirmed items added: (9) individual-only rejection with per-record reason (DEC-LOY-010), (10) Purchase Record monetary fields are reporting metadata only and never influence loyalty progression (DEC-DATA-003).
- §11 "What This Reference Does Not Decide" — removed batch-rejection conflict and Purchase Record monetary fields from the open-items list (now resolved); added a "Resolved 16 July 2026 (Phase 3B — Batch A)" note listing all four, and flagging that DEC-GOV-006's *approval* is recorded but the renumbering *execution* remains pending (Phase 4).
- Metadata block *Last controlled update* updated accordingly.

## 9. Documentation Changes Log Entry

Entry 006 appended to `docs/00-governance/documentation-changes-log.md`, listing all decisions processed, all files modified, and the change classification for each (Decision-driven correction throughout; the Constitution edit additionally flagged "Constitutional amendment").

## 10. Validation Results

- **Link check:** 108 relative links checked after this phase's edits, **0 broken** (2 were transiently broken mid-phase pointing at this not-yet-created report; resolved by its creation).
- **Decision ID integrity:** 103 unique DEC-* IDs, 0 duplicates, 0 removed — same 103 records as Phase 3, only statuses/fields changed on the four target records.
- **Register summary arithmetic:** CONFIRMED 37 + OPEN_FOUNDER 24 + OPEN_ENGINEERING 15 + OPEN_PROVIDER 7 + OPEN_LEGAL 6 + DEFERRED 10 + SUPERSEDED 4 + REJECTED 0 = **103** ✓.
- **Requirement IDs unchanged:** BR 98/98, PD 24/24, FR-RP and OP collisions still intentionally present (Phase 4 not begun) — confirmed by spot re-check against the Phase 2/3 baselines.
- **No other OPEN_FOUNDER record's approval fields were touched** — spot-checked the 24 remaining records; all *Final decision* fields remain blank.
- **Constitution self-consistency:** Part VII now lists exactly the same 10 items, in the same order, as TRD23 §23.3; Amendment Record entry present and dated; version bumped consistently in metadata block and body.

## 11. Remaining Founder Decisions

**24 OPEN_FOUNDER records remain**, none freeze-blocking (all were D1–D3 priority):
- **Batch B — Core Loyalty (7):** DEC-LOY-008 (overflow allocation ⭐), DEC-PROD-012 (reward quantity), correction-flow, reminder/expiry ×2, suspension-redemption, pause housekeeping + UI verb.
- **Batch C — Identity (2):** permission inheritance, phone lookup.
- **Batch D — Commercial/profile/legal commissioning (9):** plans, limits, trial, pricing, multi-business, exports, gender, birthday, legal commissioning.
- **Batch E — Pilot/public scope (6):** public pages, cohort, launch bar, free plans, self-suspension, admin subset.

(Exact IDs and full text: [founder-decision-agenda.md](../../00-governance/decisions/founder-decision-agenda.md) Batches B–E.)

## 12. Readiness Assessment for Phase 4

| Gate | Status |
|---|---|
| Constitution amendment complete | ✅ Yes — Part VII amended, version 1.1, Amendment Record entry present |
| Batch A fully propagated | ✅ Yes — all four records' *Document corrections required* items executed; verified against each record individually |
| Register synchronized | ✅ Yes — 4 records CONFIRMED, summary counts recalculated and verified (103 total, arithmetic checked) |
| Canonical Reference synchronized | ✅ Yes — §3, §9, §11 updated in this same change set; no OPEN marker for any Batch A item remains |
| Documentation internally consistent | ✅ Yes — link check 0 broken; Constitution/TRD23 hierarchy now identical; PRD/TRD monetary and rejection text mutually consistent; no contradiction found |

**Recommendation: Phase 4 (Requirement ID Normalization) may now begin on explicit founder instruction.** DEC-GOV-006 — the only gate for Phase 4 — is CONFIRMED. This report does **not** begin Phase 4; it only confirms the gate is open.

## 13. Commands Executed

Python-based exact-string and byte-level edits (used where markdown files contained non-breaking spaces in bold-label lines, confirmed via `cat -A`/`ord()` inspection rather than guessed) for the Constitution; standard string edits elsewhere; the link-checker script (see §10); a register-record parser (regex `re.split(r'(?=^\*\*DEC-[A-Z0-9]+-\d{3})', reg, flags=re.M)`) to re-verify no other record's approval fields changed.

## 14. Configuration Changes

None.

## 15. Risks

1. **Two-tier requirement-ID state persists until Phase 4.** DEC-GOV-006 is approved but not executed; FR-RP/OP collisions remain. No new risk — already flagged since Phase 1/2.
2. **Constitution is now a living amended document.** Any future amendment must use the same Amendment Record table (append, never edit prior rows) — documented in the table's own preamble sentence.
3. **DEC-DATA-003's boundary condition ("money never influences loyalty progression") is now cited in three places** (register, PRD5, TRD10) plus the Canonical Reference — a future change to this rule would need to update all four consistently; the Decision Update Procedure's supersede-never-edit rule governs that scenario.
4. No version control still applies (Git not initialized, per explicit constraint) — recommendation to initialize before Phase 4's high-churn renumbering stands from Phase 3A, reiterated here.

## 16. Rollback Instructions

All edits are additive or quoted-string replacements; nothing was deleted. To roll back Phase 3B: revert the four register records' Status/Final decision/Decision date/Approved by fields to `OPEN_FOUNDER`/blank and restore the previous §5 summary counts (33/28); revert the Constitution to version 1.0 by removing the Amendment Record entry, restoring the original Part VII list (re-adding Vision & Product Strategy) and the original preamble sentence; remove the TRD23 §23.3 register note; revert PRD0 §14.3, PRD1 §5.2, PRD5 §5 and TRD10 §10.10.1 to their Phase 3 text (quoted in full in §7 of this report and in changes-log Entries 002–004); revert Canonical Reference §3/§9/§11 to their Phase 3A text; revert the four agenda items to unanswered; remove changes-log Entry 006 and the Phase 3B tracker row; delete this report.

## 17. Confirmations

**Only the four Batch A decisions were recorded — no other OPEN record was touched or approved · no product behavior was invented beyond what the founder specified · no requirement or traceability IDs were modified · Phase 4 was not begun · no documentation was migrated · Git was not initialized · no architecture was changed · no unrelated files were modified.**
