# AUTH-PREVIEW-READINESS-001 — Multi-Provider Authentication Hosted-Preview Readiness — Implementation Report

> **Package:** `AUTH-PREVIEW-READINESS-001` — Founder-authorized engineering task resolving the hosted-preview prerequisites identified by `AUTH-PROVIDER-CONFIG-001` (P-1 preview surface, P-2 Hosting CSP, P-3 provider-flag documentation). Readiness only — no deploy, no hosted-preview execution, no AUTH-10.
> **Date:** 2026-08-12. **Depends on:** merged `AUTH-CORR-003` (multi-provider policy) and `I18N-001` (localization) — both verified on `main`.

## 1. Entry state (entry gate)

- `origin/main` = `457f4aba01b469089ddfb56facc9620503625122` (unchanged from the `AUTH-CORR-003` handover).
- **AUTH-CORR-003 PR #100 MERGED** — headRefOid `c126453989f5d57dc37b16f1a473ef765bd7e582`, merge commit `457f4aba…`; `c126453` is an ancestor of `main`. Post-merge main CI **green**.
- **I18N-001 PR #99 MERGED** (merge `0bc89754…`) — the first parent of the AUTH-CORR-003 merge; authoritative on `main`.
- **Provider matrix on `main`:** Google — Included (`google.com`→`google_sign_in`); Email/Password — Included (`password`→`email`); Phone OTP — Included, optional/non-default (`phone`→`phone_otp`); Apple / email-link-passwordless / passkeys — Deferred. Verified in `firebaseTokenVerifier.ts` (fail-closed map) and the callable allow-list `MVP_REFERENCE_TYPES` (`index.ts`).
- **AUTH-10 not started.** Authentication concern at entry: `Validation Complete — closure pending the (multi-provider) Founder-executed hosted-preview check`.
- **Dirty primary worktree untouched** (`/Users/theo/11THONUS`, branch `chore/eng-p1-001-closure`); work performed in a clean linked worktree on branch `feat/auth-preview-readiness-001` from `457f4aba`.

## 2. P-1 — Multi-provider preview surface

### Root cause
The production multi-provider `SignInPanel` + `createSignInActions` were fully implemented and unit-tested but **not mounted on any hosted/testable surface**: `App.tsx` renders only the Phase-0 scaffold on `/`, and the only auth route was the DEV-gated, **phone-only** `/dev/phone-auth-harness`. A DEV-gated route is statically dropped from a production `vite build`, so it is absent from any `hosting:channel:deploy` — there was no surface for a hosted preview to exercise Email/Google.

### Strategy (Founder-selected: isolated hosted build, CR3-style)
Mirror the governed EXT-TECH-001/CR3 mechanism: a dedicated `vite build --mode sign-in-preview` build with its own single HTML entry, structurally excluded from the ordinary production bundle (not runtime-flagged), plus a secondary DEV-server route for local convenience. The surface **reuses** the real composition — no authentication logic is duplicated.

### Final composition/surface
- `apps/web/sign-in-preview.html` — dedicated entry (static `robots: noindex`), loads `signInPreviewMain.tsx`.
- `signInPreviewMain.tsx` — bootstrap: initializes I18N-001, renders `SignInPreviewPage`; no `react-router`, `react-query`, or `observability/*` in the graph (structural isolation, like `harnessMain.tsx`). Gated by `isSignInPreviewBuildEnabled`.
- `SignInPreviewPage.tsx` — mounts the **existing** `LanguageSwitcher` + `SignInPanel`, driven by the **existing** `createSignInActions` over the shared Firebase client. Reads provider flags from `import.meta.env`. Fail-closed: renders nothing unless the dev gate or `previewBuild` is active.
- `signInPreviewPlatform.ts` — reuses the shared `getFirebaseApp`/`getFirebaseAuth`/`getFirebaseFunctions` modules (the real composition), with a positive project-ID allowlist (`eleventh-on-us-dev` + emulator `demo-11thonus`). Deliberately does **not** call `initializeFirebasePlatform` (which fails closed on the unprovisioned App Check); the `authenticate` callable does not enforce App Check, so composing auth + functions directly is correct — the same reasoning the phone harness uses.
- `signInPreviewGate.ts` — pure fail-closed gate (`previewFlag === "true"` && `mode === "sign-in-preview"` && `projectId === "eleventh-on-us-dev"`).
- `viteBuildModes.ts` — pure, unit-tested build-mode helper consumed by `vite.config.ts` (entry selection + PWA omission for both isolated builds).
- `App.tsx` — secondary DEV-only `/dev/sign-in-preview` route (literal `import.meta.env.DEV`, build-time excluded from production), mirroring the phone-harness route.
- `apps/web/package.json` — `build:sign-in-preview` script.

### Reuse confirmation
`SignInPreviewPage` imports and renders the production `SignInPanel` and calls the production `createSignInActions`; the platform accessor delegates to the shared `infrastructure/firebase/*` modules (asserted by mocking exactly those modules). No auth flow (`emailPasswordSignInFlow`, `googleSignInFlow`, `phoneSignInFlow`, `authenticateCallable`) is copied.

### Route/build gating & provider behaviour
- Authoritative hosted-validation surface = the isolated `sign-in-preview` build. Secondary local surface = the DEV route. Neither enters the production bundle (empirically verified — §7).
- Providers are disabled-by-default (`VITE_AUTH_ENABLE_*`, exact `"true"`). Mandatory core preview: Email/Password + Google enabled, Phone OTP unset. Phone appears only when its flag is explicitly `"true"`; it is never mandatory or primary. When all flags are off, `SignInPanel` shows its `unavailable` message.

## 3. P-2 — Hosting CSP

### Root cause
`connect-src` permitted `identitytoolkit`/`securetoken`/`www.google.com` but **not** the callable Functions origin. The `authenticate` callable resolves via `httpsCallable(getFunctions(app, "europe-west1"), …)` to `https://europe-west1-eleventh-on-us-dev.cloudfunctions.net` (functions region `europe-west1`, project `eleventh-on-us-dev`; `firebase-functions` v7 / gen-2, browser SDK uses the cloudfunctions.net endpoint). A hosted page would be CSP-blocked from completing any sign-in.

### Exact change
In both `hosting.headers` CSP blocks (`/index.html` and `/`):
- `connect-src` += `https://europe-west1-eleventh-on-us-dev.cloudfunctions.net` (the callable origin).
- `frame-src` += `https://eleventh-on-us-dev.firebaseapp.com` — **added in review** (Codex P1 #1, §11): Google `signInWithPopup` loads Firebase Auth's hidden resolver iframe at `https://<authDomain>/__/auth/iframe`, governed by `frame-src`.
- `script-src` += `https://apis.google.com` **and** `frame-src` += `https://apis.google.com` — **added in review** (Codex P1 #2, §11): `signInWithPopup` bootstraps the GAPI client from `https://apis.google.com/js/api.js` and opens a gapi messaging iframe on that origin (both required per Firebase Auth's documented CSP; the `frame-src` half added proactively to pre-empt the corresponding block).

No other directive changed.

### No weakening
No wildcard introduced; reCAPTCHA/Google (`www.google.com` in both `script-src` and `frame-src`) + Identity Toolkit/secure-token origins preserved; `default-src 'self'`, `object-src 'none'`, `script-src`/`style-src`/`img-src` unchanged. A regression test (`hostingCsp.test.ts`) asserts, on every document route: the callable origin in `connect-src`; the auth-domain origin in `frame-src`; no `*` in `connect-src`; and the restrictive directives remain. Local/emulator behaviour is unaffected (the client connects to `127.0.0.1:5001` in emulator mode; CSP applies only to hosted responses).

## 4. P-3 — Provider-flag documentation

Added the three governed flags — `VITE_AUTH_ENABLE_EMAIL_PASSWORD`, `VITE_AUTH_ENABLE_GOOGLE_SIGN_IN`, `VITE_AUTH_ENABLE_PHONE_OTP` — and the preview build flag `VITE_ENABLE_SIGN_IN_PREVIEW` to `apps/web/.env.example`, with blank (fail-closed) placeholders and an explanation that enablement requires the exact string `"true"`. No secrets/keys/OAuth secrets/phone numbers/credentials added.

## 5. Localization

The customer-facing auth UI (`SignInPanel`) renders entirely from I18N-001 keys; the preview reuses the existing `LanguageSwitcher` (en/fr) — no new customer-facing copy or new localization mechanism. English remains primary/default; French supported; runtime switching verified. The preview page's own dev-tool chrome (test-only banner, "Sign-in preview" heading) is plain developer-facing text, consistent with the `phoneAuthHarness` precedent for a non-customer tool.

## 6. Identity / security / privacy invariants

No change to the identity/authentication model: one customer identity → one Firebase principal → one or more methods; provider ≠ identity. Firebase remains the credential authority; no raw password/token/OTP persisted, logged, or rendered. No backend package modified (`functions/` byte-identical to `main`); no `firestore.rules`/security change; no client Firestore write path; closed error taxonomy, tuple references, AUTH-02/03/05/06/07/08 guarantees all untouched (consumed, not modified). Both isolated builds omit the PWA service worker; the preview emits `noindex` (static meta + runtime).

## 7. Build isolation — empirical verification

- `pnpm --filter web build:sign-in-preview` → 78 modules; `dist/index.html` loads the preview bundle; grep confirms the bundle **contains** auth copy ("Continue with Google") and **excludes** the AppShell scaffold, the phone harness, and all PWA artifacts.
- `pnpm --filter web build` (ordinary production) → grep confirms the bundle **excludes** the preview banner and every `signInPreview` marker, **includes** the scaffold, and emits the PWA `sw.js` (unchanged behaviour).

## 8. Files created / modified

**Created:** `apps/web/sign-in-preview.html`; `apps/web/viteBuildModes.ts`; `apps/web/src/dev/signInPreview/{signInPreviewGate.ts, signInPreviewPlatform.ts, SignInPreviewPage.tsx, signInPreviewMain.tsx, recaptchaLifecycle.ts}` (+ tests for gate/platform/page/build-isolation/recaptcha-lifecycle); `apps/web/src/infrastructure/hosting/hostingCsp.test.ts`.
**Modified:** `apps/web/vite.config.ts`; `apps/web/package.json`; `apps/web/src/App.tsx` (+ `App.test.tsx`); `firebase.json`; `apps/web/.env.example`.
**Docs:** this report + change-tracking (`IMPLEMENTATION_CHANGES.md`, documentation-changes-log Entry 106) + programme status (`CDR-001 §5`, Master Workflow).
**Backend:** none. **Dependencies:** none. **Firebase Console / deploy / preview channel:** none.

## 9. TDD (RED→GREEN) evidence

Every behavioural module was written test-first, each test observed failing (module/assertion) before implementation:
- `signInPreviewGate` — RED (module missing) → GREEN 9/9.
- `signInPreviewPlatform` — RED (module missing) → GREEN 10/10.
- `SignInPreviewPage` — RED (module missing) → GREEN 12/12.
- `viteBuildModes` (isolation) — RED (helper missing) → GREEN 6/6.
- `App` sign-in-preview route — RED (route absent) → GREEN.
- `hostingCsp` — RED (functions origin absent from `connect-src`) → GREEN 5/5 after the `firebase.json` change.

## 10. Full validation

- typecheck (all workspaces): **clean**.
- eslint: **clean**. prettier `--check`: **clean**.
- web vitest: **386/386** (was 335; +51 new, incl. the closure-review reCAPTCHA-lifecycle tests).
- functions vitest: **567/567** (no functions change).
- `emulators:validate`: **221/221**.
- e2e (Playwright): **1/1**.
- builds: isolated `sign-in-preview` build OK; ordinary production build OK; isolation grep verified both directions (§7).

## 11. Review, PR, CI

- Branch: `feat/auth-preview-readiness-001`. **PR #101** (base `main`). Not self-merged.
- First commit `e5b4f7f` — CI **success** (run 31599991110).
- **Automated review (Codex) — two P1 CSP findings, both fixed (TDD).** Both are genuine Google-`signInWithPopup` CSP requirements that would block the mandatory Google core preview on a hosted channel; verified against Firebase Auth's documented CSP.
  - **P1 #1 — `frame-src` resolver iframe** (`5d48d82`): the popup loads `https://<authDomain>/__/auth/iframe`; added `https://eleventh-on-us-dev.firebaseapp.com` to `frame-src` (both blocks) + regression assertion.
  - **P1 #2 — GAPI popup bootstrap** (next commit): the popup loads `https://apis.google.com/js/api.js` and a gapi messaging iframe; added `https://apis.google.com` to `script-src` **and** `frame-src` (both blocks) + regression assertion.
  - CSP test now 7/7. No human reviewer has commented at the time of writing.
- **Closure re-review — one P2, fixed (TDD).** On the merge-gate re-review Codex raised a **P2** on `SignInPreviewPage.tsx`: the optional Phone flow constructed a new `RecaptchaVerifier` (+ DOM node) per send without retaining it, so it never `clear()`ed the prior widget or removed the node — repeated sends leak iframes/listeners and nothing tears down on unmount. **Verified valid** (only affects the optional Phone path, but a genuine resource leak in newly-added code). **Fixed:** extracted a pure, unit-tested `recaptchaLifecycle.ts` (`createManagedRecaptcha` — tears down the current verifier + node before creating the next and on unmount, best-effort/idempotent, robust to a throwing `clear()`); `SignInPreviewPage` now wires it and tears down on unmount. New `recaptchaLifecycle.test.ts` 6/6; no React refs introduced (lint clean).
- **CI:** first commit `e5b4f7f` green (run 31599991110); frame-src fix `5d48d82` green (run 31601471084); gapi fix `bd3de3a` green (run 31603990029); P2 recaptcha-lifecycle fix — CI appended on that commit. A Codex re-review was requested after each fix.

## 12. Resulting status & remaining prerequisites

- Authentication concern → **`Validation Complete — hosted-preview ready`** (the multi-provider preview surface exists, is isolated and deployable; CSP permits the callable; flags documented). Final concern closure still depends on **`AUTH-HOSTED-PREVIEW-002`** PASS (Founder-executed). **Capability 2 remains `Open — partially implemented; not closed`.**
- Remaining prerequisites for `AUTH-HOSTED-PREVIEW-002` (all Founder-executed, none engineering-blocking): populate `apps/web/.env.sign-in-preview.local` with the real `eleventh-on-us-dev` `VITE_FIREBASE_*` values + `VITE_ENABLE_SIGN_IN_PREVIEW=true` + `VITE_AUTH_ENABLE_EMAIL_PASSWORD=true` + `VITE_AUTH_ENABLE_GOOGLE_SIGN_IN=true` (Phone unset for the mandatory core); `pnpm --filter web build:sign-in-preview`; `firebase hosting:channel:deploy … --project eleventh-on-us-dev`; confirm the preview-channel domain is in Auth authorized domains (auto-added on deploy); execute Email/Password + Google PASS (Phone OTP optional via test number, non-blocking).

## 13. Rollback

Revert the single PR. No data migration, no backend change, no config/console/deploy change was performed, so revert fully restores the prior state; the ordinary production build is unaffected either way.
