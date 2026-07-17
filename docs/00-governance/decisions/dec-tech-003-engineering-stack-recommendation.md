> **Title:** DEC-TECH-003 — Version 1 Engineering Stack Evaluation & Recommendation
> **Version:** 1.0 · **Status:** Active governance record — recommendation prepared, awaiting Engineering Lead sign-off · **Classification:** Working (governance record, engineering evaluation)
> **Governing document:** [Decision Register](decision-register.md) DEC-TECH-003; [Engineering Transition D1 Agenda](engineering-transition-d1-agenda.md) §4; [Version 1 Engineering Blueprint](../../02-technical/version-1-engineering-blueprint.md)
> **Source-of-truth path:** `docs/00-governance/decisions/dec-tech-003-engineering-stack-recommendation.md`
> **Last controlled update:** 2026-07-17 (Engineering Decision Sprint 1 — created)

# DEC-TECH-003 — Version 1 Engineering Stack Evaluation & Recommendation

## 0. Status and What This Document Does Not Do

This is an **evaluation and recommendation**, not a closure of DEC-TECH-003. Per the [Decision Governance Workflow](../decision-governance-workflow.md) §2 and §9 (established and held consistently since Engineering Transition Phase 0B's [Engineering Decision Closure Recommendations](engineering-decision-closure-recommendations.md)), only the Engineering Lead may approve an OPEN_ENGINEERING record, and the documentation/analysis role never fills approval fields on its own initiative. This document does the analysis TRD23 §23.22 OTD-001 calls for ("to be proposed by engineering") and prepares an exact, ready-to-sign register update (§9 below) — it does not flip DEC-TECH-003's status. No repository was created, no code was written, no package was installed, and no CI/Firebase resource was touched anywhere in producing this document.

---

# PART 1 — Engineering Characteristics of 11thONUS

Before evaluating any technology, this section documents what kind of system 11thONUS actually is, drawn entirely from approved documentation — not assumed.

## 1.1 It Is Three Distinct Applications Sharing One Backend

TRD16 §16.4 defines three principal application surfaces — Customer, Business, Administration — each with different users, different security postures, and different navigation (§16.13). §16.5 explicitly leaves the deployment shape open ("one frontend codebase with separate application shells, or as separately deployed applications sharing common packages") but requires the administration shell to be "capable of separate deployment" with "stricter security and access requirements." This is a **multi-shell, domain-organized** system, not a single monolithic SPA.

## 1.2 It Is Firebase-First, Not Backend-Agnostic

TRD8 §8.2 assigns exact responsibilities to exact Firebase services (Firestore for data, Cloud Functions for logic, Hosting for the PWA, Cloud Messaging for push, App Check for client integrity). TRD16 §16.8 requires a **centralized Firebase client boundary** — the frontend never scatters raw SDK access. Any frontend stack choice has to integrate cleanly with the Firebase Web SDK as a first-class citizen, not treat it as one API among many.

## 1.3 It Is a PWA With No Native App in Scope

TRD16 §16.20–16.22 (PWA Requirements, Installation Experience, Service Worker Responsibilities) and FR-FE-008/FR-FE-009 require installable-but-optional PWA behavior with full, un-degraded browser use. There is no native mobile app in the Version 1.0 documentation baseline — "future mobile applications" appear only as a long-term consideration (Part 6 below), not a Version 1 requirement.

## 1.4 Trust-Critical Actions Are Server-Authoritative, Always

This is the single most consequential engineering characteristic, and it comes directly from the platform's core mechanic (Product Experience Principles §1.2; Constitution Pillar Two). TRD16 codifies it as binding rules, not preference: FA-002 ("critical commercial actions require trusted server confirmation"), FA-007 ("offline activity shall never appear authoritative before synchronization"), FA-008 ("reward redemption requires online validation in the MVP"), FA-013 ("optimistic UI shall not imply successful commercial actions before server confirmation"), and §16.48's explicit list of forbidden optimistic-UI targets (verification, activation, redemption, sync, payment). Any frontend architecture choice has to make this boundary easy to hold, not something engineers have to remember to enforce by discipline alone.

## 1.5 It Is Offline-Tolerant for Business Capture, Not Offline-Authoritative

TRD16 §16.23–16.32 define a precise offline model: businesses may queue Purchase Record drafts locally (§16.24); customers may only view cached data, never verify or redeem offline (§16.25–16.26); a specific local queue schema is defined (§16.27: client request ID, idempotency key, business context, customer reference, Reward Program ID + cached version, quantity, timestamp, device session, retry count, sync state); synchronization is order-preserving and idempotent (§16.29, FA-018). This is a **narrow, well-specified offline surface**, not a general offline-first architecture — the stack needs to support it precisely, not maximally.

## 1.6 State Is Explicitly Three Separate Categories

TRD16 §16.11 is unusually prescriptive for a "not an implementation task" chapter: it names **Server State**, **Application State**, and **Form/Interaction State** as distinct categories with distinct examples and requirements, and states outright that they "shall not be stored in one global mutable state container without a clear need." This is a direct architectural constraint on the state-management evaluation in Part 3, not something this evaluation invents.

## 1.7 QR and Camera Access Are Core, Not Peripheral

TRD16 §16.18–16.19 and FR-FE-019/FA-011 make QR display and camera-based scanning a first-class interaction (Interaction Patterns §6–7; Trust Indicators §8's Merchant Identity and §9's Customer Confirmation both route through this). Camera permission handling, flashlight support, and a **manual-code fallback** are explicit requirements, not nice-to-haves.

## 1.8 Low-End Android and Constrained Networks Are the Baseline, Not the Edge Case

TRD16 §16.51 (Performance Budget) sets targets explicitly "measured on representative lower-cost devices" over "a typical 4G connection" — meaningful first view within 2 seconds, usable core action within 3 seconds. §16.52 requires code splitting so "customers shall not download administration code" and "staff shall not download advanced reporting code unless required." This is a bundle-size- and runtime-cost-sensitive environment, not a desktop-first one where JavaScript payload is an afterthought.

## 1.9 Internationalization Is Structural, Not Cosmetic

FR-FE-014/015 require full English/French support at launch and require the frontend to support **future** Kirundi, Swahili, and Kinyarwanda "without restructuring." §16.40 requires translation-key lookup, namespace loading, language switching, fallback handling, pluralization, localized dates/currency/numbers, and explicit layout testing for longer French copy. This has to be a first-class architectural concern, not a library bolted on later.

## 1.10 Accessibility Is a Named, Testable Standard

§16.49 and FR-FE-017 require WCAG 2.1 AA (or current equivalent) with semantic HTML, keyboard navigation, visible focus, screen-reader labels, sufficient contrast, no color-only meaning, and reduced-motion support. §16.67 requires this to be tested with real keyboard and screen-reader use, not automated tooling alone.

## 1.11 Auditability and Governance Discipline Extend Into the Frontend

FA-003 ("hidden UI controls are not authorization controls") and FA-017 ("shared-device use shall retain individual staff accountability") show the platform's Trust value (Constitution) is enforced at the UI layer, not assumed to be a server-only concern. Combined with the Engineering Standards Pass 1 suite's existing documentation-conventions.md (rule-ID citation in code) and testing-conventions.md (idempotency/state-transition test requirements for every sensitive write), this is a codebase that expects to be **audited**, not just shipped.

## 1.12 Governance Is Versioned and the Frontend Must Not Fight It

TRD23's governance model, the Decision Register, and the Requirements Traceability Matrix all assume every requirement traces to an implementation location. A frontend stack that makes this traceability hard (e.g., heavily generated code, opaque conventions, or a framework that obscures where a given rule is enforced) works against the platform's own governance discipline, independent of any technical merit it might otherwise have.

## 1.13 Future Scope Exists but Is Explicitly Deferred, Not Ignored

The MVP explicitly excludes gift cards, marketplace discovery, POS integrations, and multi-branch management (PRD0 §19.2), while stating "the architecture may allow future addition of these features." TRD23 §23.32 (context extracted for this evaluation) notes: "Public business pages may exist where required for Reward Program visibility, but they shall not expand into a full marketplace during the MVP" — a specific, disclosed signal that a public-facing (non-authenticated), potentially SEO-relevant surface is plausible *later*, even though nothing in the current documentation requires it *now*. This is treated as a migration-risk input in Part 3/6, not a current requirement.

---

# PART 2 — Engineering Requirements the Frontend Stack Must Satisfy

Each requirement below is derived directly from Part 1 and cites its source; none are invented.

| Requirement | Source | What it demands of the stack |
|---|---|---|
| **Developer Experience** | Engineering Principles (Phase 6); solo/small-team reality of this programme | Fast local iteration, minimal config ceremony, strong TypeScript tooling — a small team cannot absorb a framework with a steep operational learning curve. |
| **Maintainability** | Constitution "Sustainability" value; Engineering Standards Pass 1 | Conventions that hold up as the team grows; domain-based structure (§16.6) must map cleanly onto the chosen tools' own organizing model. |
| **Scalability** | Part 6 below (millions of customers, thousands of businesses) | Code-splitting and lazy-loading support (§16.52) at the tool level, not bolted on. |
| **Performance** | §16.51 Performance Budget | Small initial bundle, fast cold start, low-end-Android-representative performance. |
| **Accessibility** | §16.49, FR-FE-017 | Component foundation must not fight WCAG 2.1 AA — ideally builds on accessible primitives by default. |
| **Offline capability** | §16.23–16.32 | Server-state layer must support cache/offline patterns; a dedicated local queue is needed for the exact schema in §16.27. |
| **Testing** | §16.66–16.70 | Unit, component, integration (incl. Firebase Emulator), and E2E layers, each named explicitly. |
| **Deployment** | TRD8 §8.2 (Hosting = "PWA hosting"), TRD20 §20.16–20.17 | Output must be deployable as static assets to Firebase Hosting inside the existing environment/CI model — not require a separate Node application server. |
| **PWA support** | §16.20–16.22, FR-FE-008/009 | Manifest, service worker, install flow, offline shell — natively supported, not hand-rolled from scratch. |
| **Firebase integration** | §16.8–16.10 | First-class SDK support; centralizable client boundary. |
| **Internationalization** | §16.40, FR-FE-014/015 | Namespace-based, fallback-capable i18n framework with pluralization and locale-aware formatting. |
| **Component architecture** | §16.6–16.7 | Clear presentation/feature/domain-hook/infrastructure layering must be expressible without fighting the framework's own conventions. |
| **State management** | §16.11 (three explicit categories) | No single global store forced onto server state, app state, and form state alike. |
| **Data fetching** | §16.9–16.11.1 ("dedicated query and cache layer... invalidation... offline cache") | A server-state library matching this description almost verbatim. |
| **Error handling** | §16.46–16.47, FR-FE-018 | Standardized error/loading/empty/retry states across every async workflow. |
| **Type safety** | DEC-TECH-002 (React+TS, CONFIRMED); Engineering Standards' TypeScript Conventions | End-to-end type safety from validation schema through to UI props, ideally without duplicate type declarations. |
| **Form handling** | §16.36 Form Standards, §16.35 | Progressive disclosure, close-to-field validation, draft preservation, low re-render cost on constrained devices. |
| **Validation** | §16.36, shared with server-side validation per TRD11 §11.34's `fieldErrors` shape | A schema library expressive enough to mirror server validation and produce the same field-error shape. |
| **Security** | §16.70, FA-002/003/012/013 | No security decision may live only in the UI; local storage must be minimal and clearable on sign-out. |
| **Build performance** | Engineering Principles (fast feedback loops); §16.51 | Fast rebuilds during development; efficient production bundling. |
| **Future extensibility** | Part 6; PRD0 §19.2 | Must not foreclose gift cards, future public pages, multi-country/multi-language, or a future API surface. |
| **Operational simplicity** | Constitution "Sustainability"; TRD20's environment model | Fewer moving parts to operate (no separate app-server runtime) fits the existing Firebase-only operational model exactly. |

---

# PART 3 — Candidate Technology Evaluation

Each area below evaluates only realistic candidates already implied or reasonably expected given Part 1–2 — not an exhaustive survey of the JavaScript ecosystem.

## 3.1 Build Tool

| Candidate | Fit assessment |
|---|---|
| **Vite** | Produces a static-asset build that deploys directly to Firebase Hosting (TRD8 §8.2's "Hosting = PWA hosting" responsibility) with no separate server runtime. Fast dev server and HMR directly serve the "Developer Experience" and "Build performance" requirements (Part 2). Mature `vite-plugin-pwa` (Workbox-based) directly satisfies §16.20–16.22. No SSR/SEO requirement exists anywhere in the current documentation (§1.13's disclosed future public-page possibility aside) to justify the added operational surface of a server-rendering framework. |
| **Next.js** | Its core differentiator — server-side rendering / incremental static regeneration — answers a requirement (SEO, public-page rendering) that does not exist in the MVP scope and is only speculatively possible later (§1.13). Adopting it now would mean running (or provisioning for) a Node rendering runtime that TRD8's Firebase-service responsibility table does not assign to anything — Hosting is scoped to static/PWA delivery, and Cloud Functions are scoped to "business logic and workflows" (§8.2), not page rendering. This is a real architectural mismatch, not a style preference. |
| **Remix** | Same fundamental mismatch as Next.js — a server-rendering-first framework solving a problem (dynamic SSR) this platform's documentation does not currently have, at the cost of a non-static deployment model. |

## 3.2 Routing

| Candidate | Fit assessment |
|---|---|
| **React Router** | The most mature, widely adopted React routing library; directly supports the nested-shell structure (§16.5's Customer/Business/Administration shells, §16.6's domain-based `routing/` folder) via nested routes and layout routes. Large community, long track record, low learning-curve risk for a small team. |
| **TanStack Router** | Offers stronger compile-time type safety for routes and params — a genuine advantage given the platform's type-safety requirement (Part 2) — but is a newer library with a smaller community and less production track record at the time of this evaluation. Given Engineering Principle "Simple Beats Clever" and the "Community maturity"/"Maintenance outlook" evaluation criteria (Part 4), its type-safety benefit does not yet outweigh React Router's maturity for a small, solo-heavy engineering team that cannot easily absorb an unexpected breaking change in a less-battle-tested router. |

## 3.3 State Management (Evaluated Separately, per TRD16 §16.11)

### 3.3.1 UI/Application State
Role context, active business, language, connectivity state (§16.11.2) are narrow, low-cardinality pieces of state. React's built-in Context + `useState`/`useReducer` is sufficient and keeps the dependency surface minimal; a dedicated library (Redux, Zustand, Jotai) is not justified by anything in the documented scope and would violate §16.11's explicit instruction against one global container. Where a genuinely cross-cutting piece of client-only state emerges beyond what Context comfortably handles (evaluated during implementation, not assumed now), a minimal atomic store (e.g. Zustand) is preferable to Redux's boilerplate — but this is not required by Version 1 scope as documented.

### 3.3.2 Server State
See §3.4 below — this is the "dedicated query and cache layer" §16.11.1 explicitly calls for.

### 3.3.3 Form State
See §3.5 below.

### 3.3.4 Authentication State
Firebase Authentication's own `onAuthStateChanged` observable, wrapped in a thin context inside the centralized Firebase client boundary (§16.8) — not a separate state library. Introducing a second state-management tool for auth would duplicate what the Firebase SDK already exposes.

### 3.3.5 Offline State
A purpose-built module over IndexedDB (§16.28) implementing exactly the queue schema §16.27 specifies (client request ID, idempotency key, business context, customer reference, Reward Program ID + version, quantity, timestamp, device session, retry count, sync state). No general-purpose "offline library" in the ecosystem matches this exact, narrow schema — evaluated and rejected as a category: adopting a generic offline-sync framework would either be under-specified (forcing the same custom work anyway) or over-broad (syncing more than the deliberately narrow §16.24–§16.27 surface permits), risking exactly the "trust erosion" Part 1.4 identifies as the platform's central risk.

## 3.4 Server State

| Candidate | Fit assessment |
|---|---|
| **TanStack Query** | Matches §16.11.1's required capability list almost point for point: request deduplication, retries, invalidation, pagination, loading states, stale-state handling, offline cache. Works identically whether the underlying call is a Cloud Functions callable command (§16.9) or a permitted direct Firestore read (§16.10) — one consistent caching/invalidation model for both of TRD16's two documented data-access paths. Large, mature community; framework-agnostic (reduces migration risk if the UI layer ever changes). |
| **RTK Query** | Technically capable, but it is a module of Redux Toolkit and pulls in Redux's global-store model as a dependency of adopting it — in direct tension with §16.11's instruction against one global container for state that TRD16 explicitly separates into categories. Choosing it would mean either fighting that coupling or accepting Redux for state categories (§16.11.2/16.11.3) that do not need it. |
| **Native Firebase listeners (`onSnapshot`) alone, no library** | Real-time listeners are appropriate for specific live-data cases (e.g. a purchase awaiting verification), but used as the *only* data-fetching mechanism they provide no built-in deduplication, retry policy, pagination helpers, or offline-cache ergonomics — all explicitly required by §16.11.1. The recommended approach (§8 below) uses TanStack Query as the general layer and lets specific real-time cases use Firestore listeners *underneath* a TanStack Query subscription where genuinely needed, rather than choosing one exclusively over the other. |

## 3.5 Forms

| Candidate | Fit assessment |
|---|---|
| **React Hook Form** | Uncontrolled-input-first design minimizes re-renders — directly relevant to the low-end-Android performance requirement (Part 1.8) — and integrates with schema validation via a resolver pattern. Widely adopted, mature, low learning curve. |
| **TanStack Form** | Newer, smaller community than React Hook Form at the time of this evaluation; promising but carries more maintenance-outlook uncertainty for a platform that needs forms (registration, onboarding, purchase recording, dispute) to be dependable from Version 1. |
| **Formik** | Mature but generally more re-render-heavy than React Hook Form in typical usage and has seen slower recent maintenance velocity — a "Maintenance outlook" concern (Part 4) given the multi-year horizon this platform is being built for. |

## 3.6 Validation

| Candidate | Fit assessment |
|---|---|
| **Zod** | TypeScript-first: the schema *is* the type (via inference), eliminating duplicate type declarations — directly serves the "Type safety" requirement (Part 2). First-class React Hook Form resolver support. Large, actively maintained ecosystem. Its parsed-error shape maps cleanly onto TRD11 §11.34's `fieldErrors` contract (field + code + messageKey), so client and server validation can share a consistent shape even before schema code itself is shared. |
| **Valibot** | A newer, smaller-bundle alternative with a similar type-inference model — a real future candidate if bundle size becomes a measured constraint, but has less ecosystem maturity (resolver integrations, community troubleshooting resources) than Zod today. |
| **Yup** | Mature and widely used historically, but lacks Zod's native static type inference — using Yup would require maintaining separate TypeScript types alongside validation schemas, working against the "Type safety" and "reduce duplication" requirements. |

## 3.7 Component Foundation

| Candidate | Fit assessment |
|---|---|
| **shadcn/ui** | Built on Radix UI's accessible, unstyled primitives (serving §16.49/FR-FE-017 by construction) and distributed as source copied into the repository rather than an opaque npm dependency — meaning the approved Trust/Progress/Reward visual language (Design Decisions Register §DEC-UX-003; `premium_verification_system/DESIGN.md`) can be implemented exactly, without fighting another library's own design opinions. This directly serves "avoid unnecessary frameworks" and gives full control over the "High-End Minimalism" aesthetic already approved in the Stitch exploration. |
| **MUI** | Implements Google's Material Design language by default — visually and philosophically in tension with the approved "editorial-grade," non-"gamified" aesthetic (Design Anti-Patterns §9; `premium_verification_system/DESIGN.md`'s explicit rejection of decorative/childish visual tropes). Overriding MUI's opinions to match the approved direction would mean fighting the library more than using it. |
| **Mantine** | Similar concern to MUI at a smaller scale — a more opinionated, batteries-included component set than the approved minimalist, restrained visual direction calls for. |
| **Headless UI** | Shares Radix's unstyled-primitive philosophy but has a narrower component set than shadcn/ui's (which itself builds on Radix); shadcn/ui provides more of what the platform's own screens (per Interaction Patterns, Navigation Model) actually need out of the box. |

## 3.8 Styling

TRD16 §16.3 already conditionally pre-approves this: *"Tailwind CSS may be used for styling, provided that: design tokens remain centralized; accessibility is not sacrificed; class usage does not replace reusable components; customer and business experiences remain visually consistent."* This evaluation confirms Tailwind satisfies its own stated condition when paired with shadcn/ui's component-first model (utility classes compose *inside* reusable components, never replacing them) and a centralized token configuration implementing the Product Experience Principles §10 token philosophy and the approved DEC-UX-003 color roles. CSS Modules and Styled Components were not evaluated as live alternatives because TRD16 already names Tailwind as the pre-approved direction, conditional on exactly the discipline described above — evaluating a fresh alternative here would be re-opening a question the TRD has already partially answered, not genuinely open (see also DEC-TECH-004/006/007's precedent in the Engineering Decision Closure Recommendations for recognizing where documentation already answers a question).

## 3.9 Charts

Business and administration reporting (TRD15; §16.15's "Customers Close to Reward" cards) needs lightweight, React-native charting — not enterprise business-intelligence tooling, since no such requirement is documented. **Recharts** fits: React-idiomatic API, sufficient chart types for the documented reporting needs, reasonable bundle size. Heavier commercial/enterprise options were not evaluated as live candidates — nothing in TRD15 or the PRD documents a BI requirement that would justify their weight or licensing complexity.

## 3.10 Icons

**Lucide** (`lucide-react`) is the natural pairing with shadcn/ui (its own default icon set), is tree-shakeable (only used icons ship — serving the bundle-size requirement), and matches the approved "medium-weight geometric paths" icon guidance in `premium_verification_system/DESIGN.md`.

## 3.11 Tables

Business/admin screens (customer lists, transaction tables, review queues — §16.15, `concept_6_business_dashboard`) need sorting, filtering, and pagination without imposing a heavy, opinionated visual design. **TanStack Table** (headless) fits the same philosophy already chosen for components (shadcn/ui + Tailwind): the library provides table *logic*, the platform's own approved visual language provides the *appearance*. A visually-opinionated enterprise grid (e.g. AG Grid) was not selected as the live candidate — no documented requirement (Excel-like editing, complex pivoting, licensing budget) justifies its weight or its commercial-tier feature gating.

## 3.12 PWA

**`vite-plugin-pwa`** (which wraps **Workbox** under the hood) is the direct, Vite-native path to §16.20–16.22's manifest/service-worker/offline-shell/update-management requirements, and to §16.33's update-detection-without-interrupting-active-forms requirement. Workbox's caching-strategy primitives (cache-first for the app shell and static assets, network-first for data) map directly onto §16.22's listed service-worker responsibilities. Background synchronization, where the browser supports the Background Sync API, is layered on top for the offline-queue flow (§16.29) — evaluated as a progressive enhancement, since §16.22 itself says the service worker "may manage... background synchronization where supported," acknowledging it is not universally available.

## 3.13 QR Scanning

Evaluated at the requirement level (§16.19, FR-FE-019, FA-011) rather than committing to one specific npm package, since this is a narrower, more volatile leaf dependency than the architectural choices above. The requirement is: browser-camera-based scanning using a maintained JavaScript QR-decode approach (using the native `BarcodeDetector` API where the browser supports it, with a JS-decoder fallback library where it does not — matching §16.57's supported-browser matrix, which includes browsers without universal `BarcodeDetector` support), behind a small internal abstraction (consistent with §16.8's centralized-boundary philosophy) so the underlying decode library can be swapped without touching call sites, plus the mandatory manual-code fallback (FA-011) as a first-class, equally-supported path rather than an afterthought.

## 3.14 Notifications

Already answered by the approved architecture, not a fresh choice: TRD8 §8.2 assigns push notifications to **Cloud Messaging**. The frontend integrates via the Firebase Web SDK's messaging module, inside the centralized Firebase client boundary (§16.8) — evaluating a third-party push provider would contradict the already-approved Firebase-service responsibility table.

## 3.15 Testing

| Candidate | Fit assessment |
|---|---|
| **Vitest** | Native Vite integration (shares config, transform pipeline, and speed characteristics with the build tool itself — §3.1), Jest-compatible API (low learning-curve/migration risk for engineers with prior Jest experience), directly serves §16.66's Unit and Component Test layers. |
| **React Testing Library** | The de facto standard for component testing in a way that tests user-visible behavior rather than implementation detail — fits §16.66's Component Tests (forms, role-context switcher, progress cards, error states) precisely. |
| **Playwright** | Strong, actively maintained cross-browser E2E support with genuinely good offline/network-condition simulation — a specific, documented need (§16.69 Offline Testing: connection restoration, duplicate retries, failed synchronization). This directly serves §16.66's End-to-End layer (registration, onboarding, purchase recording, verification, redemption, role/language switching, session expiry, offline queue and sync) better than lighter alternatives that lack robust network-condition control. |
| **Visual regression** | Not addressed by a dedicated tool in this Version 1 recommendation — no visual-regression requirement is documented in TRD16 or the Engineering Standards Pass 1 suite. Flagged as a disclosed gap (§7 Risks) rather than filled with an unrequested tool. |

## 3.16 Package Management

| Candidate | Fit assessment |
|---|---|
| **pnpm** | Content-addressable storage (disk-efficient across a monorepo with 3 shells + shared packages, per §16.5–16.6), strict dependency isolation (prevents "phantom dependencies" — a package used without being declared — which would otherwise quietly erode the domain-boundary discipline the Engineering Standards suite requires), and first-class workspace support that directly implements DEC-TECH-004's monorepo rationale ("strong type and contract reuse," OTD-002). |
| **npm** | Works, and is the zero-extra-tooling default, but its workspace/monorepo ergonomics and disk efficiency are weaker than pnpm's for this specific multi-shell structure. |
| **yarn** | Modern Yarn (Berry/PnP) has comparable strengths to pnpm in places but a more disruptive migration/tooling-compatibility story (Plug'n'Play's compatibility quirks with some tooling) than pnpm's more drop-in-compatible `node_modules` mode — a "Migration risk" concern (Part 4) not justified given pnpm already meets the requirement cleanly. |

---

# PART 4 — Evaluation Criteria Applied

Applied consistently to every recommendation above; summarized here rather than repeated per-item to avoid redundancy with Part 3's per-candidate fit assessments, which already argue "why it fits," "advantages," and "disadvantages" in context.

- **Operational impact:** every recommended tool either requires zero new infrastructure (Vite/static Hosting, Vitest, Playwright, pnpm) or integrates with already-approved Firebase services (TanStack Query over Firebase calls, FCM for push) — none require a new backend runtime or third-party service beyond what TRD8/TRD9 already approve.
- **Learning curve:** every recommendation was checked against "does this require the small engineering team to learn a fundamentally new paradigm" — the one candidate explicitly rejected on this basis relative to its alternative is TanStack Router vs. React Router (Part 3.2), where the newer tool's type-safety benefit did not yet clear the higher learning-curve/maturity bar.
- **Community maturity:** every recommended library (React Router, TanStack Query, React Hook Form, Zod, shadcn/ui, Tailwind, Vitest, Playwright, pnpm) has multi-year production track records at meaningful scale — the evaluation deliberately favored proven tools over newer alternatives at nearly every category (Part 3.2 router, 3.5 forms, 3.6 validation) consistent with Engineering Principle "Simple Beats Clever" and the general instruction not to default to novelty.
- **Maintenance outlook:** flagged explicitly where a candidate's maintenance trajectory was a factor in rejecting it (Formik, Part 3.5; RTK Query's Redux coupling, Part 3.4).
- **Migration risk:** flagged explicitly for yarn vs. pnpm (Part 3.16) and for any future move toward SSR should the disclosed public-page possibility (§1.13) materialize (addressed directly in Part 6).
- **Long-term sustainability:** addressed comprehensively in Part 6.

---

# PART 5 — Trade-Off Analysis (Direct Answers)

**Why Vite instead of Next.js?** Because nothing in the approved documentation requires server-side rendering or SEO, and TRD8 assigns Hosting the specific responsibility of static "PWA hosting" — not an application-server runtime. Adopting Next.js now would mean paying its architectural cost (a Node rendering layer, a different deployment model) for a capability the platform doesn't currently need, while gaining none of the offline/PWA-specific tooling maturity Vite's plugin ecosystem already has purpose-built. If the disclosed future public-pages possibility (§1.13) becomes real requirements, that is a deliberate, documented future migration decision — not a reason to carry the cost from day one.

**Why React Router instead of TanStack Router?** Maturity and community size outweigh TanStack Router's stronger compile-time route-type-safety for a small team that cannot easily absorb instability in a newer, less battle-tested library, especially for the routing layer that every one of the three application shells depends on. This is a "safer default, revisit if the type-safety gap becomes a real pain point" choice, not a permanent rejection.

**Why TanStack Query instead of RTK Query?** Because TRD16 §16.11 explicitly separates server state from application/UI state and explicitly warns against one global container — RTK Query's dependency on the Redux store model works against that separation, while TanStack Query is a standalone server-state layer with no such coupling, and it matches §16.11.1's required capability list almost verbatim.

**Why React Hook Form?** Lower re-render cost than the alternatives on the low-end-Android baseline Part 1.8 establishes as the norm, not the edge case, plus first-class Zod integration.

**Why Zod?** Type inference eliminates the duplicate-type-declaration problem that would otherwise work against the "Type safety" requirement, and its error shape naturally maps onto the already-approved server-side `fieldErrors` contract (TRD11 §11.34).

**Why shadcn/ui?** Because the approved Stitch Version 2 exploration and its accompanying `premium_verification_system/DESIGN.md` specify a particular, restrained, non-default aesthetic (Design Decisions Register §DEC-UX-003) that an opinionated component library (MUI, Mantine) would fight rather than express; shadcn/ui's Radix-primitive, source-in-repo model gives full control while still guaranteeing accessibility by construction.

**Why Tailwind?** It is not a fresh choice — TRD16 §16.3 already conditionally approves it. This evaluation confirms the condition (centralized tokens, no bypassing of reusable components) is satisfiable with the rest of the recommended stack.

**Why not alternatives generally?** In every category, the rejected alternative either (a) solved a problem the documentation doesn't actually pose (Next.js/Remix's SSR), (b) introduced coupling that fights an explicit architectural rule (RTK Query/Redux vs. §16.11), (c) carried more maturity/maintenance risk than the chosen option for comparable benefit (TanStack Router, TanStack Form, Valibot, yarn), or (d) fought the already-approved visual direction (MUI, Mantine). None were rejected on taste or popularity alone — see Part 3's per-item citations.

---

# PART 6 — Long-Term Thinking

- **Millions of customers / thousands of businesses:** the recommended stack's operational model (static frontend on Firebase Hosting, Cloud Functions for logic, Firestore for data) scales the same way TRD8/TRD20 already describe the backend scaling — the frontend adds no separate scaling bottleneck since it isn't a stateful server. Code-splitting by shell/domain (§16.52) keeps customer bundle size flat even as business/admin feature surface grows.
- **Multiple countries / multiple languages:** the i18n architecture requirement (§16.40) is satisfied by a namespace-based i18n framework (e.g. i18next-family tooling, selected at implementation time within this architecture) layered under the recommended stack without restructuring — exactly what FR-FE-015 requires. No recommended tool above assumes a single-locale UI.
- **Feature growth / engineering team growth:** the domain-based structure (§16.6), already-authored Engineering Standards Pass 1, and the recommended tools' category-separated state model (Part 3.3) mean a growing team can own a domain folder largely independently — a monorepo with clear domain boundaries (pnpm workspaces, Part 3.16) supports adding engineers without every change touching shared global state.
- **CI/CD and automated testing:** Vitest + Playwright integrate cleanly into the CI pipeline TRD22 §22.10/§22.11 and TRD20 §20.11 already require as a Phase 0/1 deliverable — no new CI paradigm is introduced.
- **Future mobile applications:** not in scope for Version 1, and the recommended stack does not foreclose it — a future native or React Native app would consume the same Cloud Functions/Firestore backend contracts (TRD11's command wrappers, TRD8's event architecture) independent of the web frontend's specific tool choices, since business logic already lives server-side (Part 1.4) rather than in the web client.
- **Future APIs / partner ecosystem:** TRD9 §9.25 (Public API Standards) already scopes this as an Integration Domain concern, independent of frontend tooling — the recommended stack does not need to anticipate this beyond continuing to route all sensitive actions through typed server commands (§16.9), which keeps business logic server-side and API-exposable regardless of frontend framework.
- **Future analytics / reporting / AI-assisted features:** the recommended charting (Recharts) and table (TanStack Table) choices are headless/lightweight specifically so they don't need to be replaced if reporting sophistication grows — a future dedicated BI tool, if ever justified by a documented requirement, would be additive, not a rip-and-replace.
- **The one genuine long-term watch point:** if the disclosed future public business-pages possibility (§1.13; TRD23 §23.32) becomes a real, scheduled requirement with genuine SEO/discoverability needs, that is the point at which an SSR framework (or a hybrid approach — e.g. a small, separately-deployed static/SSR marketing surface alongside the authenticated Vite SPA) should be re-evaluated. This is flagged explicitly as a **future review trigger**, not deferred silently.

---

# PART 7 — Engineering Philosophy

This recommendation is guided by the same philosophy already established in [Engineering Principles](../../06-engineering-governance/engineering-principles.md) and the [Product Experience Principles](../../01-product/product-experience-principles.md), applied specifically to frontend tooling:

**Simplicity matters because the platform's trust promise depends on the team being able to reason about every code path that touches a sensitive action.** A stack with fewer, well-understood moving parts is a stack where "does this optimistic update ever imply a false success" (FA-013) is an answerable question, not an archaeology project.

**Explicit architecture matters because TRD16 already specifies real constraints** — three state categories, a centralized Firebase boundary, domain-based structure — and a stack choice that fights those constraints (e.g. a state library that couples unrelated state categories) creates a permanent tax on every future engineer trying to follow the architecture as documented.

**Maintainability matters because this is a multi-year platform, not a prototype** — every library recommended above was chosen partly for its demonstrated maintenance trajectory, not just its capability today (Part 4).

**Avoiding unnecessary frameworks matters because every framework is a constraint, not just a capability** — Next.js's SSR capability is a constraint (a Node runtime, a different deployment model) the moment it's adopted, whether or not any page ever uses server rendering. This recommendation repeatedly chose the tool that solves the documented problem with the fewest structural side effects (Vite over Next.js, Context over Redux, headless table/chart libraries over opinionated ones).

**Engineering consistency matters because governance traceability (Part 1.12) depends on it** — a codebase where server state, form state, and app state are handled by three different, purpose-fit tools in three consistent, predictable places is easier to audit against the Requirements Traceability Matrix than one where a single all-purpose state library is stretched to cover everything.

This philosophy is intended to be carried into the [Version 1 Engineering Blueprint](../../02-technical/version-1-engineering-blueprint.md) verbatim — see §9 below for exactly how.

---

# PART 8 — Final Recommended Version 1 Stack

| Category | Recommendation |
|---|---|
| Frontend Framework | React 18 + TypeScript (already CONFIRMED — DEC-TECH-002; not re-decided here) |
| Build Tool | **Vite** |
| Routing | **React Router** |
| Component Library | **shadcn/ui** (Radix primitives, source-in-repo) |
| Styling | **Tailwind CSS** (centralized token config implementing DEC-UX-003's color roles and Product Experience Principles §10) |
| State Management — UI/App | React Context + local state; a minimal atomic store (e.g. Zustand) only if a genuine cross-cutting need emerges during implementation |
| State Management — Server | **TanStack Query** |
| State Management — Forms | **React Hook Form** |
| State Management — Auth | Firebase Authentication SDK state, wrapped in a thin context |
| State Management — Offline | Purpose-built IndexedDB-backed queue module matching TRD16 §16.27's exact schema |
| Validation | **Zod** |
| Icons | **Lucide** (`lucide-react`) |
| Charts | **Recharts** |
| Tables | **TanStack Table** (headless) |
| PWA | **`vite-plugin-pwa`** (Workbox-based) |
| QR Scanning | `BarcodeDetector`-first with a JS-decoder fallback, behind an internal abstraction; manual-code entry as a first-class equal path (FA-011) |
| Notifications | Firebase Cloud Messaging (Web SDK) — already-approved service, not a new choice |
| Testing — Unit/Component | **Vitest** + **React Testing Library** |
| Testing — E2E | **Playwright** |
| Linting | **ESLint** |
| Formatting | **Prettier** |
| Package Manager | **pnpm** |
| Developer Tooling | TypeScript strict mode (already specified, Engineering Standards Pass 1); Vite dev server; Firebase Emulator Suite (already a TRD22 Phase 0/1 deliverable) |
| Recommended project structure | Exactly TRD16 §16.6's domain-based structure — not a new proposal |
| Versioning approach | Semantic versioning for shared monorepo packages; app releases tagged per [Git Workflow](../../06-engineering-governance/git-workflow.md) §6 (already established) |

---

# PART 9 — Decision Impact

**On ENG-P0-001:** this recommendation, once signed off by the Engineering Lead, resolves the *last* of ENG-P0-001's two blocking preconditions (DEC-TECH-004 already has a prepared closure per Engineering Transition Phase 0B). ENG-P0-001 can be finalized with concrete tool names and promoted from `Blocked` to `Ready` the moment both sign-offs exist — see §11 below for the specific draft update prepared.

**On the Engineering Blueprint:** [Version 1 Engineering Blueprint](../../02-technical/version-1-engineering-blueprint.md) §1.3 currently states the frontend tooling set is "deliberately not fixed" — once DEC-TECH-003 is signed off, that section should be updated to state the confirmed stack and reference this document, and Part 7's philosophy above should be incorporated into the Blueprint's architectural reasoning (see §11 for the specific prepared edit, not yet applied without sign-off, consistent with the same discipline used for the three DEC-TECH closures in Phase 0B).

**On Engineering Standards:** [Linting and Formatting Conventions](../../03-standards/engineering-standards/linting-and-formatting-conventions.md) §5 currently reads "Tool Selection — Pending DEC-TECH-003." Once signed off, it is updated with ESLint/Prettier as the confirmed tools. The remainder of Engineering Standards Pass 1 (repository/folder, naming, TypeScript, testing, logging, error-handling, documentation, commit conventions) was already written tool-agnostically and requires no change — those documents already anticipated this outcome rather than needing rework.

**On future implementation phases:** every work package in the [Engineering Implementation Programme](../../05-implementation/change-tracking/engineering-implementation-programme.md) whose "Decision Dependencies" column cites DEC-TECH-003 (ENG-P0-001 directly; several later Phase 0–2 packages transitively via the tooling ENG-P0-001 establishes) becomes unblockable in sequence once sign-off exists.

**On repository creation:** this document does not create a repository, and per its own Part 10 scope, none should be created until DEC-TECH-003 is actually signed off and ENG-P0-001 is formally issued per the [AI Collaboration Workflow](../../06-engineering-governance/ai-collaboration-workflow.md).

**On developer onboarding:** a concrete, named stack (rather than an open question) is what makes a future engineer's first day possible — this recommendation is written so that, once accepted, an onboarding guide could be written directly from Part 8 without further research.

**On documentation:** see §10–11 below for exactly what changes and what stays as a prepared-but-unapplied recommendation.

---

# PART 10 — Explicitly Out of Scope (Confirmed Honored)

No repository was created. No code was written. No `package.json` was generated. No dependency was installed. No CI/CD configuration was created. No Firebase project was created. No UI was implemented. No documentation was modified except where required to support this recommendation (§11 below), and even those changes are prepared/disclosed, not silently applied where they would require a decision-owner sign-off first.

---

# 11. Prepared Register Update — Applied (Engineering Decision Sprint 2, 2026-07-17)

> **Status update (Engineering Decision Sprint 2, 2026-07-17):** the prepared register update below has since been **applied** to the live [Decision Register](decision-register.md) under explicit Founder-directed instruction (Engineering Decision Sprint 2 task brief), following the [Decision Update Procedure](../decision-update-procedure.md). DEC-TECH-003 is now **CONFIRMED**. The prepared text below is preserved unchanged as the audit record of what was proposed and applied.

Following the same discipline established in Engineering Transition Phase 0B's [Engineering Decision Closure Recommendations](engineering-decision-closure-recommendations.md):

- **Status:** OPEN_ENGINEERING → **CONFIRMED** *(prepared, not applied)*
- **Final decision (prepared text):** *"Version 1 frontend stack: Vite (build tool), React Router (routing), TanStack Query (server state), React Hook Form + Zod (forms/validation), shadcn/ui + Tailwind CSS (component foundation/styling), Lucide (icons), Recharts (charts), TanStack Table (tables), vite-plugin-pwa/Workbox (PWA), Vitest + React Testing Library + Playwright (testing), ESLint + Prettier (lint/format), pnpm (package manager). Full evaluation and rationale: [DEC-TECH-003 Engineering Stack Evaluation & Recommendation](dec-tech-003-engineering-stack-recommendation.md)."*
- **Decision date / Approved by:** *(pending Engineering Lead sign-off)*
- **Implementation consequences:** unblocks ENG-P0-001 (jointly with the already-prepared DEC-TECH-004 closure); Engineering Standards §5 (Linting/Formatting) tool-name update; Version 1 Engineering Blueprint §1.3 update.
- **Document corrections required upon sign-off:** [Linting and Formatting Conventions](../../03-standards/engineering-standards/linting-and-formatting-conventions.md) §5; [Version 1 Engineering Blueprint](../../02-technical/version-1-engineering-blueprint.md) §1.3; [ENG-P0-001 draft](../../05-implementation/prompts/ENG-P0-001-draft.md) §4/§11.

**This register update is not applied by this document.** Applying it follows the [Decision Update Procedure](../decision-update-procedure.md) once the Engineering Lead reviews and signs off.

## 12. Relationship to Other Documents

- [Decision Register](decision-register.md) DEC-TECH-003 — the record this evaluation prepares a closure for.
- [Engineering Decision Closure Recommendations](engineering-decision-closure-recommendations.md) — the precedent for the "prepare, don't apply" discipline used here.
- [Version 1 Engineering Blueprint](../../02-technical/version-1-engineering-blueprint.md) — receives this document's Part 7 philosophy and Part 8 stack once signed off.
- [Engineering Standards](../../03-standards/engineering-standards/README.md) — Pass 1 already written tool-agnostically; §5 of Linting and Formatting Conventions is the one section gated on this decision.
- [ENG-P0-001 draft](../../05-implementation/prompts/ENG-P0-001-draft.md) — the work package this recommendation, once signed off, unblocks.
- [Product Experience Principles](../../01-product/product-experience-principles.md) §10, [Design Decisions Register](../../07-product-design/design-decisions.md) §DEC-UX-003 — the approved visual direction this stack's component/styling choices are selected to serve.
