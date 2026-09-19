> **Title:** 11THONUS-CF-001 — Cloudflare Capability & Architecture Alignment Assessment
> **Version:** 1.0 · **Status:** Assessment record — awaiting Founder review · **Classification:** Working (governance/assessment record; Miledge portfolio alignment follow-on)
> **Governing documents:** MTAIP-001; [11thONUS Infrastructure Disposition v1.0](../../00-governance/11thonus-infrastructure-disposition-v1.md); Platform Constitution Part VII hierarchy
> **Source-of-truth path:** `docs/05-implementation/reports/11thonus-cf-001-cloudflare-capability-and-architecture-alignment-assessment-2026-09-19.md`
> **Scope:** Assessment only. No production deployment, DNS change, authentication migration, database migration, runtime migration, or Cloudflare infrastructure was created. No application code was changed.

# 11THONUS-CF-001 — Cloudflare Capability & Architecture Alignment Assessment

## 1. Evidence basis

- **Exact repository/base SHA:** `a404a538e228e2d7d0cc0cbd3ca9b5918ee6fd70` (branch at assessment start: `docs/dec-legal-002-bt-draft-007`). Assessment branch: `docs/11thonus-cf-001-cloudflare-assessment-001`.
- **Authoritative sources reviewed:**
  - [11thONUS Infrastructure Disposition v1.0](../../00-governance/11thonus-infrastructure-disposition-v1.md) (Founder-accepted, MTAIP-001 §12, 2026-08-28) — **primary authority for current infrastructure state**;
  - [Decision Register](../../00-governance/decisions/decision-register.md) (last controlled update 2026-09-17, `DEC-LOY-014`) — `DEC-TECH-001/002/003/005`, `DEC-PROV-004`, `DEC-SEC-001/003`, `AUTH-P0-001` (D-A1–D-A5), `DEC-TECH-010`, `DEC-PROV-005/006`;
  - DEC-TECH-005 Cloud Region Evaluation Evidence Pack and region decision brief;
  - TRD8 (Firebase platform architecture), TRD16 (frontend/PWA), TRD20 (deployment/resilience), TRD12 (security);
  - [canonical-reference.md](../../00-governance/canonical-reference.md) (§1, §9, §10);
  - `MILEDGE-PLATFORM-ARCHITECTURE.md` (MPA-002 project declaration);
  - Implementation evidence: `firebase.json`, `apps/web/package.json`, `functions/package.json`, `apps/web` source, `functions/src`, `storage.rules`, `docs/changes/IMPLEMENTATION_CHANGES.md`.
- **MCPA-001 / KCF-001 status:** neither MCPA-001 nor KCF-001 is present anywhere in this repository (verified by full-text search of `docs/`, `MILEDGE-PLATFORM-ARCHITECTURE.md`, `README.md`). They are Miledge portfolio-level records (MCPA-001 approved; KCF-001 validated Cloudflare for a suitable Miledge workload — per the task brief, Klockit). This assessment treats them as **portfolio context, not 11thONUS authority**: Klockit's implementation is evidence of Cloudflare suitability in general, not a template for 11thONUS. No 11thONUS decision record references Cloudflare; nothing in the approved 11thONUS baseline is contradicted by Cloudflare adoption at the edge.
- **Documentation conflicts found:** none that Cloudflare findings disturb. One **premise correction** (§3.3). One previously known register-sync gap is restated, not reopened (§9).

## 2. Current 11thONUS architecture relevant to Cloudflare

Derived from the Founder-accepted Infrastructure Disposition v1.0 and verified against the live tree:

| Aspect | Current position |
|---|---|
| Frontend/runtime | React 19 + Vite 8 + TypeScript SPA, mobile-first PWA (`apps/web`), served by **Firebase Hosting** with SPA rewrite, immutable asset caching, and a CSP scoped to Firebase Auth / Cloud Functions / App Check endpoints (`firebase.json`). No SSR framework (explicitly rejected in DEC-TECH-003 evaluation). |
| Backend | **Cloud Functions** in `europe-west1` (confirmed `DEC-TECH-005`): 1 health-check HTTP endpoint + 18 callable (`onCall`) functions. **All client data access is mediated through this callable boundary** — the frontend performs no direct Firestore reads/writes. |
| Database / data authority | **Firestore is the sole authority** for all implemented material business data; `outboxEntries` is a derived/event representation, not a competing authority. No relational database exists anywhere in the architecture. |
| Authentication | **Firebase Authentication** (Google, Email/Password, optional Phone OTP) with internally generated, provider-independent `CustomerIdentityId` mapped via `authenticationReferences` — a deliberate portability seam. MVP provider scope confirmed (Phone OTP + Google; email/Apple/passkeys deferred). Staff authentication governed separately (`DEC-SEC-003`, open). |
| Firebase dependencies architecturally justified | Auth, Firestore, Cloud Functions, Hosting, App Check (client integrity), Firebase Storage client SDK (scaffolded). Confirmed under `DEC-TECH-001` ("Firebase implements the architecture; it does not define it") and Disposition §16 ("no current provider-risk requirement justifies migration"). |
| Firebase dependencies under reconsideration | **None at the infrastructure level.** Open provider decisions concern *adjacent* services: backups (`DEC-TECH-010`, `DEC-PROV-006`), notifications, monitoring-adjacent providers. SMS production classification (`EXT-TECH-001`) is pending as a launch-readiness matter. |
| Portability boundaries | (a) provider-independent internal identity via `authenticationReferences`; (b) provider-neutral outbox/domain-event representation; (c) Sentry behind a provider-abstraction layer with no-op fallback; (d) callable-boundary API surface in front of Firestore. |
| Preview/deployment workflow | **Manual/local `firebase deploy`; no automated pipeline, no persistent preview hostnames** (Disposition §5). DoD deployment/preview criteria classified at Capability-Closure/Release-Readiness level for domain-layer concerns (`DEC-GOV-010`). |
| Surfaces | Customer (public participant), Business (organisation/admin), Administration (platform admin shell with stricter access, TRD16 §16.5), Founder/internal QA preview builds (`founder-qa-preview` build mode). |
| File/object storage | Firebase Storage **scaffolded but unimplemented** — SDK wired, deny-by-default `storage.rules`, no upload/download code path, no stored assets (Disposition §8). |
| Asynchronous processing | Outbox pattern implemented and emulator-tested; **no live production trigger** (`onSchedule`/Pub/Sub unwired) (Disposition §7). |
| Security perimeter | App Check + callable-boundary authorization + Firestore/Storage rules + CSP on Hosting. No edge perimeter (WAF/DDoS/rate limiting) exists; no custom production domain is recorded anywhere in the baseline. |
| External integrations | Firebase + Sentry only. Email, SMS/WhatsApp, payments, product analytics: no code, no selected provider. |

## 3. Settled vs unresolved architecture decisions

**SETTLED** (not reopened by this assessment):
- Firebase-first infrastructure (`DEC-TECH-001`); Firebase-native classification **F** (Disposition §2, §16–17).
- React + TypeScript mobile-first PWA (`DEC-TECH-002`) and the Version 1 frontend stack (`DEC-TECH-003`).
- Firestore as sole data authority; callable-only client access boundary; outbox as derived event representation (Disposition §3, §6, §9).
- Firebase/GCP region `europe-west1` (`DEC-TECH-005`, CONFIRMED).
- Authentication strategy: Firebase-native OTP + Google within the Founder-approved Identity & Authentication Strategy (`DEC-PROV-004`); MVP providers Phone OTP + Google (`AUTH-P0-001` D-A2); provider-independent internal identity (`DEC-IDENTITY-001`); recovery order and progressive verification (`DEC-SEC-001`).
- Consumption-first commercial model (`FD-COM-001` / `DEC-SUB-014`).

**IMPLEMENTED BUT NOT YET ARCHITECTURALLY SETTLED:**
- Firebase Storage (scaffolded, unimplemented — no file-storage requirement exercised yet).
- Outbox live-trigger wiring (pattern valid and tested; no production delivery mechanism chosen/wired).
- Backup and recovery (`DEC-TECH-010`/`DEC-PROV-006` open; Disposition §11 requires resolution before meaningful production data accumulates).
- Preview/deployment pipeline (manual deploys only; no pipeline or persistent non-prod hostnames decided or built).

**UNDER ACTIVE DECISION:**
- Staff authentication on shared devices (`DEC-SEC-003`, `OPEN_ENGINEERING`).
- SMS production classification / Burundi OTP proof (`EXT-TECH-001`, PENDING — launch-readiness).
- Backup method/service, notification, and remaining adjacent provider selections (`DEC-TECH-010`, `DEC-PROV-002`, `DEC-PROV-006`).

**NOT YET DECIDED:**
- Production custom domain and public perimeter posture (no record exists; this assessment does not create one).
- Email, payments/mobile-money, product analytics providers; future public marketing pages (TRD16 §1.13 speculative); any API surface beyond the callable boundary.

### 3.3 Premise correction (recorded, not silently reconciled)

The task premise states that "authentication, database and future deployment choices are being aligned." Repository evidence refines this:
- The **database** position is not in flux — Firestore authority is SETTLED and was re-affirmed Founder-side by the MTAIP-001 alignment closure. No "database choice" decision is open.
- **Authentication** is settled at strategy and MVP-provider level; what remains open is *staff* authentication and the *SMS production* classification — adjacent concerns, not the customer auth provider.
- **Deployment** is genuinely unsettled (manual only; no pipeline decision recorded).

These refinements do not change any classification below but prevent this assessment from being read as implying an open database or customer-auth-provider selection.

## 4. Capability fit matrix

| # | Capability | Classification | Adopt independently of app runtime? | Lock-in exposure |
|---|---|---|---|---|
| 1 | DNS / TLS | **LIKELY LATER** | Yes — fully | Minimal |
| 2 | CDN / caching | **NOT NEEDED** (duplicative) | n/a | — |
| 3 | WAF | **LIKELY LATER** | Yes — fully | Minimal |
| 4 | DDoS protection | **LIKELY LATER** (bundled with proxied zone) | Yes — fully | Minimal |
| 5 | Rate limiting | **ARCHITECTURE-DEPENDENT** | Yes, but only meaningful with a proxied custom domain | Low–moderate |
| 6 | Turnstile | **ARCHITECTURE-DEPENDENT** | Yes — widget + server-side verify callable, adapter-wrapped | Low (if adapter-wrapped) |
| 7 | Cloudflare Access | **LIKELY LATER** (non-production/internal only) | Yes — fully (hostname-scoped) | Moderate, internal-only (acceptable) |
| 8 | Cloudflare Tunnel | **NOT NEEDED** | Yes | — |
| 9 | Cloudflare Containers | **REJECT** as default; ARCHITECTURE-DEPENDENT only for future long-running workloads | n/a | High |
| 10 | Workers | **REJECT** for application logic; NOT NEEDED as edge middleware today | n/a | High |
| 11 | Pages | **NOT NEEDED** (hosting settled on Firebase Hosting) | n/a | High |
| 12 | R2 | **ARCHITECTURE-DEPENDENT** | Yes (S3-compatible API) | Moderate if kept behind S3 API |
| 13 | Hyperdrive | **NOT NEEDED** | n/a | — |
| 14 | Queues | **NOT NEEDED** | n/a | High |

### 4.1 Per-capability justification

**DNS / TLS — LIKELY LATER.**
- *Requirement:* production reachability for the Burundi pilot on a branded, trusted domain; no custom domain or production deployment exists today.
- *Fit:* Cloudflare DNS/TLS fronts Firebase Hosting and callable endpoints transparently; no application change.
- *Dependencies:* a registered domain; a production hosting/deployment decision; awareness of the settled `DEC-LEGAL-006`/`DEC-TECH-005` jurisdictional posture (operator Rwanda, pilot Burundi, region `europe-west1`).
- *Portability:* DNS delegation is the most portable edge control that exists; migration is a zone transfer.
- *Lock-in:* minimal. *Runtime independence:* fully independent.
- *Evidence:* Disposition §5 (Hosting, manual deploys); `firebase.json` (no domain config); TRD20 (no domain record).

**CDN / caching — NOT NEEDED.**
- *Requirement:* none unmet. Firebase Hosting already serves content-hashed assets with immutable cache headers and `no-cache` HTML (`firebase.json`; Vite builds). Firebase Hosting rides Google's edge.
- *Conclusion:* adding Cloudflare CDN would duplicate a settled delivery path without a requirement.
- *Revisit only if* post-launch latency evidence from Burundi/Kigali shows a gap. *Evidence:* `firebase.json` headers; DEC-TECH-003 build evaluation.

**WAF — LIKELY LATER.**
- *Requirement:* protect trust-critical commercial endpoints (registration, verification, redemption callables) from common web attacks; today only App Check + callable authorization defend them.
- *Fit:* managed WAF rules apply to any hostname proxied through the Cloudflare zone, with zero application change. Raw `*.cloudfunctions.net` hostnames cannot be WAF-covered — the prerequisite is serving the app (and ideally the callable endpoints) under the custom domain.
- *Dependencies:* proxied custom domain. *Portability:* WAF rule concepts port across providers; minimal lock-in. *Runtime independence:* full.
- *Evidence:* Disposition §6 (callable boundary); `firebase.json` CSP; TRD12.

**DDoS protection — LIKELY LATER.**
- *Requirement:* availability protection for a trust-critical platform; no current attack evidence or incident record exists.
- *Fit:* always-on DDoS protection is bundled with a proxied Cloudflare zone — no separate adoption decision, no application change. GCP provides baseline infrastructure defense in parallel.
- *Dependencies:* same as WAF. *Portability:* high. *Runtime independence:* full. *Evidence:* TRD20 availability posture; no incident record in repository.

**Rate limiting — ARCHITECTURE-DEPENDENT.**
- *Requirement:* real but narrow — abuse control on authentication/verification flows (OTP abuse, enumeration), not a generic edge requirement. The authoritative control points are App Check and the callable boundary; edge rate limiting is inapplicable without a proxied custom domain.
- *Fit:* could complement (not replace) App Check. Must not become the primary abuse-control mechanism; the primary mechanisms are already settled and Firebase-native.
- *Dependencies:* proxied custom domain; abuse-model evidence — naturally paired with the `EXT-TECH-001` SMS production classification, which governs exactly the most abuse-exposed and cost-exposed flow.
- *Portability:* low–moderate (rule semantics differ per provider). *Runtime independence:* yes. *Evidence:* `AUTH-P0-001` D-A4; Disposition §6.

**Turnstile — ARCHITECTURE-DEPENDENT.**
- *Requirement:* potential protection of public, unauthenticated or low-friction customer flows (registration initiation, sign-in abuse, disputes/review submissions, any future public pages). No abuse evidence exists yet, and App Check already attests the platform's own clients.
- *Fit:* integrates without runtime relocation — widget in the SPA + verification inside the existing callable boundary, wrapped behind a small provider-neutral "human-verification" adapter so the widget is swappable (same pattern as the existing Sentry abstraction).
- *Dependencies:* abuse evidence or a concrete public flow; adapter boundary; a CSP update in `firebase.json` (trivially reversible; the only code-adjacent change).
- *Portability:* good if adapter-wrapped. *Runtime independence:* yes. *Evidence:* `AUTH-P0-001`; App Check wiring in CSP; Sentry abstraction precedent (Disposition §10).

**Cloudflare Access — LIKELY LATER (non-production/internal surfaces only).**
- *Requirement:* protect Founder QA previews, future staging/internal hosts, and the Administration shell's non-production instances (`founder-qa-preview` build mode exists; TRD16 §16.5 requires stricter admin access).
- *Fit:* hostname-scoped Access policies sit **in front of** those hosts and never touch customer sign-in — Firebase Authentication remains the sole customer authentication provider, satisfying the explicit constraint. Internal users would present an Access identity (e.g. Google) before reaching the Firebase app.
- *Dependencies:* Cloudflare zone + persistent non-production hostnames — which do not exist today (manual deploys only). This is the binding prerequisite.
- *Portability:* moderate — Access policies are internal-only and disposable; losing them degrades convenience, not the product.
- *Runtime independence:* full. *Evidence:* Disposition §5; `apps/web` preview build modes; `DEC-GOV-010` (deployment classified at later lifecycle stages).

**Cloudflare Tunnel — NOT NEEDED.**
- *Requirement:* none. Tunnel exposes self-hosted/internal origin services; 11thONUS has no self-hosted origin — everything is cloud-hosted (Firebase), and emulators run locally during development.
- *Revisit only if* a self-hosted internal service is ever introduced (none is decided or implied by any approved decision). *Evidence:* Disposition §2 (classification F — fully cloud-hosted).

**Cloudflare Containers — REJECT (as default); ARCHITECTURE-DEPENDENT only for future workloads.**
- *Requirement:* none. The application compute boundary is 19 Cloud Functions callables; no workload needs containers, long-running processes, or custom runtimes.
- *Klockit's validation is portfolio evidence, not a 11thONUS requirement.* Adopting Containers would mean relocating application runtime for no demonstrated need — explicitly prohibited by this review's constraints and by Disposition §16 ("migrating for theoretical portability alone would add cost and complexity without demonstrated product value").
- *Revisit only via* Disposition §18 trigger 6 (a future capability demonstrating material need for another infrastructure component).
- *Evidence:* Disposition §6; `functions/package.json` (Node 20 firebase-functions); DEC-TECH-001.

**Workers — REJECT for application logic; NOT NEEDED as edge middleware today.**
- *Requirement:* none. Moving business logic into Workers would (a) relocate runtime without cause, (b) duplicate the callable boundary, and (c) create the deepest form of Cloudflare coupling (Workers runtime APIs).
- *Boundary note:* if edge-level request manipulation is ever genuinely required on a Cloudflare-proxied zone, a minimal, disposable Worker (e.g. header normalization) is acceptable *as edge configuration*, never as application logic. Nothing today requires even that.
- *Evidence:* Disposition §6; DEC-TECH-003's explicit rejection of server-rendering runtimes for the frontend.

**Pages — NOT NEEDED.**
- *Requirement:* none. Frontend hosting is settled on Firebase Hosting (`DEC-TECH-001`, TRD8 §8.2 "Hosting = PWA hosting", Disposition §5). Migrating hosting to Pages would be provider substitution without requirement, and would break the current CSP/rewrite header model for no gain.
- *Evidence:* `firebase.json` hosting config; DEC-TECH-003 static-build evaluation.

**R2 — ARCHITECTURE-DEPENDENT.**
- *Requirement:* no exercised object-storage requirement exists (Disposition §8: Storage scaffolded, unimplemented, no stored assets). The provider for file storage is not yet a live decision because the capability has no consumer.
- *Fit:* R2 exposes an S3-compatible API, so it *could* serve as a provider-neutral object-storage backend if/when a storage abstraction (bucket-style interface behind a port) is introduced. Firebase Storage is already scaffolded and Firebase-native; it remains the default unless its own decision record says otherwise.
- *Dependencies:* a future file-storage requirement (e.g. receipts, exports, business logos) and a governed provider decision. Do not adopt now.
- *Portability:* preserved if and only if access stays behind an S3-compatible interface rather than R2-native bindings (Workers R2 bindings would violate the portability boundary).
- *Evidence:* Disposition §8, §12 (future domains have no recorded authority); `storage.rules` deny-by-default placeholder.

**Hyperdrive — NOT NEEDED.**
- *Requirement:* none. Hyperdrive accelerates connections to SQL databases (Postgres/MySQL). **No SQL database exists in 11thONUS and none is decided**; the data authority is Firestore behind the callable boundary. Introducing Hyperdrive would presuppose a database migration — prohibited.
- *If a relational store is ever selected* (a separate architecture decision under Disposition §18), Hyperdrive's value then depends on the chosen database *and* runtime topology (it benefits Workers/edge-origin topologies specifically). Until both are settled, the question is not askable.
- *Evidence:* Disposition §3, §6; no SQL dependency anywhere in `package.json` manifests.

**Queues — NOT NEEDED.**
- *Requirement:* no asynchronous workload requires external queueing today. The outbox pattern (write-side outbox, transactional claim, backoff, dead-lettering) is implemented, emulator-tested, and deliberately provider-neutral; its live trigger is unwired by design, awaiting the first work package that needs production event processing (Disposition §7).
- *Fit:* adopting Cloudflare Queues would bind event delivery to the Cloudflare runtime (Queues consume from Workers), contradicting the provider-neutral outbox representation and forcing a runtime foothold. When the live trigger is wired, Firebase-native mechanisms (scheduled functions / Pub/Sub) match the settled infrastructure.
- *Evidence:* Disposition §7, §9; `functions/src` outbox implementation and emulator tests.

## 5. Answers to the particular questions

1. **DNS/TLS/WAF/CDN/DDoS/rate limiting now?** Not *immediately* actionable — every one of these (except nothing) requires a proxied custom production domain, which does not exist and is itself undecided. They are the single best-fit future package: zero application change, fully portable, runtime-independent. CDN alone is not needed at all (Firebase Hosting already caches at edge).
2. **Turnstile for public customer flows?** Potentially material for registration initiation, sign-in abuse, disputes/review submissions, and any future public pages — but only once abuse evidence or a concrete public flow exists, and only behind a provider-neutral verification adapter alongside (never instead of) App Check.
3. **Access for Founder/staging/internal preview?** Yes, genuinely valuable and non-interfering: hostname-scoped Access on non-production/internal hosts leaves customer Firebase Authentication untouched. Blocked today only by the absence of persistent non-production hostnames (manual deploys only).
4. **Hyperdrive after database settles?** The database is already settled (Firestore). Hyperdrive is a SQL-acceleration product with no 11thONUS object. Direct access is a non-question today: all data access is mediated by the callable boundary, which is the settled and correct topology. Revisit only if a separate architecture decision ever selects a SQL store *and* an edge-origin runtime topology.
5. **Containers / Workers / Pages / other runtime?** The application runtime genuinely fits its current settled shape: static PWA on Firebase Hosting + callable Cloud Functions. No requirement favors Containers, Workers, or Pages. A portable container-based runtime would be a *migration*, not an improvement, under every current decision.
6. **R2 with provider-neutral abstraction?** Yes in principle — R2's S3-compatible API fits a bucket-port abstraction — but there is no storage requirement yet and Firebase Storage is already scaffolded. Classify ARCHITECTURE-DEPENDENT; revisit with the first real file-storage requirement.
7. **Queues?** Not justified. The provider-neutral outbox already covers the asynchronous need at the representation level; delivery wiring is deliberately deferred and will be Firebase-native when wired.
8. **Decisions now vs later?** *Now:* only governance — record this assessment; no infrastructure. *Gated on production domain/deployment decision:* DNS, TLS, WAF, DDoS. *Gated on persistent non-prod hostnames:* Access. *Gated on abuse evidence / EXT-TECH-001:* rate limiting, Turnstile. *Gated on future workload decisions (§18 triggers):* R2, Containers, Workers, Queues, Hyperdrive.
9. **Edge/security-perimeter-only capabilities?** DNS/TLS, WAF, DDoS, Access, Tunnel (in principle), rate limiting — all protect reachability without touching the portable application core. CDN would too but is duplicative.
10. **Material dependency increase?** The edge package (DNS/TLS/WAF/DDoS/Access) creates only reachability-level dependency: a zone can be transferred and rules re-expressed elsewhere; justified by the perimeter requirement alone. Turnstile/rate limiting add mild coupling, justified only with abuse evidence. Workers/Pages/Containers/Queues/Hyperdrive/D1 would create deep runtime/data coupling — all rejected or deferred, so no unjustified dependency is recommended.

## 6. Immediate low-risk edge/security opportunities

None executable today without violating this assessment's own scope (no DNS changes, no new infrastructure, no production deployment). The genuine low-risk opportunity is **sequencing**, not adoption:
- When the production custom-domain decision is made (pre-launch, alongside the settled `DEC-TECH-005` region and the pending backup decisions), adopt **DNS + TLS + proxied zone (managed WAF + DDoS)** as one edge-perimeter package — zero application change, full portability.
- When persistent staging/preview hostnames first exist, scope **Access** to those hostnames only.

## 7. Architecture-dependent capabilities (holding pattern)

Rate limiting, Turnstile, R2 (and, per revisitable triggers, Containers/Workers/Queues/Hyperdrive). Each is recorded with its gating condition in §4–§5; none has a current requirement.

## 8. Rejected / non-required capabilities

- **Containers, Workers (for app logic), Pages, Queues, Hyperdrive** — rejected or not needed for the reasons in §4.1. D1 is not among the reviewed capabilities but is addressed by the same logic and the explicit constraint: not introduced because it is Cloudflare-native; no SQL requirement exists.
- **Cloudflare as customer authentication provider** — out of scope by constraint and contrary to settled `DEC-PROV-004`/`AUTH-P0-001`; Access on internal hosts is not customer authentication.

## 9. Unresolved technology decisions that block final selection

- **Production custom domain / perimeter posture** — not yet decided; blocks the entire edge package.
- **Deployment/preview pipeline** — manual only; blocks Access usefulness (no persistent hostnames).
- **`EXT-TECH-001` (SMS production classification)** — gates the abuse-control evaluation (rate limiting, Turnstile) for the most exposed flows.
- **`DEC-TECH-010` / `DEC-PROV-006` (backup)** — open; not Cloudflare-related but must precede meaningful production data (Disposition §11).
- **`DEC-SEC-003` (staff authentication)** — open; affects the internal/admin surface threat model that Access would sit within.
- Restated, not reopened: the Decision Register's `DEC-TECH-005`/`DEC-LEGAL-006` register-sync traceability gap recorded in Disposition §19 remains as documented.

## 10. Recommended sequencing

1. **Now:** record this assessment; no infrastructure. Note in the register (via separate governed action) that Cloudflare is approved-in-principle only at the edge/security-perimeter level.
2. **Pre-launch (production domain decision):** DNS + TLS + proxied zone with managed WAF and DDoS — one package, edge-only.
3. **With first persistent staging/preview hostnames:** Cloudflare Access on internal hostnames only.
4. **With abuse evidence / `EXT-TECH-001` resolution:** evaluate Turnstile (adapter-wrapped) and edge rate limiting as complements to App Check and the callable boundary.
5. **On §18 reconsideration triggers only:** R2, Containers, Workers, Queues, Hyperdrive, D1 — each requiring its own governed architecture decision with the demonstrated-need chain (requirement → fit → benefit → portability impact → implementation boundary).

## 11. Portability / lock-in assessment

- **Edge perimeter capabilities** preserve the portable core entirely: application code, data authority, and runtime remain Firebase-native and provider-independent. The only Cloudflare artifacts are zone-level configuration.
- **Turnstile** must be adapter-wrapped to retain swappability; **R2**, if ever adopted, must stay behind an S3-compatible interface (never R2-native bindings).
- **Rejected/deferred capabilities** are precisely those that would move logic, data, or runtime into Cloudflare-specific substrates — the deep-lock-in category.
- Net effect of this assessment's recommendations: **portable core + Cloudflare edge** is achievable with zero change to the portable core.

## 12. Conflicts with current approved architecture decisions

**None.** No Cloudflare classification above contradicts `DEC-TECH-001`–`005`, `DEC-PROV-004`, `AUTH-P0-001`, the Infrastructure Disposition, or any product/domain decision. The only recorded refinement is the premise correction in §3.3, which corrects the assessment task's framing, not any approved decision.

**Recommendation for separate decision processes (not made here):** (a) when the production-domain decision arises, adopt the edge-perimeter package; (b) if abuse evidence emerges, a bounded Turnstile/rate-limiting decision behind an adapter; (c) no decision to reconsider any existing architecture decision is warranted by these findings.

## 13. Bounded live pilot — is one justified now?

**No.** A pilot would require DNS changes, new Cloudflare infrastructure, or persistent non-production hostnames — none of which exist, and all of which are excluded by this assessment's scope. The highest-value bounded pilot (Access on a single staging hostname) becomes justified **at the moment the first persistent non-production hostname exists**; define its boundary then as: one internal hostname, one Access policy, no customer-facing surface, removable without application change.
