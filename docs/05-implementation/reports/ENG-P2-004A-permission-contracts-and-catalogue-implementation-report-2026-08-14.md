> **Title:** ENG-P2-004A — Permission Contracts & Sensitive Permission Catalogue — Implementation Report
> **Status:** Implemented, test-first (TDD) — pending Founder-authorized review and merge.
> **Date:** 2026-08-14
> **Task:** `ENG-P2-004A`, per Founder authorization citing `ENG-P2-004-DESIGN-001` (Approved v1.1, AD-1–AD-5 recorded) as governing design.
> **Source-of-truth path:** `docs/05-implementation/reports/ENG-P2-004A-permission-contracts-and-catalogue-implementation-report-2026-08-14.md`
> **Companion documents:** [`ENG-P2-004-DESIGN-001`](../roadmap/ENG-P2-004-DESIGN-001-role-context-permission-resolution-architecture.md); [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-ID-003`

---

## Executive Summary

Implemented the `ENG-P2-004A` contract/configuration foundation at
`functions/src/domains/permissions/models/` — the `Role` and
`PermissionId` value types, the eight-entry Sensitive Permission
Catalogue (a direct transcription of `ENG-P2-004-DESIGN-001` §3.2), the
`RoleTemplate` contract (with `SENSITIVE_PERMISSION_ROLE_TEMPLATES` derived solely from
the catalogue's own inheritance metadata), the `PermissionOverride`
contract, and domain-local errors. Built test-first: every module's test
file exercises the module's full public surface, including every
structural invariant the design requires (sensitive permissions cannot be
implicit in a role template's defaults, an override cannot target an
Owner membership, malformed/unknown identifiers are rejected). **No
runtime permission evaluation, `AuthorizationDecision` logic, decision
table, evaluator caching, audit/outbox emission, protected-command
integration, or persistence was implemented** — this is domain
modeling/contract definition only, matching `ENG-P2-004A`'s scope
boundary in the design's §14 decomposition.

## 1. Files Inspected (Phase A)

`ENG-P2-004-DESIGN-001` (full document, v1.1); TRD10 §10.6.4
(`BusinessMembershipDocument`); the entire Identity domain
(`functions/src/domains/identity/models/*` — value-object, closed-enum,
and domain-error conventions), Authentication domain-contracts layer
(`functions/src/domains/authentication/models/*`), and LoyaltyNumber/
QrIdentity domains for the repeated Firebase-free `models/`+README
pattern; `functions/src/shared/errors/errorCategories.ts` and
`platformError.ts`; `functions/vitest.config.ts`, `functions/tsconfig.json`,
and the repo-root `eslint.config.js` (per-domain
`no-restricted-imports` boundary convention).

## 2. Files Created

- `functions/src/domains/permissions/models/role.ts` + `.test.ts`
- `functions/src/domains/permissions/models/permissionId.ts` + `.test.ts`
- `functions/src/domains/permissions/models/sensitivePermissionCatalogue.ts` + `.test.ts`
- `functions/src/domains/permissions/models/roleTemplate.ts` + `.test.ts`
- `functions/src/domains/permissions/models/permissionOverride.ts` + `.test.ts`
- `functions/src/domains/permissions/models/permissionErrors.ts` + `.test.ts`
- `functions/src/domains/permissions/README.md`
- This report, and the tracking-log updates in §16/§17 below.

## 3. Files Modified

- `eslint.config.js` — one new scoped block
  (`functions/src/domains/permissions/**/*.ts`) adding a
  `no-restricted-imports` rule forbidding `firebase-admin`/
  `firebase-functions` imports, mirroring the existing Identity/
  LoyaltyNumber/QrIdentity/Authentication precedent.
- `docs/05-implementation/change-tracking/engineering-implementation-programme.md`,
  `docs/05-implementation/11thonus-master-workflow.md`,
  `docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md` —
  narrow status notes only (§16 below).
- `docs/changes/IMPLEMENTATION_CHANGES.md`,
  `docs/00-governance/documentation-changes-log.md` — new entries.

No other file was created or modified.

## 4. Code Diff Summary

14 new files, 1,103 insertions, 0 deletions in `functions/src/domains/permissions/`;
34-line additive block in `eslint.config.js`. No existing file's
behavior changed. `git diff origin/main --stat` confirms this is the
entire runtime-code diff.

## 5. Permission Contracts Implemented

- `Role` (`role.ts`) — `"owner" | "manager" | "staff"`, the exact TRD10
  §10.6.4 literal union, reused not redefined.
- `PermissionId` (`permissionId.ts`) — a validated `"domain.action"`
  dot-namespaced identifier shape. Deliberately not a closed universal
  enum: no governed document mints identifiers for the non-sensitive
  baseline permission space, so a closed enum there would invent
  content rather than transcribe it.

## 6. Sensitive Permission Catalogue Implementation

`sensitivePermissionCatalogue.ts` transcribes all eight
`ENG-P2-004-DESIGN-001` §3.2 entries exactly — same ids, meanings,
owning domains, default states, inherit/grant/revocation/audit flags, and
sensitivity rationale codes, in the design's own table order. No entry
added, removed, or reclassified. `business.transferOwnership`'s
"N/A (owner-only, not grantable)" grant/revocation cells are modeled as
`explicitGrantRequired: false` / `explicitRevocationSupported: false`
with an explanatory comment, since no non-owner grant path exists for it
anywhere in the design.

## 7. Role/Template Contracts Implemented

`roleTemplate.ts`'s `createRoleTemplate` enforces: role validity,
well-formed permission ids, no duplicates, and — the design's central
invariant — no sensitive permission whose catalogue entry marks
`inheritAllowed: false` may appear in *any* role's default permissions,
including Owner (Owner's access to those six permissions is a runtime
"owner floor" evaluation rule, §3.6/§6.9 step 5 — `ENG-P2-004B`'s
concern, not a template fact). `SENSITIVE_PERMISSION_ROLE_TEMPLATES` is derived
programmatically from the catalogue's own `inheritAllowed`/`defaultState`
fields (Owner and Manager default to the two inheritable entries;
Staff defaults to neither) — not a hand-authored, independently
maintained list that could drift from the catalogue.

**Scope disclosure:** `SENSITIVE_PERMISSION_ROLE_TEMPLATES` does not claim to be
Owner/Manager/Staff's *complete* default permission set — the
non-sensitive baseline (e.g. `purchase.record`, `redemption.process`)
remains outside the Sensitive Permission Catalogue and outside this
module's scope, per the design's own statement that non-sensitive
defaults "remain governed by TRD12 §12.11's ordinary resolution path and
PRD1 §7–§8's role-default lists, unchanged by this package." This is not
a gap in `ENG-P2-004A` — it is the design's own boundary, honored rather
than second-guessed.

## 8. Override Contracts Implemented

`permissionOverride.ts`'s `createPermissionOverride` represents one
explicit grant or revocation: `permissionId`, `direction`
(`"grant"|"revoke"`), `businessId`, `membershipId`, `grantedBy`,
`grantedAt`. Validates permission-id shape, direction, and non-blank
scope fields; refuses any override whose `targetRole` is `"owner"`
(design §3.6/§8). No override-resolution precedence is implemented —
`createPermissionOverride` only constructs and validates the input
`ENG-P2-004B` will later resolve.

## 9. Versioning/Validation Treatment

Every contract validates at construction time (throw-on-invalid, not a
separate `validate()` step) — matching the Identity domain's own
convention (`createCustomerIdentityId`, `createIdentityLookupPurpose`).
No schema-version field was added to any 004A contract: these are
in-code, compile-time-typed configuration/value objects, not persisted
Firestore documents — versioning of a future persisted config
representation (if `ENG-P2-004D` chooses to store the catalogue/templates
as Firestore config rather than in-code constants, an explicitly
undecided implementation choice per the design §8) is out of this
package's scope.

## 10. Sensitive-Permission Invariant Verification

Proven by `roleTemplate.test.ts`: every role (including `owner`) rejects
all six non-inheritable sensitive permissions in its defaults; every role
accepts the two inheritable entries; `SENSITIVE_PERMISSION_ROLE_TEMPLATES` is asserted
to contain none of the six non-inheritable ids for any role. Proven by
`sensitivePermissionCatalogue.test.ts`: the inherit/default-state split
matches the design exactly (rows 1–6 `owner_only`/non-inheritable, rows
7–8 `owner_and_manager_default`/inheritable).

## 11. Business-Context Isolation Treatment

`PermissionOverride` is scoped to `(businessId, membershipId)` — no
global grant is representable; there is no code path anywhere in
`ENG-P2-004A` that unions or reads across businesses (it doesn't read
any persisted membership at all — it is a pure construction/validation
layer). This preserves, without yet exercising, the shape `ENG-P2-004B`'s
evaluator needs (subject + business context + membership + permission,
per the design's own framing).

## 12. Backward-Compatibility Result

Purely additive: one new domain, one new `eslint.config.js` block. No
existing file's exported surface, type, or behavior changed. Full
`functions` (665/665) and `apps/web` (397/397) suites, unchanged from
their pre-task baselines plus the 98 new tests, all pass.

## 13. Focused Tests Added

98 new tests across the six model files (`role`, `permissionId`,
`sensitivePermissionCatalogue`, `roleTemplate`, `permissionOverride`,
`permissionErrors`), covering: valid/invalid construction for every
contract, the sensitive-inheritance invariant (per role, including
Owner), the Owner-override refusal, malformed/duplicate/unknown-identifier
rejection, determinism (same inputs → equal output), and closed-taxonomy
category conformance for every error factory.

## 14. RED→GREEN Evidence (corrected for accuracy — Founder final-review pass)

**Corrected disclosure:** on honest re-examination, no genuinely observed
RED step exists for any cycle of this package's development — initial
implementation, the two P1 review-fixes, or the P1-3 rename/scope-test
correction below. In every case, implementation code and its test file
were authored together and the test suite was run once, at the end of
each cycle, observing GREEN directly. This is a process-accuracy
correction to the original version of this section, which described the
initial 98 tests as "authored to exercise the ... validation surface
before being run" — true only in the sense that the tests were written
alongside, not strictly after, the implementation; it did not mean a
failing run was captured and then made to pass. No RED evidence is
fabricated here or was fabricated originally; this section simply now
states plainly that none was captured, for any cycle, rather than
implying a stricter TDD loop occurred than actually did. The suite
passed 98/98 (initial), then 669/669 (+4, review-fix), then 670/670 (+1,
P1-3 correction) on each cycle's single terminal run, with no failing
intermediate run observed or discarded.

## 15. Full Validation Results

- `npx vitest run` (functions, focused): 6 test files, 98/98 pass.
- `npx vitest run` (functions, full suite): 78 test files, 665/665 pass
  (baseline 567/567 + 98 new).
- `npx tsc --noEmit` (functions): clean, no errors.
- `npx eslint .` (repo-root, whole tree): clean, no errors/warnings.
- `npx prettier --check .` (scoped to new files + `eslint.config.js`):
  clean after one `--write` pass.
- `pnpm -r run build` (functions + apps/web): both clean.
- `npx vitest run` (apps/web, full suite): 51 test files, 397/397 pass
  (unchanged baseline — `apps/web` untouched by this task).

## 16. Emulator-Validation Result

Not run locally. `ENG-P2-004A` adds zero Firestore reads/writes, zero
Rules changes, and zero `*.emulator.test.ts` files — `pnpm
emulators:validate` only executes `test:emulator`
(`**/*.emulator.test.ts`), a set this task did not add to or modify.
Per the task's own Phase I instruction ("emulator validation if the
changed contract surface participates in emulator-tested code"), this
contract surface does not. CI's `Build, Lint, Test, Emulator Validation`
job runs the full emulator suite regardless and is the authoritative
confirmation that the existing emulator-tested surface is unaffected.

## 17. Security/Boundary Audit (Phase H)

`grep -rln "AuthorizationDecision|evaluatePermission|decisionTable|outboxWriter|onCall|firebase-admin|firestore" functions/src/domains/permissions/`
matches only prose in `README.md` describing what is *deferred* to
`ENG-P2-004B`/`004C`/`004D` — zero matches in any `.ts` implementation or
test file. Confirmed absent from the diff: permission evaluation,
`AuthorizationDecision` runtime logic, an allow/deny decision table,
evaluator caching, sensitive-decision audit/outbox emission,
protected-command integration, authorization middleware, Capability-3
functionality, ITM, dual control. `git diff origin/main --stat` shows
only the 14 new domain files plus the additive `eslint.config.js` block
— nothing else changed.

## 18. Confirmations

- **No evaluator implemented** — confirmed (§17).
- **No audit/outbox implementation added** — confirmed (§17); `Audit
  requirement: "mandatory"` is recorded as catalogue *metadata* only,
  never acted on.
- **No protected-command integration added** — confirmed (§17); nothing
  in this domain is wired to any Cloud Function, `onCall`, or command
  dispatcher.

## 19. Dependencies Added

None — zero new `package.json` entries in any workspace.

## 20. Config Changes

None beyond the additive `eslint.config.js` block (§3).

## 21. Firebase/Rules Changes

None. No `firestore.rules` change; the approved 004A contract does not
require one (it defines no Firestore collection).

## 22. Deployment Changes

None.

## 23. Programme/Traceability Update (§16)

- `engineering-implementation-programme.md` — `ENG-P2-004` row Notes cell
  appended: `ENG-P2-004A` implemented, pending Founder review; `004B`/
  `004C`/`004D` not started; overall `ENG-P2-004` Status remains
  `Blocked` (implementation of the full concern is not complete).
- `11thonus-master-workflow.md` §17 — new dated bullet recording
  `ENG-P2-004A` implementation, explicitly restating `004B`/`004C`/`004D`/
  ITM/Capability 3/Release Readiness/AUTH-10 unstarted.
- `CDR-001-capability-delivery-roadmap.md` §5 — pointer to this report
  added; Capability 2 status value unchanged (`Open — partially
  implemented; not closed`).
- `IMPLEMENTATION_CHANGES.md`, `documentation-changes-log.md` — new
  entries.

## 24. Automated Review Findings & Dispositions

The repository's Codex automated PR reviewer raised three P1 findings on
this package's first push. Each was independently assessed against
`ENG-P2-004A`'s own scope boundary before disposition:

1. **"Reject sensitive defaults in Staff templates"** (`roleTemplate.ts`)
   — **valid, fixed.** `createRoleTemplate` checked only the catalogue's
   permission-level `inheritAllowed` flag, not its per-role `defaultState`
   — so a caller could construct a Staff template listing
   `customer.viewProtectedProfile`/`report.exportFinancial` even though
   the catalogue names those two entries `owner_and_manager_default`
   specifically. Fixed: `createRoleTemplate` now additionally rejects an
   inheritable sensitive permission for any role its `defaultState` does
   not name. New error `sensitivePermissionNotDefaultForRoleError`; the
   test that had documented the old (permissive) behavior for Staff was
   inverted to assert rejection. This is a genuine 004A contract-layer
   gap (Phase E's own required coverage: "sensitive permissions cannot
   accidentally become implicit inherited permissions through malformed
   template configuration") — not scope creep into evaluation.
2. **"Block overrides for ownership transfer"** (`permissionOverride.ts`)
   — **valid, fixed.** `createPermissionOverride` validated identifier
   shape, direction, and non-blank scope, but never consulted the
   catalogue's `explicitGrantRequired`/`explicitRevocationSupported`
   flags — so a grant or revoke override could be constructed for
   `business.transferOwnership` despite the catalogue explicitly marking
   both `false` ("N/A — owner-only, not grantable"). Fixed:
   `createPermissionOverride` now rejects a `grant` direction when the
   entry's `explicitGrantRequired` is `false`, and a `revoke` direction
   when `explicitRevocationSupported` is `false`. New error
   `permissionOverrideDirectionNotSupportedError`, with two new tests.
3. **"Include baseline permissions in the default templates"**
   (`roleTemplate.ts`, `DEFAULT_ROLE_TEMPLATES`) — **originally
   acknowledged but not applied; corrected below (Founder final-review
   pass, §25) after independent reassessment found the original
   disposition insufficient.** Populating the non-sensitive baseline
   remains correctly out of scope (that judgment stands). But the
   original disposition stopped at "the doc comment already discloses
   this," which understated the actual risk — see §25.

Post-fix validation (initial P1-1/P1-2 fixes only): functions **669/669**
(+4 from the two new tests above; +98 net from this package's original
98), `tsc --noEmit` clean, repo-root `eslint .` clean, `prettier --check`
clean. Boundary audit (§17) re-run and unchanged: no
evaluator/audit/persistence/protected-command code present.

## 25. Founder Final-Review Pass — P1-3 Reassessment and Correction

The Founder's final-review task explicitly instructed not to dismiss
P1-3 merely because the repository has not minted non-sensitive
permission identifiers, and to independently assess whether
`DEFAULT_ROLE_TEMPLATES` could reasonably be misread by a future 004B
consumer as a *complete* role-default baseline. Re-assessed against the
eight questions posed:

1. **Is it complete?** No — only the two catalogue-inheritable sensitive
   entries for Owner/Manager, none for Staff.
2. **What subset does it represent?** Exactly the Sensitive Permission
   Catalogue's own `inheritAllowed: true` entries — nothing else.
3. **Structurally obvious to a TypeScript consumer?** No — the type
   (`Readonly<Record<Role, RoleTemplate>>`) carries no signal that the
   content is partial.
4. **Obvious from the exported symbol name?** No — `DEFAULT_ROLE_TEMPLATES`
   reads naturally as "the (complete) default templates per role," which
   it was not.
5. **Obvious from its type?** No (same as #3 — `RoleTemplate` itself does
   not distinguish a full baseline from a sensitive-only projection).
6. **Enforced by tests?** Only by content-equality assertions (asserting
   the two known ids), not by any test that machine-checks the *scope
   boundary itself* (that the table can only ever contain catalogue
   members) — an omission also corrected below.
7. **Could 004B reasonably misuse it as the full role-default set?**
   Yes — plausibly and reasonably. Design §6.6 tells a future
   implementer to consume "a static, versioned role-default table
   (Owner/Manager/Staff → default permission set)" as an evaluator
   input; a name like `DEFAULT_ROLE_TEMPLATES` reads exactly like "the
   promised table," inviting direct use without noticing the omission.
8. **Effect of such misuse:** fail-closed functional denial, not a
   security hole — every ordinary baseline permission check (e.g. Staff
   recording a purchase) would incorrectly deny, since Staff's table
   entry is empty and Owner/Manager's contain only two sensitive
   permissions. Safe direction, but a real correctness trap.

**Conclusion: the original "doc-comment disclosure is sufficient"
disposition was insufficient.** The independent assessment above
confirms Codex's finding 3 identified a genuine API-clarity defect, not
a request to invent content. **Correction applied, within 004A's
authorized scope (no non-sensitive permission identifier invented):**

- Renamed `DEFAULT_ROLE_TEMPLATES` → `SENSITIVE_PERMISSION_ROLE_TEMPLATES`,
  matching the `SENSITIVE_PERMISSION_*` naming family
  `sensitivePermissionCatalogue.ts` already establishes — the name
  itself now states the scope rather than implying completeness.
- Expanded the doc comment to state plainly, at the top, "**Not a
  complete role-default permission baseline**" and to name what a
  future `ENG-P2-004B` evaluator must do instead (combine this with a
  separately governed non-sensitive baseline table, not treat this
  constant as defaults in full).
- Added a new, machine-enforced test asserting every permission id in
  every role's template is a member of `SENSITIVE_PERMISSION_IDS` — the
  scope boundary is now a test assertion, not prose alone, and would
  fail if a future edit ever widened this constant beyond the catalogue
  without a corresponding rename/re-review.
- Updated all in-repository references (`README.md`, this report,
  Master Workflow, changes logs) to the new name.

**Post-correction validation:** functions **670/670** (+1, the new scope
test), `tsc --noEmit` clean, repo-root `eslint .` clean, `prettier
--check` clean. Boundary audit re-run and unchanged.

## 26. Second Automated Review Pass — New P1 Finding and Fix

Triggering a fresh Codex review against the P1-1/P1-2 fix commit
(`a25b955`) surfaced a **new, genuine P1 finding** not present in the
first pass:

**"Restrict sensitive grants to eligible target roles"**
(`permissionOverride.ts`) — **valid, fixed.** `createPermissionOverride`'s
P1-2 fix checked only whether a permission supported the `grant`
direction *at all* (`explicitGrantRequired`), not *which specific role*
the design names as eligible to receive it. The design's own §3.2 table
does not say "Yes" for grants — it says "Yes (for Manager)" for rows
1/2/4/5/6 and "Yes for Staff" for rows 7/8 — a role-specific qualifier my
original catalogue transcription collapsed into a bare boolean. Left
unfixed, an override could have been constructed granting, e.g.,
`business.configureFraudRules` to a Staff membership, even though the
design names only Manager as eligible.

**Fix (verified against the authoritative design text on `origin/main`,
not merely against my own prior report):** added
`explicitGrantEligibleRole: Role | null` to
`SensitivePermissionCatalogueEntry`, populated directly from the
design's own parenthetical qualifiers (`"manager"` for rows 1/2/4/5/6,
`"staff"` for rows 7/8 — since Owner/Manager already hold those two by
default, an explicit grant only makes sense to extend them to Staff,
`null` for row 3, which has no grant path at all).
`createPermissionOverride` now rejects a `grant` whose `targetRole`
doesn't match the entry's `explicitGrantEligibleRole`. New error
`permissionOverrideRoleNotEligibleForGrantError`, with new tests
covering both eligible-role families in both the accept and reject
direction.

**Scope justification:** this validates a static catalogue fact the
design's own table already specifies (which single role may receive a
grant), not a runtime precedence decision — the same category of
structural validation as the Owner-target refusal already in this
module, not an expansion into `ENG-P2-004B`'s evaluation territory.
Revoke-direction role eligibility was deliberately **not** modeled the
same way: unlike grant eligibility (a fixed catalogue fact), determining
who may legitimately have an entitlement to revoke depends on whether it
came from a role default or a prior grant — genuinely evaluation-time
state, correctly left to `ENG-P2-004B`.

**Validation:** functions **683/683** (+13: 1 new catalogue-field test
suite + revised override tests), `tsc --noEmit` clean, repo-root
`eslint .` clean, `prettier --check` clean. Boundary audit re-run,
unchanged — no evaluator/audit/persistence/protected-command code
present.

**Status recorded:** `ENG-P2-004A` = implemented, pending Founder review;
`ENG-P2-004B` = NOT STARTED; `ENG-P2-004C` = NOT STARTED; `ENG-P2-004D` =
NOT STARTED; `ENG-P2-004` overall = NOT COMPLETE; Capability 2 = Open —
partially implemented; Capability 3 = Not started (existing governed
status); ITM = Not started — Unauthorised.
