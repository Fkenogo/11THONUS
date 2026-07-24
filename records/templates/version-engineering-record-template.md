# Version Engineering Record Template

> **This is a template, not a record.** It contains no populated data and narrates no version. Copy it to `records/version-<N>/version-<N>-engineering-record.md` to draft an actual Version Engineering Record (VER), per the [Engineering Implementation Records Standard](../../docs/06-engineering-governance/engineering-implementation-records-standard.md).
>
> **Non-authoritative.** This record summarizes and links every Phase Engineering Record within the version — it does not replace any phase record, and it does not itself determine release readiness (standard §7.3, §10.3).

---

## 1. Document Control

| Field                      | Value                                                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Record type                | Version Engineering Record (VER)                                                                                                                 |
| Version                    | _(e.g. Version 1)_                                                                                                                               |
| Record lifecycle state     | `Recorded` while the version is still open (grows by append); `Administratively Closed` only once the version itself is complete (standard §7.3) |
| Drafted by                 | _(coding agent / Founder)_                                                                                                                       |
| Drafted on / last appended | _(date)_                                                                                                                                         |
| Approved by                | _(Founder — filled only at `Administratively Closed`)_                                                                                           |
| Approved on                | _(date — filled only at `Administratively Closed`)_                                                                                              |
| Source-of-truth path       | `records/version-<N>/version-<N>-engineering-record.md`                                                                                          |

## 2. Version Dashboard

| Field                                                                                      | Value                                                |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| Version                                                                                    | _(number)_                                           |
| Version status _(authoritative source: Master Workflow / Programme — cite, never restate)_ | _(status + link)_                                    |
| Record lifecycle status                                                                    | _(`Recorded` (growing) / `Administratively Closed`)_ |
| Phases in version                                                                          | _(count)_                                            |
| Phases with a Recorded or Closed PER                                                       | _(count)_                                            |
| Version start date                                                                         | _(date, or `Not recorded`)_                          |
| Version release/close date                                                                 | _(date, or `Not recorded` if still open)_            |

## 3. Version Scope

_(One short paragraph, from the platform's version scope statement — cited, not reworded into a new claim.)_

## 4. Phase Record Register

_(Standard §10.3 item 2 — every phase in the version, its current status per the Programme/Master Workflow, cited not restated, and a direct link to its Phase Engineering Record.)_

| Phase       | Status (cited)    | Phase Engineering Record       |
| ----------- | ----------------- | ------------------------------ |
| _(Phase N)_ | _(status + link)_ | _(link, or "Not yet created")_ |

## 5. Delivery Timeline

_(High-level, version-spanning timeline of major milestones — phase starts/closes, major decision confirmations — each cited. Not a re-listing of every phase record's own chronicle.)_

## 6. Major Engineering Outcomes

_(What the version actually delivered, at a summary level, cited to the constituent Phase Engineering Records.)_

## 7. Architecture and Decision Summary

_(Major architecture and Decision Register outcomes that shaped the version, cited — never restated as though this record were authoritative for their content.)_

## 8. Requirements and Traceability Summary

_(Roll-up of Requirements Traceability Matrix coverage for this version, cited to the matrix — not re-derived.)_

## 9. Quality and Validation Summary

_(Roll-up of validation outcomes across the version's phases, cited to the relevant Definition of Done reconciliations and Technical Reviews.)_

## 10. Security, Privacy and Compliance Summary

_(Roll-up of relevant Decision Register entries and reports — e.g. cross-border hosting, data protection — cited, not restated.)_

## 11. Infrastructure and Deployment Summary

_(Roll-up of infrastructure/deployment evidence across the version's phases, cited.)_

## 12. Known Limitations

_(Carried forward from constituent phase records, not re-derived.)_

## 13. Deferred Work and Future Versions

_(What was explicitly deferred to a later version, cited to where that was disclosed.)_

## 14. Major Risks

_(Version-level risk roll-up, distinct from any single phase's own risk section.)_

## 15. Lessons Learned

_(Version-level observations.)_

## 16. Release Readiness

_(Citation to wherever release readiness was actually assessed — this record does not itself assess or declare readiness.)_

## 17. Founder and Technical Lead Approval

_(Evidence of version-level sign-off, cited.)_

## 18. Administrative Closure and Locking

_(Who approved this record's lock, and when. Empty until the version itself is complete and the Founder approves.)_

## 19. References

_(Every Phase Engineering Record and major citation referenced above, consolidated.)_

## 20. Amendment History

_(Present from creation, typically empty. Holds zero or more dated Amendment entries, appended only after this record is locked and a defined, authorized reopening occurs — mirroring the EIR-level procedure in standard §6.4.)_

| Date         | Amendment | Primary source |
| ------------ | --------- | -------------- |
| _(none yet)_ | —         | —              |
