# FD-IDENTITY-DISPLAY-001 — Founder Disposition: 11thONUS Platform Display Name

**Date:** 2026-08-27
**Task type:** Governance/documentation only. No `functions/`, `apps/web/`, Firestore, Rules,
Firebase configuration, or dependency was touched. No `users` document was modified. No
profile-completion UI was implemented. No Package G or Package F work was performed.

This document records the Founder decision arising from `USER-DISPLAY-IDENTITY-RECON-001`
(2026-08-27): the platform-controlled human-readable identity for 11thONUS is `users.displayName`
— the field TRD10 §10.6.1 already reserves but no code path currently populates. This disposition
is intended to unblock a separately-authorized `IDENTITY-PROFILE-A` implementation task; it is
**not** that implementation authorization itself.

---

## 1. Entry repository state

`git fetch origin` run; `origin/main` confirmed at `b2e9116a53a25961bb955f48188ce7873eaecc51`
(unchanged since PR #186/#187 — no intervening merge). A fresh linked worktree was created from
`origin/main` at that exact commit on a new branch, `docs/fd-identity-display-001-founder-disposition`,
clean at creation. `FD-IDENTITY-DISPLAY-001` searched across `docs/` — no existing use of this
identifier found; no collision.

## 2. Governing sources reviewed

- [`USER-DISPLAY-IDENTITY-RECON-001`](#) (this session's prior reconciliation report — not a
  committed file; its findings are re-verified against the live repository directly below, not
  trusted from summary alone).
- `docs/02-technical/trd/10-firestore-data-architecture.md` §10.6.1 (`users` document —
  `displayName: string`, required, currently unpopulated by any write path) and §10.6.2
  (`customerProfiles` — confirmed `firstName`/`lastName` remain a materially different, protected
  category).
- `docs/00-governance/decisions/decision-register.md` / `DEC-IDENTITY-001` (Standard Participation
  Principle — no externally observable gate between identity creation and full participation;
  re-verified directly against `functions/src/domains/identity/models/customerIdentity.ts`'s own
  header, which cites it verbatim).
- `docs/00-governance/decisions/evidence/FD-IDENTITY-001-founder-decision-package-2026-08-01.md`
  (Identity First / Progressive Trust constitutional principles — confirms a self-chosen Display
  Name activating an already-reserved `users` field introduces no new identity source, consistent
  with Principle 1).
- `FD-P3-002-G-001` (the original active-member identity-projection authorization this disposition
  narrows/completes — re-read in full; §1's "display name" language is the exact clause this
  document gives a concrete field to).
- `docs/05-implementation/reports/ENG-P2-001-02-implementation-report-2026-08-07.md` (independent
  corroboration that `displayName`/photo were originally planned together and deliberately deferred
  to the `users` document, not abandoned).
- The established Founder-disposition convention:
  [`FD-P3-002-G-001-founder-disposition-staff-team-identity-projection-2026-08-27.md`](FD-P3-002-G-001-founder-disposition-staff-team-identity-projection-2026-08-27.md)
  and
  [`ENG-P3-002-ONBOARDING-JOURNEY-RECON-001-FOUNDER-DISPOSITION-2026-08-24.md`](ENG-P3-002-ONBOARDING-JOURNEY-RECON-001-FOUNDER-DISPOSITION-2026-08-24.md)
  — both standalone reports cross-linked from `docs/changes/IMPLEMENTATION_CHANGES.md`, not
  Decision Register rows, for a decision scoped to one work-package family.

## 3. Decision-record convention

Follows the same convention `FD-P3-002-G-001` established for this task family: a standalone
`FD-*` report under `docs/05-implementation/reports/`, cross-linked from
`docs/changes/IMPLEMENTATION_CHANGES.md`, rather than a new `DEC-*` Decision Register row. No
existing `DEC-*` prefix already covers platform Display Name; this is a bounded product/privacy
decision scoped to the identity/Staff-Team task family, not a constitutional or cross-cutting
register amendment.

## 4. Final decision identifier

**`FD-IDENTITY-DISPLAY-001`** — no collision found (§1); used as proposed.
**Path:** `docs/05-implementation/reports/FD-IDENTITY-DISPLAY-001-founder-disposition-platform-display-name-2026-08-27.md`
(this document).

## 5. Authoritative Display Name model

**`users.displayName`** (TRD10 §10.6.1) is adopted as the sole authoritative platform Display
Name. **Not authorized:** `StaffMembership.displayName`, a separate `UserDisplayProfile`
collection, or any other new identity source. Display Name belongs to the existing User/Customer
Identity model — activating an already-reserved, already-governed schema field, not inventing a
new one. This is the smallest architecture-consistent model available (`USER-DISPLAY-IDENTITY-RECON-001`
§5/§6) and introduces zero new identity concepts.

## 6. Meaning/semantics

Display Name is a **user-controlled, human-readable label** (e.g. "Fred Kenogo"). It is explicitly
**not**: a legal name, a verified identity name, an authentication-provider name, an email alias,
or a unique username/handle. It carries no verification weight and makes no claim about the
underlying person's legal or authenticated identity — it is presentation-only.

## 7. Uniqueness decision

**Not unique.** Multiple users may legitimately share the same Display Name. **No** uniqueness
lookup, reservation index, or username namespace is authorized. This matches TRD10 §10.6.1's own
schema, which imposes a uniqueness rule only on `authUid`, never on `displayName`.

## 8. Mutability decision

**Self-editable by the authenticated owner of the Customer Identity only.** The caller's identity
must be server-derived — no client-supplied `userId` may determine whose Display Name is changed
(the same discipline every existing mutation in this codebase already enforces, e.g.
`acceptStaffInvitation`'s `authenticatedCustomerIdentityId`). Business Owners/managers **cannot**
edit another team member's Display Name — this is not a Staff-management capability, it belongs
entirely to the owning identity.

## 9. Validation decision

For MVP: trim leading/trailing whitespace; reject empty/whitespace-only values; Unicode is
permitted; length after trimming is 1–50 characters. **No** username syntax or ASCII-only
restriction is introduced — Display Name is a free-text human label, not a handle.

## 10. Moderation disposition

**No profanity/impersonation/content-moderation system is introduced for MVP.** Recorded as a
known, accepted limitation — no existing platform moderation capability was found anywhere in this
codebase to reuse, and inventing one is out of this disposition's scope. This does not prevent a
future, separately governed moderation policy.

## 11. Completion trigger

Display Name **must not** block ordinary registration or participation — this preserves
`DEC-IDENTITY-001`'s Standard Participation Principle exactly as already established
(`customerIdentity.ts`'s own header: "no intermediate, externally-observable gate between identity
creation and full participation"). A **lazy-completion model** is adopted: a user may be prompted
to add a Display Name only when a specific product context needs one, never as a registration
gate.

## 12. Staff invitation sequencing

Invitation acceptance remains fully independent of Display Name completion. **Approved
sequencing:** authenticate/sign in → accept invitation → membership established → optional,
non-blocking prompt to add a Display Name. Display Name is **not** inserted into invitation
entitlement or acceptance authorization at any point — `acceptStaffInvitation`'s existing bespoke,
minimal authority model (`invitationEntitlement.ts`) is untouched by this decision.

## 13. Existing users

**No migration or backfill is required.** Display Names must **not** be fabricated from email,
phone, Firebase Auth, Customer Profile, or invitation delivery target — each of those is a
different data category (§16) and using any of them to manufacture a Display Name a person never
chose would undermine the very self-chosen-label rationale that makes Display Name safe to expose
in the first place. Existing users (Business Owners, existing Staff, ordinary participants) may
remain without a Display Name indefinitely, until they choose or are prompted to complete it.

## 14. Missing Display Name

Missing Display Name remains **genuinely absent** — never a fabricated placeholder. Server
projections (e.g. Package G's future membership DTO) must **omit** the optional value when unset,
mirroring exactly how `StaffInvitationSummary.email` already behaves in PR #187 (present only when
populated, never invented). Any customer-facing fallback wording (e.g. "Unnamed team member")
belongs entirely to the consuming UI package (Package F), not to any backend projection.

## 15. Team projection authority

For Package G, the display name `FD-P3-002-G-001` §1 already authorizes is specifically and only:

```
users/{customerIdentityId}.displayName
```

Package G may project this field **server-side only**, and **only** for callers already
authorized to read that Business's Team (the existing, unchanged `assertActiveMembership` check in
`staffTransportReadService.ts`). **This does not widen Team authorization** in any way — it
supplies the concrete field `FD-P3-002-G-001` §1 left unresolved, nothing more.

## 16. Privacy boundary

Activating Display Name does **not** authorize exposure of: `CustomerProfile.firstName`/`lastName`,
email, phone, Firebase Auth profile data, provider metadata, internal identity IDs, or
cross-Business identity information — every one of `FD-P3-002-G-001` §4's original prohibitions
remains fully in force, unchanged and unwidened by this decision. Display Name is, for now,
exposed **only** through explicitly authorized product projections (the Team context this task
family concerns itself with) — **not** globally, and **not** as a platform-wide people directory.
No search-by-name, lookup, or directory capability is authorized by this document.

## 17. Profile photo

**Deferred.** No Storage/upload capability is introduced as part of Display Name work. Consistent
with `USER-DISPLAY-IDENTITY-RECON-001` §12's finding that no avatar/photo infrastructure exists
anywhere in this codebase today (Storage Rules are a bare, fully deny-all placeholder) — including
it now would pull in an unrelated, materially larger, currently nonexistent subsystem to solve a
problem Display Name alone already solves.

## 18. Telephone

**Excluded.** Telephone remains contact/authentication-related identity (it doubles as a Phone OTP
authentication-reference target) and is not part of the Display Profile capability. This is a
direct continuation of `FD-P3-002-G-001` §4's existing, unconditional phone-number prohibition —
introducing profile completion is not itself a reason to revisit that prohibition.

## 19. Audit/history disposition

**No new field-level Display Name history/audit subsystem is required for MVP.** If the existing
identity-mutation architecture (event sourcing via the outbox, already used by every other identity
mutation in this domain) automatically produces evidence of a Display Name change as a side effect
of following that existing pattern, that evidence is acceptable and sufficient — but no
purpose-built audit system is to be created solely for this one field.

## 20. Programme status

- **PR #187** — remains independent, open, draft, unmodified by this task; still recommended for
  merge on its own timeline (`ENG-P3-002-G-ACTIVE-IDENTITY-RECON-001` §16,
  `USER-DISPLAY-IDENTITY-RECON-001` §16).
- **`IDENTITY-PROFILE-A`** — not started; awaits its own fresh, narrowly-scoped Founder
  implementation authorization, now unblocked in principle by this disposition.
- **`IDENTITY-PROFILE-B`** — not started; depends on `IDENTITY-PROFILE-A`.
- **Package G active-member completion** — not started; depends on `IDENTITY-PROFILE-A`.
- **Package F** — not started. Not authorized by this task.
- **Package H** — not started.
- **`ENG-P3-002`** — Open. Not closed by this decision.
- **Capability 3** — Open. Not closed by this decision.

## 21. Files modified

- `docs/05-implementation/reports/FD-IDENTITY-DISPLAY-001-founder-disposition-platform-display-name-2026-08-27.md`
  (new — this document)
- `docs/changes/IMPLEMENTATION_CHANGES.md` (appended entry, no existing content altered)

No other file touched. No `functions/`, `apps/web/`, Rules, or Firebase configuration path was
modified — matching the task's constraints exactly.

## 22. Diff summary

Two additions: one new governance report file (this document); one new dated entry appended to the
end of `docs/changes/IMPLEMENTATION_CHANGES.md`, following the exact format of the immediately
preceding entries in this task family. No deletions, no edits to existing lines in any file.

## 23. Commands executed

```
git fetch origin
git rev-parse origin/main
grep -rl "FD-IDENTITY-DISPLAY-001" docs   (identifier collision check — none found)
find docs -iname "*FD-IDENTITY-DISPLAY*"  (identifier collision check — none found)
gh pr view 187 --json state,isDraft,headRefOid,mergeable
git worktree add -b docs/fd-identity-display-001-founder-disposition <path> origin/main
git status --porcelain=v1 -b
```

Plus read-only inspection (`grep`, `find`, `Read`) of the governing sources listed in §2. No
build, test, lint, or deploy command was run — none applies to a documentation-only change.

## 24. Dependencies/config/Firebase changes

None. Expected none; none introduced.

## 25. Risks

- **Scope-creep risk:** a Display Profile capability is an attractive place to bolt on more fields
  later (bio, social links, etc.) without fresh governance. Mitigated by this document's explicit
  narrow scope (§5/§13/§17/§18) — any future field needs its own scoped decision.
- **Self-chosen-name misuse risk:** since uniqueness isn't required and no moderation exists, a
  user could set an offensive or impersonating Display Name. Recorded as a known, accepted MVP
  limitation (§10), not silently ignored.
- **Interpretation-drift risk:** a future implementer could read "human-readable label" as license
  to widen exposure beyond the Team context. Mitigated by §16's explicit "explicitly authorized
  product projections only, no directory" language.

## 26. Rollback

Revert the two additions (this document and the `IMPLEMENTATION_CHANGES.md` entry) via a single
follow-up commit/PR; no other file is touched, so rollback is a clean, isolated revert with no
downstream dependency to unwind.

## 27. Persistent decision path

`docs/05-implementation/reports/FD-IDENTITY-DISPLAY-001-founder-disposition-platform-display-name-2026-08-27.md`
(this document, source of truth for this decision).

## 28. Changes-tracking state

`docs/changes/IMPLEMENTATION_CHANGES.md` updated with a new dated entry (`FD-IDENTITY-DISPLAY-001`,
2026-08-27) immediately following the existing `FD-P3-002-G-001` entry — the entry immediately
preceding it on `origin/main` at the time this branch was created (`ENG-P3-002-UI-IMP-G`'s own
changes-tracking entry exists only on unmerged PR #187, not on `origin/main`, so it does not
precede this one in the merged file).

## 29. PR number

Recorded once opened — see the companion commit/PR for this branch
(`docs/fd-identity-display-001-founder-disposition`).

## 30. Final head

Recorded once committed — see the companion commit for this branch.

## 31. CI

Not applicable — documentation-only change, matching the precedent every prior `FD-*`/
`*-FOUNDER-DISPOSITION` docs-only PR in this task family recorded.

## 32. Exact next Founder action

Review and merge this disposition PR. Once merged, `IDENTITY-PROFILE-A` (the backend Display Name
write/read foundation) may proceed **only** after its own fresh, separately-scoped Founder
implementation authorization referencing this document (`FD-IDENTITY-DISPLAY-001`) as its governing
semantics/validation/privacy policy — this document alone does not authorize starting that
implementation work.

---

## Final gate

**PLATFORM DISPLAY NAME FOUNDER DISPOSITION RECORDED — IDENTITY-PROFILE-A AWAITS FRESH
IMPLEMENTATION AUTHORIZATION.**
