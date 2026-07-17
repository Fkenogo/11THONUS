# 11thONUS Assumptions Register

> **Purpose:** MVP assumptions are statements the platform currently relies on **without proof**. They are not decisions (nothing to choose) and not dependencies (no external party owes an answer) — they are beliefs that must be validated, mostly through the Burundi pilot. Source: TRD Chapter 23 §23.25 (AS-001..AS-015, renamed from A-001..A-015 in documentation Phase 4 per DEC-GOV-006), restated here as the controlled register.
> **Status values:** UNVALIDATED / VALIDATION_PLANNED / VALIDATED / **FALSIFIED** (triggers the consequence plan and usually a founder decision).

| ID | Assumption | Source | Validation method | Owner | Validate by | Consequence if false | Status |
|---|---|---|---|---|---|---|---|
| AS-001 | The first pilot operates primarily in Bujumbura, Burundi | TRD23 AS-001 | Pilot planning confirmation (DEC-PILOT-001) | Founder | Phase 15 planning | Pilot logistics and support model change | UNVALIDATED |
| AS-002 | Initial businesses are SMEs with recurring products/services | TRD23 AS-002 | Pilot cohort selection screening | Founder | Phase 15 | Onboarding/taxonomy focus shifts | UNVALIDATED |
| AS-003 | Businesses use phones/tablets/desktop browsers, no special hardware | TRD23 AS-003 | Pilot device survey | Founder + Engineering | Phase 15 | PWA device support matrix revised | UNVALIDATED |
| AS-004 | The platform does not process customer purchase payments in the MVP | TRD23 AS-004 | Confirmed scope (DEC-PROD-005) — validate no pilot blocker emerges | Founder | Phase 15 | Scope change via formal process only | UNVALIDATED |
| AS-005 | Business subscription payments run through an external provider | TRD23 AS-005 | Provider selection + sandbox (EXT-PROV-001) | Engineering Lead | Phase 10 | Manual billing fallback needed | UNVALIDATED |
| AS-006 | Customer verification can occur later, not at point of sale | TRD23 AS-006 | Pilot verification-timing data (EXT-PILOT-001) | Founder | Phase 15 | Reminder/UX redesign; possible in-store verification aid | UNVALIDATED |
| AS-007 | Customers accept responsibility for approving activity on their number | TRD23 AS-007 | Pilot rejection/dispute behavior | Founder | Phase 15 | Education material and defaults revised | UNVALIDATED |
| AS-008 | Friends/family purchasing on one number is used and understood where allowed | TRD23 AS-008 | Pilot shared-number usage data | Founder | Phase 15 | Shared-number defaults revisited (program-level policy) | UNVALIDATED |
| AS-009 | Ten verified units is a workable threshold | TRD23 AS-009 | Pilot cycle-completion data | Founder | Phase 15 | Threshold change = formal product approval (DEC-LOY-001 guard) | UNVALIDATED |
| AS-010 | The business provides the next eligible item as the On Us reward | TRD23 AS-010 | Pilot redemption observations | Founder | Phase 15 | Reward-fulfilment support tools needed | UNVALIDATED |
| AS-011 | One operational branch per business suffices for launch | TRD23 AS-011 | Pilot cohort screening | Founder | Phase 15 | Multi-branch (DEC-FUT-005) accelerates | UNVALIDATED |
| AS-012 | English + French are sufficient for the first production release | TRD23 AS-012 | Pilot French-comprehension feedback | Founder | Phase 15 | Kirundi timing (DEC-L10N-002) accelerates | UNVALIDATED |
| AS-013 | A controlled launch taxonomy is sufficient (no full regional catalogue) | TRD23 AS-013 | Onboarding suggestion-workflow volume | Founder + Knowledge editor | Phase 15 | Taxonomy expansion sprint | UNVALIDATED |
| AS-014 | Public customer discovery is not required to prove the loyalty model | TRD23 AS-014 | Pilot business/customer feedback | Founder | Phase 15 | DEC-FUT-001/DEC-UX-003 revisited | UNVALIDATED |
| AS-015 | One subscription payment provider suffices for the pilot | TRD23 AS-015 | Provider reliability during pilot | Engineering Lead | Phase 15 | Second provider adapter added | UNVALIDATED |

**Rules.** (1) An assumption is never silently promoted to fact — validation evidence goes in the row and the changes log. (2) A FALSIFIED assumption immediately creates or reopens a decision in the Decision Register. (3) Pilot planning (Phase 15) must include a validation checkpoint for every UNVALIDATED row (grouped under EXT-PILOT-001).
