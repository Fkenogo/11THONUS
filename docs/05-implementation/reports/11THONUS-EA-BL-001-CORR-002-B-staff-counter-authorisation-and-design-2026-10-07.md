# 11THONUS — EA-BL-001-CORR-002-B Staff Counter: Authorisation & Design Assessment

**Package:** `EA-BL-001-CORR-002-B` — Staff Counter
**Date:** 2026-10-07 · **Type:** analysis / design / governance only (no implementation)
**Status after the assessment (historical, 2026-10-07):** DESIGN ASSESSED — AWAITING FOUNDER AUTHORISATION. **Superseded by §22: the Founder has since recorded dispositions D1–D8 and Slice B is AUTHORISED / READY FOR IMPLEMENTATION (not started).** Sections 1–21 are the unaltered assessment.

## 1. Entry state and authority verification
- `origin/main` at entry: `92ffd217668e64d3e38f6c45fb253d200766ffbb` (PR #305 closure merge). Tree clean; branch cut from it. Verified live: PR #305 merged at that commit; PR #304 merged at `75ae6acf30d66f6a39270ce400ca927258bbadeb` (reviewed head `a848cfe95f058a2cb9d650162f26cd51429f9cd8`); `EA-BL-001-CORR-002-BR` COMPLETE / ACCEPTED / MERGED; BR prerequisite SATISFIED.
- Experience Reference: `Fkenogo/11thonus-prototype@18e8d700f505beefe46d324f6ea33f20a670abe7` verified present and read at that exact SHA: `StaffCounterExperience.tsx` (1006 lines), `BusinessWorkspace.tsx` (2850), `MobileNavigation.tsx` (333), `ParticipantExperience.tsx` (not read in depth; no Staff handoff state relevant to this assessment was found in the files read).
- Authority applied: `DEC-PROD-015`, PRD01 §8.2/§8.3 (Staff permissions/restrictions), the BR closure, and the code at `92ffd21`.

## 2. What the prototype Staff Counter is (read at the frozen SHA)
A single scrolling "Frontline Counter Terminal": header + "Scan Customer QR" button → a **prototype-review scenario strip** (never product UI) → left column "1. Identify Customer" (search box over *all* participants by name/phone/ONUS id; pills listing every participant with name, phone, ONUS id and `n/10` progress; "Register walk-in (secondary)" quick-add by name+phone that "instantly starts" a circle) and "2. Select Programme" (list with price) → right column: customer banner (name, id, `Cycle #n`), action banner, **Loyalty Circle**, then either **Reward-ready → "Confirm reward" (Staff-side redemption)** or the **Record** card (−/＋ stepper, "approval above N" note, "Record n item(s)") → "Today's Counter Activity" log (customer name, "By staff", Approved/Pending Approval) → modals (confirm-redemption sheet, simulated QR scanner with hard-coded customers, quick-add). Everything is client-side mock (`useApp()` seeded users, `setTimeout(250)` fake submit, default-selected "Amina").
The prototype's `MobileNavigation` is the **Owner/Manager** bottom nav (Home / Customers / Programmes / More); it has **no Staff variant**. Staff are reached by `switchRole('frontline_staff')`.

## 3. Current production capabilities (verified in code)

| Capability | Current implementation (evidence) |
|---|---|
| Staff sign-in | Existing auth; `RootEntry` → `/business` resolver → role/Business choice → `/business/:id/dashboard/*`. **No Staff-specific shell or landing**: `BusinessDashboardShell` shows one nav (Home, Profile, Locations, Team, Terms, Reward programmes, Purchases, Customer rewards) to every role; role is not gated in the web (server is the authority). |
| `purchase.record` | Staff, Manager and Owner (PRD5 §8); live-evaluated; role stored as `recorded_by_role`. |
| Programme + item reads | `listRewardPrograms` is membership-gated (Staff may read); `currentVersion.qualifyingItems` already carries opaque `qualifyingItemId` + label; threshold key is **absent** for Staff (BR). `listQualifyingItems` also membership-gated. |
| Customer identification | Server accepts **exactly one** of `loyaltyNumberValue` or `qrReference`; resolved in `recordPurchase` via `lookupCustomerIdentityBy…` with purpose `merchant_transaction`, which returns **only `customerIdentityId`** (no name/phone). **No standalone pre-record lookup/preview callable exists.** Supported identifiers are Loyalty Number and QR only. |
| Web QR capture | **None.** No camera/scanner code or library in `apps/web`. Existing record form takes typed Loyalty Number / QR text. |
| New customer | Customers self-register by signing in (Google / email / phone OTP) on the public app; first sign-in establishes identity + Loyalty Number + QR (`customerIdentityArtifactEstablishment`); customer shell shows them (`getMyCustomerIdentityPresentation`). **No staff-initiated registration, no handoff token, no invitation/deep-link/returnTo mechanism for customers** (`returnTo`/redirect grep: none). Staff invitations exist but are for staff only. |
| Branch | Server resolves the Business's **default branch** (`readDefaultBranchForBusiness`) and stores it as informational metadata. No per-Staff branch assignment; no branch in the request. |
| Record contract | Request: `businessId`, `rewardProgramId`, exactly one artifact, `quantity` (int ≥ 1), `qualifyingItemId`, `purchaseDate` (not future), optional `unitValueMinor`+`currency` (together), optional `notes`, `idempotencyKey`. Server resolves actor/role, customer, canonical LN snapshot, default branch, program+version lock, item-in-frozen-set, shared-LN gate, multiple-units rule, BR routing from the locked version, evidence. Result: `{ purchase, review: { required, status } }`. |
| BR | `business_review_required` outcome returned; Staff cannot decide, list the queue, read a protected row by id, or see reviewer attribution/reason/threshold. |
| Customer verify | Customer-only; requires `waiting_for_customer` and ownership. Staff has no path. |
| Circle progress | `listLoyaltyCycleProgressForBusiness` / available-rewards reads are **Owner/Manager only**. Staff have **no** progress read, although PRD01 §8.2 permits "limited customer progress needed to complete the transaction". |
| Redemption | `confirmRedemption` callable exists; `redemption.confirm` is Owner floor / Manager default / **Staff explicit grant only**; no web UI today. |
| Staff purchase reads | `listPurchasesForBusiness` / `getBusinessPurchaseRecord` are **membership-gated for all members**, so Staff can currently read every Business Purchase Record (customer identity ids, LN snapshot, `recordedByUserId`), not only their own, contrary to PRD01 §8.2's "recently submitted purchases". Pre-existing; BR adds redaction only for review fields. |
| PWA | `vite-plugin-pwa` present (autoUpdate, standalone manifest); no offline queue/mutation replay. |
| i18n | EN/FR with parity tests; existing `purchase.*` strings cover the generic record form and the BR outcome. |
| Idempotency (web) | `useRecordPurchaseMutation` holds a key per payload (`keyForRequest`), rotates after success, retains it **only** for errors mapped retryable (`settleKeyOnError`); any other error discards it. |

## 4. Staff authority matrix (confirmed)
Staff **can**: sign in; belong to the Business; read active programmes and their qualifying items; submit a Purchase with a Loyalty Number or QR; see the routing outcome; (where explicitly granted) confirm a redemption.
Staff **cannot**: Business-review (structurally ineligible, no grant path); see `businessReviewQuantityThreshold` (key absent server-side); list the review queue or open a review-required row by id; grant themselves authority; mint loyalty value; verify for a customer; create a customer identity; impersonate or bypass customer authentication; read Circle progress; export customer lists.

## 5. Customer identification and registration design

**Existing Customer.** Counter takes a Loyalty Number (typed) or QR reference (typed/pasted; scanning needs a capability decision, D2) *[CORRECTED — §23.7: a customer cannot copy the opaque QR reference, so camera scan is the QR path and Loyalty Number is the manual fallback]*. The server resolves the canonical identity during the record call. Because no preview exists, the counter can **echo only what the Staff member entered**, not a name.

**New Customer — no safe Staff-created identity.** The existing architecture supports a **tokenless** assisted self-registration with no new security primitive:
1. Counter shows a "New customer?" panel with the app's public sign-up address as text and as a static QR (identical for everyone; contains no identity, token or Business context).
2. The Customer opens it **on their own phone**, signs in/registers with their own credentials (Google/email/phone OTP), and lands on their shell, which already displays their Loyalty Number and QR *[CORRECTED — §23.8: a customer who also holds an active Business membership lands in Business context and must select Personal]*.
3. The Customer presents that QR or reads out the Loyalty Number; Staff enters/scans it and records. The Business never sees authentication data (names, phone, email, provider links are not returned by `merchant_transaction`).
- **One phone vs two:** same-device handoff is **not** supported and is not recommended: the device carries the Staff Firebase session; letting a customer authenticate there would require Staff sign-out or mixing sessions. The supported path is **two devices** (customer's phone).
- **Not designed, not allowed:** synthetic customers, Staff-set passwords, Staff-owned accounts, placeholder identities that can accrue loyalty, shared credentials, per-customer handoff tokens. A true "resume recording automatically after registration" (a Business-context token) would be a **new governed token/protocol** and is explicitly **not** proposed; if the Founder wants it, it is a separate security decision.
- **Prototype rebinding:** "Register walk-in (secondary)" (name + phone → instantly selected member) is replaced by the panel above. Experience intent (a fast, secondary walk-in path) is preserved; the conflicting action (Staff creating the member) is removed.

## 6. Production journey (mobile-first)
Phone-first single column, one-handed, bottom-anchored primary action; desktop adapts the same structure (two columns only at ≥ md).
1. **Counter ready:** Business name; Staff identity from the authenticated session; programme (auto-selected when exactly one active); no scenario strip, no mock data.
2. **Identify:** large Loyalty Number field (text/alphanumeric keyboard with capitalisation — **not** numeric; *[CORRECTED — §23.3]*) + QR affordance (per D2) + "New customer?" panel. Invalid artifact → inline, field-associated error.
3. **Item and quantity:** item select (auto when one); stepper (large targets) shown **only** when the locked version allows multiple units (otherwise quantity fixed at 1, as the server enforces); the "approval above N" prototype note is **removed** (Staff must not learn a threshold).
4. **Record:** one primary button, disabled while in flight; one idempotency key per intentional submission.
5. **Outcome (server-truthful):**
   - `waiting_for_customer`: "Purchase recorded. The customer now needs to confirm it. Nothing has been earned yet." CTA **Serve next customer** (resets form, fresh key).
   - `business_review_required`: "Purchase recorded. Business review is required before customer confirmation." Same CTA; no review controls, no threshold, no reviewer.
6. Customer verifies on their own device (Slice A); a BR approval later makes that possible.
- **Status visibility for Staff:** the existing status vocabulary (`waiting_for_customer`, `business_review_required` labelled "Awaiting business review", `rejected`, `verified`, `under_review`) with no reasons or reviewer attribution (already enforced server-side). A BR-rejected Purchase appears to Staff only as `rejected`, matching PRD01 §8.2 ("pending, verified, rejected or disputed"). No Business Review reason is shown.
- **Commercial gate:** not surfaced; Staff never sees capacity, credit or `pending_admission` internals (Staff-visible `pending_admission` label, if listed, uses the existing neutral "Received · awaiting admission" copy).

## 7. Prototype → production fidelity table

| Prototype element | Class | Production treatment |
|---|---|---|
| Counter header / "Frontline Counter Terminal" | KEEP VISUALLY / REBIND | Business name + authenticated Staff name; "Station: Front Desk" replaced (D7: informational default branch only). |
| Scenario strip, simulated scanner buttons, preset "Amina", `setTimeout` submit | **REMOVE** | Prototype-only; never ported. |
| Big "Scan Customer QR" | **BLOCKED / FOUNDER DECISION (D2)** | No scanner exists; baseline is typed/pasted LN/QR. |
| Search by name / phone | **REMOVE** | Not a supported identifier (LN/QR only); would widen customer data access. |
| Pill list of all participants with name, phone, ONUS id, progress | **REMOVE** | Business-wide customer browsing is forbidden for Staff (PRD01 §8.3). |
| Customer banner (name, id, `Cycle #n`) | **FOUNDER DECISION (D1, D4)** | No pre-record read exists; baseline echoes the entered LN only. |
| Loyalty Circle / progress / "n of 10" | **BLOCKED (D4)** | Staff have no progress read; never computed client-side. |
| Programme selector | KEEP / REBIND | Real active programmes; prices not shown (no Staff-facing price truth). |
| Quantity stepper | KEEP / MODIFY | Max not client-invented; shown only if multiple units allowed; no threshold note. |
| "Held for manager approval" note | **MODIFY** | Replaced by post-record truthful outcome only. |
| Record button + "Recognition in seconds" | KEEP / MODIFY | Copy changed: no recognition/credit implied. |
| Success "Recorded n… now has x of 10" | **MODIFY** | Replaced by "customer must confirm; nothing earned yet". |
| Pending Approval state | **MODIFY** | Becomes the BR-required outcome. |
| Reward-ready banner + Confirm-reward sheet | **FOUNDER DECISION (D5)** | Redemption confirm is a separate authority (Staff explicit grant) with no UI; recommend defer. |
| "Register walk-in (secondary)" | **MODIFY** | Tokenless self-registration panel (§5). |
| Today's Counter Activity | **MODIFY / FOUNDER DECISION (D6)** | Only Staff's own submissions may be shown; needs a server-side own-records filter, otherwise omit. |
| Mobile navigation | **FOUNDER DECISION (D8)** | Prototype nav is Owner/Manager; Staff need a counter-first, minimal shell. |
| Offline/PWA | KEEP AS-IS (no offline claim) | No offline queueing; network error is recoverable with the same key. |

## 8. Product Truth conflicts

| Prototype behaviour | Product Truth | Adaptation | Founder decision |
|---|---|---|---|
| Staff creates a member and the circle starts instantly | Customer owns identity; only Customer verification earns value | Tokenless self-registration panel | Confirm (D3) |
| Staff sees threshold-based "approval above N" | Staff must never see the threshold (N4) | Outcome-only copy | No |
| Staff "Confirm reward" in-counter | Redemption is a separate governed authority | Defer / separate surface | Yes (D5) |
| Staff sees every customer and their progress | PRD01 §8.2/8.3: limited progress only; no customer lists | Remove; optional minimal read later | Yes (D4) |
| Counter log of all business transactions | PRD01 §8.2: "their recently submitted purchases" | Own submissions only | Yes (D6) |
| Success implies steps credited | Pending ≠ Verified | Truthful copy | No |

## 9. Decisions required (separate; none invented)

| ID | Question | Evidence | Recommendation | Decision? |
|---|---|---|---|---|
| D1 | May Staff see any customer identity display (e.g. first name) before/after recording? | `merchant_transaction` lookup returns only an id; no pre-record read exists; prototype relies on the name. | Baseline: **no name**; echo the entered Loyalty Number and show it on the result. A minimal "first name + last initial" read would be a new callable and a data-minimisation call. | **YES** |
| D2 | QR capture: add camera scanning? | No scanner or library in `apps/web`. | Baseline: typed/pasted LN/QR with manual fallback. Camera scanning only if the Founder accepts a new web dependency or the browser `BarcodeDetector` API with permission handling. | **YES** |
| D3 | Accept tokenless two-device assisted self-registration (no same-device handoff, no auto-resume)? | No customer handoff/returnTo/token primitives; Firebase single session per browser. | Accept (§5). Auto-resume would require a new governed token and is not proposed. | **YES (confirm)** |
| D4 | Give Staff "limited customer progress needed to complete the transaction" (PRD01 §8.2)? | Progress reads are Owner/Manager only; none for Staff. | Defer; Slice B shows no Circle. A Staff-minimal progress read is a separate backend package. | **YES** |
| D5 | Include Staff redemption confirm in the Counter? | `confirmRedemption` exists; no UI; Staff need explicit grant. | Defer to a later slice (Slice B = record only). | **YES** |
| D6 | Staff recent-activity: scope to own submissions? | Staff currently can read all Business purchases (pre-existing). | Add a server-side own-submissions filter as a bounded backend enabler, or omit activity from Slice B. Do **not** filter client-side. | **YES** |
| D7 | Branch: show a station label? | Default branch only, informational; no Staff assignment. | Show Business name only; no station label. | ~~NO~~ → **FOUNDER DISPOSED: APPROVED (§22.1)** *[CORRECTED — §23.4]* |
| D8 | Staff shell: bounded role-aware landing (Staff lands on Counter, minimal nav; Owner/Manager unchanged)? | One shared dashboard nav for all roles; role available from the accessible-business resolver. | Yes, bounded to Staff entry/nav only (UX gating; server remains authority). | **YES (scope confirm)** |

No decision reopens a locked decision (customer verification, BR, no synthetic identities, reviewer privacy).

## 10. Data minimisation and N1/N4
- **Staff-visible customer data (proposed):** only the Loyalty Number/QR the Staff entered and the server's outcome. No name, phone, email, history, rewards or progress unless D1/D4 are separately authorised.
- **N4 (threshold):** binding Slice B constraint. Programme options come from `listRewardPrograms` (key absent for Staff); the web must treat an absent key as "unknown", never "disabled"; no threshold in loaders, form options, errors, success state or browser state; the BR Trust Event payload is never surfaced; the only Staff-visible fact is the routing outcome of *that* Purchase. Add an explicit automated assertion that no Staff-bound payload contains `businessReviewQuantityThreshold`.
- **N1 (`recordedByUserId`):** Slice B would **not** newly surface it provided the Counter shows only the Staff member's own submissions with server-computed outcomes. It **would widen** the exposure if the Counter "recent activity" reused the unfiltered Business purchase list (Staff would render colleagues' attribution and customer ids). Flagged: D6 resolves it. N1 itself is not fixed here.

## 11. Architecture gap table

| Capability | Slice B requirement | Gap? | Action | Authority needed |
|---|---|---|---|---|
| Staff session / membership | Authenticated Staff | No | Reuse | — |
| Business context | Business id + name | No | Reuse | — |
| Branch context | Informational | Minor | Omit station label (D7) | — |
| Programme / item reads | Real active programmes + items | No | Reuse `listRewardPrograms` | — |
| Customer lookup (pre-record) | Identity confirmation | **Yes** | Baseline echo; optional new read | D1 |
| QR lookup / scan | Scan | **Yes (web)** | Typed/paste baseline | D2 |
| LN lookup | Entry | No | Reuse record call | — |
| New-customer registration | No Staff creation | No (self-reg exists) | Static panel | D3 |
| Customer-auth handoff | Token-less | n/a | Not built | D3 |
| `recordPurchase` | Record | No | Reuse | — |
| BR routing outcome | Neutral outcome | No | Reuse `review` | — |
| Staff review denial | Denied | No | Reuse | — |
| Threshold redaction | Absent for Staff | No | Reuse; add web assertion | — |
| Idempotency | One key/submission | No | Reuse key holder | — |
| Customer confirmation | Customer-only | No | Reuse | — |
| Staff own-activity | Own submissions | **Yes** | Server filter or omit | D6 |
| Staff progress read | Limited progress | **Yes** | Defer | D4 |
| Staff redemption UI | — | Yes (UI) | Defer | D5 |
| Staff mobile shell | Counter-first | **Yes** | Bounded Staff entry/nav | D8 |
| EN/FR | Parity | Partial | New keys (below) | — |

## 12. Error / edge-state contract (EN/FR required)
*[CORRECTED — §23.2: the current callable collapses these causes; a bounded backend discriminator is authorised for Slice B]* Map server categories to user copy, never raw codes (`purchase_command_failed` is intentionally generic): artifact invalid/not found → "We couldn't find that customer code. Check it or ask the customer to open their code."; programme inactive/changed → "This programme isn't available. Refresh and try again."; item invalid → "That item isn't part of this programme."; quantity not allowed → "This programme allows one unit per purchase."; shared-number policy → neutral "This code can't be used here."; not authorised/suspended membership → "You can't record purchases right now. Ask a manager."; session expiry → sign-in prompt, form preserved; network/uncertain → "We couldn't confirm the result. Retry — it won't record twice." (same key); replay → show the original outcome. Review-required is a **success**, not an error.

## 13. Idempotency and double-submit UX
One key per intentional submission (existing holder); button disabled in flight; retry after uncertainty reuses the key *[CORRECTED — §23.1/§23.5: the same `purchaseDate` must also be retained, and the original outcome is recovered only while the actor remains authorised]* (the future implementation must verify that network/uncertain failures map to a retryable error code, since non-retryable errors discard the key by design); **Serve next customer** or any payload change rotates the key; no backend change.

## 14. States
initial/loading · ready · customer entered/validated · recording · recorded→customer confirmation · recorded→business review required · customer not found · new-customer panel · validation error · server error · network/uncertain · idempotent recovery · ready for next customer. Each has defined copy and live-region announcement.

## 15. Accessibility and mobile checklist
Labelled inputs with `aria-describedby` errors; outcome in `role="status"` (errors `role="alert"`); logical focus order, focus moved to the outcome then to **Serve next**; ≥ 44px targets; stepper with accessible names; no colour-only status (text + icon); safe-area padding; `inputMode` for numeric entry; no horizontal overflow at 320px; bottom-anchored primary action respecting the on-screen keyboard; Staff nav compatible with a bottom bar (D8).

## 16. EN/FR requirements
New keys needed (EN primary, FR parity, parity test): counter title/intro, identify label/hint/errors, new-customer panel, outcome (normal, review-required, "nothing earned yet"), serve-next, error map (§12), in-flight/retry text. Existing and reusable: `purchase.recordSuccessReview` (EN/FR), `purchase.status.*`, record-form labels. No English-only placeholders.

## 17. Proposed bounded implementation scope (for Founder authorisation, if D1–D8 are disposed)
Counter route (Staff-function; access per existing `purchase.record`, §23.6) + bounded Staff entry/nav (D8); production binding to real membership/Business/programme/item; Loyalty Number/QR entry (+ scanner per D2); self-registration panel; `recordPurchase` integration with the existing key holder; truthful outcome states; EN/FR; accessibility; tests; Founder Preview tooling/seed scenarios. **Backend:** none required by the baseline; only D1/D4/D6 would add (minimal, separately named) read capabilities if authorised.
**Out of scope:** Owner/Manager review UI/queue/dashboard, onboarding, programme creation, customer Circle/redemption redesign, reporting, commercial UI, WP-COM, Trust/audit UI, Slices C/D/E, EA-BL-002, FEF-TLC, deployment.

## 18. Future test matrix
Auth/role (Staff, authorised Manager and Owner allowed per `purchase.record`; non-member, suspended and revoked denied — see §23.6); identity (valid LN, valid QR via camera scan (not typed QR reference — §23.7), invalid, cross-customer, self-registration then record, no synthetic identity); purchase (normal, multiple, disallowed multiple, invalid item, inactive/changed programme, duplicate, network replay); BR (routed outcome, neutral copy, threshold absent in every Staff payload and error, Staff cannot list/approve/reject, later approval permits customer confirmation); verification (Staff cannot verify; customer cannot verify while review-required); privacy (no threshold, reviewer, protected customer data, Trust payload); i18n parity; UX (loading/success/error/reset/double-tap/320px/keyboard/a11y); Founder Preview scenarios (§19).

## 19. Founder Preview plan
Seeded Staff, existing customer, review-trigger programme and a two-device registration walkthrough; compare against the frozen prototype at phone width first, then desktop adaptation: (1) existing customer + normal; (2) review-routed quantity; (3) threshold invisible; (4) Staff cannot review; (5) assisted new-customer registration; (6) return to Counter and record; (7) double-tap; (8) customer confirmation handoff; (9) EN; (10) FR; (11) phone; (12) desktop. Not accepted before that preview.

## 20. Risks
Customer-name omission reduces prototype fidelity (D1); typed entry is slower than scanning (D2); two-device registration adds a step; Staff currently over-read Business purchases (pre-existing, N1-adjacent); a shared dashboard shell may confuse Staff until D8; programme with threshold NULL gives Staff no BR signal (correct).

## 21. Final recommendation and verdict
No locked decision is violated, no new security protocol is needed, no BR/Customer/Trust change is required, and a coherent record-only Staff Counter is implementable on existing backend capabilities. Eight items (D1–D8) needed Founder disposition when authorising *[CORRECTED — all eight are now FOUNDER DISPOSED, §22.1/§23.4]*.

**DESIGN ASSESSED — READY FOR FOUNDER AUTHORISATION** (Slice B remains NOT AUTHORISED / NOT STARTED; Slices C/D/E, EA-BL-002, WP-COM and FEF-TLC-001 unchanged).

---

## 22. Founder authorisation record (appended 2026-10-07)

**Status: `EA-BL-001-CORR-002-B` — AUTHORISED / READY FOR IMPLEMENTATION.** Not started, not implemented, not complete, not accepted, not merged. Recorded on PR #306 (assessment head `39624eab8c773d938c2f9511e55c972afb7d3c3f`). This section records the Founder dispositions exactly; where they differ from the recommendations in §9 the disposition governs.

### 22.1 Dispositions
| ID | Disposition | Record |
|---|---|---|
| D1 | **APPROVED BASELINE** | No customer name/profile read in Slice B. **No customer-profile lookup callable is to be added.** Staff works from the presented Loyalty Number / QR and the server outcome. |
| D2 | **APPROVED** | Slice B **must** support camera QR capture as a primary point-of-service interaction: capability detection; manual entry stays available as fallback (**Loyalty Number is the real manual fallback**, §23.7); use a browser-native scanner if sufficiently supported; a bounded, well-maintained web scanning dependency is authorised if needed; no image/video data is sent to the backend; scanning resolves only the QR reference already accepted by `recordPurchase`; camera-permission failure falls back cleanly to manual entry. |
| D3 | **APPROVED** | Tokenless two-device self-registration: Counter shows a static public sign-up URL / QR → Customer registers/authenticates on their own device → existing identity establishment creates Loyalty Number / QR → Customer presents identity → Staff records. **Not authorised:** synthetic identity; Staff-created customer account; Staff-set credential; same-device Staff/customer session switching; handoff token; auto-resume token/protocol. |
| D4 | **DEFERRED** | No Staff Circle/progress read or display in Slice B. |
| D5 | **DEFERRED** | No redemption-confirmation UI in Slice B; existing redemption authority/backend unchanged. |
| D6 | **APPROVED** | Staff may see a bounded list of **their own** recently submitted Purchases only, enforced **server-side**. Do not reuse the Business-wide Staff purchase list as the Counter feed; do not client-filter a Business-wide response; do not expose colleagues' submissions or customer identifiers. Authorised: only the **minimum** read/query/API adjustment required for Staff-own recent submissions. |
| D7 | **APPROVED** | Show the Business name. No fabricated station/front-desk label. Server default-branch metadata unchanged. |
| D8 | **APPROVED** | Bounded role-aware Staff experience: Staff land on the Counter; mobile-first minimal Staff navigation; Owner/Manager experience unchanged; UX routing only; backend remains authoritative. |

### 22.2 Locked idempotency requirement
Before implementation acceptance, prove that uncertain/network failures **preserve the same idempotency key**. Inspect the actual error mapping during implementation (the assessment found the web key holder discards the key for any error not mapped retryable). If a network/uncertain outcome is not currently classified retryable, make only the **minimum architecture-consistent correction** so retry uses the original key. Uncertain outcomes must **never** be solved by generating a new key.

### 22.3 Authorised Slice B scope
**IN:** mobile-first Staff Counter route/page; bounded Staff shell/landing/navigation; real authenticated Business/Staff context; real active Reward Program + qualifying-item reads; Loyalty Number entry; QR reference entry; camera QR scanning with manual fallback; static tokenless new-customer sign-up panel; real `recordPurchase` integration; truthful `waiting_for_customer` outcome; truthful `business_review_required` outcome; own-submissions recent activity via server-side scoping; threshold confidentiality (N4); reviewer-data confidentiality; double-submit / idempotency-safe retry; loading/error/success/reset states; EN/FR parity; accessibility; mobile-first responsive assembly; production tests; Founder Preview seed/tooling for the approved scenarios.

**OUT:** customer name/profile lookup; Staff customer Circle/progress; Staff redemption; synthetic customer identities; same-device customer authentication; customer handoff/return token; Owner/Manager Business Review UI; Slices C/D/E; onboarding/programme redesign; WP-COM changes; commercial UI; Trust/audit UI; EA-BL-002; FEF-TLC adoption; deployment.

### 22.4 Experience bindings (binding on implementation)
Frozen prototype `Fkenogo/11thonus-prototype@18e8d700f505beefe46d324f6ea33f20a670abe7`; directive: preserve the prototype experience as closely as possible, replacing only the specific data, action, field or authority that conflicts with Product Truth. Explicit bindings: Scan Customer QR → real camera scan + manual fallback; participant-name/phone search → **remove**; walk-in quick-create → tokenless self-registration panel; Loyalty Circle → **defer/remove**; threshold note → **remove**; Staff redemption → **defer/remove**; today's activity → own submissions only; generic Owner/Manager mobile nav → bounded Staff Counter shell; mock submit/scenario data → real authoritative backend only.

### 22.5 Founder Preview gate
Slice B **must** receive Founder Preview before acceptance. Preview must include: (1) existing customer, normal purchase; (2) existing customer, BR-routed purchase; (3) camera QR scanning; (4) manual fallback; (5) threshold invisible; (6) Staff cannot review; (7) new-customer two-device registration; (8) return to Counter using the resulting customer identity; (9) own recent submissions only; (10) double-tap protection; (11) uncertain network retry/idempotency; (12) customer-confirmation boundary; (13) EN; (14) FR; (15) phone-first viewport; (16) desktop adaptation; (17) comparison with the frozen prototype. Slice B is **not** to be marked accepted before that preview.

### 22.6 Programme boundary
Slices C/D/E remain **NOT AUTHORISED / NOT STARTED**; EA-BL-002, WP-COM and FEF-TLC-001 unchanged. This authorisation covers Slice B only and authorises no other package. Carried constraints: N4 binding (no Business Review threshold on any Staff surface); N1 must not be widened (D6).

---

## 23. Authorisation correction pass (appended 2026-10-07, PR #306 review findings)

Eight review findings were verified against the code and are valid; the authorised status is unchanged (**`EA-BL-001-CORR-002-B` AUTHORISED / READY FOR IMPLEMENTATION**, not started). This section makes the implementation contract technically precise and is **binding on implementation**; where it conflicts with §§1–21 it governs. No code is changed here.

### 23.1 Locked acceptance requirement — purchase date and idempotency (P1)
Evidence: `resolvePurchaseDateInstant` returns a fresh `now.toISOString()` for "today"; `useRecordPurchaseMutation` hashes `JSON.stringify(payload)` (including `purchaseDate`) into the key signature; `keyForRequest` clears the held key when the signature changes. A retry that recomputes the date would therefore mint a new key and could record a second Purchase after a lost response.
Contract, for one intentional submission:
- capture the exact `purchaseDate` **once** and retain it across uncertain/network retries; **do not call `resolvePurchaseDateInstant` again for a retry**;
- retain the same idempotency key across those retries;
- reset `purchaseDate` **and** the idempotency intent only when the transaction payload intentionally changes, or Staff selects **Serve next customer** / starts a new transaction.
Future tests must prove: committed response lost → same payload + same `purchaseDate` + same key retried → **no duplicate Purchase**. (Together with §22.2: uncertain/network failures must be classified retryable so the key is retained; never solve uncertainty with a new key.)

### 23.2 Bounded backend enabler — public error discriminator (P2)
Evidence: `purchaseArtifactError`, `purchaseProgramError`, `purchaseQualifyingItemError`, `purchaseQuantityError`, `purchaseSharedPolicyError` all use `VALIDATION_FAILED`; `toHttpsError` returns one generic `purchase_command_failed`, and the web client surfaces only `validation_failed`. Per-cause copy in §12 is therefore not selectable today.
Authorised for Slice B (minimum change, **not implemented here**): expose a small stable public discriminator on the existing error path sufficient for safe Counter UX — at minimum, where the domain can reliably tell: `customer_artifact_invalid_or_not_found`, `programme_unavailable`, `qualifying_item_invalid`, `quantity_invalid`, `generic_validation_failed`. Shared-number/policy-sensitive failures may stay under a neutral customer-code or generic validation message if distinguishing them would leak policy. Requirements: no raw internal messages, stack or error detail; no protected policy data; preserve the existing error/auth architecture. The implementation scope in §17 is extended accordingly (this is the only added backend work besides the D6 own-submissions read).

### 23.3 Loyalty Number input (P2)
Canonical Loyalty Numbers are alphanumeric (three letters then three digits, e.g. `ABC-234`; `loyaltyNumber.ts` accepts an optional hyphen, case-insensitive). The Counter must use a **text/alphanumeric-capable keyboard** with suitable capitalisation/formatting; **no numeric-only `inputMode`**.

### 23.4 D1–D8 status (P2)
**D1–D8 = FOUNDER DISPOSED** (§22.1). D7 is not a "no decision needed" item: its disposition is Business name only, no fabricated station label. The §9 "Decisions required" table and the Entry 295 wording ("eight open decisions", D7 "NO") are historical and superseded.

### 23.5 Idempotent replay and authorisation (P2)
`recordPurchase` evaluates `purchase.record` **before** the idempotency peek, so current authorisation still gates every retry; a suspended/removed/revoked Staff actor's retry fails authorisation. Do **not** move replay ahead of authorisation to return a prior result after revocation. Accurate statement: **"Same-intent retries recover the original outcome when the actor remains authorised; current authorization still gates the retry."** Any earlier wording that retries always return the old result is corrected by this.

### 23.6 Counter role scope (P2)
The Counter is the **frontline purchase-recording function**. Access follows existing `purchase.record` authority: Staff, authorised Manager, Owner. Staff receive the new Counter-first landing and minimal Staff navigation (D8); the Owner/Manager shell and navigation are **unchanged**, and they may use the Counter where exposed/linked under the existing experience structure — Slice B does not redesign their shell. The future test matrix: Staff, authorised Manager and Owner may use the Counter; non-members, suspended/revoked members denied; Staff landing/nav is Staff-specific; Owner/Manager landing/nav unchanged. (The earlier "Staff-only route" phrase means "Staff-function", not role-restricted.)

### 23.7 QR fallback (P2)
The customer shell renders the opaque `qrReference` only as a QR image (`QRCodeSVG`) and offers no copy surface. Therefore **camera scan is the primary QR path and Loyalty Number entry is the real manual fallback**; "type/paste QR reference" is **not** a normal fallback. **No customer QR-reference copy feature is authorised in Slice B.** Programmatic QR-reference entry may exist only as an internal/test affordance of the scanner path. The D2 requirement "manual fallback on camera failure" is satisfied by Loyalty Number entry; "valid QR" tests exercise the scan path (or a test double of its result), and camera-permission failure falls back cleanly to Loyalty Number entry.

### 23.8 Dual-role customer registration (P2)
`RootEntry` sends any identity with an active Business membership to `/business`, where Personal context must be selected. The new-customer panel/instructions must tell such a user to **switch to / select Personal context** to see their customer Loyalty Number and QR. No same-device session mixing; no handoff token; no new redirect/token protocol (consistent with D3).

### 23.9 Programme status after correction
Slice B: **AUTHORISED / READY FOR IMPLEMENTATION** (not started/implemented/accepted/complete/merged). Slices C/D/E: NOT AUTHORISED / NOT STARTED. EA-BL-002, WP-COM, FEF-TLC-001: unchanged.
