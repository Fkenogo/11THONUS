# AUTH-P0-001 — Authentication Foundation Decisions (Implementation Report)

> **Title:** AUTH-P0-001 — Authentication Foundation Decisions
> **Version:** 1.0 · **Status:** Governance decision record — decisions only, no engineering · **Classification:** Working (implementation report)
> **Governing document:** 11thONUS Platform Constitution; Engineering Governance Charter
> **Source-of-truth path:** `docs/05-implementation/reports/AUTH-P0-001-authentication-foundation-decisions-2026-08-07.md`
> **Last controlled update:** 2026-08-07 (`AUTH-P0-001` — created)

**Nature.** Records the Founder-approved Authentication foundation decisions (D-A1–D-A5) so the customer Authentication implementation stream may proceed without repeated governance interruptions. **Records decisions only — no engineering, no runtime code, no capability numbering change.** Each `AUTH-*` package still requires its own fresh Founder implementation authorization.

## 1. Repository State
- **Entry:** fresh isolated worktree `auth-p0-001` off `origin/main` @ `a420a97bc42b0768596ffaf1538fd35115ffd26a`; branch `docs/auth-p0-001-authentication-foundation-decisions`; `0 0`; clean tree; no locks. Dirty primary checkout untouched (read-only).
- **Final:** documentation-only edits + one new report; commit/push/PR recorded in the chat completion report and changes-log Entry 090.

## 2. Founder Decisions Recorded (`DEC-AUTH-001`, CONFIRMED)
- **D-A1 — Authentication Package Series.** Official **`AUTH-*`** series: `AUTH-P0-001` (this foundation task), `AUTH-BP` (blueprint), `AUTH-01`–`AUTH-09` (implementation, per `CAP-P2-009` §4). Capability 2 Authentication-concern packages, **distinct from `ENG-P2-002`/`ENG-P2-003`/`ENG-P2-004`** (Business/Staff/role — unchanged, not renumbered). Capability numbering unchanged.
- **D-A2 — MVP Authentication Providers.** Phone OTP **Included**; Google Sign-In **Included**; Email/Password **Deferred**; Apple Sign-In **Deferred**; Passkeys **Deferred**. Future providers additive.
- **D-A3 — Duplicate Identity Merge Authority.** Duplicate-identity merge is a **separate governed capability**. Authentication **never** auto-merges Customer Identity aggregates; it may **identify a possible duplicate and refer** it to the governed merge process (consistent with `ENG-P2-001-08` detection/fail-closed and `ENG-P2-001-PLAN-001` §14 Ambiguity 4, still unresolved as auto-merge authority).
- **D-A4 — SMS Production Dependency.** `EXT-TECH-001` (Burundi phone-OTP delivery) is a **production-launch** concern, **not** a build blocker. Authentication engineering **may proceed on the Firebase Auth Emulator**; production activation stays governed by `EXT-TECH-001` (`PENDING`) and `DEC-PROV-004` point 9.
- **D-A5 — Staff Authentication Boundary.** Customer Authentication is **independent** from Staff Authentication (TRD12 §12.4.3; `DEC-SEC-003`, separately governed). **No** staff-authentication scope enters this stream.

## 3. Files Modified
| File | Change |
|---|---|
| `docs/00-governance/decisions/decision-register.md` | New `AUTHENTICATION (DEC-AUTH)` category + `DEC-AUTH-001` (CONFIRMED); §5 summary (CONFIRMED 43→44; Total 104→105); header. |
| `docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md` | §5 Authentication concern → `Not started — Foundations approved` (series/MVP/boundaries); §2 summary restatement; header. |
| `docs/05-implementation/change-tracking/engineering-implementation-programme.md` | `ENG-P2-001` Current Status note (AUTH-P0-001 marker); header. |
| `docs/05-implementation/11thonus-master-workflow.md` | §17 next-action (Authentication foundations; next = `AUTH-BP`/`AUTH-01`, unauthorised to begin). |
| `docs/00-governance/documentation-changes-log.md` | Entry 090 + header. |
| `docs/changes/IMPLEMENTATION_CHANGES.md` | AUTH-P0-001 entry. |
| `docs/05-implementation/reports/AUTH-P0-001-...-2026-08-07.md` | This report. |

No new *governance artefact type* beyond the standard Decision Register entry + implementation report; no duplicate source of truth (decisions owned by the Decision Register; concern status owned by `CDR-001` §5).

## 4. Validation
- **Repository integrity:** `0 0`; scope limited to documentation files.
- **Programme consistency:** `AUTH-*` series registered; `ENG-P2-002/003/004` untouched; capability numbering unchanged.
- **Cross-document consistency:** `DEC-AUTH-001` (Register) ↔ `CDR-001` §5/§2 ↔ Programme ↔ Master Workflow ↔ changes-log all state the same series, MVP scope, boundaries, and `Not started — Foundations approved` status.
- **No duplicate authority:** decisions → Decision Register; concern status → `CDR-001` §5 (others carry dated pointer notes).
- **Links resolve;** no unrelated modifications; no runtime code touched.

## 5. Dependencies Added
**None.**

## 6. Configuration Changes
**None.**

## 7. Risks
None from this task (governance-only). The stream's forward risks (`EXT-TECH-001` SMS, interface stability, duplicate-identity merge authority, production reCAPTCHA/App-Check) are enumerated in `CAP-P2-009` §9; D-A3/D-A4 now bound two of them.

## 8. Rollback Instructions
`git revert` the AUTH-P0-001 commit (or discard the branch pre-merge). Reverting restores the prior `Not started — Unauthorised` status and removes `DEC-AUTH-001`; no code or data impact.

## 9. Final Gate
- **Authentication work-package numbering is now authoritative** (`AUTH-*` series; D-A1). ✅
- **MVP provider scope is fixed** (Phone OTP + Google; email/Apple/passkeys deferred; D-A2). ✅
- **Duplicate identity authority is defined** (separate governed capability; refer-only; D-A3). ✅
- **SMS production dependency is classified** (production-launch; emulator-based build; D-A4). ✅
- **Staff Authentication boundary is confirmed** (independent, separately governed; D-A5). ✅
- **Authentication implementation may now begin under the approved architecture** — via the `AUTH-*` packages, **each requiring its own fresh Founder implementation authorization** (`AUTH-BP`/`AUTH-01` not begun). ✅
