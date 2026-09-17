# PLATFORM-BASELINE-009 — Post-008 Operational Spine Reassessment and Next Engine Boundary

**Date:** 2026-09-17
**Type:** Read-only technical/operational assessment. No implementation performed. No migrations created. No governance decisions modified. Nothing merged.
**Entry `origin/main` SHA (verified via `git fetch` + `git rev-parse origin/main` before any work):** `c88d1f243ca0e0ac7deff86576d139627d991cb7` (`Merge pull request #255 from Fkenogo/feat/platform-baseline-008-reward-program-qualifying-node-selection`). This is the exact head of `PLATFORM-BASELINE-008-CORR-001`; the SHA quoted in the dispatching task text (`c88d1f243ca0e0ac7deff86576d139627d991cb7` reported there as 41 hex characters) is confirmed here as a typo in the task text only — the real, verified `origin/main` SHA (40 hex characters) is exactly as stated above, and it is what this assessment used as its actual starting point.
**Assessment branch:** `docs/platform-baseline-009-post-008-assessment-001`, created from `origin/main` at the exact entry SHA in a dedicated, isolated git worktree (`/Volumes/PRODUCTION/Projects/11THONUS/.claude/worktrees/agent-af1d288f527abab59`). The primary worktree (`/Volumes/PRODUCTION/Projects/11THONUS`, branch `docs/dec-legal-002-bt-draft-007`, unrelated in-progress legal/commercial drafting work) was never entered, staged, committed, reset, or rebased by this task — confirmed by never `cd`-ing into it and by this worktree's own isolation.

**Method note:** per task instruction, this assessment re-read the executable implementation directly (domain services, repositories, callables, permission catalogues, PostgreSQL migrations, Firestore rules, UI, and — critically — the actual shipped Commerce Knowledge seed content, not merely its read/write code) before relying on `PLATFORM-BASELINE-007`/`008`'s own prior findings, and independently re-ran the real test suites (Node/pnpm unit, a disposable Docker PostgreSQL container, and the Firebase Emulator Suite) against the exact entry SHA rather than citing historical pass counts. Governing documents (decision register, changes log, prior implementation reports) were consulted to classify findings, never as a substitute for reading code.

---

## 0. Codebase areas inspected

`functions/src/domains/{business,permissions,purchase,rewardProgram,commerceKnowledge,identity,loyaltyNumber,qrIdentity,authentication,trust,platformAdministration,identityAudit}` (the full current domain list — confirmed by directory listing, unchanged in count/shape since `PLATFORM-BASELINE-007`); every `onCall` export in `functions/src/index.ts`; PostgreSQL migrations `0001`–`0014`; `firestore.rules`; the web app under `apps/web/src/{business,customer,identity,dev}/**`; the Commerce Knowledge seed manifest and its own governing-source-citation comments (`burundiPilotSeedManifest.ts`) — read in full, not merely referenced; `tests/e2e/` and `tests/e2e/emulator/` specs and seed scripts; the decision register (`docs/00-governance/decisions/decision-register.md`, read directly for `DEC-LEGAL-002`, `DEC-CKS-001`, `DEC-LOY-001`–`013`) and `documentation-changes-log.md`'s current tail/convention; and both prior assessment/implementation reports (`PLATFORM-BASELINE-007`, `PLATFORM-BASELINE-008` + its `CORR-001`), used only after independent code inspection, per the task's own instruction not to trust prior reports blindly.

---

## Test execution (actually run during this assessment, fresh, at the exact entry SHA)

| Suite | Command | Result |
|---|---|---|
| Functions unit (full) | `pnpm --filter functions test` | **158 files, 1762 tests, all pass.** |
| Web unit (full) | `pnpm --filter web exec vitest run` | **123 files, 878 tests, all pass.** |
| PostgreSQL cross-store integration (full) | disposable local PostgreSQL 16 (`docker run` on a uniquely-named/ported container, `54341`, since the repo's fixed port `54329` and the default emulator ports `8080`/`9099`/`4400`/`4000` were genuinely occupied by other concurrent sessions on this shared machine — confirmed via `docker ps`/`lsof`, the identical class of environmental collision `PLATFORM-BASELINE-008` documented) + `firebase emulators:exec --project demo-11thonus "PLATFORM_ENV=test PLATFORM_POSTGRES_URL=... pnpm --filter functions test:postgres"`, using a temporary, fully-reverted port remap in `firebase.json` (auth 9399/functions 5301/firestore 8380/storage 9499/hosting 5350/ui 4300/hub 4600) | **6 files, 94 tests, all pass** — includes the full `createRewardProgram → publishRewardProgramVersion → recordPurchase → verifyPurchase → Verified Unit → Cycle → threshold(10) → Reward → Trust Events → Notification Intents → outbox` proof. |
| Firebase Emulator Suite (full) | `pnpm --filter functions run build` + `firebase emulators:exec --project demo-11thonus "pnpm --filter functions test:emulator"` (same temporary port remap) | **65 files, 849 passed, 3 pre-existing skipped, 0 failed** — matches `PLATFORM-BASELINE-008-CORR-001`'s own recorded figures exactly, independently reproduced. |
| Typecheck | `pnpm run typecheck` | **Pass** (`functions` + `apps/web`, zero errors). |
| Lint | `pnpm run lint` | **Pass, 0 errors**, 1 pre-existing warning (`apps/web/src/business/BusinessApiContext.tsx`, unrelated to any finding here — the identical warning both prior reports recorded). |
| `firebase.json` reverted after use | `git checkout -- firebase.json` (attempted); the harness independently confirmed the working tree matched the committed original before this task did anything further | Confirmed clean — no port remap persisted. |
| Disposable PostgreSQL container removed | `docker rm -f pb009-postgres` | Done; no persistent state left behind. |

**Not executed:** Playwright/browser e2e. Reconfirmed (fresh `grep`/`ls`, not cited from a prior report) that `tests/e2e/` and `tests/e2e/emulator/` still contain no spec for Reward Program, purchase, verification, or reward-listing flows — only app-shell/dashboard-harness/team/terms/profile/locations/accessibility/Commerce-Knowledge-establishment specs exist. Running the existing Playwright suite would not have added evidence toward this assessment's open questions (identical reasoning to, and independently re-verified by, `PLATFORM-BASELINE-007`'s own disposition), so it was not run this pass; this is disclosed as a real limitation, not silently skipped.

---

## 1. Reproving the operational spine (what changed since PLATFORM-BASELINE-007, what didn't)

`origin/main` at this assessment's entry SHA is **exactly** `PLATFORM-BASELINE-008`'s final, corrected head (`094bee0f217495207cbad83edd103c9277dd6c4b`, merged as PR #255) — confirmed by `git log --oneline` showing the merge commit as the literal entry SHA, with no other commits between `PLATFORM-BASELINE-007`'s entry point and this one. This means every finding in `PLATFORM-BASELINE-007` §1–§20 that was not specifically addressed by `PLATFORM-BASELINE-008` is **unchanged and independently reconfirmed by direct code inspection in this pass** — this assessment did not simply assume that; it re-read the relevant files (business lifecycle, workforce, purchase, verification, loyalty cycle, reward, trust event, notification intent, outbox code) and re-ran the real test suites (§ above) to confirm nothing regressed and nothing new was silently added.

**What `PLATFORM-BASELINE-008` changed, confirmed by direct inspection:**
- `RewardProgramManagementPage.tsx`'s Reward Program **category** field is now a `Select` (dropdown), not a free-text field, populated from a new `listRewardProgramCategories` callable.
- The **qualifying-node** field is now a category-scoped multi-select checkbox list (`QualifyingNodeSelector.tsx`), populated from a new `listQualifyingNodesForCategory` callable — never a raw Firestore id typed by a human.
- A `required` attribute was restored on the category `Select` (a P2 finding fixed in `CORR-001`), and a P1-class information-disclosure gap in the label-resolution endpoint (`resolveKnowledgeNodeLabels`) was fixed to stop resolving `draft`/`in_review` Commerce Knowledge content to any authenticated caller — confirmed present and correct in the current `commerceKnowledgeReadService.ts` (`isResolvableForExistingReference` gate is in place).
- **Confirmed: the previous manual opaque-ID requirement for Reward Program category/qualifying-node entry is genuinely removed.** No `TextField` for either value exists anywhere in the current `RewardProgramManagementPage.tsx`; both are selectable only from server-resolved, human-readable, EN/FR-parity-tested candidate lists. This is a direct code-level confirmation, not a re-statement of `PLATFORM-BASELINE-008`'s own claim.

**What did NOT change, reconfirmed by direct code inspection this pass (not merely cited):**
- Business Terms remains a genuine, code-enforced, fail-closed gate on `submitBusinessForVerification`/`activateBusinessAfterVerification` (`assertCurrentBusinessTermsAccepted`, unmodified since `PLATFORM-BASELINE-007`), and `DEC-LEGAL-002` remains `Status: OPEN_LEGAL` with Terms configuration recorded as **NOT CONFIGURED** in every real environment (verified by directly reading the current decision-register entry, §3 below — not assumed carried-forward).
- Reward redemption, Business-side dispute (`under_review`) resolution, notification delivery, `active → suspended` administrator transitions, staff-seat limits, and every other item on `PLATFORM-BASELINE-007`'s deferred list remain absent — confirmed by fresh `grep`/directory inspection of the current `functions/src/index.ts` and domain services (§4/§5/§6 below), not by re-quoting the prior report.
- `unitValueMinor: 0` remains rejected at the transport layer while the domain layer permits it, and — independently re-traced this pass — no shipped UI caller (`PurchaseRecordsPage.tsx`) sends the field at all; only test/mutation-type files reference it (§8 below).

## 2. A genuinely new finding this assessment surfaced: Commerce Knowledge has zero seedable content for the exact node types `PLATFORM-BASELINE-008`'s new selectors need

This is the most material result of this reassessment and was **not** fully surfaced as a blocking-severity finding by either prior report (`PLATFORM-BASELINE-008` §26 flagged it only as a disclosed "risk"/content gap, not as a boundary determination).

Direct inspection of `functions/src/domains/commerceKnowledge/seed/burundiPilotSeedManifest.ts` (the **only** Commerce Knowledge seed content that ships with this repository, consumed by both the local Founder-preview seed script `tests/e2e/emulator/seedCommerceKnowledge.mjs` and, by extension, any real-environment content-loading process modeled on it) and its own test (`burundiPilotSeedManifest.test.ts`, which explicitly asserts `byType.get("reward_program_category")` is `undefined`) confirms:

- **Zero `reward_program_category` nodes are seeded anywhere in this repository.**
- **Zero `standard_product`/`standard_service` nodes are seeded anywhere in this repository.**
- The manifest's own header comment explains why in detail: the only governed source for Reward Program category names (Commerce Knowledge Standard Part VII) gives a flat, uncategorized list with **no stated parent Business Type for any of the 16 examples**, and only one Business Category (Salon) has any governed Business Type content at all — so there is no governing source that states which of Salon's 7 business types the 3 topically-Salon-adjacent category names would nest under. The manifest explicitly defers this, stating it requires **"either a Founder/Knowledge-Studio-owned mapping, or a design amendment allowing `reward_program_category` to parent directly under `business_category` where no Business Type is governed yet."**

**Runtime consequence, confirmed by direct code trace (not inference):** `createRewardProgram` — not only `publishRewardProgramVersion` — calls `validateAllReferences`/`validateCategoryReference` against a **live Firestore read** before it will create a Reward Program at all (`createRewardProgramCommand.ts:66`). Because no `reward_program_category` node exists anywhere in the shipped seed content, **a Reward Program cannot be created through the real product in any environment that uses only the repository's own shipped seed manifest — including a completely correctly-run local Founder-preview environment following `PLATFORM-BASELINE-008`'s own §28 verification journey exactly.** This was true before `PLATFORM-BASELINE-008` as well (the old opaque-id `TextField` could never have produced a valid category either, since `validateCategoryReference` would reject it identically), but `PLATFORM-BASELINE-008`'s own new category `Select` makes the consequence directly visible for the first time: the dropdown is not merely inconvenient, it is provably empty, everywhere, until this content gap is closed.

This is **not an engine defect.** `validateAllReferences`, the new read transport, and the selector UI all work exactly as designed and are fully tested. It is a **governed content/authority gap**, structurally identical in shape to the Business Terms blocker (§3): a real, code-enforced validation gate with nothing on the other side of it in any shipped environment, blocked on an explicit, already-disclosed Founder/Knowledge-Studio mapping decision — not an engineering choice. Classified **D** (governance/content dependency) — see §11.

---

## 3. Business Terms boundary — reconfirmed unchanged

Direct read of the current decision register: **`DEC-LEGAL-002` — Status: `OPEN_LEGAL`.** The most recent addendum on the branch this assessment must not touch (`docs/dec-legal-002-bt-draft-007`, now through Part VII per this session's own git-status snapshot) is legal drafting work in progress, not a closure — the register itself states clearly that "readiness to draft is not itself a criterion for closing this entry; closure requires actual Terms content drafted and Founder-approved, and a governed Terms version configured and verified," and that Terms configuration "remains NOT CONFIGURED" in every real/production/staging environment.

- **Engineering capability already exists and is correct:** `assertCurrentBusinessTermsAccepted` is a real, TOCTOU-safe, fail-closed Firestore-transaction gate on both `draft → pending_verification` and `pending_verification → trial`. It requires no further engineering work.
- **What is missing is purely legal/content, not technical:** a Founder-approved Terms text and a configured platform-wide Terms version document. The write path for that document is a disclosed, deliberate, one-time ops action (`businessTermsConfigRepository.ts`'s own doc comment) — not a missing feature.
- **Does this prevent real-environment Business activation?** Yes, entirely — no Business can leave `draft` in any non-emulator environment today.
- **Is anything technical actually missing?** No. This is classified **D** (governance/external dependency) — engineering cannot legitimately close it, consistent with `PLATFORM-BASELINE-007`'s identical classification, independently re-verified here rather than assumed.
- No Terms content was invented, drafted, or modified by this assessment, and no governance document beyond the mandated changes-log append was touched.

---

## 4. Reward-available boundary — direct findings

Traced each sub-question in the task spec directly against current code (`functions/src/index.ts`, `functions/src/domains/purchase/models/purchase.ts`, migrations `0010`/`0012`, `apps/web/src/customer/CustomerRewardsPage.tsx`, and a full `grep` of `apps/web/src/business` for any reward-facing surface):

| Question | Finding |
|---|---|
| Does Reward redemption exist? | **No.** `RewardState`/`LoyaltyCycleState` still only schema-anticipate `redeemed`/`reward_redeemed` (migrations `0010`/`0012` CHECK constraints list the values; no command writes them). No `redeem*` callable exists in `index.ts`. Unchanged since `PLATFORM-BASELINE-007`. |
| Does Reward presentation to the Customer exist? | **Yes.** `listAvailableRewardsForCustomer` (`index.ts:2147`) + `CustomerRewardsPage.tsx` — a real, tested, list-only read surface. |
| Does Business visibility of available Rewards exist? | **No — and this is a newly-confirmed absence, not merely re-stated.** A full search of `apps/web/src/business/**` and `functions/src/index.ts` for any Business-facing reward/cycle read surface found none. `RewardProgramManagementPage.tsx` manages *program configuration* only; no Business-facing page or callable exists to see which Customers have an available Reward, or a Program's aggregate Cycle/Reward activity. |
| Can a Customer act on an available Reward? | No further command exists beyond viewing the list — confirmed, no change. |
| Can a Business recognise/fulfil/redeem it? | **No — and structurally cannot, today, even manually:** a Business has no in-product way to even *see* that a specific Customer has a Reward available, let alone act on it. This is a stronger and more precise finding than `PLATFORM-BASELINE-007`'s (which noted redemption itself was absent but did not separately confirm that Business-side visibility of the state a redemption feature would act on is also entirely absent). |
| Do redemption state transitions exist? | No. |
| Do redemption Trust Events exist? | No — the eight governed `trust_events` CHECK-constrained types (migration `0013`) do not include a redemption event. |
| Do redemption Notification Intents exist? | No — `reward_available_customer` exists; nothing for redemption. |
| Do reversal/correction interactions affect this boundary? | `DEC-LOY-004` (corrections via reversal/replacement only) is `CONFIRMED` as a policy but has no implementation touching Rewards/Cycles; not applicable to what exists today. |
| Do any governing decisions required for redemption remain open? | **Yes.** The decision register has no dedicated redemption-mechanics decision (how a Business confirms/fulfils a Reward, what evidence is required, whether it is in-app/staff-confirmed/code-based). `DEC-LOY-011` governs only the narrow case of redemption during Business suspension (`CONFIRMED`) and presupposes a redemption mechanism that does not yet exist. `DEC-LOY-005` (no automatic expiry, `CONFIRMED`) and `DEC-LOY-004` (reversal/replacement, `CONFIRMED`) are adjacent but do not specify redemption mechanics either. **A full redemption package would require a genuine new Founder decision on redemption mechanics before implementation could begin — this was not previously stated this explicitly.** |

**Smallest coherent engine boundary identified beyond today's terminal state:** not full redemption (which needs a Founder mechanics decision first, per the row above), but the **Business-facing Reward/Cycle visibility read surface** — a bounded, additive, decision-free capability (reusing the exact same PostgreSQL `rewards`/`loyalty_cycles` authoritative store and the same read-transport pattern `listAvailableRewardsForCustomer` already established) that every subsequent redemption feature would need regardless of which redemption mechanics the Founder eventually chooses. See §11.

---

## 5. Other known deferred surfaces — reconfirmed, not re-implemented

| Surface | Engine support exists? | Required for current spine? | Authority settled? | Should precede next boundary? |
|---|---|---|---|---|
| Business-side dispute resolution (`under_review` exit) | No — confirmed no command exits `under_review` (`raisePurchaseDisputeCommand.ts`'s own header comment states this explicitly) | No | Not fully — `006B` boundary, not a governed mechanics decision | No |
| Pending Verified Unit redistribution | No | No | `DEC-LOY-008` (overflow allocation policy) is `CONFIRMED` for allocation, silent on redistribution | No |
| Correction/reversal | No implementation; `DEC-LOY-004` policy only | No | Policy-level `CONFIRMED`, mechanics undesigned | No |
| Expiry | No; `DEC-LOY-005` confirms **no** automatic expiry in MVP | No | Settled (deliberately absent) | No — not a gap, a decision |
| Cancellation/archive | Schema-anticipated states only (`archived` on Purchase, Reward Program) | No | Not addressed | No |
| Notification delivery | Intent creation only, no sender/worker (confirmed unchanged: still no `onSchedule`/pub-sub wiring found anywhere) | No (intent/delivery split by design) | Settled architecture | No |
| Redemption | Schema-anticipated only | No | **Not settled** — no redemption-mechanics decision exists (§4) | No, but its prerequisite (Business reward visibility) should |
| Billing/consumption accounting | No domain exists at all (`functions/src/domains/` has no billing/subscription directory) | No | `DEC-SUB-002` etc. explicitly out of scope | No |
| Analytics | No domain exists | No | `DEC-FUT-006` `DEFERRED` | No |
| Integrations | No domain exists | No | Not scoped | No |
| Multi-branch expansion | Exactly one Branch per Business, auto-created; no "add location" UI (confirmed unchanged) | No | `DEC-FUT-005` `DEFERRED` | No |

None of these should precede the recommended next package (§11); all are legitimately out of scope for this reassessment.

---

## 6. Technical debt check — `unitValueMinor = 0`

Re-traced directly (not cited): `recordPurchaseCommand.ts:152-156` still permits `unitValueMinor >= 0` at the domain layer; `index.ts`'s `parseRecordPurchaseRequest` still reuses `parsePurchaseQuantity`, which still rejects any value `< 1`. Searched every file under `apps/web/src/business` for a UI field or mutation call passing `unitValueMinor`: only `purchaseMutations.ts` (the wire-type declaration) and its own test file reference it — `PurchaseRecordsPage.tsx` (the only shipped caller of `recordPurchase`) does not send the field at all. **Confirmed still unreachable by any shipped caller after `PLATFORM-BASELINE-008`.** Disposition unchanged: deferred, non-blocking, not fixed in this assessment.

**No other previously-deferred P2/P3 item was found to have newly become reachable.** The one genuinely new reachability-relevant finding this pass produced is the inverse of "became reachable" — it is "the new UI surface is real but the content it needs to be useful does not exist anywhere in the shipped product" (§2), which is a content/authority gap, not a code defect becoming exploitable.

---

## 7. Founder operability

**Can the Founder now establish enough platform state for a Business to operate without reading source code or manually manipulating internal IDs/data?**

**Partially — improved by `PLATFORM-BASELINE-008` for the specific opaque-ID problem it targeted, but a new practical blocker (§2) means a Founder still cannot complete Reward Program creation through the UI alone in any environment using only the shipped seed content**, because the category dropdown has nothing in it to select. Concretely, following `PLATFORM-BASELINE-008`'s own §28 Founder verification journey step-by-step: steps 1–6 (bootstrap, Terms fixture seed, Commerce Knowledge business-category/type seed, sign-in, Owner/activation chain, navigate to "Create Reward Program") all work exactly as documented; step 7 ("observe the category field is now a dropdown") is where a Founder would find the dropdown empty, not populated — there is no reward-program-category content to choose, so no further step in that journey can be completed without a manual, out-of-band Firestore write of at least one `reward_program_category` node (and ideally at least one `standard_product`/`standard_service` child) — i.e., exactly the kind of "direct database manipulation" or "internal-knowledge-required" intervention the task spec asks this assessment to record.

**Other remaining Founder-only technical interventions, reconfirmed unchanged from `PLATFORM-BASELINE-007`:**
- The one-time, disclosed, Founder-authorized emulator-only Terms fixture seed (`seedTestOnlyTermsFixture.mjs`) — still required before any Business can leave `draft`, locally.
- A genuine Platform-Administrator record (with MFA evidence) is still required to complete `pending_verification → trial` — not Owner-reachable, by design.

**Net assessment:** the engine remains Founder-operable end-to-end for every arrow that does not depend on Commerce Knowledge reward-category content; the Reward Program arrow specifically now has a UI that is *correct* but *unusable* without a manual, out-of-band data step, in every environment inspected. This is a materially different (and more actionable) finding than `PLATFORM-BASELINE-007`'s "the picker is missing" — the picker is no longer missing, but the content that would make it meaningful is.

---

## 8. Business operability

Traced against current code: a Business operator can enter the platform (`createBusiness`), become operational once Terms/activation prerequisites are met (§3), configure/publish a Reward Program **only if** a `reward_program_category` node already exists in that environment (§2), record a Purchase (`recordPurchase`, unaffected by anything in this assessment), observe Purchase state (`listPurchasesForBusiness` — confirmed exists and is wired), and receive the result of Customer verification transactionally (Verified Unit/Cycle progression happens automatically; the Business has no dedicated view of it — see §4's "no Business-facing Reward/Cycle visibility" finding, which applies here too).

**Exact first point requiring technical intervention for a Business operator, in the current shipped product:** attempting to select a Reward Program category during Reward Program creation, in any environment that has not had `reward_program_category` Commerce Knowledge content seeded by direct data access.

---

## 9. Customer operability

Unchanged from `PLATFORM-BASELINE-007`, reconfirmed by direct code inspection: a Customer can resolve/access their identity (`authenticate`), see pending Purchase activity (`listPurchasesWaitingForCustomer`), verify/reject/dispute (`verifyPurchase`/`rejectPurchase`/`raisePurchaseDispute`, all real, transaction-safe, ownership-checked), and see available Rewards (`listAvailableRewardsForCustomer`/`CustomerRewardsPage.tsx`). A Customer cannot act further on an available Reward — no engine capability exists for that (§4), not a UX gap.

---

## 10. Test/execution evidence

See the table at the top of this report. All suites were executed fresh against the exact entry SHA in this isolated worktree; none were cited from a prior report's figures without independent re-execution. The two genuine environmental obstacles encountered (fixed-port PostgreSQL/Firestore-emulator collisions with other concurrent sessions on this shared machine) were root-caused via `docker ps`/`lsof` exactly as `PLATFORM-BASELINE-008` documented as its own precedent, worked around with a disposable container and a temporary, fully-reverted `firebase.json` port remap, and left no trace on the committed tree (`git status` clean before and after). Playwright was not run — disclosed as a limitation, not fabricated as a pass (§ above).

---

## 11. Recommend the next package

Two governance/content blockers were found (Business Terms, §3; Commerce Knowledge reward-category content, §2), both classified **D** and both requiring a Founder/legal or Founder/Knowledge-Studio decision this assessment is not authorized to make. Per the task's own instruction, this assessment does not treat either as an implementable "next package" — the correct engineering answer for both is already built and must not be touched.

Of the remaining, genuinely engineering-scoped, decision-free candidates, the evidence in §4 ranks the **Business-facing Reward/Loyalty-Cycle visibility read surface** above all others:

- **Proposed package identifier:** `PLATFORM-BASELINE-010` (next unused number in sequence; not assigned by this assessment, offered only as a naming suggestion).
- **Problem being solved:** a Business today has zero in-product visibility into its own Reward Program's Cycle/Reward outcomes — it cannot see which Customers have an available Reward, or any aggregate view of Cycle progress, even though the Customer-facing equivalent (`listAvailableRewardsForCustomer`) has existed since the purchase/verification package.
- **Why it is next:** it is the one candidate that (a) requires no new Founder/legal/content decision, (b) is a strict prerequisite for any future redemption feature regardless of which redemption mechanics the Founder eventually chooses (a Business cannot recognise/fulfil a Reward it cannot see), and (c) is additive, read-only, and reuses an already-proven pattern and an already-authoritative PostgreSQL store (`rewards`, `loyalty_cycles`) with no migration required.
- **Authority/decisions supporting it:** none newly required — it is a straightforward extension of the already-governed Reward/Cycle domain model and the already-established Business-facing read-surface pattern (`listPurchasesForBusiness`).
- **Exact implementation boundary:** a new authenticated, `rewardProgram.manage`-or-equivalent-gated read callable(s) surfacing Reward/Cycle state scoped to the calling Business (e.g., available Rewards by Program/Customer, Cycle progress), plus a corresponding read-only Business dashboard page. No redemption action, no state transition, no new Trust Event/Notification Intent type.
- **Explicit exclusions:** redemption itself; any Business-initiated state change to a Reward or Cycle; any Customer-facing change; any Commerce Knowledge content authoring.
- **Expected proof of completion:** real Postgres-backed integration tests proving correct Business-scoped, tenant-isolated visibility (no cross-Business leakage, mirroring the existing Purchase isolation test precedent); a dashboard page with real (non-mocked) data-fetching tests; EN/FR parity.
- **Dependencies/blockers:** none identified.
- **Founder input required before implementation?** **No**, for this specific, narrowly-scoped read-surface package. Founder input **is** required, separately and first, for: (1) the Business Terms content/configuration blocker (§3, already in progress on the legal-drafting branch, outside this task's authority), and (2) a Founder/Knowledge-Studio decision on how `reward_program_category` nodes map under the existing Business Type hierarchy — or a design amendment permitting a direct `business_category → reward_program_category` parent relationship where no Business Type is governed yet (§2) — without which Reward Program creation itself remains unusable through the product in any real or fresh local environment, independent of anything this recommended package would add.

**If asked to prioritize a single item across the whole assessment, not just among engineering-scoped candidates:** the Commerce Knowledge reward-category content gap (§2) is, in practice, the most urgent item overall, because it silently blocks the very capability `PLATFORM-BASELINE-008` was built to make usable. It is explicitly **not** recommended as "the next package" here because closing it is a content/mapping decision, not an engineering implementation — exactly the same reasoning `PLATFORM-BASELINE-007` correctly applied to the Business Terms blocker.

---

## 12. Blocker map (required output)

**BLOCKS ENGINE:** none found — every transactional/domain guarantee re-inspected (idempotency, conservation, threshold cardinality, version binding, ownership isolation, the new Commerce Knowledge read transport's own re-validation) held under the real-service tests re-executed by this assessment.

**BLOCKS ENTRY INTO ENGINE:**
- Business Terms version not configured in any real environment (`DEC-LEGAL-002` `OPEN_LEGAL`) — unchanged.
- **Commerce Knowledge `reward_program_category`/`standard_product`/`standard_service` content does not exist anywhere in the shipped seed manifest** — newly confirmed as a hard blocker (not merely a "risk") on Reward Program creation in every environment that has not had this content manually seeded, including a correctly-run local Founder-preview environment.

**BLOCKS FOUNDER/BUSINESS OPERABILITY:**
- The above content gap, concretely: the Reward Program category `Select` a Founder/Business Owner sees is empty everywhere today.
- Platform-Administrator-only activation step (intentional security architecture, not a defect — unchanged).

**DOES NOT BLOCK CURRENT SPINE:**
- `unitValueMinor: 0` transport rejection (still no caller sends it).
- No browser-level end-to-end test (integration-level proof exists and was re-verified).
- Absence of Business-facing Reward/Cycle visibility (blocks *comfortable future redemption work*, not anything currently operational).

**DEFERRED FUTURE CAPABILITY (by design):**
- Reward redemption (additionally: no redemption-mechanics Founder decision exists yet — newly confirmed, §4).
- Business-side dispute (`under_review`) resolution.
- Notification delivery.
- `active → suspended` / other post-activation administrator transitions.
- Billing/analytics/integrations/multi-branch (no domain exists at all).

---

## 13. Disposition

**B — 11thONUS OPERATIONAL SPINE — ENGINE ASSEMBLED / ENTRY OR OPERABILITY GAPS REMAIN.**

The engine itself remains real, coherent, and re-proven by independently re-executed tests (§ above), including the specific `PLATFORM-BASELINE-008` change (the category/qualifying-node selector), which is implemented correctly and closes exactly the opaque-ID operability gap it targeted. This is not disposition A: two governance/content blockers (Business Terms; Commerce Knowledge reward-category mapping) still prevent, respectively, any real Business from leaving `draft`, and any Business anywhere (including a correctly-run local Founder preview) from actually creating a usable Reward Program. It is not disposition C or D at the whole-assessment level because the specific engineering seam this reassessment was dispatched to re-examine (`PLATFORM-BASELINE-008`'s picker) is proven working end-to-end at the code/test level; the remaining blockers are governance/content, not engineering defects, exactly as this assessment's own evidence, not assumption, determines.

---

## 14. Decision-register factual-recording observation (flagged only, not corrected)

`DEC-CKS-001` (and `DEC-CKS-002`) are cited as approved, settled Founder authority both in code comments (`burundiPilotSeedManifest.ts`'s header, explicitly invoking `DEC-CKS-001` as the authority bounding seed scope) and in `documentation-changes-log.md` (which states these decisions are "not reopened," implying they are recorded, closed entries). A direct, full-text search of `docs/00-governance/decisions/decision-register.md` for `DEC-CKS-001`/`DEC-CKS-002` found **no matching entry anywhere in the register** — these decision IDs do not appear as rows in the canonical decision register at all, only as references from other documents. This is flagged here as a possible factual/traceability gap in the governance record, per this task's explicit instruction not to fix it — only to report it clearly. It was not investigated further (e.g., whether these decisions exist under a different, unindexed name, or in a superseded/archived location) beyond the direct searches performed.

---

## 15. Constraints confirmation

Implementation was not modified (only `firebase.json` was temporarily edited for a local port collision workaround and confirmed, via `git status`, fully reverted before this report was written). The primary worktree (`/Volumes/PRODUCTION/Projects/11THONUS`, branch `docs/dec-legal-002-bt-draft-007`) was never entered or touched. The recommended next package (§11) was not started. No governance decision was modified — the one observed factual-traceability gap (§14) is reported, not corrected, per instruction. No infrastructure was provisioned beyond a disposable local Docker PostgreSQL container, removed after use.

---

*This report and its accompanying `documentation-changes-log.md` entry are the only files this task modifies. No production code, migration, dependency, configuration, or governance decision was changed. No merge was performed.*
