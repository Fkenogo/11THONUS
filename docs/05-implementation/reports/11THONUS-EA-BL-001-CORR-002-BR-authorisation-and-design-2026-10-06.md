# 11THONUS — EA-BL-001-CORR-002-BR
## Business Review Domain Foundation — Authorisation & Design Report

> **Package:** `EA-BL-001-CORR-002-BR` · **Date:** 2026-10-06 · **Type:** analysis + governance / design confirmation only
> **Entry `origin/main`:** `961fc272abf6f50656973cdbb361dbec90ddd289` (PR #302 merge — Slice A closure)
> **Branch:** `docs/ea-bl-001-corr-002-br-foundation` (documentation/governance only; no merge by this task)
> **Authority:** `DEC-PROD-015` (CONFIRMED, 2026-10-05); frozen Experience Reference `Fkenogo/11thonus-prototype@18e8d700f505beefe46d324f6ea33f20a670abe7`
> **Boundaries:** No BR code. No schema/migration execution. No Staff UI. No Owner/Manager UI. No Slice B/C/D/E. No EA-BL-002. No WP-COM implementation. No FEF-TLC adoption. No deployment.
> **Correction (2026-10-06, PR #303 review):** Staff grant path removed — Staff is INELIGIBLE for `purchase.business_review` at MVP with no explicit-grant path (Owner / authorised Manager review only, per approved Founder direction); EIP current-state contradiction corrected (§22 record). No redesign; no new Founder decision; all locked principles unchanged.

---

## 1. Entry repository state

- Clean `origin/main` at `961fc272abf6f50656973cdbb361dbec90ddd289` (merge of PR #302, `docs/ea-bl-001-corr-002-a-closure`).
- Slice A implementation merge verified: PR #300 merge `facf59c73ddea3404d70469a490dd6cbc8e6d126`, reviewed head `cd2ffbbac6e0edffd7ab19cf480a50731783dfb8`, exact-head CI run `37337547775` SUCCESS (per the post-merge closure report).
- Slice A closure PR #301 (`e4de7af`) remains merged on main; PR #302 is the closure record.
- Work performed on branch `docs/ea-bl-001-corr-002-br-foundation` branched from the entry SHA. Working tree was clean at entry; no application file touched.
- A pre-existing unrelated `wp-com-06a` work-in-progress (stash `preserve wp-com-06a WIP before BR task`) was left untouched in the stash; its branch pointer was restored to `bb22f43`. This task changes no WP-COM file.

## 2. Current programme position

Verified directly against `origin/main` records at task entry (entry position, before this authorisation — not from memory):

- **Slice A — COMPLETE / ACCEPTED / MERGED.** EIP §C.2 table (`docs/05-implementation/change-tracking/engineering-implementation-programme.md:800`); Prompt Register §4 (`docs/05-implementation/change-tracking/coding-agent-prompt-register.md:104` — `Complete — Accepted / Merged`, PR #300, merge `facf59c…`, head `cd2ffbb…`); Master Workflow §17 (`docs/05-implementation/11thonus-master-workflow.md:391-393`); post-merge closure report `docs/05-implementation/reports/11THONUS-EA-BL-001-CORR-002-A-post-merge-closure-2026-10-05.md`; `IMPLEMENTATION_CHANGES.md` 2026-10-05 closure entry.
- **BR — NOT AUTHORISED / NOT STARTED.** EIP §C.2 row (`engineering-implementation-programme.md:805` — `Not Yet Scheduled — NOT AUTHORIZED`); Prompt Register §4 (`coding-agent-prompt-register.md:109` — `Not Yet Scheduled — NOT AUTHORIZED`); Master Workflow §17 (`11thonus-master-workflow.md:391,395` — `Not Yet Scheduled`, NOT AUTHORIZED and NOT STARTED; next package candidate for separate Founder authorization).
- **Slice B — NOT AUTHORISED / UNSTARTED** (blocked on BR). Prompt Register (`coding-agent-prompt-register.md:105` — `Not Yet Scheduled — NOT AUTHORIZED`, dependencies include `future Business Review Foundation`); EIP §C.2 (`engineering-implementation-programme.md:801,807`).
- **Slices C–E — NOT AUTHORISED / UNSTARTED.** Prompt Register rows (`coding-agent-prompt-register.md:106-108`); EIP §C.2 rows (`engineering-implementation-programme.md:802-804,807`).
- **EA-BL-002 — unstarted.** No EA-BL-002 package is registered or authorized (EIP `engineering-implementation-programme.md:807,809`). The merged `EA-002` local preview foundation (PR #294) does not start `EA-BL-002` (Master Workflow `11thonus-master-workflow.md:399`).
- **WP-COM — state unchanged by this task and by Slice A.** `WP-COM-05a` (migration `0026`, PR #290 `94fa71e`), `WP-COM-05b` + CORR-001 (migration `0027`, PR #291 `bb22f43`), and `WP-COM-06a` (PR #293 `c064f43`) are merged on `origin/main`. The Commercial admission gate defaults to `off` (today's behaviour preserved); `WP-COM-06b` not started; `PB-013B P3-3` remains OPEN. This stream changes no WP-COM file (EIP `engineering-implementation-programme.md:807`; `IMPLEMENTATION_CHANGES.md` 2026-10-05 closure boundary).
- **FEF-TLC-001 — still not adopted** (Master Workflow `11thonus-master-workflow.md:397`; EIP `engineering-implementation-programme.md:807`; closure boundary).

## 3. Current purchase lifecycle (authoritative, read from current code)

**Persisted states** (`functions/src/domains/purchase/models/purchase.ts:15-24` — `PurchaseStatus`):

`waiting_for_customer` · `pending_admission` · `verified` · `rejected` · `under_review` · `corrected` · `cancelled` · `expired` · `archived`

Only the first five have writers in the current package. `corrected` / `cancelled` / `expired` / `archived` are vocabulary/check-constraint members with **no command transition** (deferred scope — cf. `PLATFORM-BASELINE-006` design §“Business dispute review … correction/replacement workflow, cancellation, expiry scheduler …” as out of scope).

**Actual current lifecycle diagram:**

```
                        recordPurchase (staff/manager/owner, purchase.record)
  (∅) ──────────────────────────────────────────────────────────────────────────▶ WAITING_FOR_CUSTOMER
                                                                                        │
                                           ┌──────────────────────────────────────────────┼───────────────────────────────────┐
                                           │                                              │                                   │
                        verifyPurchase      │                           rejectPurchase      │                raisePurchaseDispute │
                        (customer, owner)   │                           (customer, owner)   │                (customer, owner)    │
                                           ▼                                              ▼                                   ▼
                                       VERIFIED  ──▶ VerifiedUnit ──▶ Cycle ──▶ Reward    REJECTED (reason)                    UNDER_REVIEW (dispute reason)
                                      (1 credit,    (allocation,      (at exactly 10)       no units                           no units, NO EXIT in this
                                       qty=qty)     threshold 10)                                                          package — safe holding state
                                           ▲
                                           │ gate `enforce` only:
                                           │ admitOrHoldPurchase
                    ┌──────────────────────┴──────────────────────┐
                    │ capacity + queue decision (commercial)      │
  WAITING_FOR_CUSTOMER ──▶ PENDING_ADMISSION (hold: valid,          PENDING_ADMISSION ──▶ VERIFIED
                    │      preserved, credit-free)                   (reevaluatePendingAdmissions,
                    │                                                processor, system actor)
                    └──▶ VERIFIED (admit path, same seam)
```

**Valid transitions (conditional `UPDATE … WHERE status = …`; zero rows = race loser, fail closed):**

| From | To | Writer |
|---|---|---|
| ∅ | `waiting_for_customer` | `insertPurchaseRecord` (`purchaseRecordRepository.ts:130-167`), always; `recordPurchaseCommand.ts:319-341` step 13, lifecycle event ∅ → `waiting_for_customer` (`:343-356`) |
| `waiting_for_customer` | `verified` | `transitionPurchaseToVerified` (`purchaseRecordRepository.ts:205-224`), via `admitPurchaseToLoyalty` from live `verifyPurchase` (gate `off`) or enforced admit |
| `waiting_for_customer` | `pending_admission` | `transitionPurchaseToPendingAdmission` (`purchaseRecordRepository.ts:231-246`), via `admitOrHoldPurchase` hold branch (`admitOrHoldPurchase.ts:172-197`), gate `enforce` only |
| `pending_admission` | `verified` | `transitionPurchaseToVerified(..., fromStatus: "pending_admission")`, via `admitPurchaseToLoyalty` from `reevaluatePendingAdmissions` processor |
| `waiting_for_customer` | `rejected` | `transitionPurchaseToRejected` (`purchaseRecordRepository.ts:249-264`), via `rejectPurchase` (customer only) |
| `waiting_for_customer` | `under_review` | `transitionPurchaseToUnderReview` (`purchaseRecordRepository.ts:267-282`), via `raisePurchaseDispute` (customer only) |

DB backstops: status vocabulary CHECK + `purchase_records_verified_fields` CHECK (migration `0026_purchase_pending_admission.sql:41-58`); `pending_admission` guard trigger (`0026:62-86` — cannot be created in, may only be entered from `waiting_for_customer`, may only leave to `verified`); Verified-Unit partial-unique (exactly one credit per purchase); reward UNIQUE per cycle.

**Transition services:** `recordPurchaseCommand.ts` (19-step contract, design §12); `verifyPurchaseCommand.ts` (atomic verify → units → cycle → reward, design §§14/16); `rejectPurchaseCommand.ts`; `raisePurchaseDisputeCommand.ts`; `admitPurchaseToLoyalty.ts` (extracted verbatim admission seam, WP-COM-05a); `admitOrHoldPurchase.ts` (enforced commercial decision, WP-COM-05b); `reevaluatePendingAdmissions.ts` (FIFO held-purchase processor + CORR-001 skip-and-continue); `confirmRedemptionCommand.ts` (Capability 6, separate path).

**Repositories:** `purchaseRecordRepository.ts` (conditional transitions, events, held-queue reads); `purchaseProgramScopeRepository.ts` (program/version locks, qualifying-item proof); `verifiedUnitRepository.ts`; `loyaltyCycleRepository.ts` (stream/cycle locks, allocation, rewards, `LOYALTY_CYCLE_THRESHOLD = 10`); `trustEventRepository.ts`; `purchaseOutboxRepository.ts` (notification intents + outbox); `customerExperienceRepository.ts` + `businessLoyaltyVisibilityRepository.ts` (reads); `heldPurchaseRecoveryRepository.ts` (WP-COM-06a run state).

**Commands/callables** (`functions/src/index.ts:2322-2411`): `recordPurchase` (Business-authenticated via `resolveAuthenticatedBusinessActor`); `verifyPurchase` / `rejectPurchase` / `raisePurchaseDispute` (customer-authenticated via `resolveAuthenticatedIdentityActor`; client-supplied customer id never trusted); `confirmRedemption` (Business, `redemption.confirm`).

**Role/permission guards:** writes — `authorizePurchaseRecord` (`purchaseAuthorization.ts:35-58`) via `evaluatePermission` for `purchase.record` (Staff/Manager/Owner, server-resolved role stored as `recorded_by_role`); reads — membership-gated only (`authorizeBusinessPurchaseRead`); Business loyalty visibility — Owner/Manager only (`authorizeBusinessLoyaltyVisibilityRead`); redemption — `authorizeRedemptionConfirm` (`redemption.confirm`, Owner floor / Manager default / Staff explicit grant); customer verify/reject/dispute — pure ownership check (`purchase.customer_identity_id == server-resolved identity`) inside the transaction after row lock.

**Audit/evidence records:** `purchase_record_events` (append-only, from/to, actor type+id, reason, payload, correlation); `trust_events` (single trust ledger; causal + subject events in the same transaction; `purchase.recorded/.verified/.rejected/.disputed`, `verified_units.issued`, `loyalty_cycle.allocated/.reward_available`, `reward.available/.redeemed`); `notification_intents` (recorded → customer; verified/rejected/disputed → business; reward → customer); `purchase_outbox`; idempotency keys (`purchase.create/.verify/.reject/.dispute`, `purchase.admit` reserved namespace, `redemption.confirm`); sensitive-decision audit (`recordSensitiveDecisionStandalone` for mandatory-audit permissions).

**Rejection/dispute models:** bounded vocabularies — `PurchaseRejectReason` (`purchase.ts:33-42`: `did_not_happen | duplicate | wrong_customer | wrong_program | wholly_invalid`); `PurchaseDisputeReason` (`purchase.ts:45-51`: `wrong_quantity | wrong_item | partially_inaccurate`).

**Customer verification path:** customer-owned `waiting_for_customer` → (`verifyPurchase`, gate `off` default → admit) → `verified` + exactly one Verified-Unit credit (`quantity = purchase qty`) + stream-serialised allocation (capacity 10, overflow → pending positions, never a second active cycle) + minimum Reward entitlement at exactly 10 + Trust/Notification/outbox. Gate `enforce` discriminates: admitted (as above + commercial reservation/earmark) vs held (`pending_admission`, no loyalty state). Re-verifying a held purchase reports state without forcing admission (`verifyPurchaseCommand.ts:188-202`).

**Quantity handling:** `quantity >= 1` integer (DB CHECK + command); `multipleUnitsAllowed=false ⇒ exactly 1` against the LOCKED version; whole-record quantity → units mapping (1 purchase qty = N verified units on one credit row); 10+1 overflow behaviour unchanged.

**Threshold/review-related fields:** `reward_program_versions.bulk_review_threshold INTEGER NULL` exists (migration `0002:31`; repository `rewardProgramRepository.ts:78,104,210,327,449`) but is **read nowhere on the purchase path** — no enforcement, no cap. See §8.

**Current `bulk_review_threshold` semantics:** review-visibility-only per `DEC-LOY-003`, never a hard cap (record command header `recordPurchaseCommand.ts:31-37`; test file note `purchaseCommands.postgres.test.ts:27`). Confirmed present meaning: optional, version-scoped, non-blocking metadata. See §8.

**Existing `under_review` semantics:** see §5.

## 4. Existing state semantics that must not be overloaded

### 5. `under_review` disposition

**Exactly what it means today:** customer dispute / exception holding state. Entered **only** via `raisePurchaseDispute` (`raisePurchaseDisputeCommand.ts:1-12,118-124`): customer-authenticated, `waiting_for_customer → under_review`, mandatory bounded `dispute_reason` (`wrong_quantity | wrong_item | partially_inaccurate`), no Verified Units. Carries `dispute_reason IS NOT NULL AND rejection_reason IS NULL` (DB CHECK `0026:54-55`). Emits its own command/event/Trust Event (`purchase.disputed`)/Notification Intent (`purchase_disputed_business`)/outbox (`purchase_disputed`) — never silently redirected into rejection (`raisePurchaseDisputeCommand.ts:9-11`). **No customer command exits `under_review` in this package** — “Business-side dispute review/correction belongs to a later package (`PLATFORM-BASELINE-006B` or equivalent)” (`raisePurchaseDisputeCommand.ts:7-10`).

**Disposition:** `under_review` **MUST NOT** become Business Review. It is the customer-dispute state (consistent with `DEC-PROD-015` Notes: “Existing `under_review` remains the Customer-dispute state”). The proposed Business Review uses a **new distinct status** (`business_review_required`, §9) with its own edges; no transition into/out of `under_review` is added or altered by BR.

### 6. `pending_admission` disposition

**Exactly what it means today:** commercial admission hold — “received and preserved; not invalid; not yet admitted into Loyalty” (migration `0026:6-9`). Entered **only** from `waiting_for_customer` via the enforced commercial decision (`admitOrHoldPurchase` hold branch; gate `enforce` only — no writer when the gate is `off`). Carries no verdict facts and no `verified_at` (CHECK `0026:47-49`). May **only** leave to `verified` (guard trigger `0026:71-72` + conditional transitions). Hold provenance is the neutral `purchase_record_events` row (`reason: "awaiting_admission"`, payload-free — “Business staff … must see no commercial reason or figure”, `admitOrHoldPurchase.ts:176-188`) plus the Commercial audit row; re-verifying reports state without forcing admission.

**Disposition:** `pending_admission` **MUST NOT** be reused for Business Review. It is commercial-capacity state with its own FIFO processor, queue invariants (`existsEarlierHeldPurchaseInStream/InBusiness`), earmarks/reservations, and a trigger that **refuses any exit except to `verified`**. Business Review is a pre-verification business gate; commercial admission is a at-verification capacity gate. They are orthogonal and may compose (an approved purchase may still be commercially held at verify time under `enforce`). BR introduces its own status and leaves `0026`’s guard semantics intact (extended only to name the new state as a non-interfering neighbour — §12).

### 7. Existing rejection semantics

- `rejection_reason` (`did_not_happen | duplicate | wrong_customer | wrong_program | wholly_invalid`) represents **customer rejection**: set only by `transitionPurchaseToRejected` from `waiting_for_customer`, written only by the customer-authenticated `rejectPurchase` command, with actor `customer`, Trust Event `purchase.rejected`, and Business notification `purchase_rejected_business` (`rejectPurchaseCommand.ts:116-157`). CHECK requires `rejection_reason IS NOT NULL AND dispute_reason IS NULL` on `rejected`.
- `dispute_reason` (`wrong_quantity | wrong_item | partially_inaccurate`) represents **customer dispute outcome entry** (not a rejection): set only on `under_review` via `raisePurchaseDispute`.
- Neither field represents business rejection, dispute outcome beyond entry, or generic purchase rejection. **One field cannot safely represent all contexts** without losing the actor/reason distinction the CHECK constraints and evidence consumers rely on.

**Disposition:** Business rejection **must not** silently reuse `rejection_reason`’s customer vocabulary, and **future implementation MUST NOT reuse the existing customer `rejection_reason` semantics** (vocabulary, writer, or meaning) for business-review rejection. Business rejection reuses the terminal `rejected` **status** (governed terminal representation) but carries a **distinct bounded business-reason representation** (new column or new vocabulary, §12) with reviewer attribution in the lifecycle event + Trust Event, so customer-rejection integrity (`rejected` + customer reason + customer actor) is never ambiguous. The exact new column/name remains a bounded implementation-level choice per current repository conventions; the constraint is fixed here: no silent overloading, no customer-semantics reuse.

### 8. `bulk_review_threshold` current meaning

Authoritative current meaning: **optional, version-scoped (`reward_program_versions.bulk_review_threshold INTEGER NULL`), visibility-oriented / non-blocking metadata. Never a hard cap, never an approval gate, never Verified-Unit math.** Evidence: schema (`0002_create_reward_program_versions.sql:31`); repository passthrough only (`rewardProgramRepository.ts`); command header (“review-visibility-only per DEC-LOY-003 (never a hard cap)”, `recordPurchaseCommand.ts:31-37`); design/implementation reports (006A report §“no cap is enforced or invented”); readiness assessment R4 (“review-visibility `bulk_review_threshold` (never a hard cap — ‘no cap invented’)”); `DEC-LOY-003` register row (“configurable review thresholds create visibility only; customer verification remains the primary control”, `decision-register.md:455-457`); `DEC-PROD-015` Notes (“Supersedes only `bulkReviewThreshold` visibility-only semantics … as needed for the expressly approved Business-review gate; its multi-quantity and ‘never auto-reject’ rules remain unchanged”, `decision-register.md:429`).

**Disposition:** Do **NOT** treat `bulk_review_threshold` as an automatic approval gate. The BR trigger uses a **new, separately governed threshold field** (§10). `bulk_review_threshold` itself is left untouched (no semantic change, no reuse without the governed correction + validation the plan report already requires).

## 9. Proposed Business Review lifecycle

New distinct status: **`business_review_required`** (name chosen to match `DEC-PROD-015` register language “the record enters Business Review Required” and the plan report’s “distinct `business_review_required` status”).

```
NORMAL PATH (below threshold / threshold disabled)

  recordPurchase ──▶ WAITING_FOR_CUSTOMER ──▶ customer verify ──▶ VERIFIED ──▶ Verified Units / Cycle / Reward
                                              customer reject ──▶ REJECTED (customer reason)
                                              customer dispute ──▶ UNDER_REVIEW (existing, unchanged)

REVIEW-TRIGGERED PATH (quantity ≥ threshold, threshold enabled)

  recordPurchase ──▶ BUSINESS_REVIEW_REQUIRED ──▶ approve (owner/authorised manager) ──▶ WAITING_FOR_CUSTOMER
                     (no verify/reject/         │                                              │
                      dispute actions            │                                              └──▶ then the full normal path
                      available to customer)     │                                                   (customer verification MANDATORY)
                                                 └──▶ reject (owner/authorised manager) ──▶ REJECTED (business reason + reviewer evidence)
                                                      terminal · no customer verification · no Verified Units
```

**Core invariants (all hold in this design; §20 records no Product Truth conflict):**

1. Business Review happens **before** customer verification (at record time; the purchase never enters `waiting_for_customer` until approved).
2. Business approval does **NOT** create Verified Units, advance Cycle progress, unlock Reward, or replace customer verification — approval is `business_review_required → waiting_for_customer` only; the entire `admitPurchaseToLoyalty` sequence runs solely on the later customer verify.
3. Customer verification remains mandatory after approval (verify still requires `waiting_for_customer` + ownership; threshold path adds no bypass).
4. Business rejection creates no loyalty progress (no unit/cycle/reward writes; terminal `rejected` with business evidence).
5. Review decisions are append-only/auditable (lifecycle event + Trust Events + idempotency completion in the same transaction, §13).
6. `reviewer_user_id != recorded_by_user_id` enforced server-side where self-approval is prohibited (§12 of this report governs the rule; sole-reviewer exception is an explicit governed Founder-approved carve-out, not a silent weakening).
7. Owner and authorised Manager may review per the permission model (§11); Staff is INELIGIBLE with no grant path; Platform Administrator never by platform status; Customer never.
8. Multiple quantity remains supported (threshold compares against whole-record `quantity`; `multipleUnitsAllowed` rules unchanged; `DEC-LOY-003` multi-quantity rule intact).
9. Threshold crossing **never** automatically rejects (routing only; rejection is always an explicit authorised human decision with reason).
10. Existing customer dispute state remains separate (`under_review` untouched; no new edge touches it).

No current Product Truth contradicts this model: `DEC-PROD-015` §2 + register row expressly approve it (“approval advances only to `waiting_for_customer`; rejection does not advance; neither outcome creates Verified Units or reward eligibility. Customer verification remains mandatory.”). `DEC-LOY-003`’s surviving rules (multi-quantity, never-auto-reject) are preserved. No Founder Decision Item is required on the model itself.

## 10. Review trigger semantics (smallest governed MVP)

**Recommended MVP trigger: a configurable per–Reward-Programme-Version quantity threshold** — new column `reward_program_versions.business_review_quantity_threshold INTEGER NULL` (§12).

| Question | Determination |
|---|---|
| Where the threshold belongs | On the **locked Reward Programme Version** (same row that already carries `multipleUnitsAllowed`, `sharedLoyaltyNumberAllowed`, `bulk_review_threshold`). Evaluated **inside the record transaction against the locked version** (the existing steps 7–11 pattern), so a concurrent publish cannot race the routing decision. |
| Business-scoped vs Programme-scoped | **Programme-version-scoped** for MVP (smallest architecture-consistent choice: reuses versioning, freezing, and the existing `rewardProgram.manage` configuration authority; no new Business-level config surface, no new permission). Business-wide or item-specific thresholds are deferred, not forbidden. |
| Default value | **`NULL` = disabled** (direct to `waiting_for_customer`, today’s behaviour). Any governed seed value is set explicitly through programme versioning, never by default. |
| Zero / null meaning | `NULL` (and any non-positive / absent value, fail closed) = **disabled**. Zero is not a meaningful threshold (every purchase has qty ≥ 1); treat `<= 0` as disabled, never as “review everything”. Exact CHECK: `NULL OR >= 2` recommended (a threshold of 1 would route every purchase; if a Business truly wants that, they set it explicitly — the schema permits `>= 1`, the guidance recommends `>= 2`). |
| Who can configure it | Whoever can publish a programme version today (**Owner-only** `rewardProgram.manage`; Manager explicitly excluded per `DEC-LOY-017` precedent — “must not blindly inherit the Owner-only `rewardProgram.manage`”). No new configuration permission. |
| Whether Staff can see it | **Outcome, not value.** Staff learn the routing outcome truthfully at record time (proceeds to customer verification vs requires review). The threshold value itself is not a Staff read requirement; no new Staff read surface is created. |
| Effect scope | **Review routing only.** The threshold decides `waiting_for_customer` vs `business_review_required` at record time and nothing else. |
| Multiple qualifying items | Threshold compares the **whole-record `quantity`** (consistent with the 1:1 quantity→units mapping and `purchaseCommands` quantity governance). No per-item threshold in MVP. |
| Commercial admission interaction | **Orthogonal.** Business Review gates record→customer-visibility; commercial admission gates verify→loyalty-credit. An approved-then-verified purchase may still be commercially held (`pending_admission`) under `enforce`. Neither gate reads the other’s threshold. |
| `bulk_review_threshold` interaction | **Separate fields, separate semantics.** `bulk_review_threshold` stays visibility-only and untouched. The new threshold is the routing gate. Never derive one from the other; never migrate values across. |

**Governed principles (locked):** threshold determines **whether Business Review is required** — and only that. It MUST NOT determine reward eligibility. It MUST NOT reject automatically. It MUST NOT change Verified-Unit math (`quantity = units` on the later verify path, unchanged).

## 11. Permission model

Actual current architecture (verified, not assumed):

- Four structurally separate catalogue modules + evaluator branches: **sensitive** (8 design rows + `redemption.confirm`; `sensitivePermissionCatalogue.ts`), **ordinary** (4 `business.*` entries; `ordinaryPermissionCatalogue.ts`), **reward-program** (`rewardProgram.manage`, Owner-only), **purchase** (`purchase.record`, Staff/Manager/Owner; `purchasePermissionCatalogue.ts:53-59`), **qualifying-item** (`qualifyingItem.manage`, Owner/Manager; `DEC-LOY-017` precedent). Closed-shape `PermissionId` (`permissionId.ts`); load-time cross-catalogue collision invariants; `evaluatePermission.ts` has **deliberately no platform-administrator branch** (`evaluatePermission.ts:408`) and `Role` is the closed `owner | manager | staff` union.
- Sensitive lifecycle precedent (`redemptionPermissionCatalogue.ts`): Owner floor (non-revocable), Manager default with explicit revoke/re-grant via `staff.assignPermissions`-governed overrides, mandatory audit (`recordSensitiveDecisionStandalone`), per-permission `eligibleBusinessStatuses`. Unlike `redemption.confirm`, `purchase.business_review` names **no** Staff-eligible grant — Staff is ineligible by construction.

**Determination:**

| Actor | Authority |
|---|---|
| **OWNER** | **May approve/reject Business Review** (default grant; non-revocable floor, mirroring `redemption.confirm`). |
| **MANAGER** | **May approve/reject by default**, revocable and re-grantable through the existing governed override mechanism (`staff.assignPermissions`). The architecture supports this (`owner_and_manager_default` default state, `inheritAllowed: true`). A Business that wants Owner-only review revokes the Manager grant explicitly (audited), rather than the platform hard-coding Owner-only. |
| **STAFF** | **INELIGIBLE for `purchase.business_review` at MVP — no explicit-grant path.** May record purchases (`purchase.record`, unchanged); cannot approve/reject Business Review under any grant, override, or inheritance. |
| **PLATFORM ADMINISTRATOR** | **No tenant Business Review authority by virtue of platform status** (no evaluator path; closed `Role` union). Same boundary as `redemption.confirm` and `qualifyingItem.manage` — regression-pinned, not re-argued. |
| **CUSTOMER** | **No Business Review authority** (no Business membership satisfies the gate; verify/reject/dispute remain the customer’s only purchase actions). |

**If a new permission is needed — it is, and it is defined explicitly (not by blind example):**

- New id **`purchase.business_review`** (dot-namespaced, well-formed per `permissionId.ts`; distinct from `purchase.record`).
- New **structurally separate catalogue module** `purchaseBusinessReviewPermissionCatalogue.ts` holding exactly this entry (per the `DEC-LOY-017` / `redemption.confirm` / `qualifyingItem.manage` precedent: never widen an unrelated closed catalogue), **registered** in the sensitive evaluation path so evaluation, override administration (`staff.assignPermissions`), and mandatory audit reuse the existing architecture with no review-specific bypass:
  - `defaultState: "owner_and_manager_default"`, `inheritAllowed: true`
  - `explicitGrantRequired: true`, `explicitGrantEligibleRoles: ["manager"]` (Manager re-grant after explicit revocation only; **Staff is excluded — no Staff grant path exists**), `explicitRevocationSupported: true`. Override construction (`createPermissionOverride`-family) **refuses** any Staff-targeted `purchase.business_review` grant (mirroring the existing refusal of overrides targeting an Owner membership), and the evaluator revalidates eligibility independently, so a fabricated Staff grant denies `GRANT_NOT_HONORED`/`AUTH_FORBIDDEN` regardless of stored override content.
  - `auditRequirement: "mandatory"`, `rationale: ["c"]` (gates movement/misstatement of reward value — same rationale as `redemption.confirm`)
  - `eligibleBusinessStatuses: ["trial", "active"]` (same as `purchase.record`; commercial `suspended` default-allow of redemption does **not** transfer — review of new purchases for a suspended Business stays fail-closed)
- Evaluator gains one structural-copy classification/authorization branch (fifth branch, same logic family as the existing four). Load-time cross-catalogue separation invariant extended to the new module.
- Lifecycle-eligibility and role-floor behaviour regression-pinned by catalogue tests, mirroring `sensitivePermissionCatalogue.test.ts` / `redemptionPermissionCatalogue.test.ts`.

## 12. Self-approval rule

**Actor attribution today:** every purchase stores `recorded_by_user_id` + `recorded_by_role` (`purchase_records`, `purchaseRecordRepository.ts:48-49,111-116`), server-resolved from the evaluator (never a client claim) at `recordPurchaseCommand.ts:177-181,331-332`.

**Enforced rule:** in the approve/reject transaction, after locking the purchase and evaluating `purchase.business_review`, compare the server-resolved reviewer `userId` against the row’s `recorded_by_user_id`:

```
reviewer_user_id != recorded_by_user_id   (else fail closed: AUTH/self-approval error, nothing written)
```

The comparison is server-side, in-transaction, after the row lock — unspoofable by client role claims. Both approve and reject paths enforce it. Replays and stale UI actions fail on the status precondition first (§14); a self-approval attempt fails on this rule with a distinct error (auditable deny where the permission is mandatory-audit).

**Edge cases:**

- *Owner records, Owner reviews:* **prohibited by the same rule** (no role exemption — exemptions are how prohibitions die silently).
- *Manager records, Manager/Owner reviews:* same rule; a *different* authorised reviewer must act.
- *Staff records:* Staff is ineligible for `purchase.business_review` at MVP with no grant path (§11); the inequality rule is a second backstop.
- *System/API-originated transactions:* no system recording path exists today (`RecorderRole = staff | manager | owner`; `recordedByUserId` is always a user). If a future governed system path is added, a `system` recorder never equals a human reviewer, so the rule passes without special-casing. No carve-out is created now for a path that does not exist.
- *Sole-reviewer deadlock (single Owner, no Manager, Owner recorded the purchase):* strict enforcement deadlocks that purchase in `business_review_required`. This is a real MVP edge for single-owner Businesses. Two governed options exist — **(A)** fail closed and require the Owner to invite/assign a second eligible reviewer (Manager) before the purchase can advance; **(B)** allow Owner self-approval **only** when the Business has exactly one eligible reviewer, with mandatory reason + enhanced audit. Option A preserves the prohibition absolutely but blocks legitimate commerce; Option B unblocks it but creates a self-approval exception. **This report recommends Option A as the default (no exception in the implementation package) and records Option B as an explicit Founder decision item for the implementation authorization** — it is not silently adopted, not implemented, and not assumed. The implementation package (§17) implements the strict inequality; any exception requires a separate recorded Founder disposition.

## 13. Audit / evidence model

Existing architecture is reused in full; **no parallel audit mechanism is created.**

For each of the four reportable facts — *review required, review approved, review rejected,* plus reviewer identity, timestamp, reason where required, source purchase, previous state, resulting state — the durable evidence is:

1. **`purchase_record_events` row** (authoritative lifecycle source): `from_status → to_status`, `actor_type` (owner/manager role of the reviewer; recorder role at creation), `actor_id` (reviewer `userId`), `reason` (business reason, mandatory on reject; mandatory-or-null policy on approve per §12 implementation: **reject requires reason; approve records optional note**), `event_payload` (threshold context: version id, quantity, threshold value at decision time — frozen evidence, never a live re-read), `correlation_id`, `occurred_at`.
2. **Trust Events** (same transaction): new types reusing the single `trust_events` ledger —
   - `purchase.business_review_required` (causal + subject: the record; actor: recorder),
   - `purchase.business_review_approved` (actor: reviewer),
   - `purchase.business_review_rejected` (actor: reviewer, payload carries business reason).
   
   Same cardinality/dedup conventions as the existing `purchase.*` events; DB CHECK enumerations extended (migrations `0013`/`0020` shape CHECKs).
3. **Notification Intents** (same transaction): `purchase_business_review_required` → Owner/Manager reviewers (Business recipient); `purchase_business_review_approved` → Customer (now verifiable) + Business confirmation; `purchase_business_review_rejected` → Customer (truthful terminal notice, no internal detail) + Business record. Exact copy is Slice B/C presentation work; intent creation + recipient correctness is the foundation’s contract.
4. **Outbox entries** mirroring the Trust Events (existing `purchase_outbox` pattern; new `PurchaseOutboxEventType` members).
5. **Sensitive-decision audit** via `recordSensitiveDecisionStandalone` for allow **and** deny (the `redemption.confirm` precedent — `authorizeRedemptionConfirm` + `purchaseAuthorization.ts:163-180`), keyed per attempt (`purchase.business_review` + purchase id + idempotency key), because the permission is mandatory-audit.
6. **Idempotency completion** binding reviewer, decision, and resulting purchase row (replay returns the stored decision; never re-executes).

Review history for Slice C is read from `purchase_record_events` + Trust Events for the purchase (existing `listPurchaseRecordEvents` pattern); the review queue for Slice C is a status-filtered business list (`status = 'business_review_required'`, oldest-first, §12 index). No new review table: a separate table would duplicate the append-only event ledger and create a second source of truth for the same transition — explicitly rejected.

## 14. Customer-visible semantics

Founder-approved principle (DEC-PROD-015 + plan): do not expose internal operational detail; Pending vs Verified stays distinct and truthful.

| Situation | Customer sees | Internal state (never shown verbatim) |
|---|---|---|
| Purchase recorded, review triggered, awaiting Owner/Manager | **“Waiting for business confirmation”** (EN) / **“En attente de confirmation du commerce”** (FR) — new i18n keys (e.g. `purchase.status.business_review_required`, `experience.activityBusinessReview`) | `business_review_required` |
| Approved, awaiting customer action | Normal “Waiting for you” / pending-unit treatment (existing keys) | `waiting_for_customer` |
| Rejected by business | Truthful terminal notice (e.g. “Not confirmed by the business”), **no** internal reason codes, no reviewer identity | `rejected` (business reason) |
| Progress | **Never** counted as Verified progress; never in the verifiable queue until approval | — |

Structural consequences (implementation package, §17):

- `listCustomerPendingUnits` (currently `status = 'waiting_for_customer'` only, `customerExperienceRepository.ts:105`) **must exclude** `business_review_required` — awaiting-review purchases are not pending customer action.
- `listWaitingPurchasesForCustomer` (`purchaseRecordRepository.ts:390-403`) **must exclude** `business_review_required` — it is the verifiable queue; review-gated purchases enter it only via approval.
- `listCustomerExperienceActivity` includes review-gated purchases as activity (truthful presence) with the neutral copy above; the detail view offers **no** verify/reject/dispute actions while `status = 'business_review_required'` (server enforces regardless: verify/reject/dispute require `waiting_for_customer` and fail closed otherwise).
- Slice A activity/pending representations need no redesign — the new status is an additional handled case with neutral copy, following the `pending_admission` precedent (`CustomerActivityPage.tsx:158-168`; i18n `purchase.status.*` / `experience.activity*`).

## 15. Slice B dependency contract (Staff Counter — future, NOT implemented here)

What Slice B will bind to (API/domain contract the foundation guarantees):

- `recordPurchase` result extends truthfully: `{ purchase, review: { required: boolean; status: "waiting_for_customer" | "business_review_required" } }` — Staff learns the routing outcome at record time from the server (never computed client-side from a visible threshold).
- Record flow stays fast: one callable, same idempotency (`purchase.create`), same 19-step shape + threshold routing branch; no approval simulation on the counter; no second Staff action required.
- Staff reads: existing business purchase lists gain the new status as a filterable, labelled value (same pattern as `pending_admission` in `PurchaseRecordsPage.tsx:52-56`); Staff sees outcome + business-confirmation copy, never reviewer internals beyond what Slice C governance allows.
- Truthful outcomes: below-threshold → “sent for customer verification”; above-threshold → “sent for business review” (no promise of approval, no Verified-Unit language).
- Guards Slice B must respect (server-enforced anyway): Staff cannot approve/reject (ineligible — no grant path; permission deny); Staff cannot self-approve (inequality rule); Staff cannot verify on the customer’s behalf (ownership check).

## 16. Slice C dependency contract (Owner / Manager Operations — future, NOT implemented here)

What Slice C will bind to:

- **Review queue:** business-scoped list `status = 'business_review_required'`, oldest-first, paginated (`listPurchaseRecordsForBusiness` status filter + §12 partial index). Each row carries transaction context: item label, quantity, customer ( governed minimum per `customer.viewProtectedProfile` — transaction-necessary minimum only), recorded-by actor + role + timestamp, programme/version, threshold evidence.
- **Actions:** `approveBusinessReview(purchaseId, idempotencyKey, note?)` → `waiting_for_customer`; `rejectBusinessReview(purchaseId, idempotencyKey, reason)` → `rejected` (bounded business reason, mandatory). Both: Business-authenticated, `purchase.business_review` evaluated live, self-approval inequality enforced, conditional-transition atomicity, idempotent, audited (§13).
- **Review history:** per-purchase event + Trust Event timeline (required → approved/rejected, actor, timestamps, reasons).
- **Permissions:** live evaluator state drives UI enablement (Owner default; Manager default unless revoked; Staff never shown — no grant path exists); revocation between page load and action denies the action (same live re-resolution as `confirmRedemption`).
- **Audit trail:** reviewer identity, decision, reason, before/after states, correlation — all server-written, all immutable.

## 17. Schema / migration assessment (proposed delta — NOT executed)

Smallest architecture-consistent model. **One additive migration (proposed `0028_business_review_foundation`), no new table, no column removed, no existing semantic altered:**

1. **New purchase status.** `ALTER TABLE purchase_records DROP/CREATE CONSTRAINT purchase_records_status_check` — add `'business_review_required'` to the vocabulary CHECK (same `NOT VALID → VALIDATE` pattern as `0026:31-37`).
2. **State-integrity CHECK.** Extend `purchase_records_verified_fields` (same pattern as `0026:41-58`): `business_review_required` carries `verified_at IS NULL AND rejection_reason IS NULL AND dispute_reason IS NULL` (no verdict facts while awaiting review — like `waiting_for_customer`).
3. **Transition guard.** Extend the guard function/trigger (same pattern as `0026:62-86`, new or amended function):
   - `INSERT` may create `waiting_for_customer` (existing) or `business_review_required` (new; routing decided in-transaction at record time). `INSERT` in `pending_admission` stays forbidden.
   - `business_review_required` may be entered **only** at creation (from ∅). It may leave **only** to `waiting_for_customer` (approve) or `rejected` (business reject). All other entries/exits refused — in particular: no `business_review_required → verified` (approval never mints credit), no `waiting_for_customer → business_review_required` (no retroactive gating), no `business_review_required → under_review/pending_admission`, and no customer verify/reject/dispute from it (those commands’ `WHERE status = 'waiting_for_customer'` preconditions already fail closed; the trigger is defence in depth).
   - `pending_admission` and `under_review` guards unchanged.
4. **Threshold config.** `ALTER TABLE reward_program_versions ADD COLUMN business_review_quantity_threshold INTEGER NULL CHECK (business_review_quantity_threshold IS NULL OR business_review_quantity_threshold >= 1)` with guidance `>= 2` (see §10). `NULL` = disabled. No change to `bulk_review_threshold`. Version-scoped, frozen per version (historical purchases reinterpreted under their creation version — same history rule as `multipleUnitsAllowed`).
5. **Business-rejection representation.** Reuse terminal `rejected` status + **distinct bounded business-reason representation**: either (preferred) new nullable column `purchase_records.business_review_reason TEXT` with CHECK-vocabulary + `rejected`-from-review requires it (and requires `rejection_reason IS NULL` on that path, preserving customer-reason integrity), or a disjoint new vocabulary with actor-disambiguated evidence. **Future implementation MUST NOT reuse the existing customer `rejection_reason` semantics** (vocabulary, writer, or meaning) for business-review rejection. The implementation package decides between the two distinct-representation options from the migration-authoring constraints at the time; **both preserve the §7 invariant** (customer `rejection_reason` rows always have customer actor + customer vocabulary). This report locks the invariant, not the column choice, and requires the implementation prompt to state the choice explicitly. (Rationale for preference: a separate column keeps the customer CHECK untouched and makes `rejected`-by-whom a pure column read.)
6. **Reviewer attribution columns (minimal, recommended).** `business_review_reviewer_user_id TEXT NULL`, `business_review_decided_at TIMESTAMPTZ NULL` — set atomically on approve/reject, `NULL` otherwise (CHECK). Rationale: mirrors `verified_at`/`rejection_reason` verdict-column precedent and makes queue/history/audit reads single-row without event joins. (Alternative — events-only — is explicitly rejected for production audit: attribution must survive event-table retention/pagination choices.)
7. **Evidence enumerations.** Extend `trust_events` `event_type` CHECKs (migrations `0013`/`0020` shape) with `purchase.business_review_required | purchase.business_review_approved | purchase.business_review_rejected`; extend `PurchaseOutboxEventType` + notification-intent types identically to the existing `purchase.*` family. No new ledger/table.
8. **Indexes.** Partial index `purchase_records_business_review_queue_idx ON purchase_records (business_id, created_at, id) WHERE status = 'business_review_required'` (queue pattern of `0026:90-95`); consider `(customer_identity_id, created_at) WHERE status = 'business_review_required'` only if a customer “awaiting business” read is governed (default: excluded from customer reads per §14 — index only if needed).
9. **Permission seeds.** No seed-data migration for `purchase.business_review` beyond the catalogue module + evaluator branch + tests (permissions are code-catalogue, not rows; overrides remain Firestore-governed). No `eligibleBusinessStatuses` backfill (absent = legacy set; new entry names its own set explicitly).
10. **Migration hygiene.** `NOT VALID → VALIDATE` constraint pattern; `.down.sql` failing closed when `business_review_required` rows exist (same pattern as `0026.down:14-17`); expected-migration-list test updates (same mechanical class as WP-COM-05a D2).

Explicitly **not** required: new review table; new outbox/audit ledger; changes to `pending_admission`/`under_review` edges; changes to `bulk_review_threshold`; changes to Verified-Unit/Cycle/Reward schema; Firestore collection changes.

## 18. Proposed transition matrix

Conventions: every mutation is a single PostgreSQL transaction with global lock order `[idempotency → purchase FOR UPDATE → (stream/cycle iff admitting) → appends]`; every state change is a conditional `UPDATE … WHERE status = <FROM>`; reviewer identity is server-resolved (never a client claim); every row below completes its idempotency key.

| # | FROM | ACTION | ACTOR | PRECONDITION | TO | SIDE EFFECT | EVIDENCE | FAILURE MODE |
|---|---|---|---|---|---|---|---|---|
| T1 | ∅ | record purchase below threshold (or threshold disabled) | Staff/Manager/Owner with `purchase.record`; Business `trial`/`active` | artifact valid; program/version current+active; item on locked version; shared/quantity rules pass; `quantity < threshold OR threshold NULL` | `waiting_for_customer` | Purchase snapshot; lifecycle event; `purchase.recorded` Trust; customer intent; outbox | creation event (∅→waiting) + Trust + intent + outbox + `purchase.create` completion | any precondition fails → fail closed, nothing written; idempotency conflict/in-progress per existing semantics |
| T2 | ∅ | record purchase at/above threshold | Same as T1 | Same as T1 except `threshold NOT NULL AND quantity >= threshold` | `business_review_required` | Same writes as T1 **plus** `purchase.business_review_required` Trust + Owner/Manager review intent; purchase is **invisible** to customer verify queue/pending units | creation event (∅→business_review_required) + both Trust Events + intents + outbox + completion | threshold read is from the **locked** version; concurrent publish cannot alter routing; failure modes as T1 |
| T3 | `business_review_required` | approve review | Owner / authorised Manager with `purchase.business_review` (live); `reviewer != recorded_by` | `status = business_review_required` (row lock); reviewer eligible + Business `trial`/`active` | `waiting_for_customer` | Reviewer columns set; customer “now verifiable” intent; purchase enters customer queue/pending projection | transition event (review→waiting, actor=reviewer, note?) + `purchase.business_review_approved` Trust + intents + outbox + `purchase.business_review_approve` key completion + sensitive-decision audit | stale (already decided) → `purchaseStaleStateError`; self-approval → deny, nothing written; permission revoked → deny + audited deny |
| T4 | `business_review_required` | reject review | Same actor/permission/rule as T3 | Same lock/precondition as T3 + **mandatory bounded business reason** | `rejected` (business reason) | Reviewer columns + business reason set; terminal; customer truthful-notice intent; **no** unit/cycle/reward/intent beyond notice | transition event (review→rejected, actor=reviewer, reason) + `purchase.business_review_rejected` Trust + intents + outbox + key completion + audit | same failure modes as T3; missing/invalid reason → validation error, nothing written |
| T5 | `waiting_for_customer` (post-approval) | customer verify after approval | Customer (ownership) | `status = waiting_for_customer` + ownership; programme path as today (gate `off` → admit; `enforce` → commercial decision incl. possible `pending_admission`) | `verified` (or `pending_admission` under enforce-hold) | Full existing admission writes (unit/cycle/reward/Trust/intents/outbox); identical to normal path — approval added no shortcut | existing verify evidence chain (`purchase.verified`, `verified_units.issued`, …) with `programCurrentVersionId`/rebound trace | wrong customer → ownership error; already-decided → stale; commercial hold → discriminated held outcome (not an error) |
| T6 | `waiting_for_customer` (post-approval) | customer reject/dispute after approval | Customer (ownership) | `status = waiting_for_customer` + ownership | `rejected` (customer reason) / `under_review` (dispute reason) | Existing reject/dispute writes only | existing reject/dispute evidence chain | same as T5 ownership/stale modes |
| T7 | `business_review_required` | Staff review attempt (ineligible) | Staff (no grant path exists at MVP) | — (attempt) | **no transition** | Nothing written except the mandatory-audit deny record | audited deny (sensitive-decision audit) + error to caller | fail closed `AUTH_FORBIDDEN`-family; no state change; no grant path exists, so retry cannot succeed — a future Staff path would require a new governed disposition, not an override |
| T8 | `business_review_required` | self-approval attempt | Otherwise-authorised reviewer who recorded the purchase | `reviewer == recorded_by` | **no transition** | Nothing written (distinct self-approval error, auditable) | audited deny + error; purchase stays review-required for a different reviewer | fail closed; sole-reviewer deadlock governed by §12 (Option A default; Option B only by separate Founder disposition) |
| T9 | `waiting_for_customer` or `rejected` (post-decision) | duplicate review action | Any | purchase already decided (status ≠ `business_review_required`) | **no transition** | Idempotent replay returns the stored decision when the **same** key+hash repeats; a **new** key on a decided purchase fails stale | stored idempotent result / stale-state error | never double-applies: conditional transition + completed key |
| T10 | `business_review_required` | stale/concurrent review action (approve+approve, approve+reject, decision+verify race) | Two authorised actors (or actor + customer) | row lock serialises; conditional transition admits exactly one winner | winner’s TO; loser no-op | Exactly one decision’s full write set; customer verify racing review loses (verify requires `waiting_for_customer`) | winner’s evidence; loser’s stale-state error (+ its own idempotency completion as failed/no-op per existing semantics) | no split decision; no unit without customer verify; no verify without approval |

Out of scope (no rows added): any exit from `verified`/`rejected`/`under_review` (unchanged); `corrected`/`cancelled`/`expired`/`archived` (no writers — deferred packages).

## 19. Concurrency / idempotency requirements

Existing mutation patterns (reused, not reinvented): pre-transaction peek + in-transaction `checkAndReserveIdempotencyKey` → `SELECT … FOR UPDATE` row lock → conditional transition → appends → `completeIdempotencyKeyInTransaction` → commit; global lock ordering (idempotency → purchase → stream → cycle → reward → appends); `WITH` no new lock class before the purchase lock; `admit:<purchase_id>` namespace reserved for the commercial admission key (do not collide — new review keys use `purchase.business_review_approve:<id>` / `…_reject:<id>` or caller-supplied keys namespaced per operation).

- **Duplicate approval:** same key + same body → stored decision replay (no second transition, no second Trust Event — replays return before any write, per `trustEventRepository` “loud bug signal” invariant). Same key + different body → conflict error.
- **Approval + rejection race:** both take the purchase `FOR UPDATE` lock in one transaction each; the conditional `UPDATE … WHERE status = 'business_review_required'` admits exactly one; the loser sees zero rows → stale-state error; loser’s idempotency key completes as failed/no-op without decision writes.
- **Customer verification racing Business Review:** verify/reject/dispute preconditions require `status = 'waiting_for_customer'` (`verifyPurchaseCommand.ts:203-205,236-238`; `rejectPurchaseCommand.ts:112-114`; `raisePurchaseDisputeCommand.ts:114-116`). A review-gated purchase fails these closed until T3 approval lands. No customer action can leapfrog review; no review action can mint credit.
- **Replayed callable:** peek short-circuit + reserved-key completion make retries safe; `isReservedIdempotencyKey` defence-in-depth rejects cross-namespace key reuse (`verifyPurchaseCommand.ts:140-143`).
- **Stale UI action:** any action on a non-current status fails with `purchaseStaleStateError(expected, actual)`; UI re-reads queue/detail (same pattern as `pending_admission` filterable lists).
- **Purchase cancellation:** no cancellation command exists; nothing in BR creates one. If a future cancellation package arrives, its edges must explicitly name `business_review_required` (allow or forbid) — BR does not pre-decide it.
- **Server-authoritative atomicity:** all review transitions are single-transaction, lock-ordered, conditional, idempotent, and audited — per the existing `publishVersion`/`purchaseRecordRepository` precedent (header `purchaseRecordRepository.ts:10-17`).

## 20. Product Truth conflicts, if any

**None.** Checked against current repository Product Truth:

- `DEC-PROD-015` (CONFIRMED) expressly establishes the model (§2 dispositions + register row `decision-register.md:420-429`): review-before-verification gate, approval → `waiting_for_customer` only, rejection terminal, no Verified Units from business action, customer verification mandatory, `under_review` stays customer-dispute, `bulkReviewThreshold` visibility-only superseded only as to the gate.
- `DEC-LOY-003` surviving rules (multi-quantity allowed; never auto-reject) are preserved (§§8–10).
- `DEC-PROD-002` (customer verification as primary control) is supplemented, not weakened (register Notes).
- The `18e8d700` Experience Reference governs experience; Product Truth governs data/state/permissions/transitions — no material conflict found; none invented.
- Open design choices (§§10–12, §17 items 5–6) are **bounded implementation decisions within authorised Product Truth**, not Product Truth contradictions. The sole explicit Founder decision item carried forward is the §12 sole-reviewer exception (Option B), which is **excluded** from the authorised package until separately dispositioned.

No Founder Decision Item blocks authorisation. No compromise was invented.

## 21. Exact implementation package scope (future — NOT authorised to start by this report alone)

**In scope (future BR implementation prompt only):**

1. Purchase domain state: `business_review_required` status, record-time routing branch in `recordPurchase` (locked-version threshold read), approve/reject commands with the §18 matrix.
2. Transition service + repository: conditional transitions, queue/history reads, partial index, guard-trigger migration (`0028`, §17 items 1–4, 8).
3. Threshold config: `business_review_quantity_threshold` column + versioning/seed semantics (§17 item 4; §10 table). `bulk_review_threshold` untouched.
4. Business-rejection representation: §17 item 5 (invariant locked; column choice stated in the implementation prompt).
5. Reviewer attribution columns: §17 item 6.
6. Permission: `purchase.business_review` catalogue module + evaluator branch + override/audit reuse + tests (§11).
7. Evidence: Trust/outbox/intent type extensions + same-transaction writes + sensitive-decision audit (§13).
8. Callables/API: `approveBusinessReview` / `rejectBusinessReview` (+ parsers, idempotency namespaces, error taxonomy — no new category unless the closed 14-category set requires it, which it should not).
9. Customer/business reads: queue exclusion/inclusion per §14 (pending-units, waiting queue, activity copy, business filters) + EN/FR keys.
10. Tests: full transition-graph tests (T1–T10), permission matrix (owner/manager/staff/platform-admin/customer × approve/reject/self/invalid/duplicate/race), Staff grant-attempt refusal (override construction refuses Staff-targeted grants; evaluator denies fabricated Staff grants), event actor/time evidence, no-unit-on-approval-or-rejection proofs, customer-verification-still-mandatory proof, threshold boundary tests (null/disabled, below/at/above), commercial-gate orthogonality tests (approved→held under `enforce`), migration up/down tests.
11. Migration `0028` (+ `.down.sql` fail-closed) and expected-list bookkeeping.

**Explicitly excluded:** Staff UI; Owner/Manager UI (queues/actions/history presentation beyond the domain reads); Customer redesign (beyond the §14 handled-case copy); onboarding; reporting; commercial changes (gate, earmarks, processor, read models); Slice C; Slice D/E; EA-BL-002; WP-COM (any package); FEF-TLC adoption; deployment; any change to `under_review` / `pending_admission` edges / `bulk_review_threshold` / Verified-Unit math.

## 22. Programme records changed (this task)

- This report: `docs/05-implementation/reports/11THONUS-EA-BL-001-CORR-002-BR-authorisation-and-design-2026-10-06.md` (new).
- Master Workflow §17: dated BR-authorisation note (superseding note, history preserved).
- Engineering Implementation Programme §C.2: BR row → **AUTHORISED / READY FOR IMPLEMENTATION** (Prompt-Register sense: `Ready` — eligible for its detailed implementation prompt; implementation not started) + dated note; Slice B dependency note unchanged (still blocked until BR is *implemented*, not merely authorised).
- Coding-Agent Prompt Register §4: BR row → **AUTHORISED / READY FOR IMPLEMENTATION** (`Ready`); report linked; B–E rows unchanged.
- `docs/00-governance/documentation-changes-log.md`: Entry 292 (this task).
- `docs/changes/IMPLEMENTATION_CHANGES.md`: BR authorisation entry (governance only).
- No Decision Register change (no decision created, amended, or superseded beyond what `DEC-PROD-015` already governs). No Product Truth document changed.

## 23. Final authorisation verdict

**BR AUTHORISED — READY FOR IMPLEMENTATION**

`EA-BL-001-CORR-002-BR` (Business Review Domain Foundation) is authorised as **READY FOR IMPLEMENTATION** under `DEC-PROD-015` per the lifecycle, trigger, permission, self-approval, evidence, visibility, schema-delta, transition-matrix, and concurrency design recorded in §§9–19, within the implementation scope of §21 and the boundaries on this report’s cover.

- This authorises **BR ONLY** (domain foundation: state, transitions, permission, evidence, threshold config, callables, tests, migration `0028` design).
- It does **NOT** authorise Slice B, Slice C, Slice D, Slice E, EA-BL-002, WP-COM work, FEF-TLC-001, deployment, or any UI.
- Slice B remains blocked until BR is **implemented and merged**, not merely authorised.
- The §12 sole-reviewer exception (Option B) is **not** authorised; the strict inequality ships unless a separate Founder disposition says otherwise.
- The next governed action is a **separately authorised BR implementation prompt**; no implementation begins without it.

---

## Completion report (task mechanics)

1. **Files modified:** (a) new report (above path); (b) `docs/05-implementation/11thonus-master-workflow.md` (§17 dated note); (c) `docs/05-implementation/change-tracking/engineering-implementation-programme.md` (§C.2 BR row + note); (d) `docs/05-implementation/change-tracking/coding-agent-prompt-register.md` (§4 BR row); (e) `docs/00-governance/documentation-changes-log.md` (header + Entry 292); (f) `docs/changes/IMPLEMENTATION_CHANGES.md` (BR authorisation entry). No application, migration, config, or dependency file touched.
2. **Diff summary:** governance/documentation only; six files; no code hunks outside `docs/`.
3. **Commands executed:** `git fetch origin`; `git rev-parse` / `git log` / `git show` verification of PR #300 (`facf59c…`) and PR #302 (`961fc27…`) SHAs; read-only codebase inspection (`purchase` domain services/repositories/models, `permissions` catalogues/evaluator, `0026` migration, `index.ts` callables, web customer/business reads + i18n, Decision Register `DEC-PROD-015`/`DEC-LOY-003`, Master Workflow/EIP/Prompt Register/plan reports). No test/build/deploy commands (no code changed; none required for a governance-only change set).
4. **Dependencies added:** none.
5. **Config changes:** none.
6. **Schema/migration changes:** **NONE executed.** Proposed delta specified (§17) for the future implementation package (proposed migration `0028`, not created).
7. **Risks:** (a) implementer reuses `under_review`/`pending_admission`/`rejection_reason`/`bulk_review_threshold` instead of the new artefacts — mitigated by §§5–8 disposition locks + review checklist; (b) threshold misread off the unlocked version (race) — mitigated by locked-version evaluation requirement (§10); (c) self-approval weakening under single-owner pressure — mitigated by strict default + explicit Option-B exclusion (§12); (d) review-gated purchases leaking into customer verifiable/pending reads — mitigated by §14 read contracts + tests; (e) approval minting credit via wrong edge (`→ verified`) — forbidden by guard + matrix T3 + no-credit tests; (f) Staff granted review authority via override or eligible-role widening — eliminated by construction (Staff excluded from grant-eligible roles; override construction + evaluator revalidation refuse Staff-targeted grants; tests pin it, §11).
8. **Rollback instructions:** revert the authorisation PR (documentation-only; `git revert` the merge or close the PR unmerged). No data migration to roll back; no application behaviour changed; programme records return to “BR NOT AUTHORISED” by the revert.
9. **Markdown report:** this file (§§1–23 above).
10. **Changes tracking update:** Entry 292 in the documentation-changes log + `IMPLEMENTATION_CHANGES.md` BR authorisation entry (both in this change set).
11. **PR number:** to be created on push (governance-only branch `docs/ea-bl-001-corr-002-br-foundation` → `main`); **DO NOT merge** (per task GIT STRATEGY).
12. **Exact head SHA:** recorded at commit time (see PR description / §1 entry SHA + branch head after commit).
