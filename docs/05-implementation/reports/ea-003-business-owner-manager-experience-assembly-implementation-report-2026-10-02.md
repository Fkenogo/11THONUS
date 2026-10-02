> **Title:** EA-003 — Business Owner / Manager Experience Assembly — Implementation Report  
> **Version:** 1.0 · **Status:** Implemented — pending Founder visual review · **Classification:** Working (implementation record)  
> **Governing documents:** `11THONUS-EA-001`; `EA-002`; `11THONUS-EXP-REF-001`; `DEC-SUB-014`; Founder Development & Preview Workflow Alignment (2026-09-11)  
> **Source-of-truth path:** `docs/05-implementation/reports/ea-003-business-owner-manager-experience-assembly-implementation-report-2026-10-02.md`  
> **Runbook:** [`founder-preview-runbook.md` §13](../../runbooks/founder-preview-runbook.md)

# EA-003 — Business Owner / Manager Experience Assembly

| Item | Value |
|---|---|
| Repository | `Fkenogo/11THONUS` |
| Entry `origin/main` | `ae4f05f346eb0f0864bc35b29371957d80c1b94c` (EA-001, EA-002, WP-COM-06a present) |
| Experience Reference | `Fkenogo/11thonus-prototype` @ `18e8d700f505beefe46d324f6ea33f20a670abe7` (read only; unchanged) |
| Branch | `claude/inspiring-hamilton-fn0o7w` |

## 1. Assembly strategy

Product Truth assembled **through** the reference, not ported from it. No prototype code or `AppContext` state was copied.
The production Dashboard already had real pages for programmes, customer rewards, purchases, team, locations and profile; what was missing was the
**Business home** (a profile + four links) and a shell that is phone-first and role-aware. EA-003 therefore:

1. adds a **Command Centre** composed client-side from four existing read models (no new backend, no new callable);
2. makes the existing **hamburger/drawer shell** phone-first and role-labelled (Founder direction: no bottom navigation);
3. corrects two phone defects found on a real Pixel 7 run of the existing programme page;
4. leaves every authorisation decision server-side (the viewer's role changes wording/labels only).

## 2. Prototype → production mapping

| Prototype element | Intended experience | Canonical Product Truth / backend | Production UI (before) | Action taken |
|---|---|---|---|---|
| Dashboard "Attention Needed" queue | What needs me now | Purchase states; `listAvailableRewardsForBusiness`; `listRewardPrograms` | none | **Built**: rewards ready · waiting for customer · under review · held (`pending_admission`) · no live programme |
| Approvals queue / Approve-Reject | Manager decisions | **None** (EA-001 D-3) | none | **Excluded** |
| Instant Circle progress on record | Immediate stamp | **Contradicted** — progress only after customer verification (D-1) | none | **Excluded**; unverified Purchase shown as "not counted" |
| Commercial standing notice | Tell the Business why new Circles are paused | Commercial standing exists in DB only; **no Business-facing read, no `commercial.view*` permission** (WP-COM-08) | none | **Partially assembled** via canonical Purchase state `pending_admission`; standing panel **blocked — seam S-1** |
| Today's Activity | Recent happenings | `listPurchasesForBusiness` | Purchases page | **Built** (latest 5, status-labelled) |
| Programme cards | Status + rule | `listRewardPrograms` | Programme page | **Built** summary on Home; full page reused, mobile-corrected |
| Customers tab | Visibility, not CRM | `listLoyaltyCycleProgressForBusiness` | Customer Rewards page | **Reused**; "closest to a reward" surfaced on Home |
| Team & frontline | Roles, no shared logins | membership + role callables | Team page | **Reused** as-is; role/permission behaviour verified |
| Locations | | branch callables | Locations page | **Reused**; moved up in navigation |
| Role switcher, scenarios, reset, tour, privacy toggle | Demo tooling | n/a | none | **Excluded** (replaced by EA-002 identities) |
| Mobile bottom navigation | Thumb reach | Founder: hamburger/drawer | hamburger | **Adapted**: overlay drawer, sticky header, 44 px targets |

## 3. Deviation table

| Reference element | Production implementation | Same / Adapted / Excluded | Reason |
|---|---|---|---|
| Bottom nav (Home/Customers/Programmes/More) | Sticky header + hamburger → full-height drawer; desktop sidebar | **Adapted** | Founder direction supersedes prototype |
| Approvals & Decisions | not built | **Excluded** | Product Truth (no manager-approval concept) |
| Instant progress; Approve/Reject on large quantities | "Not counted until the customer verifies" | **Excluded** | Product Truth supersedes prototype |
| Quick-add customer, Counter Terminal shortcut | not built | **Excluded** | Product Truth / deferred Frontline package |
| Commercial standing card with grace/restricted state | Held-Purchase attention item only (no standing, no balance) | **Adapted** | Backend seam not yet available (S-1) |
| `$1` unit / 5-unit trial values | not shown | **Excluded** | Superseded values; Commercial detail not exposed |
| Reports & Analytics tab | not built | **Excluded** | Deferred (PRD09) |
| Billing & Commercial Units tab (Owner) | not built | **Excluded** | Seam S-1 |
| Customers search/filter pills, names | Loyalty Number only | **Adapted** | Business read exposes no customer identity beyond the Loyalty Number (privacy) |
| Programme wizard (guided 10+1) | Existing programme page | **Same (existing)** | Reuse; PB-013B P3-3 untouched |
| Redeem button on ready rewards | none | **Excluded** | Business read lacks Reward ID (EA-001 B4); Frontline package |
| Dark/colour palette of prototype | Existing design tokens | **Adapted** | Reuse production design system |

## 4. What was built (files)

New: `apps/web/src/business/dashboard/commandCentre/{CommandCentre.tsx,deriveCommandCentre.ts}` (+2 test files);
`BusinessDashboardRoutes.commandCentre.test.tsx`; `tests/e2e/preview/ea-003-business-experience.spec.ts`; evidence PNGs under
`docs/05-implementation/evidence/EA-003/`; this report.
Modified: `BusinessDashboardShell.tsx` (+test), `BusinessDashboardRoutes.tsx`, `DashboardHome.tsx`, `RewardProgramManagementPage.tsx` (phone layout only),
`i18n/locales/{en,fr}.ts` (`dashboard.commandCentre.*`), the runbook, change logs.
**No** backend, migration, dependency, configuration, CI or seed change.

## 5. Experience by area

* **Shell / mobile:** sticky header (Business + role badge + 44 px menu button); drawer overlays the page (content never pushed); 48 px nav targets; navigation reordered to operate-first (Overview, Reward Programs, Customer Rewards, Purchases, Team, Locations, Profile, Terms). Desktop keeps the persistent sidebar with role badge.
* **Command Centre (Owner/Manager only):** *Needs your attention* → *Loyalty at a glance* (live programs, Circles in progress, rewards ready, waiting for customer) → *Closest to a reward* (verified progress bars) → *Reward Programs* snapshot (status; draft marked "Not published yet") → *Recent activity* → shortcuts. Loading and error states with retry. Staff and unresolved roles keep the previous Home.
* **Programmes:** snapshot on Home; programme page reordered on phones (programmes first, Qualifying Items after), padding and row wrapping corrected so Rename/Retire no longer clip.
* **Customer/Circle/Reward:** bars and counts are the server's verified numbers; an unverified Purchase appears only as "Waiting for the customer — not counted".
* **Team / Locations:** reused unchanged; verified by journeys (Owner sees *Change role*; Manager does not).
* **Commercial consequence:** a Purchase in `pending_admission` raises *Purchases on hold* with the three business-facing truths (in-progress Circles continue; earned rewards stay redeemable; who to contact — Owner: 11thONUS support; Manager: ask the Owner). No balance, ledger, settlement, processor, earmark, scheduler or database term is read or rendered (asserted by a unit test and a journey).
* **Terms:** untouched. Seeded Businesses show the real accepted state; a hand-created Business keeps the genuine "Terms unavailable" state (seam S-2, unchanged).

## 6. Owner vs Manager (verified)

| Capability | Owner | Manager | Enforcement |
|---|---|---|---|
| Command Centre | yes | yes (wording differs on held Purchases) | each read authorised server-side |
| Create Reward Program | button shown | **absent** | `canManage` UI courtesy; server authoritative |
| Change role | shown | **absent** | `staff.assignRole` Owner-only server-side |
| Customer Rewards / Purchases / Team / Locations | yes | yes | membership + permissions server-side |
Playwright asserts the presence/absence at both viewports. Hidden controls are convenience only; every callable remains authorised by the backend (unchanged).

## 7. EN/FR

All 38 new keys exist in `en.ts` and `fr.ts` (`dashboard.commandCentre.*`); the existing locale-parity test passes. **Copy is not approved** — "Circle" is used in new copy while older keys say "Cycle"; Founder copy review requested.

## 8. EA-002 compatibility

`pnpm preview:start` + the existing seed; no second mechanism, no seed change. All 18 EA-002 preview specs still pass alongside 11 new EA-003 results (29 passed, 1 phone-only test skipped at desktop).
Seed used: Bella Salon (Owner `grace.owner`, Manager `patrick.manager`, Staff `diane.staff`), Sparkle Car Wash, Tembo Fitness.

## 9. Validation

| Check | Result |
|---|---|
| `pnpm typecheck` · `pnpm build` | pass |
| `pnpm lint` | 0 errors (1 pre-existing warning) |
| `pnpm format:check` | pass for repository files |
| Web unit/component | 944 passed (129 files), including the new tests |
| New unit tests | derivation (7), Command Centre (6), routes-by-role (3), shell role (2) |
| Preview Playwright, desktop + Pixel 7 | 29 passed / 1 skipped (phone-only) |
| Functions / PostgreSQL / emulator suites | not touched (no `functions/` change); run in CI |

## 10. Product Truth seams and Founder decisions

* **S-1 (backend seam — Business-facing Commercial standing).** No callable or `commercial.view*` permission exposes standing to a Business (design WP-COM-08). The prototype's standing panel, grace messaging and Owner "Commercial & Usage" cannot be bound to canonical state. **Stopped at the seam** rather than inventing a read; consequence is surfaced only through canonical `pending_admission`. With the gate off (preview default) nothing is held, so Tembo Fitness (restricted, negative credit) shows **no** notice — by design, documented. *Decision needed:* authorise WP-COM-08 (Business read + permissions) and/or a local `enforce` scenario (EA-001 D-7) to preview held Purchases.
* **S-2 (Terms UI)** unchanged: still blocks a hand-created Business from activation; seeded Businesses unaffected.
* **S-3 (Reward ID)** unchanged: no Owner/Manager action needed it, so no stop.
* **S-4 (purchase dates).** The Business purchase list returned no usable date in the browser; Recent activity therefore shows no date. Minor; to be traced by the Purchases owner.
* **No EXPERIENCE ↔ PRODUCT TRUTH CONFLICT** remained open: the known prototype/Product Truth differences (instant progress, approvals, quick-add, bottom nav, prices) were resolved in favour of Product Truth / Founder direction and are listed above.
* Founder decisions: copy approval (EN/FR, "Circle" vs "Cycle"); WP-COM-08 authorisation; whether held-Purchase scenario should be seeded under a local `enforce` mode.

## 11. Evidence

`docs/05-implementation/evidence/EA-003/` (regenerate with `EA003_EVIDENCE=1 pnpm test:e2e:preview`): 01 owner home · 02 programme · 03 customer/reward activity · 04 team · 05 commercial state · 06 manager home · 07 manager activity (each desktop + mobile) · 00 owner drawer (mobile). ≈3.5 MB, following the existing evidence-PNG convention.

## 12. Risks and rollback

Risks: Home issues seven small reads (all cached by TanStack Query; counts capped by the server page size); status-filtered counts are page-capped; copy unapproved. Rollback: `git revert` the commit; no schema/config/dependency to undo.
