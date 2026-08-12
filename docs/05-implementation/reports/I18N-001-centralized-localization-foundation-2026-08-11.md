# I18N-001 — Centralized Localization Foundation — Implementation Report

> **Package:** `I18N-001` (bounded implementation of the already-governed TRD13 / TRD16 §16.40 localization requirement).
> **Nature:** Frontend localization foundation + retrofit of AUTH-04's hard-coded customer-facing copy. **No new product requirement; no backend change; no Firebase change; no provider change.**
> **Date:** 2026-08-11. **Blocks:** `AUTH-CORR-003` remains blocked until this foundation is merged.

## 1. Founder authorization

Founder-authorized as task "I18N-001 Centralized Localization Foundation" — a bounded implementation of the existing governed requirement (English primary/default, French supported) before `AUTH-CORR-003` resumes. AUTH-10+ not authorized.

## 2. Entry repository state

- `origin/main` = `2f57f9c` (AUTH-09 merged; main CI green). Clean linked worktree off `origin/main`; dirty primary worktree (`chore/eng-p1-001-closure`, 33 files) untouched; no stale-worktree cleanup.
- Verified: AUTH-09 merged; AUTH-HOSTED-PREVIEW-001 remains blocked with no Firebase change; AUTH-10 not started.

## 3. Governing localization requirements reconciled

- **TRD13** — customer-facing copy shall use **translation keys** (§13.6 translation-file structure); English + French supported for launch-critical experiences (`en`/`fr`).
- **TRD16 §16.40** — the frontend shall use **one centralized internationalization framework** (key lookup, namespace loading, language switching, English fallback, pluralization, localized formatting, persistence, lazy loading where appropriate); **language choice shall persist across sessions**.
- **Identity/profile** — `preferredLanguage` exists on the customer profile model; honoured for authenticated users through a dedicated seam.
- **Pre-existing gap addressed:** AUTH-04 shipped hard-coded English customer copy with no i18n — retrofitted here.

## 4. Chosen mechanism & rationale

**`i18next` + `react-i18next` + `i18next-browser-languagedetector`.**

- **Why it fits:** the de-facto centralized i18n framework for React; satisfies every TRD16 §16.40 requirement out of the box — `t()` key lookup, namespaces (`common`, `auth`), runtime `changeLanguage`, `fallbackLng: "en"`, interpolation, pluralization-ready, localized-formatting-ready, and localStorage persistence + navigator detection via the language-detector (English fallback). One centralized instance — no second/auth-specific mechanism.
- **Alternatives considered:** `react-intl`/FormatJS (heavier ICU/`defineMessages` ceremony, less ergonomic runtime switching); `lingui` (build-time macro extraction/tooling overhead); a **custom React context** (would fail the pluralization/localized-formatting requirement and risk "inventing an ungoverned architecture").
- **Why minimum-appropriate:** three first-party i18next-ecosystem packages, all React-19 compatible; resources are **bundled** (the two launch languages are small) so init is synchronous and Suspense-free — the smallest established setup that meets §16.40.

## 5. Architecture implemented

- `apps/web/src/i18n/config.ts` — the single i18next instance: bundled `en`/`fr` resources, `fallbackLng: "en"`, `supportedLngs`, `nonExplicitSupportedLngs` (`fr-FR`→`fr`), `load: "languageOnly"`, namespaces `["common","auth"]`, `react.useSuspense: false`, detector order `["localStorage","navigator"]` caching to `localStorage["i18nextLng"]`.
- `locales/en.ts`, `locales/fr.ts` — namespaced, structured catalogs (`common`, `auth`), key-parity enforced by test.
- `LanguageSwitcher.tsx` — accessible en/fr runtime switch (autonyms so a speaker finds their language in any UI language); persists via the detector.
- `preferredLanguage.ts` — `applyPreferredLanguage`/`normalizePreferredLanguage` seam consuming an authenticated customer's governed `preferredLanguage` (unsupported/absent ignored → English default; never geolocation-based).
- `index.ts` — public barrel.
- Boot init in `main.tsx` and test init in `src/test/setup.ts` (one import each).

## 6. Files created / modified

**Created:** `apps/web/src/i18n/{config.ts, index.ts, preferredLanguage.ts, LanguageSwitcher.tsx, i18n.test.tsx, locales/en.ts, locales/fr.ts}`; `apps/web/src/authentication/SignInPanel.i18n.test.tsx`; this report.
**Modified:** `apps/web/src/authentication/SignInPanel.tsx` (retrofit copy→keys); `apps/web/src/main.tsx` (+1 init import); `apps/web/src/test/setup.ts` (+1 init import); `apps/web/package.json` + `pnpm-lock.yaml` (deps). **No `functions/`, no `firestore.rules`, no unrelated files.**

## 7. Dependencies added

`i18next` `^26.3.6`, `react-i18next` `^17.0.11`, `i18next-browser-languagedetector` `^8.2.1` (all React-19 compatible).

## 8. Catalog structure

`resources.{en,fr}.{common,auth}`. `common.language.label`; `auth.signIn.{ariaLabel,unavailable,signedIn,continueWithGoogle,phoneLabel,sendCode,verificationCode,verifyCode}`; `auth.errors.{auth_required,auth_forbidden,not_found,validation_failed,conflict,unavailable,timeout,failed}`. `signIn.signedIn` interpolates `{{mode}}` (a backend enum — not translated).

## 9–12. Behaviour

- **English (default/fallback):** resolves to `en` when no stored/negotiated preference (jsdom navigator `en-US`→`en`); English is the fallback for any key missing elsewhere (proven with a throwaway English-only namespace).
- **French:** selectable; renders French catalog copy; verified in the SignInPanel and via `changeLanguage`.
- **Persistence:** the chosen language is cached to `localStorage["i18nextLng"]` and rehydrated on next load (unauthenticated persistence).
- **preferredLanguage integration:** `applyPreferredLanguage("fr")` switches to French; region variants/casing normalized (`fr-FR`/`EN`); unsupported (`es`) or absent values are ignored → English stands.

## 13–14. AUTH-04 retrofit

All SignInPanel customer-visible strings moved to `auth` translation keys with equivalent English (byte-identical to the prior wording) and French copy: the aria-label, the fail-closed unavailable message, the signed-in status (interpolated), "Continue with Google", the phone label, "Send code", "Verification code", "Verify code", and all eight stable error messages. **No hard-coded customer copy remains** in the migrated component (grep + test-verified). Flow logic and behaviour are unchanged; no authentication UX redesign; the Email/Password flow remains AUTH-CORR-003's scope (not implemented here).

## 15. Tests added (TDD)

`apps/web/src/i18n/i18n.test.tsx` (11) + `apps/web/src/authentication/SignInPanel.i18n.test.tsx` (4) — **+15 web tests**, covering all 9 required proofs: English default (1), French when selected (2), English fallback for missing French key (3), localStorage persistence (4), AUTH-04 copy from keys (5), English copy correct (6), French copy renders (7), no untranslated hard-coded AUTH-04 copy (8), existing AUTH-04 behaviour green (9 — the unchanged `SignInPanel.test.tsx` still passes), plus catalog key-parity, LanguageSwitcher runtime switching, and `applyPreferredLanguage` normalization/ignore-unsupported.

## 16. RED→GREEN evidence

Initial run: **317/319** with 2 failures (test-design issues — a fallback-probe that mutated the shared catalog, and a switcher label expectation). Corrected (throwaway-namespace probe; autonym switcher labels) → **319/319**. The French-rendering retrofit assertions cannot be satisfied by the pre-retrofit hard-coded-English component — they are green only because the copy is now key-driven.

## 17. Full validation (on the branch)

typecheck **PASS** (web + functions); lint **PASS**; `format:check` **PASS**; build **PASS**; **web 319/319** (43 files, +15); e2e **1/1**; **functions 564/564** (untouched — confirms no cross-package regression). Emulator suite unaffected (no `functions/` change) — CI is the authoritative gate.

## 18. Programme / traceability updates

`IMPLEMENTATION_CHANGES.md` (I18N-001 entry) and documentation-changes-log (Entry 104). Concern/capability statuses unchanged; `AUTH-CORR-003` remains blocked-pending-merge; no competing control document.

## 19. Risks / observations

- The foundation ships two launch languages bundled; adding a language later is additive (new catalog + `supportedLngs`) — lazy/namespace loading remains available in i18next if catalogs grow.
- Only AUTH-04's copy is migrated (scope); other future surfaces must use `t()` from the start (governed by TRD16 §16.42/§16.40).
- `{{mode}}` interpolates an untranslated backend enum by design (technical value).

## 20. Rollback

Revert the I18N-001 commit(s) or discard the branch: removes the `i18n/` module, the three dependencies, and restores SignInPanel's inline English strings. No data/runtime/backend impact.

## 21–26 (PR / confirmations)

PR opened on this branch; **not self-merged**. **AUTH-CORR-003 not resumed.** **AUTH-10 not started.** Dirty primary worktree untouched. (PR number / final reviewed head appended after CI + review.)

## 27. Independent review disposition (PR #99)

The Codex automated reviewer ran on first head `75374af` and raised **3 findings, all P2, all VALID and in-scope** for a localization foundation — each fixed in place (TDD regression added), history preserved:

- **F-R1 (P2, accessibility):** the document root `<html lang>` was not synced to the active language, so assistive tech treated French UI as English. **Fixed** — `config.ts` now sets `document.documentElement.lang` to the resolved base language on initial detection and on every `languageChanged`. Regression test added.
- **F-R2 (P2, correctness):** the `LanguageSwitcher` derived its pressed state from an exact `SUPPORTED_LANGUAGES` match, so a region-qualified active language (`fr-FR`) fell back to `en` and announced the wrong language pressed. **Fixed** — introduced `baseLanguage()` and the switcher now derives from the resolved base language. Regression test added (`fr-FR` → French pressed).
- **F-R3 (P2, i18n correctness):** `SignInPanel` stored the *translated* error string in state, so a live language switch left a visible alert in the old language. **Fixed** — it now stores the stable error *code* and translates at render time. Regression test added (English alert → switch → French alert).

Re-validation after fixes: web **322/322** (+3 regression tests over the +15), typecheck/lint/format/build clean, e2e **1/1**, functions **564/564** (untouched). **No unresolved P1/P2 finding remains.** Final reviewed head: `<appended after re-push CI>`.
