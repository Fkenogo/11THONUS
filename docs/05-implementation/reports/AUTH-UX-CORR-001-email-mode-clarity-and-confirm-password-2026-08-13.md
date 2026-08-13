# AUTH-UX-CORR-001 — Email Authentication Mode Clarity & Confirm-Password Correction — Implementation Report

> **Package:** `AUTH-UX-CORR-001` — Founder-directed bounded UX correction discovered during `AUTH-HOSTED-PREVIEW-002` Stage 5 hosted validation. Frontend only; no authentication architecture/semantics change.
> **Date:** 2026-08-13. **Base:** `main` `63f9ec9`.

## 1. Entry state
- `origin/main` = `63f9ec9296a416b38829cb3cdfce94a35d7806af`; CI green; AUTH-10 not started; dirty primary worktree untouched. Work performed in a clean linked worktree on `feat/auth-ux-corr-001`.
- `AUTH-HOSTED-PREVIEW-002`: Google end-to-end PASS (Stage 5); Email/Password test pending; preview channel `auth-preview-002` retained (untouched by this task).

## 2. Problem
The Email/Password surface presented one mode-less form (Email, Password, both *Create account* and *Sign in with email* buttons) with **no Confirm-Password** field on registration and no clear separation of the sign-in vs create-account states.

## 3. Fix strategy (as implemented)
Two explicit Email modes via local presentation state (`emailMode: "signin" | "register"`, default `signin`) — no routing introduced.
- **Sign-in mode:** Email + Password (`current-password`) + **Sign in with email** + a **"New here? Create account"** switch.
- **Register mode:** Email + Password (`new-password`) + **Confirm password** (`new-password`) + **Create account** + an **"Already have an account? Sign in"** switch.
- **Confirm-password** is frontend validation only: on *Create account*, if `password !== confirmPassword`, fail closed (no Firebase call), show a localized `role="alert"` associated with the confirm field (`aria-describedby` + `aria-invalid`), and focus the confirm field. On match, call the unchanged `registerWithEmail(email, password)` — the confirm value is **never** passed on, persisted, logged, returned, or placed in any domain object/event.
- **Mode switching** is a pure UI transition: never invokes Firebase; clears password + confirm-password + stale validation/server errors; preserves the (non-sensitive) email.
- Password + confirm-password are cleared at the existing credential-clearing boundary after any email attempt.

## 4. Files modified
- `apps/web/src/authentication/SignInPanel.tsx` — mode state, confirm-password field, validation, switch controls, autocomplete semantics.
- `apps/web/src/i18n/locales/en.ts` / `fr.ts` — new keys `confirmPasswordLabel`, `passwordMismatch`, `switchToRegister`, `switchToSignIn` (parity preserved).
- Tests: new `SignInPanel.emailMode.test.tsx` (9); updated `SignInPanel.test.tsx`, `SignInPanel.i18n.test.tsx`, `dev/signInPreview/SignInPreviewPage.test.tsx` for the mode model.
- Docs: this report + change-tracking (§13).
- **No backend/contract/provider-flag/Rules/model change.** `SignInPanelActions` (incl. `registerWithEmail(email, password)`) unchanged.

## 5. Sensitive-data handling
`confirmPassword` lives only in component state, the `registerReady` gate, and its own input; it is never an argument to any action/authenticate call; no `console`/`localStorage`/`sessionStorage` use; password + confirm cleared after use and on mode switch (grep-verified; DOM asserted clear in tests).

## 6. Accessibility
Labels bound via `htmlFor`/`id`; register password + confirm use `new-password`, returning sign-in uses `current-password`; mismatch error is `role="alert"` with `aria-describedby`/`aria-invalid` on the confirm field and focus moved to it; mode switches are `<button type="button">` (keyboard-operable). No change to Google/Phone controls.

## 7. Localization
All new copy via I18N-001 in en + fr; catalog parity test green; no hard-coded customer-facing copy. English default + French switching verified.

## 8. Validation
- web **395/395** (+9 new email-mode tests); functions **567/567** (unchanged); `emulators:validate` **221/221**; e2e **1/1**; typecheck/lint/format clean.
- Preview `build:sign-in-preview` succeeds and carries the corrected `SignInPanel` (en+fr confirm-password copy present in the bundle); production build excludes the preview (isolation intact both directions).
- RED→GREEN: the 9 email-mode tests were written first and observed failing (missing keys/feature) before implementation.

## 9. Regression
Google, Phone, and returning Email sign-in tests all green; existing AUTH tests preserved (three adapted to the mode model without losing coverage).

## 10. Dependencies / config / Firebase / deployment
None / none / none / none.

## 11. Governance
`F-UX-1 (Confirm Password UX)` is recorded **resolved** by this package. The Founder **elected** to treat this hosted-preview-discovered UX issue as an Authentication-concern closure condition even though it was not an original AUTH-BP §14 criterion; recorded without rewriting historical §14 evidence. The remaining §14 mandatory item is the Founder Email/Password hosted retest.

## 12. Risks / rollback
Low — additive frontend UX; no backend/contract change. Rollback = revert the PR (no data/migration/deploy impact). A later bounded preview refresh (rebuild + redeploy of `auth-preview-002`) may be authorized separately so the hosted surface reflects this change.

## 13. Change-tracking
`IMPLEMENTATION_CHANGES.md` (Stage entry) + documentation-changes-log Entry 107 updated.
