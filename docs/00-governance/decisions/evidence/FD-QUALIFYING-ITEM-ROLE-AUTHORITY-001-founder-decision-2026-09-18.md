# FD-QUALIFYING-ITEM-ROLE-AUTHORITY-001 — Phase 1 Qualifying Item Management Role Authority

> **Title:** FD-QUALIFYING-ITEM-ROLE-AUTHORITY-001 — Founder Decision: Phase 1 Qualifying Item Management Role Authority
> **Version:** 1.0 · **Status:** Founder-approved evidence record · **Classification:** Working (governance record)
> **Governing document:** 11thONUS Platform Constitution
> **Source-of-truth path:** `docs/00-governance/decisions/evidence/FD-QUALIFYING-ITEM-ROLE-AUTHORITY-001-founder-decision-2026-09-18.md`
> **Decision date:** 2026-09-18 · **Approved by:** Founder (Kenogo)
> **Decision Register representation:** [`DEC-LOY-017`](../decision-register.md) (see §6 for why this number)
> **Preceding authority:** [`FD-REWARD-QUALIFYING-ITEM-001`](FD-REWARD-QUALIFYING-ITEM-001-founder-decision-2026-09-18.md) / [`DEC-LOY-016`](../decision-register.md) (2026-09-18, Business-defined qualifying items) — extended, not re-litigated
> **Prompting analysis:** [`PLATFORM-BASELINE-012-QUALIFYING-ITEM-DELIVERY-DESIGN-001`](../../../05-implementation/reports/platform-baseline-012-business-owned-qualifying-item-implementation-readiness-design-2026-09-18.md) §17 FQ-1
> **Recorded by:** `PLATFORM-BASELINE-012-FD-ROLE-CLOSE-001` (documentation only — no code, schema, migration, or permission-catalogue change was made by this record)

## 1. Context

`DEC-LOY-016` established that a participating Business defines its own qualifying item(s) for a Reward Program, with Commerce Knowledge mapping as optional classification only. It did not state **which role inside the Business** may perform that definition.

`PLATFORM-BASELINE-012` §17 FQ-1 surfaced this as the principal open question, from direct inspection rather than inference. The relevant facts it established:

- `functions/src/domains/permissions/models/rewardProgramPermissionCatalogue.ts` holds exactly one entry, `rewardProgram.manage`, with `roleDefaults = {owner: true, manager: false, staff: false}` — **Owner-only**.
- That module's own header records *why*: `PLATFORM-BASELINE-005-FOUNDER-DISPOSITION-001` FD-2 fixed it Owner-only, and the design report's `CORR-001.5`/`.6` explicitly state that **no existing authority answered the Manager question, so none was invented**.
- `functions/src/domains/permissions/evaluator/evaluatePermission.test.ts` asserts that a grant override for `rewardProgram.manage` is never honoured — there is no explicit-grant widening path for this catalogue.
- Reusing `authorizeRewardProgramManage` for qualifying-item management — the safe, non-inventive default, and what `PLATFORM-BASELINE-011` §L recommended — would therefore make **only the Business Owner** able to add, rename, or archive a qualifying item.

`FD-REWARD-QUALIFYING-ITEM-001` §2.6 says only that "the Business remains responsible for defining its commercial offer," which does not resolve which role inside the Business holds that responsibility. For a Business whose offer changes weekly, Owner-only item management is a plausible operational defect. This record resolves that question.

## 2. Founder Decision

For Phase 1 of 11thONUS:

1. **Business Owner** and **Business Manager** may: create Business-owned Qualifying Items; rename/edit them; archive them; and optionally assign or change a Commerce Knowledge classification on them.
2. **Business Staff** may view and select configured Qualifying Items as necessary to perform authorised frontline transaction recording; Staff may **not** create, rename/edit, archive, classify, or otherwise manage Qualifying Items.
3. **Platform Administrator** does **not** receive routine authority to manage a Business's Qualifying Items merely by virtue of platform-administrator status.
4. Qualifying Item management must **not** be implemented by blindly inheriting the current Owner-only `rewardProgram.manage` permission if doing so would exclude Business Managers.
5. The existing permission architecture must be used. The smallest coherent permission-model amendment is to be determined from the existing catalogue's own conventions — not guessed.
6. **No ad-hoc UI-only role check.** Server-side permission evaluation remains the sole authority; any client-side control visibility is convenience, never enforcement.
7. This remains a **design** decision to be documented. It authorizes no implementation by itself.

## 3. What this decision does NOT do

It does not alter `rewardProgram.manage`'s own Owner-only scope for Reward Program creation, editing, versioning, or publication — that authority is untouched and is **not** widened to Manager by this decision. It does not grant Staff any management capability. It does not grant Platform Administrators any Business-scoped routine authority. It does not implement any code, schema, migration, or permission-catalogue change. It does not alter the 10+1 Circle mechanic, the fixed threshold, redemption mechanics, Commerce Knowledge seed authorization, Business Participation Terms, or any customer verification/trust control. It does not authorize `PLATFORM-BASELINE-013` to begin.

## 4. Consequences for the recorded design (documented, not implemented)

`PLATFORM-BASELINE-012` §5/§16/§17 are amended by this same task. The determined smallest coherent amendment, derived from the existing catalogue conventions rather than guessed:

**A distinct permission id in its own structurally separate catalogue module — not a widening of `rewardProgram.manage`.**

Evidence for that determination, from direct inspection of the permissions domain:

- **Widening `rewardProgram.manage` to `manager: true` would overreach this decision.** That single permission also gates `createRewardProgram`, `updateRewardProgramDraft`, `createNextRewardProgramVersion`, and `publishRewardProgramVersion` via `authorizeRewardProgramManage`. Widening it would hand Managers authority over Reward Program creation and publication, which §2 does not grant and §3 explicitly withholds. It would also reopen the closed `PLATFORM-BASELINE-005-FOUNDER-DISPOSITION-001` FD-2 instrument for an unrelated purpose — precisely the failure mode both existing catalogue module headers warn against in their own words.
- **The repository's established convention for a new bounded domain concern is a new, disjoint catalogue module.** `rewardProgramPermissionCatalogue.ts` (third) and `purchasePermissionCatalogue.ts` (fourth) were each created for exactly this reason, each stating that appending to an existing closed catalogue "would reopen that specific closed instrument for an unrelated purpose," and each adding only "a structural copy" of the existing authorization branch rather than a new algorithm.
- Therefore: a fifth module, `qualifyingItemPermissionCatalogue.ts`, holding exactly one entry `qualifyingItem.manage` with `roleDefaults = {owner: true, manager: true, staff: false}` and `eligibleBusinessStatuses = ["trial", "active"]` (matching both existing domain catalogues), plus a Step 5d branch in `evaluatePermission.ts` that is a structural copy of the existing Step 5b/5c branches, plus the same module-load-time cross-catalogue uniqueness invariant the other modules already enforce.

**Staff read/select access requires no catalogue entry.** `PLATFORM-BASELINE-012` §7 established that the frontline qualifying-item picker reads the Business's configured items through the already-existing `listRewardPrograms` callable, which is gated by `authorizeRewardProgramRead` — membership-only, by explicit existing design, matching the `getBusinessContext`/`listStaffMemberships` read precedent. Staff therefore already have exactly the view-and-select capability §2.2 grants, and exactly nothing more, with no new permission and no new read surface. `purchase.record` (Staff/Manager/Owner) continues to gate the recording action itself, unchanged.

**The Platform Administrator boundary is already satisfied by construction.** Direct inspection confirms `Role` is the closed union `"owner" | "manager" | "staff"` (`role.ts`), and `evaluatePermission.ts` contains **no** platform-administrator branch, bypass, or cross-Business path of any kind. A Platform Administrator holds no Business membership role and therefore cannot satisfy any Business-scoped catalogue entry. §2.3 requires **no** change to preserve — only a regression test asserting it stays true.

**Net effect on the recorded design:** `PLATFORM-BASELINE-012`'s slice 2 gains one new catalogue module, one evaluator branch, and their tests; `rewardProgram.manage` shows zero diff; no other slice changes. The correction is additive and does not alter any other conclusion in that report.

## 5. Supersession boundaries (exact)

| Document / artifact | Provision clarified for Phase 1 | Provision NOT superseded |
|---|---|---|
| `PLATFORM-BASELINE-005-FOUNDER-DISPOSITION-001` FD-2 (`rewardProgram.manage` Owner-only) | Nothing. FD-2 is **not** superseded, amended, or reopened — `rewardProgram.manage` remains Owner-only. | The entire disposition, including its Owner-only role defaults and its no-override-path property. |
| `rewardProgramPermissionCatalogue.ts` header note ("no existing authority answers the Manager question, so none is invented") | The Manager question is now answered by Founder authority — **but only for Qualifying Item management**, which this decision places outside that catalogue. | The note's accuracy for `rewardProgram.manage` itself, which remains Owner-only with no Manager path. |
| `PLATFORM-BASELINE-011` §L ("reuse `authorizeRewardProgramManage`'s existing Business-membership check, do not invent a new authorization surface") | Superseded to the extent it would make qualifying-item management Owner-only. A distinct permission is now required. | Its underlying intent — do not invent a new *authorization algorithm* — which is preserved exactly: the new catalogue is a structural copy, not a new mechanism. |
| `PLATFORM-BASELINE-012` §17 FQ-1 | Closed by this decision. | §17 FQ-2/FQ-3/FQ-4, which remain open and are unaffected. |
| PRD1 (`01-accounts-roles-and-permissions.md`) `AP-006` "No Silent Permission Escalation", `AP-008` "Role Names Do Not Automatically Grant Unlimited Power" | Nothing — this decision is consistent with both: authority is granted explicitly, per-permission, server-evaluated, and narrowly scoped. | Both principles in full. |

No other provision of any PRD, TRD, Standard, or the RTM is superseded by this decision.

## 6. Decision Register numbering

Recorded as **`DEC-LOY-017`**.

- `DEC-LOY-016` is the immediate parent decision and the highest `DEC-LOY-` row actually present in the register; `017` is the next free number in that family.
- The Loyalty family is correct by subject matter: this decision governs authority over **Qualifying Items**, a Reward Program construct introduced by `DEC-LOY-016` itself. The register has no `DEC-ROLE-`/`DEC-PERM-` family, and minting a new prefix for a single decision would be a guess rather than a convention. Existing role-authority decisions already sit in their subject-matter families rather than a dedicated one (for example `DEC-PROD-007`, Owner auto-approval of purchases; `DEC-SEC-003`, staff authentication on shared devices).
- `DEC-LOY-014` and `DEC-LOY-015` are **not** reused — see §7.

## 7. `DEC-LOY-014` / `DEC-LOY-015` — disclosed discrepancy carried forward (not resolved)

Unchanged from `FD-REWARD-QUALIFYING-ITEM-001` §5 and re-confirmed by this task on `origin/main` = `b2f1fda053c600e1fe29dcddea6ecda2329da6e9`: neither `DEC-LOY-014` nor `DEC-LOY-015` has an actual row in `decision-register.md`, despite both being cited as settled authority elsewhere in committed, tracked files (`0015_reward_programs_category_optional.sql`'s SQL comment and `rewardProgramKnowledgeValidation.ts`'s comments cite `DEC-LOY-014`; `coding-agent-prompt-register.md` has cited `DEC-LOY-015` since 2026-07-18). This record does **not** backfill, fabricate, reuse, or resolve either identifier. The gap remains open.

`DEC-CKS-001`/`DEC-CKS-002` likewise remain separately open and are neither invoked nor resolved here.

## 8. What this decision does not do (restated for the implementation boundary)

It implements nothing. No permission catalogue module was created or edited. No `roleDefaults` table was changed. No evaluator branch was added. No test was written. No migration, schema, seed, redemption, Circle-engine, or Business Participation Terms work was performed or authorized. `PLATFORM-BASELINE-013` is not authorized to begin by this record. The permission-model shape described in §4 is a **design recommendation carried in `PLATFORM-BASELINE-012`**, to be implemented only under a future, separately authorized package.
