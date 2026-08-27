# FD-P3-002-G-001 — Founder Disposition: Staff Team Identity Projection for Package G

**Date:** 2026-08-27
**Task type:** Governance/documentation only. No production source, `functions/`, `apps/web/`,
Firestore, Rules, Firebase configuration, or dependency was touched. No lifecycle, mutation, or
authorization semantics changed. No worktree build/test/deploy step performed.

This document records the Founder decision required by `ENG-P3-002-UI-RECON-001` Part XV before
Package G — Staff Transport Identity Correction — may begin. The prior Package G entry-gate task
(`ENG-P3-002-UI-IMP-G`, 2026-08-27) correctly stopped without touching code because Part XV states
explicitly: **"requires its own explicit, separately scoped Founder authorization — not implied by
authorizing Packages A-F."** This document is that separately scoped authorization for the
*identity-projection policy* only. It is **not** the implementation authorization for Package G
itself (see §15/§30).

---

## 1. Entry repository state

`git fetch origin` run; `origin/main` confirmed at `42d7c2a848b716c22f1be172efad85f944b02567`
(merge of PR #185, `ENG-P2-003-CORR-TIMEFIX-001` review/closure sync). A fresh linked worktree was
created from `origin/main` at that exact commit on a new branch,
`docs/fd-p3-002-g-001-founder-disposition`, with a clean status (`git status --porcelain=v1 -b`
showed no tracked-file diffs at creation). No Package G/F/H branch, PR, or implementation exists
anywhere in `git branch -a` / `git log --all` (re-confirmed; matches the prior entry-gate report).

## 2. Governing sources inspected

- [`ENG-P3-002-UI-RECON-001`](../../07-product-design/ENG-P3-002-UI-RECON-001-business-experience-design-to-implementation-reconciliation-2026-08-25.md)
  Part XI §12 (identity-gap finding), Part XV (Package G definition), Part XVI (implementation
  order) — re-read directly, not from summary.
- The prior `ENG-P3-002-UI-IMP-G` entry-gate report (this session, 2026-08-27) and its stated
  blocker: no separately-scoped Founder decision record existed authorizing reversal of the
  deliberately minimal `StaffMembershipSummary`/`StaffInvitationSummary` design.
- [`WORKING_WITH_THE_FOUNDER/05-DECISIONS-APPROVALS-AND-HANDOVERS.md`](../../../WORKING_WITH_THE_FOUNDER/05-DECISIONS-APPROVALS-AND-HANDOVERS.md)
  — decision lifecycle and Founder-authority convention.
- [`ENG-P3-002-ONBOARDING-JOURNEY-RECON-001-FOUNDER-DISPOSITION-2026-08-24.md`](ENG-P3-002-ONBOARDING-JOURNEY-RECON-001-FOUNDER-DISPOSITION-2026-08-24.md)
  — used as the direct structural precedent for this document (same task family, same
  "Founder-disposition-following-a-reconciliation-report" pattern, same "no worktree needed for a
  docs-only precedent" note — this task diverged from that precedent only in creating a worktree,
  per this task's own explicit Phase A instruction).
- `docs/00-governance/decisions/decision-register.md` — checked for an existing `DEC-*` entry
  covering Staff transport/team identity exposure; none found. This disposition is recorded as a
  standalone `FD-*` package following the `FD-IDENTITY-001` naming precedent
  (`docs/00-governance/decisions/evidence/FD-IDENTITY-001-founder-decision-package-2026-08-01.md`),
  not as a new Decision Register entry — consistent with how the sibling
  `ENG-P3-002-*-FOUNDER-DISPOSITION` documents in this same task family were recorded (as
  standalone reports cross-linked from `docs/changes/IMPLEMENTATION_CHANGES.md`, not as Decision
  Register rows).
- `docs/changes/IMPLEMENTATION_CHANGES.md` (tail, `ENG-P3-002-UI-RECON-001` entry) — confirmed as
  the correct changes-tracking location and entry format for this task family.

## 3. Existing decision-recording convention

Two conventions coexist in this repository:

1. **Decision Register (`DEC-*`)** — for constitutional/cross-cutting decisions with their own
   register row, lifecycle status, and amendment tracking (e.g. `DEC-PROV-004`, `DEC-SEC-001`,
   `FD-IDENTITY-001`'s proposed `DEC-IDENTITY-001`).
2. **Standalone Founder-disposition report, cross-linked from `IMPLEMENTATION_CHANGES.md`** — for
   a decision scoped to one work-package family's reconciliation report (e.g.
   `ENG-P3-002-ONBOARDING-JOURNEY-RECON-001-FOUNDER-DISPOSITION`,
   `ENG-P3-002-UI-HANDOFF-001-FOUNDER-DISPOSITION`).

This disposition follows convention (2): it resolves one bounded question raised by
`ENG-P3-002-UI-RECON-001` Part XV, for one work-package family, not a constitutional or
cross-cutting principle. No existing `DEC-*` prefix already covers Staff/Team identity exposure, so
no Decision Register amendment is proposed or needed.

## 4. Decision identifier and path

**Identifier:** `FD-P3-002-G-001`
**Path:** `docs/05-implementation/reports/FD-P3-002-G-001-founder-disposition-staff-team-identity-projection-2026-08-27.md`
(this document)

## 5. Exact authorized active-member identity fields

For an active Staff membership, an already-authorized Business caller (per the existing Team/Staff
read/management authorization model — unchanged by this decision) may be shown:

- the member's **display name**, resolved server-side from an existing authoritative identity
  source permitted for this purpose;
- the existing governed **role**;
- the existing governed **membership status**.

No other field is authorized. Display name is the only new field.

## 6. Exact authorized invitation identity fields

For a pending Staff invitation, an already-authorized Business caller may be shown:

- the **invitation delivery identity actually used for that invitation** (where the delivery
  target is email, the **invitation email**);
- the existing governed **invitation role**;
- the existing governed **invitation status**.

A person's name must **not** be fabricated where the invitation record only contains an email.

## 7. Authorization boundary

This decision does not widen **who** may read Team information. The existing
authorization/permission model remains authoritative and unchanged. Package G may only improve the
*information content* returned to a caller who is already authorized to read it — it must not make
Team membership or invitations enumerable by any caller who cannot already access them today.

## 8. Explicitly prohibited identity fields

Package G is **not** authorized to expose, under any circumstance, regardless of source
convenience:

- phone numbers;
- protected customer-profile fields;
- authentication-provider information;
- provider IDs;
- unrelated email addresses;
- internal identity IDs used as customer-facing identity;
- cross-Business identity information;
- passwords or secrets;
- identity-verification data;
- arbitrary user/profile metadata not explicitly listed in §5/§6.

## 9. Data-minimization rule

A field must not be added merely because it exists in an identity document reachable from the
resolution path. Only the fields explicitly listed in §5/§6 are in scope; every other field on any
touched source record is out of scope by default, not by omission.

## 10. Identity-source fail-closed rule

If no existing authoritative, non-protected source can provide a safe display name for an active
membership, Package G's implementation must **stop and report the exact narrower
identity-source/governance gap** rather than widening exposure to whatever data happens to be
available (e.g. falling back to a protected profile field, or to raw auth-provider data). The same
rule applies to invitation identity: if the only available delivery-identity representation is not
already covered by §6, implementation must stop and report rather than substitute a broader field.

## 11. General-directory prohibition

Package G must not create, and this decision does not authorize:

- search-by-name or search-by-email;
- user lookup;
- a people directory, customer directory, or cross-Business directory.

The projection is bounded strictly to Staff memberships and invitations already belonging to the
authorized Business — nothing broader. Resolving a pending invitation's email into a wider
user/customer profile merely because the email corresponds to an existing 11thONUS identity is
explicitly **not** authorized (§6 covers this directly).

## 12. Read-only scope result

This disposition authorizes a **bounded Staff read-transport identity-projection policy only**. It
does not authorize, and Package G implementation must not touch: invitation creation, invitation
acceptance, invitation revocation, Staff removal/suspension, role assignment, permissions,
membership lifecycle, invitation lifecycle, or Staff authorization semantics. The stated purpose is
narrowly to let the approved Team Management experience distinguish (a) who is currently on the
Business team and (b) who has been invited — this is not authorization for broader identity display
anywhere else in 11thONUS.

## 13. Package E status

Satisfied by inclusion in Packages B/C/D; no standalone implementation. Unchanged by this decision.

## 14. Package F status

Not started. Unchanged by this decision. (Not authorized by this task — no Team UI work performed
or implied here.)

## 15. Package G status

**Founder privacy/identity-projection disposition resolved** by this document. **Implementation not
started.** Package G implementation still requires its own fresh, separately scoped Founder
implementation authorization — this disposition answers the *what may be exposed* question Part XV
raised; it does not itself authorize starting the `staffTransportReadService`/DTO code change.

## 16. Package H status

Not started. Unchanged by this decision.

## 17. ENG-P3-002 status

Open. Not closed by this decision.

## 18. Capability 3 status

Open. Not closed by this decision.

## 19. Files modified

- `docs/05-implementation/reports/FD-P3-002-G-001-founder-disposition-staff-team-identity-projection-2026-08-27.md`
  (new — this document)
- `docs/changes/IMPLEMENTATION_CHANGES.md` (appended entry, no existing content altered)

No other file touched. No `functions/`, `apps/web/`, Rules, or Firebase configuration path was
modified.

## 20. Diff summary

Two additions: one new governance report file (this document); one new dated entry appended to the
end of `docs/changes/IMPLEMENTATION_CHANGES.md` describing this disposition, following the exact
format of the immediately preceding `ENG-P3-002-UI-RECON-001` entry. No deletions, no edits to
existing lines in any file.

## 21. Commands executed

```
git fetch origin
git rev-parse origin/main
git worktree add -b docs/fd-p3-002-g-001-founder-disposition <path> origin/main
git status --porcelain=v1 -b
git log --all --oneline (Package G/F/H branch search — none found)
git branch -a (Package G/F/H branch search — none found)
git ls-remote --heads origin (Package G/F/H remote branch search — none found)
```

Plus read-only inspection (`grep`, `find`, `Read`) of the governing sources listed in §2. No
build, test, lint, or deploy command was run — none applies to a documentation-only change.

## 22. Dependencies/config/Firebase changes

None. Expected none; none introduced.

## 23. Risks

- **Interpretation drift risk:** a future implementer could read "display name" (§5) as license to
  add other convenient fields from the same source document. Mitigated by §9's explicit
  default-out rule and §8's explicit prohibition list.
- **Fail-open risk on invitation identity:** if a future invitation delivery mechanism is added
  (e.g. SMS-based invitations) that isn't email, an implementer might improvise a new "identity"
  representation not covered by §6. Mitigated by §10's stop-and-report rule — new delivery-target
  types require their own disposition, not silent extension of this one.
- **Scope-creep risk into Package F:** because this document authorizes real display-identity
  fields, it could be read as tacit authorization to also build the Team UI. §14 and the header
  explicitly foreclose that reading.

## 24. Rollback

Revert the two additions (this document and the `IMPLEMENTATION_CHANGES.md` entry) via a single
follow-up commit/PR; no other file is touched, so rollback is a clean, isolated revert with no
downstream dependency to unwind.

## 25. Persistent decision path

`docs/05-implementation/reports/FD-P3-002-G-001-founder-disposition-staff-team-identity-projection-2026-08-27.md`
(this document, source of truth for this decision).

## 26. Changes-tracking state

`docs/changes/IMPLEMENTATION_CHANGES.md` updated with a new dated entry (`FD-P3-002-G-001`,
2026-08-27) immediately following the existing `ENG-P3-002-UI-RECON-001` entry, per §20.

## 27. PR number

Recorded once opened — see the companion commit/PR for this branch
(`docs/fd-p3-002-g-001-founder-disposition`).

## 28. Final head SHA

Recorded once committed — see the companion commit for this branch.

## 29. CI result

Not applicable — documentation-only change, no build/test/lint/deploy pipeline step required by
this repository's convention for docs-only PRs of this kind (matching the
`ENG-P3-002-ONBOARDING-JOURNEY-RECON-001-FOUNDER-DISPOSITION` precedent, which recorded the same).

## 30. Exact next Founder action

Review and merge this disposition PR. Once merged, Package G implementation may proceed **only**
after a **separate, fresh Founder implementation authorization** referencing this document
(`FD-P3-002-G-001`) as its governing identity-projection policy — this document alone does not
authorize starting the `staffTransportReadService`/DTO implementation work itself.

---

## Final gate

**PACKAGE G FOUNDER IDENTITY-PROJECTION DISPOSITION RECORDED — STAFF TRANSPORT IDENTITY CORRECTION
AWAITS FRESH IMPLEMENTATION AUTHORIZATION.**
