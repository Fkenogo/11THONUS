> **Title:** ENG-P2-GATE-001 — `DEC-PROD-012` Capability Authorisation Gate Scope Determination
> **Version:** 1.0 · **Status:** Governance interpretation and synchronisation record · **Classification:** Working (execution-layer governance record)
> **Governing document:** [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-PROD-012`; [`ENG-P2-RES-000` §7](ENG-P2-RES-000-capability-2-resolution-plan.md#7-capability-authorisation-gate); [`ENG-P2-001-PLAN-001`](ENG-P2-001-PLAN-001-customer-identity-decomposition-plan.md)
> **Source-of-truth path:** `docs/05-implementation/roadmap/ENG-P2-GATE-001-dec-prod-012-scope-determination.md`
> **Last controlled update:** 2026-08-07 (`DEC-PROD-012` closure — Option D: closure banner added; the residual gender-field gate is discharged by omission). Previously: 2026-08-02 (`ENG-P2-GATE-001` — created)

# ENG-P2-GATE-001 — `DEC-PROD-012` Capability Authorisation Gate Scope Determination

**This document is a governance interpretation and repository-synchronisation record. It does not close, record, or restate the resolution of `DEC-PROD-012`. It does not invent a gender-value policy. It does not begin any `ENG-P2-001` child package.**

> **[SUPERSEDED IN PART — `DEC-PROD-012` closure, 2026-08-07]** This determination scoped the `DEC-PROD-012` gate to `ENG-P2-001-02`'s `gender` field only; it was written while `DEC-PROD-012` was `OPEN_FOUNDER`. The Founder has since **CLOSED `DEC-PROD-012`** by selecting **Option D** — gender is not collected at MVP; the `gender` attribute is removed from the MVP Customer Profile schema (future-additive under a separate governed decision). The one remaining `gender`-field gate this document identified is therefore **discharged by omission**: `ENG-P2-001-02` is no longer blocked by `DEC-PROD-012` and is technically authorised to begin, pending a fresh Founder implementation authorization. This document's scope analysis is retained for audit continuity; see the [Decision Register `DEC-PROD-012`](../../00-governance/decisions/decision-register.md) and the [implementation report](../reports/DEC-PROD-012-implementation-and-eng-p2-001-02-unblock-2026-08-07.md) for the authoritative closure.

## 1. Gate Authority Analysis

`ENG-P2-RES-000` §7 ("Capability Authorisation Gate") is an execution-layer, Founder-approved planning document (merged via PR #28, 2026-07-29) — the same authority tier as `CDR-001` and the Engineering Implementation Programme, not a constitutional or Decision-Register-level document. Its own chapeau reads: **"`ENG-P2-001` — Customer Identity Implementation may begin only when all of the following are objectively verifiable against live repository/register state."**

This chapeau was written on 2026-07-29/30, when `ENG-P2-001` was still a single, undecomposed work package (the Engineering Implementation Programme's own definition at the time: "Customer identity (auth, profile, loyalty number, QR)" as one row). `ENG-P2-001-PLAN-001` — decomposing that single row into 10 independently-reviewable child packages — did not exist until 2026-08-02, three days later. The Gate's text therefore necessarily predates, and was never revised against, the decomposition it is now being asked to govern.

## 2. `DEC-PROD-012` Scope Analysis

Full Decision Register entry reviewed directly (not a search excerpt):

- **Decision question:** "Approve the optional-gender value set and localized wording (TRD10 example enum: female/male/non_binary/prefer_not_to_say/other)?"
- **Blocks field (verbatim):** `profile schema freeze` — nothing else.
- **Current confirmed position (verbatim):** "gender is optional and never blocks participation (confirmed); values open."
- **Founder decision required:** Yes (with legal input from `EXT-LEG-001`).
- **No evidence or decision package exists** for `DEC-PROD-012` — unlike `DEC-SEC-001`/`DEC-PROV-004` (which have `RES-003`/`RES-001` evidence packages), `DEC-PROD-012` has never been the subject of a dedicated analysis document. Its full text is the Decision Register entry itself.

`DEC-PROD-012`'s own text is unambiguous and narrow: it governs one optional field's enum/wording on the `customerProfiles` document (TRD10 §10.6.2), and its own `Current confirmed position` already states gender "never blocks participation" — i.e., even the Decision Register entry itself disclaims a blanket blocking effect.

## 3. Gate Item 6 — Exact Wording and Internal Evidence

`ENG-P2-RES-000` §7 item 6 (verbatim): *"`DEC-PROD-012` status in the Decision Register is a Final Decision, or a formally recorded defer-and-omit adoption (from `RES-006`) — included because `ENG-P2-001`'s own scope includes "profile," and the Register names this decision as blocking profile schema freeze specifically."*

Three pieces of evidence, all drawn from the same document (`ENG-P2-RES-000`), are decisive:

1. **Item 6's own rationale clause self-narrows** — it says "specifically," a word chosen to distinguish this item from a blanket block, immediately after naming the actual subject ("profile schema freeze").
2. **§7's own closing paragraph excludes a comparably narrow decision entirely:** *"Explicitly not required by this gate: `DEC-LEGAL-005`'s underlying Founder+legal-adviser decision. Per the Decision Register's own fields... it blocks 'registration policy text,' not `ENG-P2-001`'s technical build — only the Programme's documentation text needs correcting..., not the decision itself, for this gate to open."* This is the exact same reasoning pattern `DEC-PROD-012` fits — a decision whose own Decision Register `Blocks` field names a narrow, specific target, not the technical build broadly.
3. **When the Gate's authors intended a genuinely blanket block, they said so explicitly** — item 7 (`BaseMetadata` conformance) cites `ENG-P2-000` §13's finding that the conflict "blocks **any** Phase 2 work package from persisting a document **at all**." No comparable "blocks any/all" language appears anywhere in item 6.

**Counter-consideration, addressed and not adopted:** item 5 (`DEC-ID-003`) is included in the same Gate with no explanatory clause at all, even though the Engineering Implementation Programme's own Decision Dependencies table lists `DEC-ID-003` as `ENG-P2-004`'s dependency, not `ENG-P2-001`'s — meaning the Gate already bundles at least one decision belonging to a different (not-yet-decomposed) work package under the "`ENG-P2-001` may begin" chapeau. This shows the Gate's authors sometimes treated "Capability 2 entry" as a single administrative bundle during the Resolution Sprint. However, item 5's silence is an absence of stated rationale, not a competing claim — it does not contradict item 6's explicit, self-declared narrow scope, and `DEC-ID-003`'s own mis-scoping (an `ENG-P2-004` decision gating "`ENG-P2-001`") is itself a separate, pre-existing repository-modelling looseness, flagged here for a future task, not resolved by this one (out of this task's scope — `DEC-PROD-012` only).

## 4. Why the Gate Appears Broader Than `DEC-PROD-012` Itself — Classification

**Classification: repository modelling issue / stale wording — not intentional Founder governance, not a transcription error, and not a genuine unresolved authority conflict.**

- **Not intentional Founder governance:** no document records a Founder statement that all ten child concerns of Customer Identity must wait on a gender-enum choice. `DEC-PROD-012`'s own text (Founder-facing, "Founder decision required: Yes") already disclaims blocking participation; nothing supersedes that with a broader hold.
- **Not a transcription error:** item 6's text is internally coherent and deliberately worded ("specifically") — nothing suggests a copy-paste or drafting mistake.
- **Not a genuine unresolved authority conflict:** there are not two competing Founder-level positions to reconcile — there is one Decision Register entry (`DEC-PROD-012`) with a stated narrow scope, and one execution-layer Gate document whose own item 6 text already matches that scope; the only "conflict" is between the Gate's blanket **chapeau** (structural, pre-decomposition) and its own item 6 **body text** (already narrow).
- **Is stale/repository-modelling:** the chapeau's blanket structure is a direct, mechanical consequence of `ENG-P2-001` having been a single row when the Gate was written. A gate built to say "may X begin" for one undivided row cannot, by construction, express "may 9 of 10 child concerns begin" — that granularity did not exist as a repository concept until `ENG-P2-001-PLAN-001` (2026-08-02) created it. The Gate was never revisited against the new decomposition before this task.

## 5. Which Child Packages Are Actually Affected

**Only `ENG-P2-001-02` (Customer Profile)** — and narrowly, only its `gender` field/schema-completion, not the package's other fields (name, display name, photo, country, preferred language, communication preferences, consent tracking — all already governed by PRD2 §6/§10 and TRD10 §10.6.2's non-`gender` fields, none of which `DEC-PROD-012` touches).

`ENG-P2-001-05` (Identity Persistence) has a narrow, secondary relationship: it persists the `customerProfiles` document that structurally contains the still-open `gender` field, so the TRD10 §10.6.2 *type definition* cannot be marked fully "frozen" (finalized/immutable) until `DEC-PROD-012` closes — but this is a documentation-completeness distinction, not a functional code blocker. `-05` may implement and test every already-`CONFIRMED` field (including `loyaltyNumber`/`qrReference`, which the same document also contains but are fully specified under `DEC-DATA-007`), typing `gender` as an optional/deferred field consistent with `-02`'s own recommended approach and with TRD10 §10.6.2's own pre-existing Progressive KYC rule ("optional information shall remain absent rather than populated with false placeholders").

## 6. Ten-Package Impact Matrix

| Proposed ID | Work package | Relationship to `DEC-PROD-012` | Blocked? | Evidence | Permitted work before `DEC-PROD-012` closes |
|---|---|---|---:|---|---|
| `ENG-P2-001-01` | Identity Domain Foundation | None — pure domain code, no profile field of any kind | **No** | `DEC-PROD-012` `Blocks: profile schema freeze`; `-01`'s scope (`ENG-P2-ARCH-001` §2) excludes profile entirely | Full package |
| `ENG-P2-001-02` | Customer Profile | Direct — `gender` field is `DEC-PROD-012`'s exact subject | **Partially** | `DEC-PROD-012` entry (verbatim, §2 above) | All non-`gender` fields; `gender` typed optional/deferred (Progressive KYC rule) |
| `ENG-P2-001-03` | Loyalty Number Service | None — `loyaltyNumber` independently `CONFIRMED` under `DEC-DATA-007` | **No** | `DEC-DATA-007` Final Decision, unrelated field | Full package |
| `ENG-P2-001-04` | QR Identity Service | None — same basis as `-03` | **No** | Same | Full package |
| `ENG-P2-001-05` | Identity Persistence | Narrow — persists the same `customerProfiles` document as `-02`'s `gender` field | **No** (functionally) | TRD10 §10.6.2's document-level type includes `gender`; only its full "freeze" (finalization) is affected, not individual-field code/Rules | Full package, with `gender` typed optional/deferred, matching `-02` |
| `ENG-P2-001-06` | Identity Lifecycle and Status Management | None | **No** | Status model unrelated to any profile field | Full package (see §7 for the separate `Recovered` finding) |
| `ENG-P2-001-07` | Identity Recovery | None | **No** | Same | Full package |
| `ENG-P2-001-08` | Identity Linking and Duplicate Prevention | None | **No** | Same | Full package |
| `ENG-P2-001-09` | Identity Query and Lookup Interfaces | None | **No** | Lookup interfaces don't expose or depend on `gender` | Full package |
| `ENG-P2-001-10` | Identity Audit and Observability | None | **No** | Same | Full package |

**No package's scope was narrowed or widened by inference alone** — every "No" traces to the package's own already-published scope (`ENG-P2-001-PLAN-001` §2) containing no `customerProfiles.gender` dependency; the sole "Partially" traces to `DEC-PROD-012`'s own `Blocks` field naming exactly that.

## 7. `ENG-P2-001-01` Mobilisation — Prejudice Check

**`ENG-P2-001-01` (Identity Domain Foundation) can begin without prejudicing `DEC-PROD-012` in any way.** It defines the Identity Aggregate's invariants, error/event contracts, and (per §8 below) the Identity Lifecycle status *type* — none of which reference, encode, or presuppose any gender value, wording, or enum. Beginning `-01` makes no factual or design commitment that could later constrain, bias, or need correction once `DEC-PROD-012` resolves.

## 8. `Recovered` Lifecycle-State — Mobilisation Classification

**Classification: irrelevant to `-01`.** Per `ENG-P2-001-PLAN-001` §14 Ambiguity 1's own recommended resolution (not re-designed here, only reviewed for its `-01` mobilisation impact): `Recovered` is proposed as a **transient transition marker**, not a persistent status-enum member — an identity that completes recovery returns to whatever persistent state (`Active`, most commonly) it held before losing access, with the recovery *event* preserved permanently in the audit trail (`-10`), not as an ongoing status value. Under that resolution, `-01`'s Identity Lifecycle status **type** never needs to include `Recovered` as a member at all — the ambiguity is fully contained within `-06` (Identity Lifecycle and Status Management, which implements the transition logic) and `-07`/`-10` (which consume the recovery event), not `-01` (which only defines the status type's *shape*, using whichever members `-06` ultimately needs). This is consistent with, and confirms, `ENG-P2-001-PLAN-001`'s own entry-criteria note that `-06` — not `-01` — is where this ambiguity must be resolved before implementation.

## 9. Required Determination

**Determination: 2 — Scoped gate correction required.**

Only `ENG-P2-001-02`'s `gender`-field schema completion (and, narrowly, `ENG-P2-001-05`'s document-level "freeze" for the same field) remains blocked by `DEC-PROD-012`. `ENG-P2-001-01`, `-03`, `-04`, `-06`, `-07`, `-08`, `-09`, `-10`, and the non-`gender` portions of `-02`/`-05` are not blocked by `DEC-PROD-012` and never were, once the Gate's own item 6 text and the `DEC-PROD-012` entry itself are read together rather than the Gate's structural chapeau read in isolation. This determination is supported by direct textual evidence internal to the governing documents themselves (§3), not by inference or new policy.

## 10. Repository Corrections Applied

The smallest corrections consistent with §9's determination, applying the same in-place amendment pattern already established in this repository (`IDENTITY-ALIGN-001`'s `DEC-PROV-004`/`DEC-SEC-001` amendments) — prior text preserved via bracket marker, nothing deleted, `DEC-PROD-012` itself untouched:

1. **`ENG-P2-RES-000` §7 item 6** — reworded in place to state the scope explicitly at child-package granularity, cross-referencing this determination.
2. **`ENG-P2-001-PLAN-001`** — Decision and Ambiguity Register (§14, item 2) updated to record this determination, closing that specific open item (the plan's own ambiguity, not `DEC-PROD-012` itself).
3. **Engineering Implementation Programme** — `ENG-P2-001` Current Status updated to reflect that 9 of 10 child packages are no longer `DEC-PROD-012`-blocked; `DEC-PROD-012` remains `OPEN_FOUNDER` and is not closed.
4. **Coding-Agent Prompt Register** — `ENG-P2-001` row's Blocking Reason updated to match.
5. **`CDR-001`** — a light cross-reference to this determination added alongside the existing decomposition-plan reference.
6. **Master Workflow** — Phase 2 status updated using its own established `<details>` history pattern.
7. **RTM** — reviewed; no change required (this determination does not add, remove, or re-map any requirement ID).

No historical report, evidence package, or Decision Register entry (including `DEC-PROD-012` itself) was modified.

## 11. Recommended Next Executable Work Package

**Unchanged from `ENG-P2-001-PLAN-001`: `ENG-P2-001-01` (Identity Domain Foundation).** This determination removes the `DEC-PROD-012`-Gate ambiguity that previously clouded its mobilisation readiness (§7 confirms zero prejudice), but implementation still requires a fresh, explicit Founder authorization to begin — not granted by this governance-interpretation task.

## 12. Validation

1. **Deterministic conclusion reached** — no stop-and-ask was required; the evidence in §3 (three independent, internally-consistent textual signals within the same governing document) was sufficient without inference beyond the documents' own stated rationale.
2. **No product policy invented** — the gender value set/wording remains entirely undecided; this task states only which *packages* wait on that decision, never what the decision should be.
3. **`DEC-PROD-012` not closed or recorded** — confirmed; its Decision Register entry is untouched.
4. **No application code, schema, UI, or API work performed** — confirmed; this task and its corrections are `docs/` only.
5. **`ENG-P2-001-01` not begun** — confirmed.
6. **Historical artefacts unchanged** — confirmed; no `/reports/`, `/records/`, or `/evidence/` file touched.
7. **Only directly affected governance files modified** — confirmed, §10's list.
