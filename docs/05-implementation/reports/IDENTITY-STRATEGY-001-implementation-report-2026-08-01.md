> **Title:** IDENTITY-STRATEGY-001 — Progressive Trust Constitutional Realignment — Implementation Report
> **Status:** Complete. Governance-analysis task only — **no application code was modified.**
> **Date:** 2026-08-01
> **Task:** `IDENTITY-STRATEGY-001`, per the Founder's `FD-IDENTITY-001` decision ("Progressive Trust Identity Strategy").
> **Source-of-truth path:** `docs/05-implementation/reports/IDENTITY-STRATEGY-001-implementation-report-2026-08-01.md`
> **Companion documents:** [Impact Assessment and Migration Plan](../../00-governance/decisions/evidence/FD-IDENTITY-001-impact-assessment-and-migration-plan-2026-08-01.md); [Founder Decision Package](../../00-governance/decisions/evidence/FD-IDENTITY-001-founder-decision-package-2026-08-01.md)

---

## Executive Summary

The Founder issued `FD-IDENTITY-001`, a constitutional decision separating Authentication, Identity, and Verification into independent capabilities, removing mandatory phone verification from initial loyalty-programme participation, and introducing Progressive Trust as an ongoing capability rather than a one-time registration gate. The Founder further recommended **Trust Lifecycle Management (TLM)** as the internal engineering name for this capability — adopted throughout this task's output.

Per the task brief, no application code was modified. This task instead produced a complete repository-wide impact assessment, identified every affected governing document and decision record, determined that two `CONFIRMED` decisions (`DEC-PROV-004`, `DEC-SEC-001`) require targeted clause-level amendment (not supersession), drafted the amendment text and a ready-to-record Decision Register entry for the Founder's review, and produced a recommended capability boundary (splitting the current conflated "Capability 2 — Customer Identity" into Identity / Authentication / TLM) and an 8-step migration sequence.

**The critical finding shaping this entire assessment:** no engineering implementation exists yet against the pre-`FD-IDENTITY-001` model. `ENG-P2-001` (Customer Identity Implementation) remains `Blocked` and has zero code. This decision therefore costs nothing in rework — only in documentation and decision-register correction — because it arrives before, not after, the capability it redefines was built.

---

## 1. Documents Affected

Full detail with exact section numbers and current-text quotations: [Impact Assessment §3](../../00-governance/decisions/evidence/FD-IDENTITY-001-impact-assessment-and-migration-plan-2026-08-01.md#3-documents-affected).

| Document | Affected section(s) | Nature |
|---|---|---|
| Decision Register | `DEC-PROV-004`, `DEC-SEC-001` entries | Amendment required |
| Capability Delivery Roadmap (`CDR-001`) | §5 Capability 2 definition | Restructuring required (future task) |
| Capability 2 Resolution Plan | §7 Capability Authorisation Gate | Re-scoping required (future task, after roadmap restructuring) |
| Canonical Reference | §10 MVP Boundaries, §4 Terminology (future) | Wording correction required |
| Platform Constitution | CP-007 Progressive KYC | **No change — already aligned, cite as prior support** |
| PRD2 (Customer Registration and Identity) | §4 Identity 4, §5 Steps 2–4, §7 Account Status | Correction required — §5 is the single most directly contradicted passage in the repository |
| TRD12 (Security and Access Control) | §12.3 Identity Architecture, §12.4.1 Customer Authentication, §12.30/§12.31 | Correction required — §12.4.1 already independently flagged stale by `DEC-PROV-004`/`DEC-SEC-001` for an unrelated reason (Google Sign-In never propagated) |
| TRD10 (Firestore Data Architecture) | §10.6.1 `users` schema | Structural gap identified — no trust-signal fields exist; future schema-design task |
| Requirements Traceability Matrix | ~48 `FR-CI-*`/`FR-SEC-*`/`AIR-*` rows | All "Not Started" — no completed work to retroactively correct |
| Engineering Implementation Programme | Phase 2, `ENG-P2-001` | Zero implementation exists; work-package scope redefinition required (future task) |
| `verified-loyalty-principles.md` / governance-freeze doc | — | **Confirmed unaffected** — governs Reward Lifecycle Engine only, explicitly out of identity/account scope. Pre-existing, unrelated finding: neither file is committed to git history despite being cited as constitutional authority — flagged, not fixed (out of scope). |

## 2. Engineering Tasks Affected

| Work package | Current status | Impact |
|---|---|---|
| `ENG-P2-001` (Customer identity — auth, profile, loyalty number, QR) | `Blocked`, zero implementation | Scope must split into a narrower Identity package plus a new Authentication package before work begins |
| `ENG-P2-004` (Role context and permission resolution) | `Blocked`, zero implementation | **Unaffected in substance** — governs staff/business permissions (`DEC-ID-003`), a separate domain |
| *(new, not yet numbered)* Trust Lifecycle Management implementation | Does not exist yet | New work package required, sequenced after Identity and Authentication (TLM consumes signals — verified phone, verified email, account age — that only exist once those two capabilities are live) |
| `EXT-TECH-001` (Burundi phone-OTP delivery evidence, CR1–CR3 harness work already merged) | `Still Pending` | Its role changes from gating *all* customer registration to gating only the *phone-authentication provider* and the *TLM phone-verification signal* — re-scoping deferred to the future `CDR-001` restructuring task, not decided by this task |
| `DEC-PROD-012` (gender field wording, `OPEN_FOUNDER`) | Unaffected | Independent, unrelated blocking item on the Capability Authorisation Gate |

No work package status was changed by this task. No code was written, read for modification, or touched.

## 3. Decision Records Requiring Amendment

**`DEC-PROV-004`** and **`DEC-SEC-001`** — both `CONFIRMED` 2026-07-30, both require targeted clause-level correction, not full rewrite. Exact current text, exact proposed replacement text, and the reasoning for each: [Founder Decision Package §4–§5](../../00-governance/decisions/evidence/FD-IDENTITY-001-founder-decision-package-2026-08-01.md#4-proposed-amendment--dec-prov-004).

**`DEC-ID-003`** — cross-references `DEC-PROV-004`'s "Progressive Trust Model" but requires no substantive edit; its cross-reference resolves correctly once `DEC-PROV-004` is amended (citation-currency check only, at that future point).

## 4. Decision Records Requiring Supersession

**None.** Both affected decisions retain substantial correct, load-bearing content (provider selections, recovery mechanics, the general progressive-trust *shape*) that a full supersession would incorrectly discard. Reasoning: [Impact Assessment §5](../../00-governance/decisions/evidence/FD-IDENTITY-001-impact-assessment-and-migration-plan-2026-08-01.md#5-decision-records-requiring-supersession).

## 5. Capability Impact Matrix

| Capability | Affected? | Detail |
|---|---|---|
| 0 Engineering Foundation, 1 Platform Foundation | No | Unrelated |
| **2 Customer Identity** | **Yes — redefined, narrower** | Split proposed: Identity / Authentication / TLM (§6 below) |
| 3 Business Identity | No | Separate domain; shared `ENG-P2-004` unaffected |
| 4 First Verified Purchase | No (name collision only) | "Verified" = purchase verification, unrelated concept — flagged for communication clarity, not a content change |
| 5 Progress Tracking, 6 First Reward | No | **Confirmed unaffected by the Founder's own text** — Reward Engine has no verification dependency |
| 7 Business Operations, 8 Platform Operations, 9 Platform Optimisation | No | Unrelated domains |

Full matrix with reasoning per row: [Impact Assessment §7](../../00-governance/decisions/evidence/FD-IDENTITY-001-impact-assessment-and-migration-plan-2026-08-01.md#7-capability-impact-matrix).

## 6. Recommended New Capability 2 Boundary

Split the current, conflated Capability 2 into three:

1. **Capability 2 — Customer Identity (narrowed):** Internal Customer ID, Loyalty Number/QR generation (`DEC-DATA-007`, unaffected), profile, identity-linking across providers. Excludes authentication mechanism and any verification requirement.
2. **Capability "Authentication" (new, carved out of old Capability 2):** provider-agnostic access mechanism (Phone OTP, Google, Apple, Email, Passkeys, future providers) — answers only "is this the same customer," never defines trust.
3. **Capability "Trust Lifecycle Management / TLM" (new):** verified-phone/verified-email signals, account age, purchase/device/merchant history, risk-based verification triggers for high-risk actions. Explicitly does not gate ordinary participation.

Full detail, including the recommended `ENG-P2-*` work-package restructuring (a *recommendation only* — no Programme document was edited by this task): [Impact Assessment §6](../../00-governance/decisions/evidence/FD-IDENTITY-001-impact-assessment-and-migration-plan-2026-08-01.md#6-recommended-new-capability-boundary).

## 7. Risks

1. Terminology collision at rollout between purchase-verification, brand-level "Verified," and identity-verification language already coexisting in this repository.
2. `EXT-TECH-001`/Capability Authorisation Gate re-scoping ambiguity — deliberately left to the future `CDR-001` restructuring task, not resolved here.
3. A pre-existing, disclosed-but-never-mechanically-resolved Decision Register dependency edge between `DEC-PROV-004` and `DEC-SEC-001`, inherited (not created) by this task's proposed amendments.
4. TRD10's `users` schema has no trust-signal fields yet — a prerequisite for TLM implementation, not a blocker to Founder-approving the decision itself.
5. Governance-artifact drift (Programme/`CDR-001`/RTM sync) is this repository's own established deferred-follow-on pattern, inherited again here unless a dedicated sync task is explicitly scheduled.

Full detail: [Impact Assessment §8](../../00-governance/decisions/evidence/FD-IDENTITY-001-impact-assessment-and-migration-plan-2026-08-01.md#8-risks).

## 8. Recommended Implementation Order

1. Founder review and countersign of `FD-IDENTITY-001` (via the [Founder Decision Package](../../00-governance/decisions/evidence/FD-IDENTITY-001-founder-decision-package-2026-08-01.md)).
2. Decision Register update — record `DEC-IDENTITY-001` (proposed ID), apply amendment text to `DEC-PROV-004`/`DEC-SEC-001`.
3. Governing-document correction pass — PRD2 §5/§7, TRD12 §12.3/§12.4.1, Canonical Reference §10.
4. `CDR-001` restructuring — split Capability 2, insert Authentication and TLM, re-sequence `ENG-P2-*` (Engineering-Lead-authored, own review cycle).
5. Capability Authorisation Gate re-scoping (decided as part of step 4, not before).
6. RTM / Engineering Implementation Programme sync — dedicated, narrowly-scoped task.
7. Schema design task (TRD10 `users`/`customerProfiles` trust-signal fields) — sequenced after step 4 confirms TLM's exact scope.
8. `ENG-P2-001` (narrowed)/Authentication/TLM implementation begins — only once steps 1–7 complete. This is where "engineering resumes," explicitly out of this task's scope.

Full detail: [Impact Assessment §9](../../00-governance/decisions/evidence/FD-IDENTITY-001-impact-assessment-and-migration-plan-2026-08-01.md#9-recommended-migration-sequence).

## 9. Rollback Strategy

Because zero implementation exists against the pre-`FD-IDENTITY-001` model, rollback is a pure documentation/decision-register action with no code, schema, or data-migration component. If the Founder does not countersign, nothing changes (this task's output is read-only proposals). If countersigned then later reversed, every governing-document edit is a normal git commit (`git revert` restores prior wording exactly); the Decision Register amendment itself would need its own explicit Founder-authorized reversal entry, per this repository's standing rule that decisions are amended or superseded, never silently rewritten. Full detail: [Impact Assessment §10](../../00-governance/decisions/evidence/FD-IDENTITY-001-impact-assessment-and-migration-plan-2026-08-01.md#10-rollback-strategy).

## 10. Files Created (this task)

- `docs/00-governance/decisions/evidence/FD-IDENTITY-001-impact-assessment-and-migration-plan-2026-08-01.md` (new)
- `docs/00-governance/decisions/evidence/FD-IDENTITY-001-founder-decision-package-2026-08-01.md` (new)
- `docs/05-implementation/reports/IDENTITY-STRATEGY-001-implementation-report-2026-08-01.md` (new, this file)
- `docs/00-governance/documentation-changes-log.md` (Entry 052 appended)
- `docs/changes/IMPLEMENTATION_CHANGES.md` (dated entry appended)

**No other file was created, modified, or deleted.** No application code, PRD, TRD, Decision Register entry, Canonical Reference, Platform Constitution, `CDR-001`, Engineering Implementation Programme, or Requirements Traceability Matrix was edited — all are analyzed and quoted verbatim in the two evidence documents above, pending Founder action.

## Status

`EXT-TECH-001`: unchanged, **Still Pending**. Capability 2: unchanged, **Blocked** (on `EXT-TECH-001`/`DEC-PROD-012`, pending the future gate re-scoping this task recommends but does not perform). `FD-IDENTITY-001`/`DEC-IDENTITY-001`: **awaiting Founder countersign** — this task's deliverables are ready for that review.
