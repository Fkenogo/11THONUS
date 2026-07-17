# Technical Requirements Document (TRD) — Index

**Classification:** Authoritative Technical · **Status:** Version 1.0, pre-freeze ("Draft for approval")
Seventeen chapter files covering Chapters 1–23. Do not merge chapters. Phases refer to Chapter 22 (Phases 0–16). The TRD consolidation audit is **not** an authoritative chapter; it is archived with the [2026-07-16 audit](../../90-audits/2026-07-16-documentation-audit/trd-consolidation-and-consistency-audit.md).

| Ch. | File | Title | Purpose | Primary domains | Phases | Status |
|---|---|---|---|---|---|---|
| 1–7 | [01-07-platform-architecture.md](01-07-platform-architecture.md) | Platform Architecture | Technical philosophy, TAP-001..010, 15-domain model, ownership matrix, constraints | All | 0–1 | Draft for approval |
| 8 | [08-firebase-platform-architecture.md](08-firebase-platform-architecture.md) | Firebase Platform Architecture | Firebase service responsibilities, environments, offline strategy, performance | Infrastructure (all) | 1 | Draft for approval |
| 9 | [09-physical-and-integration-architecture.md](09-physical-and-integration-architecture.md) | Integration Domain and External Systems | Adapters, webhooks, idempotency, payment/messaging flows | Integration | 1, 9, 10 | Draft for approval |
| 10 | [10-firestore-data-architecture.md](10-firestore-data-architecture.md) | Firestore Data Architecture | Collections, ownership, schemas, isolation, retention, migrations (DAP, DA rules) | All (data) | 1–12 | Draft for approval |
| 11 | [11-cloud-functions-and-domain-services.md](11-cloud-functions-and-domain-services.md) | Cloud Functions and Domain Services | Commands/events, validation layers, idempotency, transactions, core workflows | All (server) | 1, 5–8 | Draft for approval |
| 12 | [12-security-and-access-control.md](12-security-and-access-control.md) | Security and Access Control | AuthN/AuthZ, claims, security rules, App Check, sessions, recovery | Identity + cross-cutting | 1–2, 14 | Draft for approval |
| 13 | [13-communications-and-localization.md](13-communications-and-localization.md) | Communications and Localization | Language hierarchy, translation keys, notification architecture | Notification | 9, 13 | Draft for approval |
| 14 | [14-search-and-discovery.md](14-search-and-discovery.md) | Search and Discovery | Taxonomy search, onboarding classification, MVP boundary | Search, Commerce Knowledge | 3 | Draft for approval |
| 15 | [15-reporting-and-analytics.md](15-reporting-and-analytics.md) | Reporting and Projections | Metric Catalogue, projections, freshness, isolation | Reporting | 11 | Draft for approval |
| 16 | [16-frontend-and-pwa-architecture.md](16-frontend-and-pwa-architecture.md) | Frontend and PWA Architecture | Application surfaces, state management, offline UX, QR | Frontend (all) | 2–13 | Draft for approval |
| 17 | [17-subscription-and-billing.md](17-subscription-and-billing.md) | Subscription and Billing | Plans, entitlements, trial, lifecycle, grace, suspension | Subscription | 10 | Draft for approval |
| 18 | [18-platform-governance-and-administration.md](18-platform-governance-and-administration.md) | Platform Governance and Administration | Admin roles, separation of duties, studio architecture, bulk jobs | Administration | 3, 12 | Draft for approval |
| 19 | [19-quality-engineering.md](19-quality-engineering.md) | Quality Engineering | Test pyramid, emulator/security/idempotency/concurrency testing, release gates | Cross-cutting | all | Draft for approval |
| 20 | [20-deployment-and-operational-resilience.md](20-deployment-and-operational-resilience.md) | Deployment and Operational Resilience | Environments, CI/CD, backup/restore, incident, cost | Cross-cutting | 0–1, 14 | Draft for approval |
| 21 | [21-privacy-and-data-protection.md](21-privacy-and-data-protection.md) | Privacy and Data Protection | Processing register, consent, rights, retention, minors | Identity + cross-cutting | 2, 14 | Draft for approval |
| 22 | [22-mvp-implementation-and-delivery.md](22-mvp-implementation-and-delivery.md) | MVP Scope and Delivery | Strict MVP scope, deferred list, Phases 0–16, exit gates, agent standards | All | all | Draft for approval |
| 23 | [23-traceability-and-completion-review.md](23-traceability-and-completion-review.md) | Traceability and Completion Review | Final domain model, terminology freeze, open decisions (OPD/OTD/LCD), freeze conditions | All | pre-0 | Draft for approval |
