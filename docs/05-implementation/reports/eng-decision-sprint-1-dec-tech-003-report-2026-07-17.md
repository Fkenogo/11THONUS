> **Title:** Engineering Decision Sprint 1 Report — DEC-TECH-003 Version 1 Engineering Stack Evaluation & Recommendation
> **Version:** 1.0 · **Status:** Complete · **Classification:** Audit evidence / Implementation report
> **Governing document:** Engineering Decision Sprint 1 task brief (2026-07-17)
> **Source-of-truth path:** `docs/05-implementation/reports/eng-decision-sprint-1-dec-tech-003-report-2026-07-17.md`
> **Last controlled update:** 2026-07-17

# Engineering Decision Sprint 1 Report — DEC-TECH-003 Version 1 Engineering Stack Evaluation & Recommendation

## 1. Executive Summary

Produced a full, evidence-based Version 1 frontend engineering stack recommendation for DEC-TECH-003, derived entirely from 11thONUS's documented product and technical requirements (TRD16 Frontend and PWA Architecture read in full, TRD8 Firebase Platform Architecture, the Product Experience Principles, the Product Design documents, and PRD0's MVP scope) rather than general technology popularity. The recommendation: **Vite** (build tool), **React Router** (routing), **TanStack Query** (server state), **React Hook Form + Zod** (forms/validation), **shadcn/ui + Tailwind CSS** (components/styling), **Lucide** (icons), **Recharts** (charts), **TanStack Table** (tables), **vite-plugin-pwa/Workbox** (PWA), **Vitest + React Testing Library + Playwright** (testing), **ESLint + Prettier** (lint/format), **pnpm** (package manager). Every choice is traced to a specific requirement or architectural rule and every rejected alternative has a documented, specific reason (see the full evaluation). **DEC-TECH-003 remains OPEN_ENGINEERING** — this document prepares a ready-to-sign register update but does not apply it, consistent with the discipline established in Engineering Transition Phase 0B. No repository, code, package, CI/CD configuration, or Firebase resource was created.

## 2. Engineering Characteristics Analysis

See the full [recommendation document](../../00-governance/decisions/dec-tech-003-engineering-stack-recommendation.md) Part 1 (13 characteristics, each sourced): three distinct application surfaces sharing one Firebase backend; a centralized Firebase client boundary; PWA-only (no native app in scope); trust-critical actions that must remain server-authoritative by construction (the single most consequential characteristic, traced to Constitution Pillar Two and TRD16's FA-002/007/008/013); a narrow, precisely-specified offline surface (not general offline-first); three explicitly separated state categories (TRD16 §16.11); first-class QR/camera handling with mandatory manual fallback; low-end-Android/4G as the performance baseline, not the edge case; structural (not cosmetic) internationalization; a named, testable WCAG 2.1 AA accessibility standard; frontend-level auditability discipline; and explicitly deferred (not ignored) future scope — gift cards, marketplace, multi-country/language, a disclosed possible future public/SEO-relevant surface.

## 3. Evaluation Methodology

Every TRD16 section not already read in this session's prior work was read in full before evaluating any technology (§16.2–16.35, §16.51–16.57, §16.71–16.74), specifically to avoid assuming requirements not actually documented. A targeted search confirmed the absence of any SSR/SEO requirement in the approved suite (the basis for the build-tool recommendation), while a separate targeted search surfaced and disclosed one genuine counter-signal (TRD23 §23.32's deferred public-business-pages possibility) rather than silently omitting it. Every candidate was evaluated against the Part 2 requirements table and the Part 4 criteria (operational impact, learning curve, community maturity, maintenance outlook, migration risk, long-term sustainability) — not popularity.

## 4. Candidate Technology Comparison

Full category-by-category comparison tables (build tool; routing; state management by sub-category; server state; forms; validation; component foundation; styling; charts; icons; tables; PWA; QR scanning; notifications; testing; package management) are in the [recommendation document](../../00-governance/decisions/dec-tech-003-engineering-stack-recommendation.md) Part 3 — not reproduced here to avoid duplicating the source of truth.

## 5. Trade-Off Analysis

Direct answers to every trade-off question in the task brief (Vite vs. Next.js; React Router vs. TanStack Router; TanStack Query vs. RTK Query; why React Hook Form; why Zod; why shadcn/ui; why Tailwind; why not the rejected alternatives generally) are in Part 5 of the recommendation document, each citing the specific requirement or architectural rule that drove the choice.

## 6. Recommended Version 1 Engineering Stack

See Part 8 of the recommendation document for the complete table. Summary: React 18 + TypeScript (already CONFIRMED, DEC-TECH-002) · Vite · React Router · shadcn/ui + Tailwind CSS · TanStack Query (server state) + React Hook Form (forms) + Context/minimal state (app state) + Firebase Auth SDK (auth state) + purpose-built IndexedDB queue (offline state) · Zod · Lucide · Recharts · TanStack Table · vite-plugin-pwa · Vitest + React Testing Library + Playwright · ESLint + Prettier · pnpm.

## 7. Rejected Alternatives (With Reasons)

Next.js/Remix (solve an SSR/SEO problem not present in documented scope, at the cost of an operational model TRD8 doesn't assign to any Firebase service); TanStack Router (less mature/proven than React Router for a small team, despite real type-safety benefits); RTK Query (couples server-state adoption to the Redux global-store model, in tension with TRD16 §16.11's explicit separation rule); TanStack Form (newer, smaller community than React Hook Form); Formik (heavier re-render profile, slower recent maintenance velocity); Valibot (promising but less ecosystem maturity than Zod today); Yup (no native static type inference); MUI/Mantine (impose a design language in tension with the approved Trust/Progress/Reward minimalist direction); Headless UI (narrower component set than shadcn/ui, which itself uses Radix); AG Grid-class enterprise tables (no documented BI/enterprise-grid requirement justifies the weight/licensing); yarn (more disruptive tooling-compatibility story than pnpm for comparable benefit). Full reasoning for each is in the recommendation document's Part 3/5.

## 8. Risks and Mitigations

- **Version 1 → 2 concept matching risk (inherited context, not new):** not applicable to this sprint.
- **DEC-TECH-003's own risk:** the recommendation is evidence-based but not founder/Engineering-Lead-confirmed; if the Engineering Lead's real-world experience surfaces a constraint this evaluation didn't have visibility into, any individual tool choice can be revisited before sign-off without invalidating the rest of the stack (each choice's reasoning is independent and documented).
- **Disclosed future risk:** if the deferred public-business-pages possibility (TRD23 §23.32) becomes a real, scheduled requirement, the Vite/no-SSR choice should be re-evaluated at that specific trigger point — flagged explicitly in Part 6, not left implicit.
- **QR scanning leaf-dependency risk:** deliberately evaluated at the requirement/category level rather than naming one specific npm package, since this is a more volatile dependency than the architectural choices — mitigated by requiring an internal abstraction layer so the underlying library can be swapped without touching call sites.
- **Visual regression testing gap:** disclosed as not addressed by a dedicated tool in this recommendation, since no such requirement exists in TRD16 or Engineering Standards Pass 1 — not silently filled with an unrequested tool.

## 9. Engineering Decision Impact Assessment

Full analysis in Part 9 of the recommendation document. In summary: once signed off, this resolves the second (and last) of ENG-P0-001's two blocking preconditions (DEC-TECH-004 already has a prepared closure from Phase 0B); the Version 1 Engineering Blueprint §1.3 and Linting/Formatting Conventions §5 move from "recommended, pending sign-off" to "confirmed"; the rest of Engineering Standards Pass 1 requires no change (it was already written tool-agnostically); every Engineering Implementation Programme work package citing DEC-TECH-003 as a dependency becomes unblockable in sequence; and a concrete, named stack makes future developer onboarding possible without further research.

## 10. Files Modified

- `docs/02-technical/version-1-engineering-blueprint.md` (§1.3 + metadata header)
- `docs/03-standards/engineering-standards/linting-and-formatting-conventions.md` (§5 + metadata header)
- `docs/05-implementation/prompts/ENG-P0-001-draft.md` (status note + metadata header)
- `docs/00-governance/decisions/engineering-transition-d1-agenda.md` (DEC-TECH-003 entry + §7 + metadata header)
- `docs/00-governance/decisions/README.md`
- `docs/README.md`
- `docs/05-implementation/change-tracking/documentation-phases.md`
- `docs/05-implementation/reports/README.md`
- `docs/00-governance/documentation-changes-log.md`

## 11. Documentation Updates

All updates listed in §10 are additive notes/pointers to the new recommendation, explicitly marked "recommended, pending sign-off" wherever they touch a still-OPEN_ENGINEERING decision — no existing substantive content was overwritten or presented as more settled than the live Decision Register actually shows. See the [full recommendation document](../../00-governance/decisions/dec-tech-003-engineering-stack-recommendation.md) for the complete analysis; this report intentionally does not duplicate it.

## 12. Commands Executed

Read-only inspection and verification only: targeted `grep` searches across TRD/PRD files for SSR/SEO/gift-card/marketplace/multi-country signals; `grep -oE "Status: \*\*[A-Z_]+\*\*" decision-register.md | sort | uniq -c` to confirm the live register was unchanged (15 OPEN_ENGINEERING, unchanged); full-suite markdown link check (see §14). No build, install, git, or Firebase command was run.

## 13. Dependencies Proposed (Recommendation Only, Not Installed)

`react-router`, `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`, `zod`, `tailwindcss`, shadcn/ui-generated component source (not an npm runtime dependency in the traditional sense — copied into the repo), `lucide-react`, `recharts`, `@tanstack/react-table`, `vite-plugin-pwa`, `vitest`, `@testing-library/react`, `@playwright/test`, `eslint`, `prettier`, plus their standard peer/dev-dependency sets — none installed; named here only as the recommendation's concrete package identifiers for when ENG-P0-001 is actually issued.

## 14. Configuration Changes (Recommendation Only)

None applied. The recommendation anticipates (but does not create): a Vite config with `vite-plugin-pwa`; a Tailwind config with centralized design tokens implementing DEC-UX-003's color roles; ESLint/Prettier configs per Engineering Standards' policy (already authored, tool-agnostic); a pnpm workspace config for the monorepo (DEC-TECH-004). All are Pass 2 / ENG-P0-001 implementation activities, not this sprint's output.

## 15. Rollback Instructions

All changes are additive documentation or narrow, clearly-marked notes on existing files. To roll back: delete the 2 new files (`dec-tech-003-engineering-stack-recommendation.md`, this report); revert the 4 modified content files (Blueprint §1.3, Linting/Formatting §5, ENG-P0-001 draft note, D1 Agenda entry+§7) to their pre-sprint text; revert the `docs/README.md`, phase-tracker, reports-README, decisions-README, and changes-log entries listed in §10. No Decision Register content was changed, so no register rollback is needed.

## 16. Markdown Implementation Report

This document, together with the full [DEC-TECH-003 Engineering Stack Evaluation & Recommendation](../../00-governance/decisions/dec-tech-003-engineering-stack-recommendation.md).

## 17. Persistent Documentation Changes Log

Entry 015 appended to `docs/00-governance/documentation-changes-log.md` — see above.
