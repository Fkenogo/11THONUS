> **Title:** FD-COM-001-REC-ASSESS-001 — Commercial Authority Recovery, Provenance and Canonicalisation Assessment  
> **Version:** 1.0 · **Status:** Assessment record — **RECOVERY BLOCKED, Founder reconfirmation required** · **Classification:** Working (governance/assessment record)  
> **Governing documents:** 11thONUS Platform Constitution; [Decision Register](../../00-governance/decisions/decision-register.md); [Platform Governance TRD18](../../02-technical/trd/18-platform-governance-and-administration.md); [TRD17](../../02-technical/trd/17-subscription-and-billing.md)  
> **Source-of-truth path:** `docs/05-implementation/reports/FD-COM-001-REC-ASSESS-001-commercial-authority-recovery-and-provenance-assessment-2026-09-29.md`  
> **Scope:** Assessment only. No commercial decision was created, adopted, restored, merged or canonicalised. No application code, database schema, migration, dependency, configuration, Firebase or infrastructure was changed. No Operator Console, commercial API or payment integration was built. No Experience Assembly was started. **No decision was manufactured to fill a documentation gap.**

# FD-COM-001-REC-ASSESS-001 — Commercial Authority Recovery, Provenance and Canonicalisation Assessment

## 1. Outcome (read first)

**FD-COM-001 RECOVERY BLOCKED — FOUNDER RECONFIRMATION REQUIRED.**

Provenance is **insufficient** to establish that the Founder previously approved the consumption-first commercial model, or that the six untracked candidate files accurately record such an approval. Per the task's canonicalisation gate, **nothing was canonicalised**. The Decision Register, TRD17, `CDR-001`, the Master Workflow and the Decision Register totals are **unchanged**.

The blocking finding is narrow and factual, and it is the opposite of the task's working assumption:

> **No repository evidence of Founder approval of FD-COM-001 exists — anywhere.**
> The decision file asserts its own approval and cites a Decision Register entry (`DEC-SUB-014`, Status CONFIRMED) that **does not exist on `origin/main` and never existed in any git object**. Meanwhile the Founder Decision Agenda on `main` **still poses the trial structure and the grace/pricing questions as open Founder decisions**, and `DEC-SUB-003` (Trial structure) is still `OPEN_FOUNDER`.

The decision may well have been discussed and favoured. What cannot be established from this repository is that it was **approved**, in the sense this repository uses that word.

## 2. Repository and evidence baseline

- **Repository:** `Fkenogo/11THONUS` (origin `https://github.com/Fkenogo/11THONUS.git`), verified.
- **Entry `origin/main` SHA:** `09a6c084013e9b5b52cf594f9a9d9f20a8dbf9d9` (merge of PR #282, `CAPABILITY-6-REDEMPTION-ENGINE-001-MERGE-CLOSE-001`), verified by `git fetch origin --prune && git rev-parse origin/main` at assessment start.
- **Isolated worktree:** `/Volumes/PRODUCTION/Projects/11THONUS-worktrees/fdcom-recovery-001`, created clean from that SHA; branch `docs/fdcom-001-recovery-assessment`; **0 modified files at entry**. No file in the primary checkout was created, moved, staged, modified, committed, stashed or deleted.
- **Primary checkout contamination (recorded read-only, unchanged):** branch `docs/11thonus-cf-001-cloudflare-assessment-001` at `d4f674c96fd65f9f77557808a5c1f04fb36df1eb`; **384 porcelain entries (256 `D`, 91 `M`, 11 `MM`, 26 `??`)**; 0 stashes. Its HEAD **is** an ancestor of `origin/main` (corrected from the prior assessment's reverse-direction test, which was inconclusive as stated).
- **Method:** `git ls-tree`, `git log --all -S` (pickaxe) on `Consumption Unit`, `FD-COM-001`, `DEC-SUB-014`, `consumption-first`, `10+1`; `git for-each-ref --contains`; `git fsck --dangling`; `git cat-file`/`git show` on checkpoint objects; `git ls-remote --heads`; `grep`/`find` in the isolated worktree. The `search_codebase` tool was **not** used for evidence because it roots at the contaminated primary checkout.

## 3. Git-history and branch provenance (Phase 1 findings)

| Probe | Result |
|---|---|
| `git ls-tree -r --name-only HEAD \| grep -i fd-com` | **no match** — absent from `main` |
| `git log --all --oneline -- '*[Ff][Dd]-[Cc][Oo][Mm]*'` | **no match** — never committed on any branch |
| `git ls-remote --heads origin \| grep -i fd-com\|commercial` | **no match** — no remote branch |
| `git for-each-ref --contains <fd-com commits>` | only `refs/cline/checkpoints/…` — **tool-local checkpoint refs, no branch, never pushed** |
| `git log --all -S 'Consumption Unit' / 'consumption-first' / '10+1'` | hits **only** `refs/cline/checkpoints/*` and cline stash/index commits |
| `git log --all -S 'DEC-SUB-014'` | hits **only** the same checkpoint/stash objects — **never in any branch commit** |
| `git fsck --dangling` | ~600+ dangling commits; message scan found **no** FD-COM/commercial-consumption commit |

**Conclusion:** the FD-COM-001 material has **never existed in any commit reachable from any branch or remote**. Its only repository footprint is agent-tool checkpoint snapshots of the contaminated working directory, plus the working files themselves. The content in the primary checkout is **byte-identical** to checkpoint `b73a80d` (SHA-256 `e10d516b0eb2c37a…` for the decision file) — i.e. it is a snapshot of uncommitted work, not a recovered history.

## 4. Candidate file inventory and provenance classification (Phase 2)

The primary checkout contains **26 untracked paths**, of which **6** are FD-COM-001 candidates. All were read read-only.

| # | Path | Loc | SHA-256 (16) | Purpose | Classification |
|---|---|---|---|---|---|
| 1 | `docs/00-governance/decisions/evidence/FD-COM-001 — 11thONUS Core Commercial Model Decision.md` | 408 | `e10d516b0eb2c37a` | The decision itself: consumption-first model, Consumption Unit, grace, trial, tiers, §22 register claim | **UNKNOWN PROVENANCE** |
| 2 | `docs/05-implementation/reports/fd-com-001-consumption-first-commercial-architecture-impact-assessment-2026-09-02.md` | 362 | `b754f1f41f0cc139` | Stage 1 impact assessment; §21's required reconciliation | **SUPPORTING EVIDENCE** (of the unmerged analysis, not of approval) |
| 3 | `docs/05-implementation/reports/fd-com-001-rec-001-commercial-model-governance-requirements-reconciliation-report-2026-09-02.md` | 164 | `3304e69b95d36ecd` | Stage 2 governance reconciliation; claims TRD17 rewrite, register note, `DEC-SUB-003`→SUPERSEDED | **SUPPORTING EVIDENCE** |
| 4 | `docs/05-implementation/reports/fd-com-001-rec-002-requirements-traceability-and-reference-closure-report-2026-09-02.md` | 186 | `71eccf68f6ea8fcb` | Stage 2 traceability; claims `FR-CNS-*` rename, 34 new rows | **SUPPORTING EVIDENCE** |
| 5 | `docs/05-implementation/reports/fd-com-001-prog-001-master-engineering-programme-alignment-report-2026-09-02.md` | 127 | `7bb1e1336de721c1` | Master programme alignment; **states "Everything from this task is uncommitted… Nothing was committed or pushed."** | **SUPPORTING EVIDENCE** |
| 6 | `docs/06-engineering-governance/fd-com-001-reconciliation-tracker.md` | 167 | `6d0be47a3c0c83a4` | Status-only tracker; cites `DEC-SUB-014` CONFIRMED | **SUPPORTING EVIDENCE** |

**Package coherence:** the six form **one internally consistent, non-duplicated decision package** — decision + impact assessment + two reconciliation passes + programme alignment + tracker. Dates, identifiers and stage numbering are coherent (all 2026-09-02 except the decision, dated 2026-09-02). No material internal contradiction was found. They are **not** drafts of each other.

**None is classified RECOVERABLE AUTHORITATIVE MATERIAL.** Per the task's instruction, UNKNOWN material is not canonicalised, and file 1 is UNKNOWN for the reasons in §5.

## 5. Why provenance is insufficient (the blocking evidence)

1. **The decision file's own status is not an approval.** Line 5 reads `**Status:** APPROVED FOR GOVERNED RECONCILIATION` — approved *for reconciliation*, which is precisely the "reconcile it, don't build on it" posture. It is not `APPROVED`, and there is no `Approved by:` or signature field anywhere in the file. Contrast the register's own convention, where every confirmed decision carries an explicit `Final decision: … · Decision date: … · Approved by: …` line.
2. **The decision file's central factual claim is false.** §22 states: *"This decision is recorded in the Decision Register as **`DEC-SUB-014`** … Status: **CONFIRMED**."* Verified on `origin/main`: the `DEC-SUB` family runs `DEC-SUB-001`…**`DEC-SUB-013`** with **no `DEC-SUB-014`**, and the register's own `Register Summary` totals **119 records** with no such entry. `git log --all -S 'DEC-SUB-014'` finds it only in agent-checkpoint objects. **A decision that self-certifies a register entry which does not and never did exist cannot be relied on as an accurate record of an approval event.**
3. **Canonical governance still treats the questions as open.** On `main`, `founder-decision-agenda.md` **Batch D** still asks the Founder: `D3. Trial — DEC-SUB-003: time-based, usage-based, or "30 days or 100 verified purchases, whichever comes first"?` and `D4. Prices and billing — DEC-SUB-008: … grace period length (7/14/30 days) …`. The register still shows `DEC-SUB-003 — Trial structure` as **`OPEN_FOUNDER`** (not SUPERSEDED, as the tracker's change log claims). A committed governance record that still solicits a Founder decision on trial and grace is the strongest available evidence that **no approval was recorded**.
4. **The claimed reconciliation never landed.** Every change the supporting reports claim is absent from `main`: TRD17 is still `v1.0 Draft for approval (pre-freeze)`, **subscription-first** (not the claimed consumption-first rewrite); `FR-CNS-*` rows = **0** across the whole suite (REC-002 claimed 34); `FD-COM` = **0** in `canonical-reference.md`, `assumptions-register.md`, `requirements-traceability-matrix.md`, `engineering-implementation-programme.md`; `DEC-SUB-003` is still `OPEN_FOUNDER` (REC-001 claimed SUPERSEDED). One report even self-documents the reason: PROG-001 §16 — *"Everything from this task is uncommitted… Nothing was committed or pushed."*
5. **No changes-tracking record exists.** Neither `documentation-changes-log.md` nor `IMPLEMENTATION_CHANGES.md` contains any entry recording FD-COM-001 approval or reconciliation. Every one of the ~30 FD-COM-001 mentions in `IMPLEMENTATION_CHANGES.md` on `main` is a **negative** assertion — "FD-COM-001 untouched", "no FD-COM-001 contact", "primary FD-COM-001 worktree untouched". The repository consistently records FD-COM-001 as **work that was avoided**, never as work that was accepted.
6. **Two existing reports explicitly and deliberately refused it as authority.** `DEC-LEGAL-002-BT-WHOLE-RECON-001-…-2026-09-03.md:37` and `documentation-changes-log.md:1686` both record that a register lookup surfaced `DEC-SUB-014`/`FD-COM-001`, that this was "an uncommitted, unrelated Founder commercial-model decision sitting only in the primary worktree's working tree", and that it "does not exist on `origin/main`… It is not referenced further in this report and did not inform any classification below." `DATA-ARCH-001-…-2026-09-08.md` classifies the FD-COM-001 ledger/grace/top-up rules as **"PROVISIONAL / UNGOVERNED INPUT"** (`:76`, `:122`) and `:31` records their verified absence from `origin/main`.

### 5.1 The one canonical document that appears to treat FD-COM-001 as settled — and why it is not evidence

`11thonus-cf-001-cloudflare-capability-and-architecture-alignment-assessment-2026-09-19.md:51` lists, under "SETTLED (not reopened by this assessment)": *"Consumption-first commercial model (`FD-COM-001` / `DEC-SUB-014`)."*

This is **not** corroboration, and it is a **newly identified documentation defect**:

- CF-001's own evidence basis records its base as `a404a53…` on branch **`docs/dec-legal-002-bt-draft-007`** — the contaminated primary worktree's branch lineage, whose working tree holds the FD-COM-001 files.
- CF-001 contains **no** contamination disclosure, unlike every other report that touched the primary checkout (each explicitly records that it stayed out of it). The pattern is consistent with CF-001 having read the unmerged material and treated it as settled.
- It cites `DEC-SUB-014`, an identifier that does not exist in the register it claims to have consulted (CF-001 §1 cites the register at "last controlled update 2026-09-17" — a date on which no register entry carried `DEC-SUB-014`).

**Recorded as documentation conflict FDC-DC-01 (§11).** It is the sole place on `main` where FD-COM-001 is asserted as governing, and it is contradicted by the register. Per the task's constraint to not modify unrelated files, CF-001 is **not** amended by this task; a bounded correction is recommended (§14).

## 6. Verified commercial chronology

| Date | Event | Canonical? |
|---|---|---|
| 2026-07-16 | TRD17 v1.0 authored — **subscription-first**, "Draft for approval (pre-freeze)" | **Yes** — on `main`, unchanged since |
| — | `DEC-SUB-001`…`013` created (plan names, staff limits, trial, plan catalogue, multi-business, exports, free plans). Mix of `OPEN_FOUNDER` and `CONFIRMED`; `DEC-SUB-011`/`012` `SUPERSEDED` | **Yes** — on `main` |
| — | TRD18 §18.5 defines 11 admin roles incl. §18.5.3 Subscription Administrator; billing permissions `billing.view`/`review_payment`/`manual_confirm`/`refund`/`plan_override` | **Yes** — on `main` |
| 2026-09-02 | FD-COM-001 decision + impact assessment + REC-001/REC-002 + PROG-001 authored **in the contaminated primary worktree only** | **No** — never committed |
| 2026-09-02 | `DEC-LEGAL-002-BT-PART-VII-*` merged to `main` (PR #212) — unrelated track | **Yes** |
| 2026-09-03 | `DEC-LEGAL-002-BT-WHOLE-RECON-001` records FD-COM-001 as unmerged, absent from `main`, and excludes it | **Yes** — exclusion recorded |
| 2026-09-08 | `DATA-ARCH-001` classifies FD-COM-001 commercial rules as PROVISIONAL / UNGOVERNED INPUT | **Yes** — exclusion recorded |
| 2026-09-19 | CF-001 lists the consumption-first model as SETTLED (contaminated read) | **Yes** — but defective (FDC-DC-01) |
| 2026-09-27 | `DEC-LOY-018` redemption authority recorded | **Yes** |
| 2026-09-29 | This assessment | branch only |

**No commit, PR, review, approval or merge event for FD-COM-001 exists at any point in repository history.**

## 7. Commercial rules: proven vs not proven

The task supplied an "expected previously-approved direction" and asked that it be verified rather than assumed. **None of it is proven as approved.** The table records what each rule's status actually is on `main`.

| # | Expected rule | Proven as previously approved? | Actual status on `main` | Candidate-file support (unproven) |
|---|---|---|---|---|
| 1 | Consumption-first, not subscription-tier-first | **NO** | TRD17 v1.0 remains **subscription-first** | FD-COM-001 §1, §20 |
| 2 | Charging unit = completed 10+1 / Circle | **NO** | Threshold 10 is governed (`LOYALTY_CYCLE_THRESHOLD = 10`), but no commercial unit exists; no billing code | §2, §5 |
| 3 | Billable point at 10 verified transactions | **PARTIAL (truth) / NO (commercial)** | Loyalty threshold governed; **no billable-point concept anywhere**; the term has no referent in any document | §2 |
| 4 | Flat ~USD 1 equivalent per unit | **NO** | Not governed. Candidate §3/§5 is explicitly illustrative; the decision itself says "The exact price is not approved by this decision" | §3, §5 |
| 5 | **Trial allowance 3–5 units** | **NO** | `DEC-SUB-003` (Trial structure) is **`OPEN_FOUNDER`**; agenda still asks the Founder. **No 3–5 range exists in any document.** Candidate says 5 is a "working hypothesis… configurable and subject to pilot validation" | §7 |
| 6 | Grace — finish active Circles | **NO** | `DEC-SUB-008` (plan catalogue incl. grace values) is **`OPEN_FOUNDER`**; agenda D4 still asks grace length. **Note:** loyalty-side `DEC-LOY-011` is CONFIRMED and separately guarantees earned rewards stay redeemable during suspension | §9 |
| 7 | Negative credit recoverable | **NO** | No credit/negative-balance concept in production or in any governing document | §10 (outstanding units) |
| 8 | New-Circle start blocked at zero capacity | **NO** | No cycle-start balance gate exists | §9 |
| 9 | Earned rewards preserved / restriction must not cancel them | **PARTIALLY — INDEPENDENTLY GOVERNED** | **`DEC-LOY-011`** (CONFIRMED) + PRD06 §5 (retired programmes still redeemable) already guarantee this. **This protection does not depend on FD-COM-001** | §18 |
| 10 | Notifications/visibility accompany commercial standing | **NO** | Low-balance thresholds explicitly "remain configurable"; nothing governed | §8 |
| 11 | Self-approval prohibited | **NOT IN CANDIDATE** | A real existing principle (`DEC-GOV-011` Knowledge Studio: "one person edits, another approves"; editor-may-edit-any-eligible-draft, self-approval separation). **The candidate FD-COM-001 does not contain this rule** | — |
| 12 | Subscription tiers deferred | **NO** | `DEC-SUB-001` (plan names) and `DEC-SUB-002` (staff limits) are `OPEN_FOUNDER` — the Founder is still being asked. Candidate §13 defers tiers | §13–15 |
| 13 | Manual Platform Administrator commercial activation before payment integration | **NOT PROVEN — and classified separately (§9)** | Not in the candidate decision at all. See §9 | — |

**Item 9 is the one place where the Experience Reference and canonical Product Truth already agree** — customer-protection behaviour is governed independently by `DEC-LOY-011`, so the adopted experience's "earned rewards are preserved" strand is bindable **today**, without FD-COM-001.

**Item 11 must not be attributed to FD-COM-001.** Self-approval separation is an existing governance principle from `DEC-GOV-011`/Knowledge Studio; the candidate decision says nothing about it.

## 8. Reconciliation with current authority (Phase 3)

**A. Subscription-first assumptions FD-COM-001 would supersede (if approved).** `TRD17` v1.0 in full; `DEC-SUB-001` plan names, `DEC-SUB-002` staff limits, `DEC-SUB-003` trial structure, `DEC-SUB-008` plan catalogue (BIF prices, intervals, grace values, proration), `DEC-SUB-009` multi-business subscription, `DEC-SUB-013` free plans; `DEC-SUB-004`/`006`/`007` (entitlement mechanics); `CDR-001` Capability 7 objective text; Master Workflow P10 row; `ENG-P10-001/002/003`; the unused `subscriptionId` field, documentation-only `SubscriptionDocument` schema, and the never-thrown `SUBSCRIPTION_LIMIT_REACHED` error.

**B. Enduring Product Truth that remains valid regardless.** `LOYALTY_CYCLE_THRESHOLD = 10` and the loyalty-cycle engine; `DEC-LOY-011` suspension default-redeemable; PRD06 §5 retired programmes still redeemable; `DEC-LOY-016/017` Business-owned Qualifying Items; `DEC-LOY-018` redemption authority; `DEC-GOV-011` knowledge-platform administrator scope and self-approval separation; the PostgreSQL foundation; `commerceKnowledge` (classification-only taxonomy).

**C. Documentation that must be amended if FD-COM-001 is later approved.** TRD17 (rewrite or supersede); `DEC-SUB-001/002/003/008/009/013` statuses; `canonical-reference.md`; `assumptions-register.md`; `requirements-traceability-matrix.md` (`FR-SUB-*` → `FR-CNS-*`); `CDR-001` Capability 7; Master Workflow P10; `engineering-implementation-programme.md` `ENG-P10-*`; the 2026-09-03/09-08 exclusion notes in `DEC-LEGAL-002-BT-WHOLE-RECON-001` and `DATA-ARCH-001`; and **CF-001 line 51** (FDC-DC-01).

**D. Implementation eventually requiring alignment (NOT touched).** No commercial engine exists in production. The only commercial-adjacent artefacts are the inert `subscriptionId?` field, the documentation-only `SubscriptionDocument`, and the never-thrown `SUBSCRIPTION_LIMIT_REACHED` code. Migrations `0001`–`0020` contain no commercial/credit/trial concept. `commerceKnowledge` is classification-only. `platformAdministration` is knowledge-only (2 roles, 7 `knowledge.*` permissions). **Nothing in production implements a subscription model, and nothing implements a consumption model.**

**E. Genuinely undecided.** Trial structure; unit price; grace duration; plan names/staff limits; whether premium tiers exist and when; multi-business billing; the entire consumption-unit ledger; commercial restriction/restore semantics; manual activation mechanics.

## 9. Manual launch operations and Operator Console commercial capability (Phase 4)

Per the task's caution, the Experience Reference's manual-activation operational requirement is classified **separately** and is **not** attributed to FD-COM-001. The candidate decision contains **no** manual-activation provision; §14's "Future Premium Capabilities" and §15's one-time-entitlement direction are about premium monetisation, not launch operations.

| Operator capability (Founder's list) | Classification | Basis |
|---|---|---|
| Grant/manage trial access | **Genuinely new Product Truth** | `DEC-SUB-003` `OPEN_FOUNDER` — the trial rule itself is undecided |
| Record offline/manual commercial settlement/reference | **Operational implementation of existing authority** *in principle* — but blocked | TRD18 §18.5.3 grants `billing.manual_confirm`; a manual billing action is already an authorised concept. The *consumption-unit* form is blocked on MC-01/FD-COM-001 |
| Activate paid service manually before payment integration | **Operational implementation of existing authority**, subject to a Founder-approved trigger | TRD18 §18.5.3 "approve governed manual billing actions"; `DEC-LOY-*`/`DEC-BUS-ACT-001` already include business activation after verification. **Closest to already-authorised** |
| Adjust commercial credit where authorised | **Genuinely new Product Truth** | No credit concept exists; TRD18 `billing.plan_override` is a *subscription* capability, not a consumption-credit one |
| View commercial standing/history | **Genuinely new Product Truth** | No commercial read model exists |
| Restrict/restore commercial service per governed rules | **Operational implementation of existing authority** | `DEC-LOY-011` (suspension default-redeemable) and TRD18 §18.5.2 "suspend or restore businesses where permitted" already govern the *loyalty-protection* side |
| Preserve earned rewards and active-Circle grace | **Already governed** | `DEC-LOY-011` CONFIRMED; PRD06 §5. The grace *commercial* framing still depends on the undecided commercial model |

**No Platform Administrator RBAC was invented.** The Founder remains the initial sole Platform Administrator; differentiated roles stay deferred (`DEC-GOV-011` narrowed the live scope to `knowledge_editor`/`knowledge_approver`; `DEC-GOV-007` — which of the 11 roles exist at launch — remains open, and is still posed to the Founder as agenda item E6).

## 10. Files modified, diff summary, commands, checks

- **Files modified (1, documentation only):** this report. Nothing else in the repository was changed. The Decision Register, TRD17, `CDR-001`, Master Workflow, `canonical-reference.md`, `assumptions-register.md`, traceability matrix, `engineering-implementation-programme.md` and the Experience Reference binding assessment are **all untouched and remain accurate as written** (MC-01's factual core — FD-COM-001 is absent from `main` — remains true and is not "incorrectly represented").
- **Diff:** one added file. `git status --porcelain` shows no modification outside `docs/`.
- **Key commands:** `git fetch origin --prune`; `git rev-parse origin/main`; `git ls-tree -r --name-only HEAD`; `git log --all -S '<term>'` (×5 terms); `git log --all --name-only -- '*fd-com*'`; `git for-each-ref --contains`; `git ls-remote --heads origin`; `git fsck --dangling`; `git worktree add … --detach origin/main`; `git show`/`git cat-file` on checkpoint objects; `grep` across the isolated worktree.
- **Checks:** `git diff --check` (whitespace); `git status --porcelain | grep -v '^.. docs/'` (empty ⇒ docs-only); primary checkout re-counted at 384 entries, unchanged.
- **Tests:** none — documentation-only, no code change.
- **Dependencies / config / schema / migrations / deployment / database actions:** **none, none, none, none, none.**
- **.md change tracking:** see §13.
- **Branch/head/PR state:** `docs/fdcom-001-recovery-assessment` from `09a6c084…`; **not pushed, no PR opened, not merged.**

## 11. Documentation conflicts remaining

| ID | Conflict | Evidence | Recommended amendment |
|---|---|---|---|
| **FDC-DC-01** | CF-001 lists the consumption-first model as **SETTLED** citing a non-existent `DEC-SUB-014`; authored from the contaminated branch with no contamination disclosure | `11thonus-cf-001-…-2026-09-19.md:51` vs register (`DEC-SUB-001…013`, total 119) | **Bounded correction:** restate as *not established on `origin/main`; FD-COM-001 unmerged*. Not performed by this task (unrelated merged record) |
| FDC-DC-02 | Candidate tracker claims `DEC-SUB-003` → SUPERSEDED; register still `OPEN_FOUNDER` | tracker §7 vs register | Resolved by not canonicalising; will re-appear only if the Founder approves |
| FDC-DC-03 | TRD17 v1.0 subscription-first vs the adopted consumption-first experience | TRD17 vs Experience Reference | Blocked on Founder decision (MC-01) |
| FDC-DC-04 | `DATA-ARCH-001` sized its recommendation while excluding all FD-COM-001 inputs | `DATA-ARCH-001:76,122` | Reassess on governance, not back-fill authority (the report says so itself) |
| FDC-DC-05 | MC-01 in the binding assessment remains **correct**: FD-COM-001 is absent from `main` | `11THONUS-EXP-REF-001` §6.2 | **No amendment required** — the assessment's factual claim stands; only its *resolution path* is now clearer |

## 12. Truth gaps remaining after reconciliation

Unchanged and, if anything, now more precisely bounded: consumption-unit ledger; billable-point definition; unit price; trial allowance (any value); grace duration/limits; negative-credit handling; zero-capacity new-cycle gate; commercial standing computation; restriction/restore semantics; manual-activation trigger and authority; commercial credit adjustment; commercial history; commercial audit read model; notification thresholds.

## 13. `.md` change-tracking

Per repository convention this assessment adds an `IMPLEMENTATION_CHANGES.md` entry and a `documentation-changes-log.md` entry. Both are inserted into the `fdcom-recovery-001` branch only, and both record the assessment as **BLOCKED with no governance change**. No Decision Register row, no `DEC-SUB-*` status, and no register total is touched.

## 14. Exactly what requires Founder reconfirmation

For the Founder to unblock recovery, each item must be **re-affirmed as current intent**, because none is provable from this repository:

1. **The commercial model itself** — is consumption-first (Consumption Unit per completed 10+1 Cycle) the approved Phase 1 model, superseding subscription-first TRD17?
2. **Trial allowance** — a specific value, replacing the still-`OPEN_FOUNDER` `DEC-SUB-003`. The prototype's 5 and any "3–5" range are **not** evidence of approval.
3. **Unit price** — the decision explicitly declined to set it; is ~USD 1 equivalent approved?
4. **Grace** — duration and limits, replacing part of `OPEN_FOUNDER` `DEC-SUB-008`.
5. **Negative credit / outstanding-unit settlement** — confirmed as intended?
6. **Tier deferral** — confirm Phase 1 has no capability tiers, superseding `DEC-SUB-001`/`002` plan questions.
7. **Manual launch activation** — a **separate** Founder decision (not FD-COM-001): is manual paid-service activation by the sole Platform Administrator authorised before payment integration, under what trigger, and what audit?
8. **The `DEC-SUB-014` discrepancy** — whether a register entry was intended and lost, or was asserted in error. This should be stated explicitly so the register's numbering history is not corrupted on recovery.

## 15. Risks and rollback

- **Risk:** adopting the candidate material as authoritative would place an unapproved commercial model into governance on the strength of a self-asserted status and a register entry that does not exist — the precise failure mode this task exists to prevent. **Avoided.**
- **Risk:** leaving CF-001 line 51 uncorrected may mislead a future reader. Bounded correction recommended; not performed here to respect the "do not modify unrelated files" constraint.
- **Risk:** the contaminated primary checkout remains a standing contamination hazard (384 entries; any tool reading it can surface non-authoritative commercial material). Recommend quarantining it.
- **Rollback:** delete this report and revert the two change-tracking entries: `git checkout origin/main -- docs/changes/IMPLEMENTATION_CHANGES.md docs/00-governance/documentation-changes-log.md`. Optionally `git worktree remove /Volumes/PRODUCTION/Projects/11THONUS-worktrees/fdcom-recovery-001`. The primary checkout needs no rollback — it was not modified. No database, migration, deployment, configuration or dependency rollback is required, because none occurred.

## 16. Recommended next task

**A bounded Founder reconfirmation session for the 8 items in §14**, recorded as a proper Founder decision in the established governance location, followed by a governance-only reconciliation package (TRD17 supersession, `DEC-SUB-*` statuses, `CDR-001`/Master Workflow currency, traceability, and the CF-001 correction). Experience Assembly remains blocked for all commercial and Operator Console surfaces until that decision is recorded.

**FD-COM-001 RECOVERY BLOCKED — FOUNDER RECONFIRMATION REQUIRED**

**EXPERIENCE ASSEMBLY — NOT STARTED**
