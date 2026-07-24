# Engineering Implementation Record Template

> **This is a template, not a record.** It contains no populated data and narrates no work package. Copy it to `records/version-<N>/phase-<N>/<work-package-id>.md` to draft an actual Engineering Implementation Record (EIR), per the [Engineering Implementation Records Standard](../../docs/06-engineering-governance/engineering-implementation-records-standard.md).
>
> **Non-authoritative.** Every field below either cites a primary source (a report, a commit, a PR, a CI run, a Decision Register entry) or is filled with `Not recorded` — never a guessed or reconstructed figure. If a claim in this record and its cited source ever disagree, the source is correct and this record is defective (standard §3.1).

---

## 1. Document Control

| Field                  | Value                                                                         |
| ---------------------- | ----------------------------------------------------------------------------- |
| Record type            | Engineering Implementation Record (EIR)                                       |
| Record identifier      | `EIR-ENG-<Pn-nnn>`                                                            |
| Work-package ID        | `ENG-<Pn-nnn>`                                                                |
| Version                | 1.0 (increments only per §11 Maintenance Rules)                               |
| Record lifecycle state | `Engineering Complete` / `Recorded` / `Administratively Closed` (standard §6) |
| Drafted by             | _(coding agent / Founder — name the author)_                                  |
| Drafted on             | _(date)_                                                                      |
| Approved by            | _(Founder — filled only at `Administratively Closed`)_                        |
| Approved on            | _(date — filled only at `Administratively Closed`)_                           |
| Source-of-truth path   | `records/version-<N>/phase-<N>/<work-package-id>.md`                          |

## 2. Record Dashboard

| Field                                                                                                                     | Value                                                               |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| EIR identifier                                                                                                            | `EIR-ENG-<Pn-nnn>`                                                  |
| Work-package ID                                                                                                           | `ENG-<Pn-nnn>`                                                      |
| Title                                                                                                                     | _(from the Engineering Implementation Programme)_                   |
| Phase                                                                                                                     | _(e.g. Phase 1)_                                                    |
| Engineering status _(authoritative source: Programme / Prompt Register — cite, never restate as this record's own claim)_ | _(e.g. `Complete` — see [Programme link])_                          |
| Record lifecycle status _(this record's own state, distinct from the row above)_                                          | _(`Engineering Complete` / `Recorded` / `Administratively Closed`)_ |
| Start date                                                                                                                | _(date work began, or `Not recorded`)_                              |
| Engineering completion date                                                                                               | _(date `Complete` was reached, or `Not recorded`)_                  |
| Administrative closure date                                                                                               | _(date this record was locked, or `Not recorded` if still open)_    |
| Commits                                                                                                                   | _(count and list, or `Not recorded`)_                               |
| Pull requests                                                                                                             | _(count and list, or `Not recorded`)_                               |
| CI runs                                                                                                                   | _(count and list, or `Not recorded`)_                               |
| Technical Reviews                                                                                                         | _(count and verdicts, or `Not recorded`)_                           |
| Founder reviews                                                                                                           | _(count, or `Not recorded`)_                                        |
| Outstanding risks                                                                                                         | _(count, or "none disclosed")_                                      |
| Next work package                                                                                                         | _(ID, or "none authorized yet")_                                    |

## 3. Purpose

_(One short paragraph: what this work package was for, in plain language. Not a restatement of the Programme's requirement text — a summary a new reader can understand without opening another document.)_

## 4. Work-Package Scope

_(What was in scope and out of scope, citing the Programme row and/or the original implementation prompt. Do not restate requirement text — cite the requirement IDs.)_

## 5. Preconditions and Authorization

_(What had to be true before this work could begin — decision dependencies, sequential dependencies, entry criteria — each cited to the Programme/Decision Register, plus the specific authorization event that allowed the work to start, e.g. a Master Workflow "Ready" transition.)_

## 6. Implementation Summary

_(Plain-language account of what was actually built or changed. Cites the Implementation Report(s) rather than reproducing their content.)_

## 7. Engineering Chronicle

_(The mandatory Timeline — standard §10.1 item 3. Every dated task/session that touched this work package, in chronological order: implementation, review, corrections, infrastructure work, merge, closure. Each entry cites its primary source — do not restate what happened, cite where it is recorded.)_

| Date     | Event                                                                 | Primary source          |
| -------- | --------------------------------------------------------------------- | ----------------------- |
| _(date)_ | _(e.g. "Implemented, test-first")_                                    | _(report link)_         |
| _(date)_ | _(e.g. "Technical Review — Approved with non-blocking observations")_ | _(review link)_         |
| _(date)_ | _(e.g. "Committed and pushed")_                                       | _(commit SHA, PR link)_ |
| _(date)_ | _(e.g. "CI passed")_                                                  | _(CI run link)_         |
| _(date)_ | _(e.g. "Merged")_                                                     | _(merge commit link)_   |

## 8. Deliverables

_(What was actually delivered — files, documents, infrastructure — as a list, each optionally cited to the commit or report that produced it. Not a diff; a manifest.)_

## 9. Decisions and Requirements Applied

_(Every Decision Register ID and Requirements Traceability Matrix ID this work package depended on, each cited to its register entry — never a restatement of the decision's or requirement's substantive text — standard §10.1 item 5.)_

| ID                      | Register/Matrix link | Role in this work package                |
| ----------------------- | -------------------- | ---------------------------------------- |
| _(e.g. `DEC-TECH-005`)_ | _(link)_             | _(e.g. "region selection precondition")_ |

## 10. Validation and Definition-of-Done Evidence

_(The final per-criterion Definition of Done result, citing the actual reconciliation that produced it — standard §10.1 item 6. Do not re-run or re-derive the reconciliation here; cite it.)_

| DoD criterion                                      | Result                                  | Evidence     |
| -------------------------------------------------- | --------------------------------------- | ------------ |
| _(criterion 1..12, per the Definition of Done §2)_ | _(Satisfied / N/A / Not yet satisfied)_ | _(citation)_ |

## 11. Technical Review

_(Verdict, reviewer, date, and a link to the Technical Review document — never a re-statement of its findings as though this record performed the review.)_

## 12. Founder Review and Approval

_(Evidence of Founder pull, Preview Review, or equivalent, per the Git Workflow and Definition of Done — cited, not re-derived. `Not recorded` if not applicable to this work package, with the reason.)_

## 13. Git, Pull Request, CI and Merge Evidence

| Item            | Value                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------- |
| Commits         | _(SHA list, or `Not recorded`)_                                                                                |
| Branch(es)      | _(name, or `Not recorded`)_                                                                                    |
| Pull request(s) | _(number and link, or `Not recorded`)_                                                                         |
| CI run(s)       | _(run ID and link, per commit, or `Not recorded`)_                                                             |
| Merge commit    | _(SHA and link, or `Not recorded` if not yet merged)_                                                          |
| Merged by       | _(who executed the merge — per the Git Workflow, only the Founder or an explicitly Founder-authorized action)_ |

## 14. Infrastructure or Deployment Evidence

_(Live infrastructure changes — project creation, resource provisioning, configuration — each cited to the report or record that verified it. `Not applicable` if this work package had no infrastructure component, stating why.)_

## 15. Risks and Non-Blocking Observations

_(Carried forward from the work package's own reports — standard §10.1 item 9 — not re-litigated here, only rolled up for visibility.)_

## 16. Deferred Work and Known Limitations

_(Anything explicitly out of scope or deferred, each cited to where that decision was disclosed.)_

## 17. Lessons Learned

_(Short, factual observations useful to future similar work — not speculation, not process commentary unrelated to this specific work package.)_

## 18. Completion Assessment

_(The work package's final engineering status and the date it was reached, cited to the Programme/Register/Master Workflow — standard §10.1 item 8. This record does not itself determine or assert completion; it reports what those documents already established.)_

## 19. Administrative Closure

_(Who approved this record's lock, and when. Empty until the Founder approves per standard §9.2. This section, once filled, is part of what becomes locked — standard §3.4.)_

## 20. Next Authorized Work Package

_(The next work package this one's completion enables, cited to the Master Workflow/Programme — never asserted independently of those documents.)_

## 21. References

_(Consolidated Evidence Index — standard §10.1 item 4 — every Implementation Report, Technical Review, closure report, PR, and CI run referenced above, listed once so a reader does not have to extract them one by one.)_

## 22. Amendment History

_(Present from creation, typically empty. Holds zero or more dated Amendment entries, appended only per the Reopening procedure — standard §6.4, §3.5, §10.1 item 10. Never contains anything before this EIR's first approval; an amendment never edits any other section above.)_

| Date         | Amendment | Reopening authorization | Primary source |
| ------------ | --------- | ----------------------- | -------------- |
| _(none yet)_ | —         | —                       | —              |
