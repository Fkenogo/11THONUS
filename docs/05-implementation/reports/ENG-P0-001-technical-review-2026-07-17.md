> **Title:** ENG-P0-001 Technical Review — Repository, Tooling, Documentation Migration and Test-Framework Scaffold
> **Status:** Review complete. **Outcome: APPROVED FOR FIRST COMMIT.**
> **Date:** 2026-07-17
> **Reviewer role:** independent Technical Review, per the Coding Agent Standard and TRD22 §22.41
> **Classification:** Target-only addition (did not exist in the migrated documentation source)

# ENG-P0-001 Technical Review

## 1. Outcome

**APPROVED FOR FIRST COMMIT.**

Every acceptance criterion passes, the two required documentation corrections are complete, the actual repository matches the submitted Implementation Report in every particular inspected, and no secret, architecture issue, scope leak, or validation failure was found. This review inspected the actual files and executed the actual commands rather than relying on the report's claims.

## 2. Actual Files Inspected

Root: `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `eslint.config.js`, `.prettierrc`, `.prettierignore`, `.gitignore`, `.husky/pre-commit`, `playwright.config.ts`, `firebase.json`, `firestore.rules`, `storage.rules`, `firestore.indexes.json`.
`apps/web/`: `package.json`, `vite.config.ts`, `components.json`, `.env.example`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `src/App.tsx`, `src/App.test.tsx`, `src/main.tsx`, `src/index.css`, `src/lib/utils.ts`, `src/test/setup.ts`, full `src/` directory listing.
`functions/`: `package.json`, `tsconfig.json`, `vitest.config.ts`, `src/index.ts`, `src/index.test.ts`.
`tests/e2e/app-shell.spec.ts`.
`docs/changes/IMPLEMENTATION_CHANGES.md`, `docs/05-implementation/reports/ENG-P0-001-implementation-report-2026-07-17.md`.

No `tsconfig.base.json` exists at the root — the report never claimed one did; consistent.

## 3. Discrepancies Between Repository and Implementation Report

**None found.** Every file inspected matches the report's description exactly: dependency lists, script names, rule content, emulator port assignments, and the neutral frontend/Functions scaffolds all correspond to what the report claims. The two known documentation inconsistencies flagged in this review's own task brief were confirmed present and are corrected below (§4) — everything else in the report was independently verified accurate.

## 4. Corrections Made

**Correction A — unsafe rollback command.** `docs/changes/IMPLEMENTATION_CHANGES.md` previously recommended `git clean -fdx && git status` for rollback. `git clean -fdx` deletes every ignored file, including the retained `.env.local` at the repo root — unacceptable. Replaced with an explicit, narrowly-scoped list of only the paths ENG-P0-001 introduced or replaced (`apps/ functions/ tests/ docs/ node_modules/` plus the specific root config files), matching the Implementation Report's own §17 rollback instructions. `.git/` and `.env.local` are never touched by the corrected rollback.

**Correction B — stale report-location reference.** The changes log stated the implementation report existed only "in-session" and not yet as a file. It now does exist at `docs/05-implementation/reports/ENG-P0-001-implementation-report-2026-07-17.md`. Corrected the entry to link that path and clarify the report is present in the working tree but not yet committed (no commit exists at all yet).

No other content in the report or changes log was rewritten, per the task's instruction to modify only the relevant passages.

## 5. Package/Workspace Review

- **Sole package manager:** pnpm. Confirmed via `find` for `package-lock.json`/`yarn.lock`/`pnpm-lock.yaml` anywhere outside `node_modules` — exactly one lockfile (`pnpm-lock.yaml`) exists, at the root.
- **Workspaces declared correctly:** `pnpm-workspace.yaml` → `apps/*`, `functions`. `pnpm -r list --depth -1` confirms exactly 3 recognized packages: `11thonus` (root), `web` (`apps/web`), `functions` (`functions`).
- **Root script scoping:** `pnpm test` → `pnpm -r run test` → runs only each workspace's own `vitest run`; it does not invoke Playwright or the emulator suite. `pnpm test:e2e` → `playwright test` only. `pnpm emulators` is interactive (`emulators:start`); `pnpm emulators:validate` is the deterministic, non-interactive `emulators:exec` variant used for automated smoke validation — correctly separated, as required.
- **`packageManager` field:** `"pnpm@9.15.9"`, pinned to the actually-installed version — appropriate for reproducibility.
- **Dependency placement:** cross-checked every non-relative import in `apps/web/src/**` and `functions/src/**` against each workspace's declared `package.json` — zero undeclared/phantom imports. A handful of declared-but-not-yet-imported packages exist by design (`@hookform/resolvers`, `@tanstack/react-table`, `class-variance-authority`, `react-hook-form`, `recharts`, `zod` in `apps/web`; `firebase-admin` in `functions`) — these are DEC-TECH-003 stack requirements pre-installed as foundations, explicitly disclosed in the original approved strategy as not wired into UI/runtime yet (Phase 1+ work). This is a documented deferral, not a defect.
- **No workspace silently skipped:** `pnpm -r run <script>` reports "Scope: 2 of 3 workspace projects" for `build`/`typecheck`/`test` — the root package correctly has no such script (it isn't a buildable/testable unit itself); both real workspaces (`web`, `functions`) run every time.

**Result: pass, no issues.**

## 6. Frontend Neutrality Review

- No `src/components` directory exists at all — zero shadcn components generated beyond the required prerequisites (`components.json`, `src/lib/utils.ts`'s `cn()` helper, Tailwind CSS variables in `src/index.css`).
- Targeted search for chart/dashboard/table/loyalty/reward/purchase-named files in `apps/web/src`: **zero matches**.
- `App.tsx` renders exactly one neutral route (`/`) with placeholder text ("Phase 0 infrastructure scaffold. No product features are implemented yet.") and no trust-critical action of any kind.
- React Router (`BrowserRouter`/`Routes`/`Route`) and TanStack Query (`QueryClientProvider`) are both initialized correctly in `main.tsx`, with no queries defined yet (appropriately — nothing to query).
- Tailwind v4 (`@tailwindcss/vite`) and `vite-plugin-pwa` are both present in the actual build output (`pnpm build` produced `dist/manifest.webmanifest`, `dist/sw.js`, `dist/workbox-*.js`, and a real CSS bundle) — not just declared, genuinely wired and functioning.
- **Service worker:** the PWA plugin uses the default `generateSW` strategy with no `runtimeCaching` configuration — it precaches only the static build assets (6 entries, 260.40 KiB) and makes no claim about caching or serving any authoritative/live data.
- **`.env.local` isolation confirmed structurally, not just by convention:** `vite.config.ts` sets no `envDir`/`envPrefix` override, so Vite's env loading is scoped to `apps/web/` (its own config root) by default — the root-level `.env.local` is outside that search path entirely. `apps/web/` contains only `.env.example`.

**Result: pass, no issues.**

## 7. Functions Neutrality Review

- `functions/src/index.ts` contains exactly one export, `ping`, an `onRequest` handler that returns a static `{ status: "ok" }` JSON response. It performs no read, write, or interaction with Firestore, Storage, or any Admin SDK call — **it cannot modify live or emulator data**, by construction (no data-access code exists in the file at all).
- No `.region(...)` call or region string appears in `functions/src/index.ts` or `firebase.json` — grep for `region` across both returned zero matches. The `us-central1` string that does appear in the Implementation Report is the Firebase emulator's own default endpoint path, logged when it started the function (an observed runtime fact, not a configured value) — see §8 for the full disambiguation.
- No live Firebase project ID appears anywhere in `functions/` source or config.
- No product-domain code, Firestore schema, event outbox, or idempotency implementation exists — confirmed by direct inspection of the two-file `functions/src/` directory.
- `functions/src/index.test.ts` requires no credential, environment variable, or emulator connection to run — it only imports the module and asserts the export is defined. Confirmed by re-running `pnpm test`, which passed with zero environment configuration present.

**Result: pass, no issues.**

## 8. Firebase Isolation and Rules Review

Targeted repository-wide search (excluding `node_modules` and `.git`), with historical documentation distinguished from live application/config matches:

| Pattern | App/config matches | docs/ matches | Interpretation |
|---|---|---|---|
| `eleventh-on-us` | 0 | 1 (Implementation Report) | The one match reads *"pointed at the unapproved temporary project `eleventh-on-us`"* — correctly documenting that the removed `.firebaserc` used to reference it. Not a live reference; `.firebaserc` does not exist in the working tree. |
| `nam5` | 0 | 0 | Fully removed; does not appear anywhere, including historical records. |
| `firebase deploy` | 0 | 0 | The original `functions/package.json` had a `"deploy": "firebase deploy --only functions"` script; it was removed and does not reappear anywhere. |
| `useEmulator` | 0 | 0 | Expected — no client-side Firebase SDK connection code exists yet (Phase 1 scope); nothing to flag. |
| `us-central1` | 0 | 1 (Implementation Report) | The one match is the Implementation Report quoting the emulator's own auto-assigned endpoint URL after startup (`http://127.0.0.1:5001/demo-11thonus/us-central1/ping`) — an observed fact about Firebase Functions' unconfigured-region default, not a value configured anywhere in `firebase.json` or `functions/src/index.ts` (confirmed no `region` keyword exists in either). Not a DEC-TECH-005 violation. |
| `allow read, write: if true` | 0 | 0 | `firestore.rules`/`storage.rules` are deny-by-default (`if false`); the original 30-day open test-mode rule text is gone entirely. |

- `.firebaserc` confirmed absent from the working tree (`ls`/`find` both return nothing).
- Both `pnpm emulators:validate` runs (initial validation and this review's independent re-run) used `--project demo-11thonus`; the CLI logged `"Detected demo project ID... attempts to access non-emulated services for this project will fail"` — confirming the fake-project isolation is real, not just configured.
- `firebase.json`: no `location`, no live project ID, no `auth.providers` assumption. `hosting.public` is `apps/web/dist` — verified this is the actual Vite build output (re-built during this review, then served correctly by the Hosting emulator at `http://127.0.0.1:5050`).
- No script in any `package.json` invokes `firebase deploy` or any live-resource-creating command as part of normal validation.
- No Firebase project was created or deployed to at any point during this review's re-execution of the full validation suite.

**Result: pass, no issues.**

## 9. Gitignore and Secret-Safety Review

- `.env.local` — confirmed ignored (`git check-ignore` matches `.gitignore:18 .env.*`).
- `.env.example` — confirmed **not** ignored and stageable (`git add -n` succeeds; `git status` shows `??`; `git check-ignore` exits 1 / not-ignored), via the `!.env.example` negation pattern.
- `node_modules/` at all three levels (root, `apps/web`, `functions`), `apps/web/dist`, `functions/lib`, `playwright-report/`, `test-results/` — all confirmed ignored.
- `firebase-debug.log` and `firestore-debug.log` (both generated once during emulator testing, in the initial implementation and again during this review) — both ignored via the `*.log` pattern; removed from the working tree after each check.
- No `service-account*.json` or `*-firebase-adminsdk-*.json` file exists anywhere in the tree.
- `.DS_Store` files exist only inside `docs/` (created by Finder while browsing) and are correctly ignored.
- **Secret pattern scan:** every git-add-eligible file scanned for Firebase API key format, PEM private-key headers, live Stripe-style secret keys, and AWS access-key format — zero matches.
- **Direct `.env.local` value-leak check** (values compared byte-for-byte against every trackable file, without printing any value): of the 8 captured variables, 6 (API key, auth domain, storage bucket, messaging sender ID, app ID, measurement ID) have **zero matches anywhere**. The remaining 2 produced matches that are not leaks: `VITE_BACKEND_PROVIDER`'s value is the generic word "firebase" (matches 19 files, all legitimate uses of that word in a Firebase-based codebase and its documentation — not a secret); `VITE_FIREBASE_PROJECT_ID`'s value is the non-secret project-slug `eleventh-on-us`, which appears in exactly the one Implementation Report sentence already addressed in §8 (documenting its removal, not exposing a credential — project IDs are identifiers, not secrets).
- No `.DS_Store` or IDE-local state is eligible for the first commit.

**Result: pass, no issues. No secret value was found leaked into any trackable file.**

## 10. Commands Executed

```
cd /Users/theo/11THONUS && pwd && git branch --show-current && git remote -v \
  && git status --short && git diff --cached --stat
find . -not -path '*/node_modules/*' \( -name package-lock.json -o -name yarn.lock -o -name pnpm-lock.yaml \)
pnpm -r list --depth -1
grep -rhoE 'from "[a-zA-Z@][^"]*"' apps/web/src functions/src ...   (import cross-check)
grep -rn "eleventh-on-us" / "nam5" / "firebase deploy" / "useEmulator" / "us-central1" / \
  "allow read, write: if true"   (targeted isolation search, repo-wide)
git check-ignore -v .env.local apps/web/.env.example node_modules apps/web/dist functions/lib \
  playwright-report test-results firebase-debug.log firestore-debug.log
git add -n apps/web/.env.example
python3 <value-leak checker, .env.local vs. every trackable file, values never printed>
pnpm install --frozen-lockfile
pnpm build
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm emulators:validate
python3 <documentation relative-link checker>
```

## 11. Complete Validation Results

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | ✅ "Lockfile is up to date, resolution step is skipped" |
| `pnpm build` | ✅ Both workspaces build; Vite output unchanged from the original report (258.66 kB JS / 7.14 kB CSS, PWA SW generated, 6 precached entries) |
| `pnpm lint` | ✅ Zero errors, zero warnings |
| `pnpm format:check` | ✅ "All matched files use Prettier code style!" |
| `pnpm typecheck` | ✅ Both workspaces, strict mode |
| `pnpm test` | ✅ 2 files / 2 tests passed (1 `apps/web`, 1 `functions`) |
| `pnpm test:e2e` | ✅ 1 passed (Chromium, 5.9s) |
| `pnpm emulators:validate` | ✅ Auth/Functions/Firestore/Hosting/Storage all started; `ping` loaded; hosting served the real build; smoke script exited 0; clean shutdown |

No command failed on this re-run; no narrowly-scoped correction was required beyond the two documentation fixes in §4.

## 12. Documentation-Link Validation Result

989 relative Markdown links checked across 141 Markdown files (139 migrated + 2 target-only additions: `IMPLEMENTATION_CHANGES.md` and the Implementation Report) — **0 broken**.

## 13. Final Git Branch, Remote and Status

```
$ git branch --show-current
main

$ git remote -v
origin  https://github.com/Fkenogo/11THONUS.git (fetch)
origin  https://github.com/Fkenogo/11THONUS.git (push)

$ git status --short
?? .gitignore
?? .husky/
?? .prettierignore
?? .prettierrc
?? README.md
?? apps/
?? docs/
?? eslint.config.js
?? firebase.json
?? firestore.indexes.json
?? firestore.rules
?? functions/
?? package.json
?? playwright.config.ts
?? pnpm-lock.yaml
?? pnpm-workspace.yaml
?? storage.rules
?? tests/

$ git diff --cached --stat
(no output — nothing staged)
```

Branch is `main`; remote is unchanged and matches the strategy report and Implementation Report; nothing is staged; no other process modified the repository during this review (re-checked at the start and confirmed no drift by the identical 18-entry status list at the end).

## 14. Remaining Risks

Unchanged from the Implementation Report, independently re-confirmed during this review:

- The Corepack/Node 20.20.0 activation bug (`ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`) is a local-machine tooling issue, not a repository defect — pnpm 9.15.9 remains correctly installed and functioning via the documented `npm install -g pnpm@9` fallback.
- macOS AirPlay Receiver's default use of port 5000 is why the Hosting emulator is configured at 5050 instead — already handled in `firebase.json`, re-verified working on this review's re-run.
- Ambient Application Default Credentials on this machine produced the same benign CLI warning on this review's emulator run as on the original — inert given the `demo-11thonus` fake-project isolation, but worth the Founder's awareness for any future non-demo Firebase CLI use on this machine.
- DEC-TECH-005 (region) and DEC-PROV-005 (error-monitoring provider) remain open by design; nothing in ENG-P0-001 depends on or resolves them.
- No new risk was discovered during this independent review.

## 15. First-Commit Recommendation

**Recommended: proceed to first commit**, subject to the Founder's own sign-off process (this review does not itself authorize the commit — see the Founder's own next-steps sequence). The working tree is clean, fully validated, free of secrets, and structurally isolated from any live Firebase resource.

## 16. Rollback Instructions

Unchanged in substance from the Implementation Report, now also corrected in `IMPLEMENTATION_CHANGES.md` (§4 above): the repository has zero prior commits, so rollback is deleting only the paths ENG-P0-001 introduced or replaced —

```bash
cd /Users/theo/11THONUS
git status --short   # confirm nothing is staged/committed first
rm -rf apps functions tests docs node_modules \
  package.json pnpm-workspace.yaml pnpm-lock.yaml \
  eslint.config.js .prettierrc .prettierignore .husky \
  playwright.config.ts README.md firebase.json \
  firestore.rules firestore.indexes.json storage.rules .gitignore
```

`.git/` and `.env.local` are never touched. **Do not use `git clean -fdx`** — it would delete `.env.local` along with everything else ignored.

## 17. Report Location

This report is saved at `docs/05-implementation/reports/ENG-P0-001-technical-review-2026-07-17.md`, per the task's instruction.

## 18. Persistent Changes-Log Update

See the new entry appended to [`docs/changes/IMPLEMENTATION_CHANGES.md`](../../changes/IMPLEMENTATION_CHANGES.md), below the corrected ENG-P0-001 entry.

---

## Status

**Outcome: APPROVED FOR FIRST COMMIT.** This determination is recorded for the Founder/Technical Lead's own workflow action — this review does not create a commit, push, or update ENG-P0-001's workflow status itself.
