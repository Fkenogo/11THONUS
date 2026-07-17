# Implementation Changes

> Persistent, append-only engineering change log per TRD22 §22.39 (Coding-Agent Change Tracking).
> This file does not replace Git history — it exists to provide a Founder-readable implementation trail.
> This file itself is a **target-only** addition, created by ENG-P0-001; it did not exist in the
> governed documentation source and is not part of the migrated documentation baseline.

---

## 2026-07-17 — ENG-P0-001 — Repository, Tooling, Documentation Migration and Test-Framework Scaffold

- **Date:** 2026-07-17
- **Phase:** TRD22 §22.10 — Phase 0, Repository and Delivery Foundation
- **Task:** ENG-P0-001 (first work package of the engineering implementation programme)
- **Status:** Implemented — awaiting Technical Review (not marked complete by the implementing agent)
- **Files changed:** see the Implementation Report for this work package (full created/modified/removed lists)
- **Tests:** Vitest unit/component tests (`apps/web`, `functions`), Playwright e2e smoke test, Firebase Emulator Suite startup/shutdown smoke validation — results recorded in the Implementation Report
- **Configuration:** pnpm workspace (`apps/web`, `functions`); root ESLint flat config, Prettier, TypeScript strict mode across every workspace; Firebase Emulator Suite configured for the `demo-11thonus` fake project (no live project, no `.firebaserc`); Husky pre-commit hook running `lint-staged`/Prettier
- **Migrations:** none (no product-domain code or Firestore schema exists yet)
- **Risks:** see the Implementation Report's Risks and Unresolved Issues section
- **Rollback:** repository has zero prior commits, so nothing needs to be reverted. Do not use `git clean -fdx` — it deletes every ignored file, including the retired-but-retained `.env.local` at the repo root. Instead, remove only the paths ENG-P0-001 introduced or intentionally replaced: `apps/ functions/ tests/ docs/ node_modules/ package.json pnpm-workspace.yaml pnpm-lock.yaml eslint.config.js .prettierrc .prettierignore .husky/ playwright.config.ts README.md firebase.json firestore.rules firestore.indexes.json storage.rules .gitignore` (see the Implementation Report §17 for the exact command). `.git/` and `.env.local` are never touched.
- **Report link:** [`docs/05-implementation/reports/ENG-P0-001-implementation-report-2026-07-17.md`](../05-implementation/reports/ENG-P0-001-implementation-report-2026-07-17.md) — exists in the working tree as of this entry; not yet committed to the repository (no commit has been made at all, per the repository's zero-commit state).

---

## 2026-07-17 — ENG-P0-001 — Technical Review

- **Date:** 2026-07-17
- **Phase:** TRD22 §22.10 — Phase 0, Repository and Delivery Foundation
- **Task:** ENG-P0-001 Technical Review (independent verification, per the Coding Agent Standard and TRD22 §22.41)
- **Status:** Review complete — **outcome APPROVED FOR FIRST COMMIT**. ENG-P0-001 itself remains not marked Complete by this review; that workflow status change belongs to the Founder/Technical Lead.
- **Files changed:** `docs/changes/IMPLEMENTATION_CHANGES.md` (two corrections — unsafe rollback command replaced; stale report-location reference corrected); new file `docs/05-implementation/reports/ENG-P0-001-technical-review-2026-07-17.md`.
- **Tests:** full validation suite re-executed independently (build, lint, format:check, typecheck, unit/component tests, Playwright e2e, Firebase Emulator Suite smoke validation, documentation link check) — all passed on re-run; results detailed in the Technical Review report.
- **Configuration:** no configuration was changed as part of this review; all inspected configuration (`firebase.json`, ESLint, Prettier, TypeScript, pnpm workspace) was verified consistent with the Implementation Report and the governing standards.
- **Migrations:** none.
- **Risks:** unchanged from the Implementation Report — no new risk was discovered during this review. See the Technical Review report §14.
- **Rollback:** unchanged in substance; the corrected rollback guidance above and in the Technical Review report §16 both avoid `git clean -fdx`.
- **Report link:** [`docs/05-implementation/reports/ENG-P0-001-technical-review-2026-07-17.md`](../05-implementation/reports/ENG-P0-001-technical-review-2026-07-17.md) — exists in the working tree; not yet committed.
