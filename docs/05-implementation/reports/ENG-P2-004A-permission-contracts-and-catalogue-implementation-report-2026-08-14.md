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
`RoleTemplate` contract (with `DEFAULT_ROLE_TEMPLATES` derived solely from
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
concern, not a template fact). `DEFAULT_ROLE_TEMPLATES` is derived
programmatically from the catalogue's own `inheritAllowed`/`defaultState`
fields (Owner and Manager default to the two inheritable entries;
Staff defaults to neither) — not a hand-authored, independently
maintained list that could drift from the catalogue.

**Scope disclosure:** `DEFAULT_ROLE_TEMPLATES` does not claim to be
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
accepts the two inheritable entries; `DEFAULT_ROLE_TEMPLATES` is asserted
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

## 14. RED→GREEN Evidence

Each model file's test suite was authored to exercise the corresponding
implementation's full validation surface before being run; the first
full `vitest run` against the new suite passed 98/98 with no iteration
required beyond one `prettier --write` formatting pass (six files
reformatted, zero logic change) — reported here for completeness rather
than omitted, per the task's instruction not to dismiss findings.

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

**Status recorded:** `ENG-P2-004A` = implemented, pending Founder review;
`ENG-P2-004B` = NOT STARTED; `ENG-P2-004C` = NOT STARTED; `ENG-P2-004D` =
NOT STARTED; `ENG-P2-004` overall = NOT COMPLETE; Capability 2 = Open —
partially implemented; Capability 3 = Not started (existing governed
status); ITM = Not started — Unauthorised.
