> **Title:** 11THONUS-EA-001 — Founder Preview & Experience Assembly Readiness Assessment  
> **Version:** 1.0 · **Status:** Assessment record — awaiting Founder review · **Classification:** Working (governance/assessment record)  
> **Governing documents:** 11thONUS Platform Constitution; [11thONUS Master Workflow](../11thonus-master-workflow.md); [Decision Register](../../00-governance/decisions/decision-register.md); `11THONUS-EXP-REF-001` (+ §19 addendum); `11THONUS-COMMERCIAL-DESIGN-001` v1.1 + CORR-002; Founder Development & Preview Workflow Alignment (2026-09-11)  
> **Source-of-truth path:** `docs/05-implementation/reports/11THONUS-EA-001-founder-preview-and-experience-assembly-readiness-assessment-2026-10-02.md`  
> **Scope:** Assessment only. No UI, application code, test, migration, dependency, configuration, Firebase/emulator, infrastructure or deployment change was made. Product Truth was not modified. The frozen Experience Reference was not modified. `WP-COM-06b` was not started. The Commercial admission gate was not enabled. No tunnel was created.

# 11THONUS-EA-001 — Founder Preview & Experience Assembly Readiness Assessment

## 0. Founder summary (plain language)

**Can we assemble a Founder Preview now? Yes — a bounded first slice (Slice 1) — but not by wiring screens to the backend alone. Four things must be built first or alongside.**

What is genuinely strong today:

- The **engine is real and deep**: sign-in, Business creation, team invitations, programme + qualifying-item configuration, recording a purchase, the customer verifying it, Loyalty Circles filling to 10, Rewards becoming available, redemption (server side), and the whole Commercial back-office (trial, credit, settlement, capacity, held purchases).
- The **web app already has real screens** for sign-in, onboarding (up to the establishment step), Business profile/locations/team, programme management, a purchases page, Owner/Manager "Customer Rewards" progress, and a minimal customer area (waiting purchases to verify, available rewards).
- A **local-first Founder review workflow is already Founder-approved** (2026-09-11), and the repo already has the building blocks: Firebase emulators, a disposable local PostgreSQL, seed scripts, Playwright emulator tests.

What is **missing** — the honest gap list:

1. **Frontline has no real counter screen.** Recording a purchase today is a desktop-shaped admin form. There is no staff-safe way to see a customer's Circle at the counter, and **no redemption screen at all** (the redemption engine is finished; no web code calls it).
2. **Customers cannot see their own loyalty number/QR** (the backend creates them at registration, but no read endpoint exists) and **cannot see Circle progress** (only Owner/Manager can, today).
3. **There is no Operator Console, and no Operator API.** All Commercial commands exist only as internal services — no endpoint can call them, and there is no cross-Business read for an operator to look at.
4. **There is no one-command local runtime.** Nothing applies the database migrations locally, nothing glues the web app + emulators + PostgreSQL together, and nothing seeds a Founder dataset.

Four **material discrepancies between the frozen prototype and Product Truth** need your decision (they are *not* silently fixed here): the prototype shows instant Circle progress while Product Truth says progress exists **only after the customer verifies**; the prototype has Manager "Approvals" and "quick-add customer" that Product Truth does not provide; the prototype uses a mobile bottom navigation that an earlier Founder instruction rejected for the Business area; and the prototype's `$1` / 5-unit-trial values are superseded by `USD 2` / `3–5` (already recorded).

**Verdict:** FOUNDER PREVIEW — **READY TO ASSEMBLE** (conditional on the decisions in §24 and the package order in §21). Recommended immediate next task: **`11THONUS-EA-002` — Local Preview Foundation** (runtime orchestration, migration runner, preview launcher accounts, reset, and the core seed). Detail in §25.

---

## 1. Entry verification

| Check | Result |
|---|---|
| `git fetch origin` | Completed |
| Canonical `origin/main` SHA | **`c064f43659d87922d14bb4a245d94a5dfe8d918d`** — "Merge pull request #293 … `claude/gallant-ramanujan-vzw1zd`" |
| `WP-COM-06a` merge `c064f43659d87922d14bb4a245d94a5dfe8d918d` present | **Yes** — it *is* the `origin/main` head (`git merge-base --is-ancestor` passes) |
| Working branch | `claude/kind-franklin-hg8iey`, reset to `origin/main` (zero commits ahead at entry) |
| Programme documents read | Master Workflow §17; `CDR-001`; documentation changes log (Entries 262–280); `IMPLEMENTATION_CHANGES.md`; `FD-COM-001` evidence; `11THONUS-EXP-REF-001` (incl. §19); `11THONUS-COMMERCIAL-DESIGN-001`; `WP-COM-06a` report + runbook; Founder Development Workflow Alignment; UI RECON/HANDOFF design documents |
| Authoritative Experience Reference identified | **Yes** (§2) — no STOP condition |

**Assessment strategy (declared before any repository change).** Evidence-first and read-only: (1) verify the entry state; (2) read the frozen Experience Reference at its adopted SHA, in a separate read-only clone outside the repository; (3) inventory `apps/web/src` by role and route; (4) inventory `functions/src/index.ts` callables, read models and domain services (a capability counts only if a callable/read exists — services alone are not treated as available to the product); (5) read tooling (emulators, Postgres, Playwright, seeds, Vite modes); (6) compare, design, and write this single report plus the two change-tracking entries. Nothing was run that mutates state; no services were started. Claims drawn from reading code or third-party SDK behaviour rather than from running it are labelled **UNVERIFIED** and become spike items.

## 2. Experience Reference identity

| Item | Value |
|---|---|
| Repository | `Fkenogo/11thonus-prototype` |
| **Authoritative frozen reference** | **`18e8d700f505beefe46d324f6ea33f20a670abe7`** — merge of PR #2 `feat/redemption-experience-reference-pass1` |
| Verified at assessment | `origin/main` of the prototype repository **is** `18e8d700…` (HEAD verified; last repository push 2026-09-29; no later commit exists) |
| Where recorded as adopted | `11THONUS-EXP-REF-001` §1 (adopted SHA); change-log Entries 266–268, 271–272, 280 ("Experience Reference UNCHANGED / FROZEN"); `FD-COM-001` evidence §11 |
| Reference scope | Experience *architecture* (journeys, composition, copy, hierarchy). **Not** commercial pricing semantics; **not** authority |
| Honest-labelling | The reference marks its own non-authority areas (`OperatorSubRole`, `OnboardingState`, `CommercialStanding`, `participantSeesConfirmer`, scenario helpers, `ScriptedDemoModal`); those are treated as PROTOTYPE-ONLY |
| Handling in this task | Cloned read-only to `/home/user/fkenogo/11thonus-prototype` (outside the repo working tree). **Not modified.** |

**Currency caveat.** `EXP-REF-001` (2026-09-29) pre-dates the Commercial implementation (`WP-COM-01…06a`), `DEC-SUB-014`'s read-model design (FD-A…FD-D), and the `pending_admission` Purchase state. The reference has not been updated since. Where those moved Product Truth, the reference is **outdated** in specific, listed places (§8) — flagged, not corrected.

---

## 3. Current UI inventory (by role)

**Classification:** **A** implemented & bound to real Product Truth · **B** implemented but incomplete · **C** placeholder / technical UI · **D** prototype/reference only · **E** backend capability exists, no experience · **F** not yet authorised by Product Truth.

Evidence: `apps/web/src/App.tsx` route table (289 source files; no route exists beyond those listed). Backend capability is counted only where a callable is exported in `functions/src/index.ts`.

### 3.1 Shared / authentication (all roles)

| Surface | Route | Class | Notes |
|---|---|---|---|
| Entry resolver + real sign-in (`SignInPage`/`SignInPanel`: Google, Email/Password, Phone OTP) | `/` | **A** | Providers are **off by default**; exact-`"true"` build flags. Local preview needs `VITE_AUTH_ENABLE_EMAIL_PASSWORD=true`. Routing: ≥1 accessible Business → `/business`; none → `/customer`. |
| Business/role/“Personal” resolver | `/business` | **A** | A person can hold personal + several Business identities. This is the production-correct "role switcher". |
| Display-name profile | `/profile` | **A** | |
| MFA (TOTP) enrollment | `/auth/mfa/enroll` | **A** | Admin TOTP enrollment exists; **no Operator landing/shell** follows it. |
| Staff invitation acceptance | `/invitations/:ref/accept` | **A** | Owner copies a link (`window.location.origin` + path). No delivery channel (notification intents have no delivery). |
| Dev harnesses (phone-auth, sign-in-preview, dashboard-harness, founder-qa sign-in) | `/dev/*` | **C** (dev only) | Build-excluded by literal `import.meta.env.DEV` / mode gates. The Founder-QA gate is hard-bound to the **hosted** project `eleventh-on-us-dev` — it is **not** a local preview mechanism. |

### 3.2 Business Owner / Manager

| Surface | Route | Class | Notes |
|---|---|---|---|
| Onboarding EST-01/02 (identity, main location → `createBusiness`) | `/business/new` | **A** | Needs Commerce Knowledge seed for category dropdown. |
| Establishment review EST-03 → "Finish setup" | `/business/:id` | **A/B** | Onboarding **stops at establishment**; no first-programme step, no team step (relocated to Dashboard, `EstablishmentReviewPage.tsx:6–8`). |
| Submitted-for-verification state | wizard / Terms page | **A** | |
| Dashboard shell (hamburger menu mobile / sidebar desktop; 8 nav items) | `/business/:id/dashboard/*` | **B** | Role-agnostic nav (nav ≠ authorisation); **no bottom navigation by prior Founder instruction** (RECON-001 §XV) — see D-2. |
| Dashboard Home (`DashboardHome`, 84 lines) | `…/dashboard` | **B** | Business identity + Terms readiness + 4 links. **No** programme status, reward-ready, attention, activity, or Commercial standing. |
| Business profile; Locations | `…/profile`, `…/locations` | **A** | |
| Team (`TeamManagementPage`, 604 lines): invite/revoke, suspend/reactivate/remove, change role | `…/team` | **A** | Reuse as-is (EXP-REF-001 disposition). No UI for the `redemption.confirm` grant. |
| Business Terms / Submit for verification | `…/terms` | **B** | **Cannot be completed in the UI**: `TERMS_READABLE_CONTENT_AVAILABLE = false` (hard-pinned; `DEC-LEGAL-002` open). The Owner cannot accept Terms or submit, so cannot reach `pending_verification` through the UI. |
| Reward Program management + Qualifying Items (`RewardProgramManagementPage`, 774 lines) | `…/reward-programs` | **A** | Bound to PB-013A–E. **`PB-013B P3-3` (publish TOCTOU boundary) OPEN** — see D-6. Two desktop-leaning rows noted by EXP-REF-001 (`:663`, `:745`). |
| Purchase Records (`PurchaseRecordsPage`, 297 lines): record, list+status filter, timeline | `…/purchases` | **B/C** | Works against real callables, but it is the *technical recording form* (7 fields, typed Loyalty Number/QR reference) — not a counter experience. Includes `pending_admission` filter. |
| Customer Rewards & Cycle progress (Owner/Manager only) | `…/customer-rewards` | **A** | Real `listAvailableRewardsForBusiness` + `listLoyaltyCycleProgressForBusiness`. **No redeem action.** |
| Manager-specific home / Approvals / Reports / Commercial & Usage | — | **D** (prototype) / **E** for Commercial | Not in production. Commercial has backend services but **no Business read adapter or permission** (design WP-COM-08). |

### 3.3 Frontline Staff

| Surface | Class | Notes |
|---|---|---|
| Staff access (invite → accept → membership; `/business` resolver) | **A** | |
| Counter / scan / record experience | **C** | Staff land in the same Dashboard shell; the only recording surface is `PurchaseRecordsPage` (desktop-shaped). No QR scan (camera) exists in the web app; reference is typed. |
| Customer identification at the counter | **B/E** | `recordPurchase` accepts **one** presented artifact (Loyalty Number or QR reference). No staff-facing lookup, no QR scanner component. |
| Circle progress / reward-ready at the counter | **E (partial) / F-gap** | Business-wide visibility is **Owner/Manager only** by design (`authorizeBusinessLoyaltyVisibilityRead`). `PRD01 §8.2` allows Staff "limited customer progress needed to complete the transaction" — **authorised in principle, no read exists**. |
| Reward redemption (confirm sheet) | **E** | `confirmRedemption` callable is complete (migration `0020`); **zero web code** calls it; no confirmer-eligibility read; no Staff-grant callable. |

### 3.4 Customer

| Surface | Route | Class | Notes |
|---|---|---|---|
| Customer shell (hamburger/sidebar; 5 destinations) | `/customer/*` | **B** | Customer area uses hamburger/sidebar, **not** the bottom bar of the handoff/prototype. |
| Home — loyalty number + QR | `/customer` | **B/C** | Renders "not yet issued". **Backend issues both at registration/sign-in** (`ensureCustomerIdentityArtifacts` in `registrationSignInService`/`identityRecoveryService`) — but **no read callable exists**, so the UI cannot show them. |
| Activity — "Waiting for you": verify / reject / dispute (handles `held` outcome) | `/customer/activity` | **A** | The product's core trust step (customer-verified loyalty). |
| Rewards — available rewards list | `/customer/rewards` | **A (minimal)** | Description only; no Circle visual; no progress. |
| Scan | `/customer/scan` | **C** | "Not yet available" stub (and the design principle forbids a scan-a-business affordance). |
| Account | `/customer/account` | **C** | Stub. |
| Circle progress ("n of 10") | — | **Gap (neither)** | **No customer-scoped progress read exists.** Authority: `PRD04` ("Customers should always understand how progress is determined"; progress exists only after verification). Founder confirmation requested (D-14). |

### 3.5 Platform Operator / Administrator

| Surface | Class | Notes |
|---|---|---|
| Operator Console (any screen, route, directory) | **D (prototype) / E** | **None exists in `apps/web`.** |
| Admin discovery + MFA enrollment (`discoverPlatformAdministrator`, `/auth/mfa/enroll`) | **A** | The only operator-adjacent UI. |
| Business activation (`activateBusinessAfterVerification`) | **E** | Callable exists (Platform Administrator + verified MFA + ≤5-minute fresh auth); **no UI**. |
| Commercial commands (open account, grant/adjust trial, credit, settlement lifecycle, activate paid, restrict/restore, price schedule) | **E (service only)** | Implemented as in-process services in `domains/commercial/services/`. **No callable, no endpoint** (`WP-COM-06a` report R-1). |
| Commercial standing / history / audit reads; cross-Business reads; held-Purchase list | **Gap** | No read model (design WP-COM-06). Platform-admin audit is **write-only**. Processor state exists as a Firestore document `heldPurchaseProcessorState/latest`. |
| Knowledge Studio administration | **E** | Platform-admin knowledge permissions exist; only `discoverPlatformAdministrator` is exposed as a callable. Out of scope for Slice 1. |

---

## 4. Business Owner / Manager journey — readiness

| # | Step | Backend capability / read model (callable) | UI today | Readiness / missing seam |
|---|---|---|---|---|
| 1 | Authentication | `authenticate`, `linkAuthenticationProvider`, `recoverAuthenticatedIdentity`; Firebase Auth | `/` sign-in (A) | **Ready** (Email/Password flag locally). |
| 2 | Onboarding / Business setup | `createBusiness`, `updateBusinessProfile`, `updateBusinessBranchProfile`, `getOwnedBusinesses`, `getBusinessContext`, `listBusinessCategories`/`…TypesForCategory` | EST-01/02/03 (A) | **Ready**; needs Commerce Knowledge seed (existing `seedCommerceKnowledge.mjs`). |
| 3 | Terms → submit → activation | `acceptBusinessTerms`, `submitBusinessForVerification`, `activateBusinessAfterVerification` (admin+MFA+fresh) | Terms page blocked (`TERMS_READABLE_CONTENT_AVAILABLE=false`) | **Seam.** UI cannot reach `pending_verification`. Preview must either drive these via real callables in the seed or Founder authorises a preview-only UI path (D-5). Note purchases/programme actions do not themselves check Business `status` (only active membership). |
| 4 | Programme creation / configuration | `createRewardProgram`, `updateRewardProgramDraft`, `publishRewardProgramVersion`, `createNextRewardProgramVersion`, `getRewardProgram`, `listRewardPrograms`, `createQualifyingItem`/`update`/`retire`/`listQualifyingItems`, knowledge label/search reads | `RewardProgramManagementPage` (A, mobile polish needed) | **Ready**, with D-6 (`PB-013B P3-3` open) and **no onboarding-time "first programme" step** (reference wizard step 2). |
| 5 | Team / frontline setup | `createStaffInvitation`, `listStaffInvitations`, `revokeStaffInvitation`, `acceptStaffInvitation`, `listStaffMemberships`, suspend/reactivate/remove/`changeStaffMembershipRole` | `TeamManagementPage` (A) | **Ready.** Invite link is copied manually. No callable to set `redemption.confirm` overrides (Owner/Manager hold it by default). |
| 6 | Business dashboard (Command Centre) | Only `getBusinessContext` + individual lists. **No aggregate/summary read.** | `DashboardHome` (B) | **Assembly + small read seam.** Composable client-side from `listRewardPrograms`, `listPurchasesForBusiness`, `listLoyaltyCycleProgressForBusiness`, `listAvailableRewardsForBusiness`; a summary read is optional (no new truth). |
| 7 | Programme status | `listRewardPrograms` (status/version) | In programme page | **Ready** (surface on Home). |
| 8 | Customer / Circle activity | `listLoyaltyCycleProgressForBusiness` (`state`, `unitsToReward`, `reward`), `listPurchasesForBusiness`, `getBusinessPurchaseRecord` | `CustomerRewardsProgressPage`, `PurchaseRecordsPage` | **Ready** (no CRM — correct: Businesses own relationships). |
| 9 | Reward activity | `listAvailableRewardsForBusiness` | rewards list | **Partial.** **No redemption history/attribution read** (`redemptions` table is write-only); no redeem action. |
| 10 | Attention states | Purchase statuses incl. `pending_admission`, `under_review`, `waiting_for_customer`; Commercial standing exists in DB | status filter only | **Seam.** No consolidated "needs attention" read; **Business Commercial standing read adapter + `commercial.view*` permissions not built** (design WP-COM-08; FD-D: Owner full / Manager standing / Staff none). |

**Business journey verdict: PARTIALLY READY.** Steps 1, 2, 4, 5, 7, 8 are assembly-only. Steps 3, 6, 9, 10 need decisions or small seams.

## 5. Frontline journey — readiness

| # | Step | Implemented Product Truth / capability | Gap |
|---|---|---|---|
| 1 | Staff authentication / access | Invitation + membership + resolver (A); `purchase.record` granted to Staff/Manager/Owner | None. |
| 2 | Customer identification | `recordPurchase` resolves **one** presented Loyalty Number *or* QR reference server-side; `qrIdentity`/`loyaltyNumber` domains; `sharedLoyaltyNumberAllowed` program rule | **No QR scanner, no staff lookup UI; and the customer cannot display their own number** (no read callable) — a Founder-visible blocker for a realistic counter demo. Preview workaround: seeded/known numbers; real fix is the customer-identity read (§10). |
| 3 | Record qualifying transaction | `recordPurchase` (19-step contract; Business-owned `qualifyingItemId`; quantity rule; `waiting_for_customer`) | Mobile counter surface absent; form is desktop-shaped. **Unauthorised in reference:** "quick-add customer". |
| 4 | Circle progress | Progress updates **only after customer `verifyPurchase`** (`PRD00` (line 546)); statuses visible via `listPurchasesForBusiness` (any active membership incl. Staff) | Staff cannot read Circle position (Owner/Manager-only); `PRD01 §8.2` limited staff-progress read is **authorised in principle, not built**. |
| 5 | Reward recognition | `rewards` rows (`available`); `listAvailableRewardsForBusiness` (Owner/Manager) | No staff-scoped "reward available for the customer in front of me" read. |
| 6 | Reward redemption | `confirmRedemption({businessId, rewardId, idempotencyKey})` → `{reward, redemption, completedLoyaltyCycleId, nextLoyaltyCycleId, unitsAllocatedForward, nextReward}`; permission `redemption.confirm` (Owner floor; Manager default; Staff only by explicit grant); no customer tap/PIN | No web adapter; no eligibility signal; no redemption history read; no callable to grant Staff authority; privacy question (`participantSeesConfirmer`) unresolved. |
| 7 | Success / error / attention states | Error taxonomy (`AUTH_FORBIDDEN`, `INVALID_STATE_TRANSITION`, indistinguishable `RESOURCE_NOT_FOUND`); `held` verify outcome; `pending_admission` | UI copy/states absent for the counter. |

**Frontline journey verdict: NOT READY — needs assembly plus two backend seams** (customer identity display; staff-scoped limited progress/reward read), plus the redemption adapter.

## 6. Customer journey — what can be previewed now

Governing principle: **11thONUS standardises trust around loyalty recognition; Businesses remain responsible for their customer relationships.** No CRM, messaging, segmentation, notes or campaign functionality is proposed.

Authorised customer experience (Product Truth): identity (Loyalty Number + QR as a lookup — *not* a voucher), **verifying/rejecting/disputing a recorded purchase**, seeing available Rewards, understanding progress, and being recognised (redemption with no customer tap/PIN/code).

| Customer moment | Previewable today? | Needed |
|---|---|---|
| Register / sign in → identity artifacts auto-issued | Yes (backend) | UI cannot show them. |
| Present identity at counter | **No** | Customer identity read callable + Home UI (number + QR). |
| "Waiting for you" → verify | **Yes** | Polish. |
| Held purchase after verify (`held` outcome / `pending_admission`) | Yes (handled in code) | Wording governed at assembly by the Experience Reference (design CORR-001 withdrew illustrative sentences). Only occurs with the gate enforced. |
| Circle progress ("4 of 10") | **No** | Customer-scoped progress read + Circle visual. |
| Reward available | Yes (minimal) | Reward visual; code/QR presentation. |
| Post-redemption "next Circle begins now" | **No** | Redemption binding; customer read of next-cycle state. |

**Customer journey verdict: PARTIALLY READY.** A meaningful but incomplete preview exists (verify + rewards); the *recognisable loyalty experience* (see my number, see my Circle) needs two backend reads and one visual.

## 7. Operator Console readiness

**Findings.** `apps/web` contains no Operator Console. The Commercial domain (`WP-COM-01…06a`) is complete as **services**; the only operator-reachable callable is `activateBusinessAfterVerification`. Authority: Platform Administrator = active `platformAdministrators/{uid}` record **+ verified second factor** (`deriveVerifiedMfaSatisfied(credential)`; ID-token `sign_in_second_factor` claim) **+ ≤5-minute fresh authentication** for privileged actions. The Founder is the sole administrator at launch; **`DEC-GOV-007` (administrator RBAC) remains OPEN — no Operator roles may be invented** (the reference's `OperatorSubRole` is inert typing).

The consumption projection (debit when a Reward becomes available) has **no runtime caller**: a search of `functions/src` outside `domains/commercial/` and tests finds only the earmark resolver in `composition/commercialAdmissionBinding.ts`; nothing triggers `projectCommercialConsumption`/`reconcileCommercialConsumption` after a verify or on a schedule (scheduling is deployment-readiness work, design WP-COM-09/10). Account opening is also not tied to Business activation.

### 7.1 Operator capability classification

**A** required for MVP operations · **B** useful for Founder Preview · **C** internal infrastructure only · **D** deferred / not authorised. "Slice 1" marks the minimum coherent console (§7.2).

| # | Candidate capability | Exists today | Class | Slice 1 | Notes |
|---|---|---|---|---|---|
| 1 | Businesses list + onboarding queue (pending verification) | none (cross-tenant read missing) | **A** | **Yes** | Already-authorised responsibility (TRD18 §18.5.2; EXP-REF-001 §19.4-A). |
| 2 | Activate Business (`pending_verification → trial`) | callable ✔ | **A** | **Yes** | Only action with an endpoint today. |
| 3 | Business detail (status, owner, team size, programmes, Commercial summary) | none | **B** | **Yes (read-only)** | "Business 360°" minimal. |
| 4 | Commercial account state: trial/paid capacity, credit (may be negative), reserved, usable capacity, standing | account row exists (service) | **A** | **Yes (read-only)** | Needs read model (design WP-COM-06). |
| 5 | Open Commercial account | service ✔ | **A** | **Yes** | Not auto-created on activation. |
| 6 | Grant / adjust trial (3–5 per grant; explicit, auditable) | service ✔ | **A** | **Yes (grant)** | Adjust → Slice 2. No default value; show 3–5 range. |
| 7 | Record + confirm manual settlement (offline reference) | service ✔ | **A** | **Yes** | Demonstrates capacity returning and held Purchases being admitted. |
| 8 | Cancel / void settlement | service ✔ | **A** | Slice 2 | |
| 9 | Adjust Commercial credit (incl. negative) | service ✔ | **A** | Slice 2 | Money-affecting; dual-control not governed (SoD specifics open). |
| 10 | Activate paid service | service ✔ | **A** | Slice 2 | Not an admission trigger. |
| 11 | Restrict / restore new Circle starts | service ✔ | **A** | Slice 2 | |
| 12 | Price schedule (BIF/RWF, USD 2 equivalent, effective-dated) | service ✔ | **A** | No (seeded) | Launch input L-1 still open. |
| 13 | Held Purchases / pending-admission list per Business | DB rows + `heldPurchaseProcessorState/latest` | **A** (when gate enforced) / **B** (preview) | **Yes (read-only panel)** | Only populated with gate `enforce` (D-7). |
| 14 | Processor / backlog status summary | Firestore state doc + log metrics | **B** (summary) / **C** (raw metrics, Cloud Monitoring) | Summary only | Raw metrics are infrastructure. |
| 15 | Programme / platform activity (counts of Businesses, purchases, verified units, rewards) | none | **B** | No (Slice 2) | PRD10 reporting; needs aggregate read. |
| 16 | Operational exceptions (consumption failures, reconciliation lag, stuck holds) | DB failure tables, metrics | **A** (launch) | Slice 2 | Not producible in a seed without fault injection. |
| 17 | Audit / provenance viewer (Commercial audit; lifecycle events) | **write-only** | **A** (all manual acts are audited) | **Yes (read tail per Business)** | Platform-admin audit read model absent; audit reads should themselves be audited. |
| 18 | Support cases | none | **D** (authorised responsibility, no model) | No | |
| 19 | Integrity cases | `trust_events` substrate only | **D** | No | "Must not infer guilt from signals alone." |
| 20 | Market / currency configuration | taxonomy only | **D** | No | Launch scope fixed (Burundi, Rwanda); only local-currency derivation mechanics remain (commercial design). |
| 21 | Differentiated operator roles / separation of duty | none | **D** | No | `DEC-GOV-007` OPEN. |
| 22 | Loyalty-state intervention (edit Circles, override Rewards, reverse redemption) | none | **D — not authorised** | No | Reversal excluded by `DEC-LOY-018`; the Operator must not mutate loyalty state. |
| 23 | Payment-provider integration | none | **D** | No | |
| 24 | Knowledge Studio administration | knowledge permissions only | **D** (separate programme) | No | |
| 25 | Raw DB / emulator / Cloud consoles | n/a | **C** | No | Internal tooling; never an Operator surface. |

### 7.2 Minimum coherent Operator Console for Founder Preview Slice 1

Desktop-first (responsive down to tablet), single "Platform Administrator" identity (no sub-roles):

1. **Operations** — attention queue: Businesses awaiting verification; Businesses with held Purchases; low-capacity/negative-credit accounts.
2. **Businesses** — list; **Business detail** with a **Commercial** tab.
3. **Actions (Slice 1 only):** *Activate Business*; *Open Commercial account*; *Grant trial*; *Record settlement → Confirm settlement*.
4. **Read-only:** Commercial standing/capacity/ledger tail, held Purchases, audit tail for that Business.

Everything else in §7.1 is Slice 2 or deferred. **Genuine backend prerequisites** (not UI): (a) an Operator endpoint wrapper that applies the existing admin+MFA+fresh-auth gate to the existing Commercial commands (`WP-COM-06a` R-1); (b) cross-Business list/detail read; (c) Commercial standing/history read models; (d) audit read; (e) held-Purchase read; (f) a consumption trigger (so completing a Circle visibly debits). These belong to the Commercial track (§22), not the UI.

---

## 8. Prototype → implementation mapping

For each reference journey: Product Truth (PT) · backend (BE) · current UI · UI matches reference · can assemble now · **reference outdated**?

| # | Reference journey/screen (`11thonus-prototype@18e8d700`) | PT now | BE now | Current UI | Matches ref | Assemble now | Outdated / discrepancy |
|---|---|---|---|---|---|---|---|
| R1 | Role switcher / TopBar with 5 personas | n/a (prototype tooling) | real auth + `/business` resolver | resolver | No (by design) | Replace with Preview Launcher (§15) | PROTOTYPE-ONLY |
| R2 | Business onboarding wizard (4 steps) | Yes (establishment) | Yes | EST-01/02/03 | Partial | **Yes** up to establishment | First-programme step absent; Terms blocked (D-5) |
| R3 | First-programme wizard | Yes | Yes | programme page | No | Yes (publish gated by D-6) | — |
| R4 | Programme configuration (8 tabs) | Yes | Yes | programme page | Partial | Yes | Rules differ: reference has `maxUnitsPerTx`, `requireApprovalAbove`, `allowBackdated`, `customerConfirmation`; Product Truth has `multipleUnitsAllowed`, `sharedLoyaltyNumberAllowed`, review-visibility `bulk_review_threshold` (never a hard cap — "no cap invented"). **Flag.** |
| R5 | Owner "Command Centre" | Partly | reads exist | Home (B) | No | Yes (composition) | Commercial widgets need WP-COM-08 reads |
| R6 | Manager dashboard (approvals-led) | **Not authorised** | none | none | No | **No** | **Discrepancy D-3**: no Manager approval workflow exists in Product Truth |
| R7 | Customers tab | Yes (as visibility, no CRM) | Yes | Customer Rewards page | Partial | Yes | — |
| R8 | **Approvals** queue (staff entries awaiting manager approval) | **No** | none | none | n/a | No | **Discrepancy D-3.** Closest real concept: customer-raised `under_review` disputes; Business-side resolution controls are explicitly deferred (006A). |
| R9 | Team & frontline | Yes | Yes | Team page | Yes | Yes | — |
| R10 | Reports & analytics | PRD09 (future) | none | none | n/a | No | Deferred |
| R11 | Commercial & Usage (Owner) | Yes (DEC-SUB-014) | services only | none | n/a | **Not for Slice 1** | **Values superseded:** `$1.00` → USD 2 equivalent; 5-unit trial → 3–5 range; `unitAmountUSD`, `commercialStanding` unions PROTOTYPE-ONLY |
| R12 | Staff counter: scan / search / record / confirm | Yes (record), partial | `recordPurchase` | desktop form | No | Assembly + seams | **Quick-add customer unauthorised** (D-4); QR scan simulated |
| R13 | **Instant Circle progress on record** (`customerConfirmation: false` default) | **Contradicted** | verify required | n/a | n/a | n/a | **Material discrepancy D-1**: "No recorded purchase contributes to customer progress until the customer verifies it" (`PRD00`); production *always* creates `waiting_for_customer`. |
| R14 | Reward-ready / Loyalty Circle visual | Yes | Business read ✔; customer read ✗ | none | No | Yes (Business side) | — |
| R15 | Redemption confirm sheet ("This one's on us.") | Yes (`DEC-LOY-018`) | engine ✔ | none | No | After adapter | `participantSeesConfirmer` is an open privacy decision (D-8) |
| R16 | Post-redemption continuity ("next 10 starts now") | Yes | engine returns `nextLoyaltyCycleId`/`nextReward` | none | No | After adapter | — |
| R17 | Participant home / Circles / Activity / Profile (bottom nav) | Partly | partial | customer shell | Partial | Partial | **Discrepancy D-2** (bottom nav vs hamburger) |
| R18 | Participant code presentation | Yes (DEC-ID-002) | issued ✔; read ✗ | "not yet issued" | No | After read | — |
| R19 | Operator Console (7 sections) | Partly (§7) | partial | none | n/a | Slice 1 subset | Sections Support/Integrity/Platform(markets) **not authorised/deferred** |
| R20 | Business 360°, manual activation, credit adjustment | Authorised (DEC-SUB-014 §8) | services only | none | n/a | After transport | Prototype 5-unit/credit values illustrative |
| R21 | Scripted demo tour, scenarios A–F, phone-frame chrome | n/a | n/a | n/a | n/a | **Replaced by seed scenarios + real device** | PROTOTYPE-ONLY |
| R22 | Language | EN primary | EN+FR **at key parity** (453/453 per EXP-REF-001 §13; test-enforced) | i18n | n/a | Yes | New keys must be added to both locales or the parity test fails |

**The reference has not been silently changed and is not changed here.** Deviations are collected in the Open Decisions (§24); the recommended handling is a **recorded deviation register** rather than reopening the frozen reference.

---

## 9. Missing experience seams (UI/assembly)

1. Mobile **counter surface** (identify → record → status) for Staff.
2. **Redemption confirm sheet** + success state, bound to `confirmRedemption`.
3. **Command Centre** home (reward-ready first, programme status, attention).
4. **Customer Home** identity (number + QR) and **Circle visual** + progress.
5. **Operator Console** shell and Slice 1 screens (desktop-first).
6. Business **Commercial standing notice** (Owner full / Manager standing / Staff none) — after WP-COM-08; not Slice 1.
7. Onboarding **first-programme step** and combined "ready" state (after D-5/D-6).
8. Bottom-nav/drawer primitives (only if D-2 is decided that way); real-route responsive coverage (customer area has none; only one production-route responsive assertion exists at 390×844).
9. **Preview Launcher** (dev-only quick sign-in as seeded real accounts).
10. Customer-facing wording for `pending_admission` / `held` (governed by the reference at assembly).

## 10. Missing backend seams

| # | Seam | Why needed | Authority |
|---|---|---|---|
| B1 | `getMyLoyaltyIdentity` (customer reads own Loyalty Number + current QR reference) | Customer Home; counter demo | `DEC-ID-002`; artifacts already issued |
| B2 | Customer-scoped Circle progress read (own data only) | Customer Circle visual | PRD04/06 (confirm D-14) |
| B3 | Staff-scoped "customer at counter" read (limited progress + available Reward for the presented artifact) | Frontline recognition/redemption | `PRD01 §8.2` (authorised in principle) |
| B4 | Redemption web adapter prerequisites: confirmer-eligibility signal; redemption history/attribution read | Redemption UI; Owner reward activity | `DEC-LOY-018`; EXP-REF-001 §9.2 |
| B5 | Callable to grant/revoke `redemption.confirm` for Staff | Staff-delegated redemption | `DEC-LOY-018` (Slice 1 avoids: Owner/Manager confirm) |
| B6 | Operator endpoint wrapper for the Commercial commands | Operator actions | `DEC-SUB-014` §8; R-1 |
| B7 | Cross-Business Business list/detail read | Operator Businesses | TRD18 §18.5.2 (confirm D-10) |
| B8 | Commercial standing / history read models; Business read adapters + `commercial.view*` permissions | Operator Commercial tab; Business notice | design WP-COM-06/08 |
| B9 | Audit read model (Commercial + lifecycle) | Operator audit tail | TRD18 §18.49 |
| B10 | Held-Purchase list read + processor-state read | Operator attention | `WP-COM-06a` runbook §6 |
| B11 | Consumption trigger (scheduled/after-verify invocation of the projection) | Credit debits when a Circle completes | design §5.4 (WP-COM-09/10) |
| B12 | Local **migration runner script** (only `migrateUp` function exists; no CLI/script) | Local runtime | repo convention |
| B13 | Optional Business dashboard summary read | Command Centre convenience | none (composition) |

---

## 11. Temporary Founder Preview seed-data proposal

Principle: **prefer real write paths**; never create impossible domain states; no production code coupled to fixtures. Write-path classes: **R** = real callable via the Functions emulator (token from the Auth emulator); **S** = real domain service invoked in-process by the seed tool (the same code the callable would run — used where no callable exists); **F** = direct fixture insert (**none proposed**); **X** = not producible without fault injection (excluded).

### 11.1 People (stable, obviously-fake identities)

All accounts: `…@preview.example.test`, one shared **preview-only** password documented in the preview README (never a real credential; emulator-only). Deterministic idempotency keys `preview:<scenario>:<step>` make re-runs safe.

| Person | Role / use |
|---|---|
| Grace N. | Owner — Bella Salon; also a Customer elsewhere (tests the Personal + Business resolver) |
| Patrick M. | Manager — Bella Salon |
| Diane K. | Staff (counter) — Bella Salon; second membership at Sparkle Car Wash |
| Jeanne U. | Owner — Sparkle Car Wash (Kigali, RWF) |
| Olivier B. | Owner — Mutima Mini-Mart (low capacity) |
| Claudine H. | Owner — Tembo Fitness (negative credit / held) |
| Eric S. | Owner — Ubuntu Books (awaiting verification) |
| **New Owner** | Registered, **no Business** — for the live onboarding demo (Kigwena Kitchen) |
| Amina, Jean-Claude, Esther, Kevin, Aline, Moses, Chantal, Yves | Customers at different Circle positions (below) |
| **Founder (Platform Administrator)** | `platformAdministrators` record via the existing `bootstrapPlatformAdministrator` service; MFA per §15 |

### 11.2 Businesses and states

| Business (category, market) | Commercial state | Loyalty state to produce | Write path | Class |
|---|---|---|---|---|
| **Bella Salon** (beauty, BI/BIF) — Owner, Manager, Staff, 2 programmes (one published, one draft) | Trial, **4** units granted (not the prototype's 5; shows "3–5, no default"), 1 consumed | Amina 3/10; Jean-Claude 7/10; Esther 9/10 (one record away from a Reward — live Founder demo); Kevin **Reward available**; Aline completed + **redeemed** | `createBusiness`+profile; invitations; `createRewardProgram`/`createQualifyingItem`/`publish…`; `recordPurchase` (staff token) → `verifyPurchase` (customer token) ×N; `confirmRedemption` (Owner token). Commercial: `openCommercialAccount`, `grantTrial` | R + S |
| **Sparkle Car Wash** (automotive services, RW/RWF) | **Paid active**, healthy credit; one settlement `recorded → confirmed` | Several customers mid-Circle; one completed Circle | as above; `recordSettlement`, `confirmSettlement`, `activatePaidService` | R + S |
| **Mutima Mini-Mart** (retail, BI) | Trial 3 granted, 2 consumed → **low capacity** (1 left) | Customers near completion | as above; consumption via `reconcileCommercialConsumption` | R + S |
| **Tembo Fitness** (health & fitness, RW) | Paid, **negative credit** (e.g. −2), **restricted new starts** | Customers with purchases **held `pending_admission`** | `adjustCommercialCredit`, `restrictNewStarts`; **requires gate `enforce` in the local runtime only** (D-7) | S (+ env) |
| **Ubuntu Books** (retail, BI) | No Commercial account yet | Submitted, **awaiting verification** | `acceptBusinessTerms` (test-only Terms fixture) + `submitBusinessForVerification` (R) | R |
| **Kigwena Kitchen** (food & beverage, BI) | — | **Created live by the Founder** during the onboarding demo | n/a | live |
| Settlement lifecycle examples | `recorded` (awaiting confirm), `confirmed`, `cancelled`, `voided` | — | `recordSettlement`, `confirmSettlement`, `cancelSettlement`, `voidSettlement` | S |
| Dispute example | — | One purchase `under_review` (customer dispute) | `raisePurchaseDispute` | R |
| Waiting example | — | Moses has a `waiting_for_customer` purchase (live verify demo) | `recordPurchase` | R |

**Not seeded (X):** consumption-failure rows, stuck-processor/lag conditions, reconciliation mismatches. These require fault injection and are not "impossible states" the seed should fabricate. The Operator attention queue is demonstrated with the producible cases above.

**Known limitation.** Server timestamps (`created_at`, verification time) reflect the seed run; only the commercial `purchaseDate` can be back-dated. Activity "history" is therefore a recent burst, not a long timeline. Acceptable for a Founder Preview; an injectable clock would be a later production-code change and is **not** proposed.

### 11.3 Seed/reset architecture

- **Where:** `tests/preview/` (new, test-tooling tree — same convention as `tests/e2e/emulator/seed*.mjs`, which already `require`s compiled `functions/lib`). **No production code imports it.** The scenario builder uses (a) HTTP calls to the Functions emulator with Auth-emulator tokens and (b) in-process service calls from compiled `functions/lib` for the Commercial services — mirroring existing practice.
- **Layers:** `scenarios/*.ts` (declarative: people, businesses, steps) → `runner` (executes steps, writes `.preview/state.json` mapping stable keys → generated IDs) → CLI.
- **Guards (copy the existing fail-loud pattern from `seedTestOnlyTermsFixture.mjs`):** refuse unless `FIRESTORE_EMULATOR_HOST` and `FIREBASE_AUTH_EMULATOR_HOST` are loopback, project is exactly `demo-11thonus`, and `PLATFORM_ENV` is `local`; refuse any non-loopback Postgres host.
- **Determinism:** stable emails/passwords, deterministic idempotency keys, stable ordering; entity IDs are server-generated and recorded in `state.json`. (UNVERIFIED: whether the Auth emulator accepts a caller-supplied `localId` to also fix UIDs — spike.)
- **Reset:** wipe emulator state (restart without import), `DROP SCHEMA public CASCADE` + re-run migrations on the **local** database `eleventhonus_platform_local` (kept separate from `_test`), re-seed knowledge + terms fixture + scenario.
- **Recommended commands (not implemented):**

| Command | Action |
|---|---|
| `pnpm preview:start` | Orchestrated startup (§14) |
| `pnpm preview:stop` | Stop web/emulators, `docker compose … down` (no `-v`) |
| `pnpm preview:reset [--scenario <name>]` | Guarded wipe → migrate → seed |
| `pnpm preview:seed [--scenario <name>]` | Idempotent (re-)seed |
| `pnpm preview:status` | Ports, migration level, scenario, accounts |
| `pnpm db:migrate:local` | The missing migration CLI (B12) |

Scenario names: `founder-slice-1` (the §11.2 set), plus small journey scenarios for tests (§12).

## 12. Functional preview + automated journey-test model

One scenario catalogue serves **Founder exploration** and **repeatable tests**:

| Layer | Use of the scenarios |
|---|---|
| Postgres integration tests (`*.postgres.test.ts`) | Existing suites keep their own fixtures; the scenario *builder* may be reused for multi-step journeys, with `PLATFORM_ENV=test` and the `_test` database. |
| Emulator integration | Journey = ordered callable calls (record → verify → progress → reward → redeem) asserting read models. |
| **Playwright** | New project `chromium-preview` (+ mobile device projects ~390×844 for Business/Frontline/Customer; desktop for Operator). `globalSetup` runs `preview:reset --scenario <small-scenario>`; specs sign in as seeded real accounts through the real UI. Reuse `@axe-core/playwright`. |
| Regression | A nightly/CI run of the full `founder-slice-1` journey; screenshot baselines for the mobile surfaces. |

**Journeys to encode (each independently resettable):** J-B1 onboard→programme→publish; J-B2 invite staff→accept; J-F1 identify→record→(customer verifies)→progress; J-F2 9/10→10th→Reward→redeem; J-C1 waiting→verify; J-C2 held→admitted after settlement; J-O1 activate→open account→grant trial; J-O2 settlement confirm→held purchases admitted.

**Decoupling rules:** (1) scenarios live under `tests/preview/` only; (2) production code never references fixture data; (3) the Preview Launcher is a build-excluded module using the same literal-gate technique as existing `/dev/*` routes, with a structural test asserting its markers are absent from a production `dist/` (precedent: harness grep checks); (4) no feature flag in production code distinguishes preview from real data.

## 13. Authentication / role preview strategy (summary)

See §15 for detail. Principle: **every preview role is a real account signed in through real Firebase Auth (emulator); authorisation is the production authorisation.** Convenience is limited to *which account is signed in*, never to *what that account may do*.

---

## 14. Local preview architecture

```
Browser (phone or desktop)
   ↓
Vite dev server  :5173   (apps/web; VITE_USE_FIREBASE_EMULATOR=true; VITE_AUTH_ENABLE_EMAIL_PASSWORD=true)
   ↓ client SDK (hard-coded 127.0.0.1 today)
Firebase Auth emulator       :9099
Functions emulator           :5001  (callables; europe-west1; PLATFORM_ENV=local; PLATFORM_POSTGRES_URL)
Firestore emulator           :8080  (identity, business, membership, terms, admin records, processor state)
Storage emulator             :9199  (unused by Slice 1)
Emulator UI                  :4000  (Founder/dev only — never exposed remotely)
Local PostgreSQL (docker)    :54329 (db eleventhonus_platform_local; Postgres 16)
   ↑
Preview seed (tests/preview) — HTTP to emulators + in-process Commercial services
```

### 14.1 Required services and ports

| Service | Port | Source today |
|---|---|---|
| Web dev server | 5173 (Playwright uses 5183/5184/4173 for its own) | `pnpm --filter web dev` ✔ |
| Auth / Functions / Firestore / Storage / Hosting / UI emulators | 9099 / 5001 / 8080 / 9199 / 5050 / 4000 | `firebase.json` ✔ (project `demo-11thonus`) |
| PostgreSQL | 54329 | `docker-compose.postgres.yml` ✔ (`pnpm postgres:up`; creates `_local` and `_test` DBs) |

### 14.2 Startup order

1. `pnpm postgres:up` (healthchecked) → 2. **migrate local DB** (missing) → 3. `pnpm --filter functions build` → 4. emulators with Functions env (`PLATFORM_ENV=local`, `PLATFORM_POSTGRES_URL` default is already the local container; optional `PURCHASE_ADMISSION_GATE_MODE=enforce` for held scenarios; `HELD_PURCHASE_PROCESSOR_MODE=drain` optional) → 5. `seed:commerce-knowledge` (existing) and `seed:test-only-terms-fixture` (existing) → 6. preview seed → 7. web dev server with the env flags.

### 14.3 Environment variables

Web: `VITE_USE_FIREBASE_EMULATOR=true`, `VITE_AUTH_ENABLE_EMAIL_PASSWORD=true` (others unset; Google/Phone stay off). Firebase client config falls back to `demo-11thonus` automatically in emulator mode. Functions: `PLATFORM_ENV=local` (**required — fail-closed, no default**), `PLATFORM_POSTGRES_URL` (optional locally), optionally the two held-processor flags above. `.env.*` files are git-ignored (only `.env.example` is tracked), so the orchestrator should generate/inject them rather than commit them.

### 14.4 Does current tooling already support this?

| Need | Status |
|---|---|
| Emulator suite, build+start (`emulators:clean`) | ✔ |
| Local Postgres container | ✔ |
| Commerce Knowledge seed; test-only Terms seed | ✔ (existing, emulator-guarded) |
| Auth through UI against emulator (Email/Password flag) | ✔ |
| **Apply Postgres migrations locally** | ✘ (`migrateUp` exists only as a function; tests apply it) |
| **Functions-emulator ↔ Postgres wiring + env** | ✘ undocumented/uncommitted (needs `PLATFORM_ENV`) |
| **One-command orchestration, health-wait, stop** | ✘ |
| **Preview seed + reset** | ✘ |
| **Preview launcher (quick account switch)** | ✘ |
| Held-processor scheduled recovery in emulator | `onSchedule` may not fire on a timer in the emulator (UNVERIFIED) — drive the processor via `HELD_PURCHASE_PROCESSOR_MODE=drain`/the signal trigger instead |

**Recommended Founder command (feasible):** `pnpm preview:start` (idempotent: brings up Postgres, migrates, builds functions, starts emulators, seeds knowledge/terms/scenario if empty, starts the web server, waits for health, prints the URLs and the account list) and `pnpm preview:reset`. A thin Node orchestrator (no new runtime dependency) is sufficient.

**Docker availability.** Docker is the dependency the Founder's machine must have (already assumed by `pnpm postgres:up`). Firebase CLI and Node ≥20 are already repo requirements.

---

## 15. Authentication / role-preview design (detail)

| Role | Preview approach | Hides defects? |
|---|---|---|
| Owner / Manager / Staff | Real Email/Password accounts created through `authenticate`; memberships created via the **real invitation callables** | No — production authorisation applies |
| Customer | Real accounts; identity artifacts auto-issued at registration | No |
| Operator | Real account + `platformAdministrators` record (bootstrap service, an existing emulator-test convention) | **See below** |

**Operator MFA — the one real decision.** Every Commercial and activation action requires `verifiedMfaSatisfied` from the verified ID token's second-factor claim **and** ≤5-minute fresh authentication. Whether the **Auth emulator supports TOTP enrollment/sign-in** well enough to produce that claim is **UNVERIFIED** (the existing `MfaEnrollmentPage` is real-TOTP; emulator tests mock `verifyIdToken`). Options, in order of preference: **(1)** spike real TOTP against the emulator in EA-002 and use it if it works — no weakening at all; **(2)** if not, an **emulator-only token-verifier decorator** wired in the *Functions composition root* under a hard guard (`FUNCTIONS_EMULATOR === "true"` **and** project `demo-11thonus` **and** `PLATFORM_ENV=local`) that attests second-factor for the one preview administrator — **only with Founder approval (D-9)**, because it is a production-path conditional even if unreachable in production; **(3)** run the Operator Console actions only in seed/service mode (no live Operator actions in the preview). Recommendation: (1), fall back to (3), treat (2) as a last resort.

**Role-switching shortcut ("Preview Launcher").** A dev-only, build-excluded route (`/dev/preview-launcher`, literal `import.meta.env` gate + a new Vite mode in `viteBuildModes.ts`, excluded from the PWA) listing the seeded accounts with a "Sign in as…" button that performs a **normal email/password sign-in** against the Auth emulator and then navigates to `/`. It adds no authority, bypasses no check, and stores no tokens; switching role = sign out + sign in. It cannot weaken production because (a) the module is not in the production module graph (same technique as `/dev/*` harnesses; verified by a bundle-marker test), and (b) the preview password is only valid in the emulator. One browser holds one Firebase session per origin, so side-by-side roles use separate browser profiles/devices.

## 16. Mobile-first assessment

| Topic | Current state (evidence) | Reference | Gap |
|---|---|---|---|
| Responsiveness | Production is mobile-first: `md:` appears in only 3 non-test files (2 shells + Customer Rewards Progress); no tables, no horizontal overflow patterns; stacked card lists | Phone-framed composition | Counter and Command Centre not built |
| Navigation | Business: hamburger/expandable menu on mobile, sidebar on desktop; **no bottom nav** by prior Founder instruction. Customer: same hamburger/sidebar | Business mobile bottom bar (Home/Customers/Programmes/More + "More" sheet); Participant bottom bar (Home/Circles/Activity/Profile) | **D-2** |
| Transaction ergonomics | Purchase form: 7 fields, typed artifact + kind selector | Scan/search → programme → quantity → record, short path | Dedicated counter flow; fewer fields; prefill programme/item; big primary action |
| Touch targets | `min-h-11` (44px) in 7 files; nav items 44px | — | Audit new surfaces for ≥44px |
| Dashboard density | Minimal | Dense Command Centre | Reward-ready-first, ≤3 cards above the fold on 390px |
| Role switching | `/business` resolver (production-correct) | Persona switcher | Preview Launcher for Founder convenience |
| Test coverage | Real-route responsive: 1 test at 390×844 (`accessibility.spec.ts`); 6 specs target dev-only harness; **customer area: none** | — | Add mobile Playwright projects (§12) |
| Desktop | Operator Console is desktop-first; sidebar patterns exist | Operator 7-section nav | Build |

Verdict: **Business Owner/Manager — foundation ready, assembly needed. Frontline — not assembled. Customer — partial, untested.**

## 17. Cloudflare Tunnel assessment

**Recommendation: B — SUITABLE WITH BOUNDED CHANGES.** (Quick tunnel for Founder testing after the changes; named tunnel + Cloudflare Access for later controlled reviewers.) *Analysis is from reading the code and general SDK/Cloudflare behaviour; nothing was run (no tunnel created, no `cloudflared` installed). Items marked UNVERIFIED must be proven in a spike (EA-009).*

Consistent with `CF-001` (2026-09-19), which found Tunnel "not needed" for the **production** architecture: this assessment uses Tunnel only as an **optional transport over the local preview**, which `CF-001`'s reasoning does not address. No hosting-architecture change is proposed.

| Concern | Finding | Needed change |
|---|---|---|
| **Client → emulator addressing** | `infrastructure/firebase/auth.ts` and `functions.ts` hard-code `127.0.0.1:9099/5001` (and likely Firestore/Storage). From a phone, `127.0.0.1` is the phone → **breaks** | Make the emulator origin configurable (e.g. same-origin) — a small change in the Firebase composition root, **not** in domain code |
| **Single HTTPS origin** | Possible via a small local reverse proxy that serves the built web app and routes a *strict allowlist*: Auth emulator REST paths (`/identitytoolkit.googleapis.com/*`, `/securetoken.googleapis.com/*`) and callable paths to the Functions emulator | New `preview:serve` proxy (test tooling). The JS SDK ignores a URL *path prefix* for the Auth emulator, so Auth needs a root-mapped route, not `/auth/…` (UNVERIFIED) |
| **Callable over HTTPS** | `connectFunctionsEmulator` is host+port (http); mixed-content on an HTTPS page is blocked | Use the SDK's custom-domain mode (`getFunctions(app, "<origin>")`) → `${origin}/<fnName>`; proxy maps to `/demo-11thonus/europe-west1/<fnName>` (UNVERIFIED) |
| **Firebase Auth / callbacks** | Email/Password works with no redirect/popup. Google popup/redirect and Phone/reCAPTCHA are not meaningful against the emulator remotely | Keep Email/Password only for remote preview |
| **CORS** | Same-origin proxy → no CORS | none |
| **Cookies** | The app uses no cookies; Firebase Auth persists in IndexedDB/localStorage (per-origin) | none; note one session per origin |
| **CSP** | `firebase.json` CSP governs Firebase Hosting only (`connect-src` lists hosted origins). A local server sets none. **Do not use the Hosting emulator for the tunnel** (its CSP would block the tunnel/emulator origins) | none if served by the preview proxy |
| **API origins** | Only emulator callables; Sentry/App Check inactive in emulator mode | none |
| **WebSocket/HMR** | Vite dev HMR over a tunnel needs host allow-listing; **Vite blocks unknown `Host` headers** (`server.allowedHosts`) | Serve a **production-mode build** (mode excluding the PWA) from the proxy instead of Vite dev — avoids HMR and host checks. Founder-on-localhost keeps Vite dev |
| **Service worker / PWA** | `includePwaForMode` already omits the SW for temporary-preview modes so a stray cached SW cannot outlive a preview | Add the new preview mode to that predicate |
| **Exposed surface / security** | Auth emulator has open sign-up and **admin endpoints** (`/emulator/v1/…`: list/flush accounts, read OOB codes); Functions emulator has no auth; Emulator UI (`:4000`) is a full data browser; Postgres must never be exposed | Proxy **allowlist only** the paths above; **never** proxy `/emulator/*`, `:4000`, `:8080`, `:9099` admin, or Postgres; bind all emulator ports to `127.0.0.1`; fake data only; set `X-Robots-Tag: noindex`; the admin account stays MFA-gated |

**Quick tunnel (temporary, Founder testing).** Random `*.trycloudflare.com` URL, no account, no access control, short-lived: acceptable for the Founder's own phone **provided** the allowlist proxy is in front and data is fake. Per Cloudflare's documentation (to be re-checked at spike time) quick tunnels carry usage limits and no SLA.

**Named tunnel + Cloudflare Access (later, other reviewers).** Requires a Cloudflare account and a controlled hostname (no production domain exists yet — `CF-001`), plus Access policy (one-time-PIN by email or SSO), session duration, and a teardown procedure. Recommended for anyone besides the Founder.

**Dependencies introduced (when authorised):** the `cloudflared` binary on the Founder's machine (no repo dependency). **Not done here:** no tunnel created, no binary installed, no DNS or account change.

---

## 18. Security considerations

1. **Do not bypass authorisation to "make the preview work."** All roles are real accounts; only account selection is simplified.
2. **Operator MFA/fresh-auth** must stay intact in the preview (§15); any emulator-only attestation needs explicit Founder approval and a hard multi-condition guard.
3. **Seed tooling guards:** loopback-only emulators, exact project `demo-11thonus`, `PLATFORM_ENV=local`, loopback Postgres; refuse otherwise (copy the existing `seedTestOnlyTermsFixture.mjs` pattern). A reset command that drops a schema must be unusable against any non-local database.
4. **No impossible domain states:** seeds use callables/services only; no direct row inserts.
5. **Fixture isolation:** no production import of `tests/preview`; launcher excluded from production bundles with a structural test.
6. **Tunnel exposure** (§17): allowlist proxy, no admin ports, fake data, Access for third parties.
7. **Privacy:** customers see their own data only; staff-scoped read (B3) must return only "limited customer progress needed to complete the transaction" (`PRD01 §8.2`); no customer lists/exports for Staff; the confirmer's identity is not shown to customers until D-8 is decided.
8. **Gate:** the Commercial admission gate stays **default OFF** in the repository; any local `enforce` is an environment variable of the local runtime only (D-7).
9. **Terms:** the test-only Terms fixture authorises only local/emulator use (`FD-PREVIEW-TERMS-001`); the UI constant `TERMS_READABLE_CONTENT_AVAILABLE` must not be flipped for production.
10. **Client eligibility ≠ authorisation:** redemption/Commercial controls may be hidden in the UI as a convenience; the server re-authorises at the mutation boundary.

## 19. Founder Preview Slice 1 — definition

**Principle:** the smallest coherent end-to-end loop that uses only implemented Product Truth, with each role seeing real data from real write paths.

**BUSINESS — onboard → configure programme → operate programme**
- Sign in; (live) onboard a new Business through EST-01/02/03 (Kigwena Kitchen); Business profile/locations.
- Configure a Reward Program + Qualifying Item and publish (D-6); invite a Staff member and accept.
- Command Centre (composed from existing reads): programme status, reward-ready/near-reward customers, Circle activity, purchases by status.
- *(Terms/verification is handled per D-5: seed-driven for seeded Businesses; the live onboarding stops at the establishment review with the honest "Terms unavailable" state unless the Founder authorises a preview path.)*

**FRONTLINE — identify → record → observe → recognise/redeem**
- Mobile counter surface: identify by Loyalty Number/QR reference → choose programme + qualifying item + quantity → record (`waiting_for_customer`).
- Observe: status moves to verified after the customer verifies; staff-scoped limited progress (B3).
- Recognise/redeem: Owner/Manager confirm with the explicit confirm step ("This one's on us."); success state shows the next Circle starting (B4 minimal).

**CUSTOMER — experience the authorised loyalty consequence**
- See own Loyalty Number + QR (B1); "Waiting for you" → verify/reject/dispute; see Circle progress and available Reward (B2); post-redemption "next Circle".

**OPERATOR — observe and administer genuinely required capabilities**
- §7.2: Operations queue; Businesses + detail; Activate Business; Open Commercial account; Grant trial; Record + confirm settlement; read-only standing/held Purchases/audit tail.

**Preview runtime:** `preview:start` / `preview:reset`, Preview Launcher, the `founder-slice-1` seed, EN (FR keys kept at parity).

## 20. Explicit exclusions from Slice 1

- Commercial **Business-facing** screens (standing notice, "Commercial & Usage", low-credit alerts) — need WP-COM-08.
- Manager **Approvals** queue and any manager-approval concept (R6/R8) — not in Product Truth (D-3).
- **Quick-add customer** at the counter (D-4) and any CRM/customer-notes/messaging/segmentation functionality.
- Staff-delegated redemption authority UI/grant (B5); redemption **reversal/undo** (excluded by `DEC-LOY-018`).
- Reports & analytics (R10); notification **delivery** (intents exist, no channel); email/SMS invitation delivery.
- Operator: Support cases, Integrity cases, Markets/config, role-differentiated administration, adjust-credit/activate-paid/restrict-restore/void/cancel actions (Slice 2), platform activity dashboards, Knowledge Studio.
- Payment-provider integration; subscription tiers; local-currency derivation mechanics.
- Gift/wallet/promotion features (future in PRD06); scan-a-business affordance.
- Google/Phone sign-in in the preview; FR translation work beyond keeping parity.
- Any deployment, hosting change, production Terms content, or enabling the production Commercial gate.
- Prototype-only tooling (scripted tour, scenarios A–F, phone-frame chrome, persona switcher).

---

## 21. Recommended Experience Assembly packages

Derived from the actual repository state; each is bounded, independently reviewable, and requires separate Founder authorisation. (`EA-001` is this assessment.)

### EA-002 — Local Preview Foundation (runtime + core seed + launcher)
- **Purpose:** one command brings up a working local product with fake data; reset is one command.
- **Depends on:** Founder decisions D-5, D-6, D-7, D-9, D-11.
- **Areas:** root `package.json` scripts; new `tests/preview/` (orchestrator, seed runner, guards); `functions` migration CLI wrapper (B12); `apps/web` build-excluded Preview Launcher + new Vite mode; `viteBuildModes.ts`; README/runbook.
- **Backend available:** callables for Business/programme/purchase/staff; Commercial services; existing knowledge/terms seeds; bootstrap admin service.
- **Missing:** migration CLI; orchestration; launcher; core seed (Bella Salon, customers at positions, one Operator account); **MFA spike**.
- **Tests:** guard unit tests; seed-idempotency (run twice → same state); structural bundle test (launcher absent from production `dist/`); one Playwright smoke that signs in as each seeded role.
- **Founder checkpoint:** `pnpm preview:start` on the Founder's machine → sign in as Owner, Staff, Customer via the launcher.

### EA-003 — Seed Catalogue & Journey-Test Harness
- **Purpose:** full `founder-slice-1` dataset (§11.2) and the Playwright preview project; journeys J-B1…J-O2 as regression tests.
- **Depends on:** EA-002. **Parallel with:** EA-004, EA-007 backend.
- **Areas:** `tests/preview/scenarios`, `playwright.config.ts` (new project), mobile device projects.
- **Backend:** all callables above; Commercial services for S-class states; gate `enforce` env for held scenarios.
- **Missing:** none beyond EA-002 (Operator-dependent scenarios wait for EA-008).
- **Tests:** scenario self-checks (assert resulting read models); deterministic re-run.
- **Checkpoint:** Founder runs `preview:reset` and sees the whole dataset across roles.

### EA-004 — Business Owner/Manager Assembly
- **Purpose:** Command Centre home, programme status, reward-ready/Circle activity, attention items, programme first-run flow, mobile corrections.
- **Depends on:** EA-002; D-2 (navigation), D-6.
- **Areas:** `apps/web/src/business/dashboard/*` (`DashboardHome`, shell, `RewardProgramManagementPage` mobile rows `:663`/`:745`), `business/hooks`; i18n (EN+FR keys).
- **Backend available:** `listRewardPrograms`, `listPurchasesForBusiness`, `listLoyaltyCycleProgressForBusiness`, `listAvailableRewardsForBusiness`, Team callables.
- **Missing:** optional summary read (B13); redemption history read (B4, shared with EA-006).
- **Tests:** component tests; Playwright mobile journeys J-B1/J-B2; i18n parity.
- **Checkpoint:** Founder reviews Owner and Manager on phone.

### EA-005 — Frontline Counter Assembly
- **Purpose:** mobile counter: identify → record → status; staff-scoped limited progress.
- **Depends on:** EA-002; backend **B3**; customer identity read **B1** (shared with EA-006).
- **Areas:** new `apps/web/src/business/counter/*`; reuse `purchaseMutations.ts`; backend read (`functions/src/domains/purchase` + `index.ts` callable).
- **Backend available:** `recordPurchase`, `listPurchasesForBusiness`.
- **Missing:** B3; scanner optional (camera QR is deferrable; typed code is enough for Slice 1).
- **Tests:** unit + Postgres tests for B3 authorisation (Staff gets *limited* data; other-Business and non-member denied); Playwright mobile J-F1.
- **Checkpoint:** Founder records a purchase as Staff on a phone.

### EA-006 — Redemption & Customer Assembly
- **Purpose:** (a) redemption binding: adapter, eligibility signal, confirm sheet, success/continuity; (b) customer identity display, Circle progress, Reward visual, polished verify flow.
- **Depends on:** EA-005 (counter) and D-8, D-14; backend **B1, B2, B4**.
- **Areas:** `apps/web/src/business/api/redemption*.ts` (+ hooks), counter/Owner surfaces; `apps/web/src/customer/*`; new read callables.
- **Backend available:** `confirmRedemption` (complete; 44 + lock-order Postgres tests), `listAvailableRewardsForCustomer`, customer purchase callables.
- **Missing:** B1, B2, B4; mass-assignment regression test for the redemption transport parser (EXP-REF-001 §9.2 gap 5).
- **Tests:** engine untouched; adapter tests with generated `idempotencyKey` reuse; permission-revoked-mid-session test; Playwright J-F2/J-C1.
- **Checkpoint:** Founder redeems a Reward on a phone; customer sees "next Circle".

### EA-007 — Operator Backend Seams (Commercial track — see §22)
- **Purpose:** Operator endpoint wrapper (B6), cross-Business reads (B7), standing/history/audit/held reads (B8–B10), consumption trigger (B11).
- **Depends on:** Founder authorisation under the Commercial track (**this is the scope that overlaps `WP-COM-06b`/design WP-COM-06–08; do not start here without that decision**).
- **Areas:** `functions/src/domains/commercial/**` (read models), `functions/src/index.ts` (callables), `composition/`.
- **Tests:** per-command authorisation (admin + MFA + fresh; Business roles denied); read-model tests; lock-order tests where applicable; loyalty-path zero-diff.

### EA-008 — Operator Console Slice 1 (UI)
- **Purpose:** the §7.2 console, desktop-first.
- **Depends on:** EA-002, **EA-007**, D-9, D-10.
- **Areas:** new `apps/web/src/operator/*`, route guard using `discoverPlatformAdministrator`.
- **Tests:** component tests; Playwright desktop J-O1/J-O2; denial tests for non-admins.
- **Checkpoint:** Founder activates a Business and grants trial/records a settlement; held Purchases become admitted.

### EA-009 — Integrated Founder Journey & Mobile Correction
- **Purpose:** end-to-end walk across the four roles; mobile/a11y fixes; acceptance record.
- **Depends on:** EA-004…EA-008.
- **Tests:** full journey Playwright run; axe; screenshot baselines.
- **Checkpoint:** Founder acceptance of Slice 1.

### EA-010 — Optional Cloudflare Tunnel Review Access
- **Purpose:** controlled HTTPS access to the local preview for the Founder's phone and later reviewers.
- **Depends on:** EA-002 (configurable emulator origin and allowlist proxy are best included there to avoid rework); D-12.
- **Areas:** `preview:serve` proxy; Firebase composition root origin option; preview Vite mode (SW off).
- **Tests:** spike proving Auth + callable over one HTTPS origin; negative tests that `/emulator/*` and raw ports are not reachable; Playwright against the tunnelled URL.
- **Checkpoint:** Founder signs in from a phone off the local network.

**Suggested order:** EA-002 → (EA-003 ∥ EA-004 ∥ EA-007) → EA-005 → EA-006 → EA-008 → EA-009; EA-010 any time after EA-002.

## 22. Parallel work opportunities and Commercial-programme relationship

**Can continue independently while Experience Assembly proceeds** (none of these block EA-002…EA-006):

- Commercial **deployment readiness** (design WP-COM-10): scheduler, Cloud Monitoring alerts, Firestore TTL policies, deployment-region check, runbook rehearsal.
- Production **scheduler proof** and gate-enforcement readiness.
- **TRD17** governed rewrite; launch **BIF/RWF price inputs (L-1)**; local-currency derivation mechanics.
- Design **WP-COM-09** (signals/intents/threshold configuration).
- Documentation currency (CDR-001 notes, etc.).

**Genuine dependencies (the only ones):**

1. **Operator Console** (EA-008) depends on Commercial-track backend: the Operator endpoint wrapper, read models, and (for a *live* debit demonstration) the consumption trigger. These correspond to design **WP-COM-06/07** and the part of **`WP-COM-06b`** concerned with Operator read models. **This assessment does not start `WP-COM-06b`.** Recommended split: the Commercial track owns the *backend* read models/endpoints; the Experience track owns the *UI* (design WP-COM-11 already says Experience binding is "separate authorisation under the Experience track").
2. **Business-facing Commercial standing** (excluded from Slice 1) depends on WP-COM-08.
3. A preview scenario with **held Purchases** depends on running the local runtime with the gate `enforce` (an environment setting, D-7) — not on gate readiness work.

**Not blockers:** gate enforcement being OFF; Cloud Monitoring incompleteness; production scheduler proof; deployment readiness.

## 23. Risks

| # | Risk | Severity | Control |
|---|---|---|---|
| R-1 | **Prototype contradicts Product Truth** (instant progress; manager approvals; quick-add) — assembling "to the reference" would build non-compliant behaviour | High | D-1/D-3/D-4; recorded deviation register; Product Truth wins |
| R-2 | **No Operator transport/read models** — Operator Console cannot be built UI-only | High | EA-007 first; Commercial-track ownership |
| R-3 | **Operator MFA in the emulator unverified** — may force a guarded emulator-only attestation | High | EA-002 spike; D-9; last-resort guard |
| R-4 | **Frontline recognition needs backend seams** (B1, B3) that did not exist when UI plans were drafted | Medium | Early authorisation of B1/B3 |
| R-5 | **`PB-013B P3-3` open** — programme publishing is part of the Slice 1 loop | Medium | D-6: local preview only; no production claim; keep open |
| R-6 | **Terms blocked** (`DEC-LEGAL-002`) — onboarding→activation cannot be completed through the UI | Medium | D-5 |
| R-7 | **Consumption trigger not wired** — completing a Circle does not debit credit unless projection is invoked | Medium | B11; in preview, trigger via seed/Operator command |
| R-8 | **Seed reset command is destructive** | Medium | Triple guard; local DB only; never touches `_test` |
| R-9 | **Tunnel exposes emulator admin/data** | Medium | Allowlist proxy; Access for third parties |
| R-10 | **Preview code leaks into production bundle** | Medium | Literal env gate + bundle-marker test |
| R-11 | **Hamburger vs bottom-nav** rework late in the programme | Low–Med | Decide D-2 before EA-004 |
| R-12 | **Timestamps all "now"** — history looks shallow | Low | Accept; document |
| R-13 | **Staff recording is desktop-shaped** — poor first impression if shown before EA-005 | Low | Sequence; do not demo the raw purchases page as "the counter" |
| R-14 | **FR parity** adds work to each surface | Low | Keep keys in both locales (test-enforced) |
| R-15 | Cloudflare/SDK behaviours here are **UNVERIFIED** | Low–Med | Spikes in EA-002/EA-010 |

## 24. Open Founder decisions

| ID | Decision needed | Recommendation |
|---|---|---|
| **D-1** | Prototype shows instant Circle progress; Product Truth requires customer verification. Keep the reference frozen and record a deviation, or authorise a reference refinement? | Product Truth governs; keep the reference frozen; record the deviation |
| **D-2** | Business mobile navigation: hamburger (earlier Founder instruction) vs prototype bottom bar; same for Customer | Decide before EA-004; if bottom bar, a primitive is required |
| **D-3** | Manager "Approvals" queue has no Product Truth | Exclude from Slice 1; treat as a future truth question |
| **D-4** | Counter "quick-add customer" | Exclude (customers self-register; no CRM) |
| **D-5** | Terms/verification in the preview (UI cannot complete it) | Seed-driven via real callables for seeded Businesses; live onboarding ends at establishment with the honest "unavailable" state; do **not** flip the production constant |
| **D-6** | May the local preview use the existing publish path while `PB-013B P3-3` is open? | Yes, local preview only; P3-3 stays open |
| **D-7** | Run the local preview with the admission gate OFF (default) or `enforce` (to show held Purchases)? | OFF by default; `enforce` as a separate local scenario via env only |
| **D-8** | Does the customer see who confirmed a redemption (`participantSeesConfirmer`)? | Hidden until decided |
| **D-9** | Operator MFA in preview: real TOTP spike → else seed-mode only → else guarded emulator attestation | As stated; attestation only with explicit approval |
| **D-10** | Operator scope and authority for cross-Business reads; who builds the backend (Commercial vs Experience track) | Slice 1 per §7.2; Commercial track builds backend |
| **D-11** | Preview Launcher (dev-only quick sign-in as real seeded accounts) acceptable? | Yes |
| **D-12** | Tunnel: approve installing `cloudflared`; quick tunnel for the Founder now; named+Access later | Defer to EA-010 |
| **D-13** | Preview languages: EN only, or EN+FR demo | EN primary; FR keys at parity |
| **D-14** | Confirm customers see their own Circle progress (authority: `PRD04`) | Yes |

## 25. Recommended immediate next task

**`11THONUS-EA-002 — Local Preview Foundation`** (Founder authorisation required), scoped to: the migration CLI wrapper; `preview:start/stop/reset/seed/status`; guards; the Preview Launcher; the core seed (Bella Salon + customers at positions + one Operator account); the **Operator-MFA spike**; the allowlist-proxy-ready configurable emulator origin (so EA-010 needs no rework). In parallel, request Founder decisions D-1…D-7 and D-9 (they unblock EA-002/EA-004), and, separately, a Commercial-track authorisation to scope the Operator backend seams (EA-007) — **without starting `WP-COM-06b` from this assessment.**

---

## 26. Evidence index

- Entry state: `git fetch origin`; `origin/main` = `c064f43659d87922d14bb4a245d94a5dfe8d918d`; prototype `HEAD` = `18e8d700f505beefe46d324f6ea33f20a670abe7`.
- Web: `apps/web/src/App.tsx`, `RootEntry.tsx`, `business/dashboard/*`, `customer/*`, `business/onboarding/*`, `config/env.ts`, `infrastructure/firebase/{auth,functions}.ts`, `authentication/providerConfig.ts`, `business/termsAvailability.ts`, `vite.config.ts`, `viteBuildModes.ts`.
- Backend: `functions/src/index.ts` (exports at lines 192–2638), `domains/commercial/**`, `domains/purchase/services/{recordPurchaseCommand,purchaseAuthorization,confirmRedemptionCommand}.ts`, `domains/identity/services/customerIdentityArtifactEstablishment.ts`, `domains/business/services/businessActivation*.ts`, `domains/commercial/services/commercialAuthority.ts`, `infrastructure/postgres/{postgresConfig,migrationRunner}.ts`, `composition/commercialAdmissionBinding.ts`.
- Tooling: `firebase.json`, `docker-compose.postgres.yml`, `playwright.config.ts`, `package.json`, `tests/e2e/emulator/*`.
- Governance: EXP-REF-001 (+§19); `FD-COM-001`; `COMMERCIAL-DESIGN-001` §10; `WP-COM-06a` report/runbook; `FOUNDER-DEVELOPMENT-WORKFLOW-ALIGNMENT-2026-09-11`; `ENG-P3-002-UI-RECON-001`; `PRD00` lines 451/546, `PRD01 §8.2`, `PRD04`.
- Reference: `11thonus-prototype/src/{App.tsx,types.ts,components/**}` at `18e8d700`.

**UNVERIFIED items** (not run; require spikes): Auth-emulator TOTP/MFA support; emulator-accepted `localId` for deterministic UIDs; `connectFunctionsEmulator`/custom-domain behaviour over HTTPS; Auth-emulator path-prefix proxying; emulator `onSchedule` timer behaviour; Cloudflare quick-tunnel limits.

## 27. Negative confirmation

This task did **not**: implement or redesign any UI; modify Product Truth, the Decision Register, TRD, PRD, `CDR-001` or Master Workflow; modify the frozen Experience Reference; start `WP-COM-06b`; enable the Commercial admission gate; deploy anything; create or configure a tunnel; add a dependency; change configuration, schema, migrations, Firebase or infrastructure; or start any service. The only repository changes are this report and the two change-tracking entries.

**Disposition:** `11THONUS-EA-001 — ASSESSMENT COMPLETE / PENDING FOUNDER REVIEW`.
