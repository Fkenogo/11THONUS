# Phase Engineering Record Template

> **This is a template, not a record.** It contains no populated data and narrates no phase. Copy it to `records/version-<N>/phase-<N>/phase-<N>-engineering-record.md` to draft an actual Phase Engineering Record (PER), per the [Engineering Implementation Records Standard](../../docs/06-engineering-governance/engineering-implementation-records-standard.md).
>
> **Non-authoritative.** This record summarizes and links every Engineering Implementation Record (EIR) within the phase — it does not duplicate any EIR's content, and it does not itself determine phase status (standard §7.2, §10.2).

---

## 1. Document Control

| Field                      | Value                                                                                                                                   |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Record type                | Phase Engineering Record (PER)                                                                                                          |
| Phase                      | _(e.g. Phase 1 — Firebase and Shared Platform Foundation)_                                                                              |
| Version                    | _(platform version this phase belongs to)_                                                                                              |
| Record lifecycle state     | `Recorded` while the phase is still open (grows by append); `Administratively Closed` only once the entire phase closes (standard §7.2) |
| Drafted by                 | _(coding agent / Founder)_                                                                                                              |
| Drafted on / last appended | _(date)_                                                                                                                                |
| Approved by                | _(Founder — filled only at `Administratively Closed`)_                                                                                  |
| Approved on                | _(date — filled only at `Administratively Closed`)_                                                                                     |
| Source-of-truth path       | `records/version-<N>/phase-<N>/phase-<N>-engineering-record.md`                                                                         |

## 2. Phase Dashboard

| Field                                                                                    | Value                                                |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Phase                                                                                    | _(number and name)_                                  |
| Phase status _(authoritative source: Master Workflow / Programme — cite, never restate)_ | _(e.g. "Complete" — see [link])_                     |
| Record lifecycle status                                                                  | _(`Recorded` (growing) / `Administratively Closed`)_ |
| Work packages in phase                                                                   | _(count)_                                            |
| Work packages with a Recorded or Closed EIR                                              | _(count)_                                            |
| Phase entry date                                                                         | _(date, or `Not recorded`)_                          |
| Phase exit date                                                                          | _(date, or `Not recorded` if still open)_            |

## 3. Phase Purpose

_(One short paragraph, from the Engineering Implementation Programme's phase profile — cited, not reworded into a new claim.)_

## 4. Included Work Packages

_(List of every work-package ID in this phase, per the Programme.)_

## 5. Work-Package Record Register

_(Standard §10.2 item 2 — every work package in the phase, its current status per the Programme/Register, cited not restated, and a direct link to its EIR where one exists yet.)_

| Work package     | Engineering status (cited)         | EIR                            |
| ---------------- | ---------------------------------- | ------------------------------ |
| _(`ENG-Pn-nnn`)_ | _(status + link to Programme row)_ | _(link, or "Not yet created")_ |

## 6. Major Deliverables

_(Roll-up of major deliverables across the phase's EIRs — a summary, not a re-listing of every EIR's own Deliverables section.)_

## 7. Major Decisions Applied

_(Decision Register IDs that materially affected this phase as a whole, cited — not restated.)_

## 8. Cross-Work-Package Chronicle

_(Standard §10.2 item 3 — a short account of how the phase progressed as a whole: major sequencing events, blockers resolved, the order work packages actually closed in, as distinct from the order originally planned. Links to individual EIRs' own Engineering Chronicle sections rather than reproducing them.)_

## 9. Phase Validation and Exit Criteria

_(Standard §10.2 item 4 — once the phase closes: citation to where exit criteria were verified satisfied, e.g. TRD22's phase-exit gate, and the date. Left as "not yet reached" while the phase remains open.)_

## 10. Risks and Technical Debt

_(Standard §10.2 item 5 — rolled up from constituent EIRs, not re-derived.)_

## 11. Deferred Work

_(Anything explicitly deferred at the phase level, cited to where that was disclosed.)_

## 12. Lessons Learned

_(Phase-level observations, distinct from any single EIR's own Lessons Learned.)_

## 13. Phase Completion Assessment

_(The phase's final status and the date it was reached, cited to the Master Workflow/Programme.)_

## 14. Founder and Technical Lead Approval

_(Evidence of the phase-exit approval, cited.)_

## 15. Administrative Closure and Locking

_(Who approved this record's lock, and when. Empty until the phase itself closes and the Founder approves.)_

## 16. Next Phase

_(The next phase this one's completion enables, cited to the Master Workflow — never asserted independently.)_

## 17. References

_(Every EIR, Programme link, and exit-criteria verification referenced above, consolidated.)_

## 18. Amendment History

_(Present from creation, typically empty. Holds zero or more dated Amendment entries, appended only after this record is locked and a defined, authorized reopening occurs — mirroring the EIR-level procedure in standard §6.4.)_

| Date         | Amendment | Primary source |
| ------------ | --------- | -------------- |
| _(none yet)_ | —         | —              |
