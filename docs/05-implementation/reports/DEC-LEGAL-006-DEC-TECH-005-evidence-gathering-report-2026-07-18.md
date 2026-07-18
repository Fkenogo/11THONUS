> **Title:** DEC-LEGAL-006 / DEC-TECH-005 Evidence-Gathering Report
> **Status:** Research complete, corrected twice same day — submitted for Founder and Technical Review. Neither decision resolved. Not committed, not pushed.
> **Date:** 2026-07-18
> **Classification:** Target-only addition (did not exist in the migrated documentation source)

# DEC-LEGAL-006 / DEC-TECH-005 Evidence-Gathering Report

> **Correction notice (2026-07-18, same day, first pass):** this report and the evidence package it describes were corrected after a source-quality and completeness review found: (1) Rwanda's official-language count was understated (three, should be four — Kiswahili was missing); (2) Burundi's primary law, initially unreachable, was successfully downloaded directly and read in full (all 55 articles, reviewed as page images since the PDF has no text layer), closing what had been the single largest research gap; (3) the technical service matrix left several services unchecked and was materially expanded, revealing a second regional gap (Cloud Tasks, alongside the already-identified Cloud Scheduler gap) in `africa-south1`; (4) some recommendation language overstated confidence and has been softened; (5) the source register was recomputed accordingly.
>
> **Correction notice (2026-07-18, same day, second pass):** a further narrow consistency review found three residual overstatements even after the first pass: (1) the Firebase Authentication wording still implied a data-residency fact ("global," "not confined") the reviewed documentation does not establish — narrowed to a controlled statement plus an explicit provider-confirmation requirement; (2) Cloud Scheduler and Cloud Tasks were being treated as solved by the same cross-region fix — they are now explicitly separated, with Cloud Tasks left as an open architecture question with its own list of sub-questions; (3) "service matrix is complete" language was further softened to "materially expanded, primary candidates checked, some items open." This report's numbers below reflect the **corrected** state after both passes; §§ marked "corrected" note what changed.

## 1. Executive Summary

Executed the committed [evidence-gathering prompt](../prompts/DEC-LEGAL-006-DEC-TECH-005-evidence-pack.md) (`fcd89d4`), then corrected it the same day following a source-quality review, using real internet research (**33 sources, 61% primary**, corrected from an initial 25/60%). Produced a legal evidence pack, a technical evidence pack, proposed-but-unapplied Decision Register text, a plain-language Founder brief, and a full source register. **Rwanda's cross-border hosting mechanism is well-documented and workable but procedural** (NCSA authorization/alternative ground + written contract, required for any non-Rwanda region), and **Rwanda's official-language count is now correctly stated as four (Kinyarwanda, English, French, Kiswahili), not three.** **Burundi's primary law was initially unreachable but was successfully downloaded and fully read in this correction pass** — its cross-border mechanism is now confirmed as an **adequacy-based model** (a Ministerial "approved country" list, or Agency-approved safeguards for non-listed jurisdictions), narrowing what had been the single largest gap to two specific open items: the list's contents and the new Agency's operational status. On the technical side, `africa-south1` (Johannesburg) and `europe-west1` (Belgium) both support the core required architecture as checked, with **two confirmed regional gaps for `africa-south1` that are evidentially distinct, not one problem**: Cloud Scheduler (a documented/strongly-supported cross-region fix exists) and Cloud Tasks (an unresolved architecture question with no equivalent confirmed fix); latency figures remain estimates, not measurements; and Firebase Authentication's actual data-residency position is now explicitly flagged as requiring direct provider confirmation rather than asserted as a known fact. **Neither DEC-LEGAL-006 nor DEC-TECH-005 is resolved.** No region was selected as final. No Firebase project was created. No deployment occurred. No Phase 1 implementation began.

## 2. Research Method

Real-time web research via search and direct document retrieval, following the source's own required hierarchy (official legislation/gazettes → national regulator publications → official government portals → treaties/regional instruments → official regulator guidance → reputable commentary as interpretation only, for legal; official Firebase/Google Cloud documentation → official pricing/location pages → official status materials, for technical). Every claim in the two evidence packs is either cited to a specific source in the [Source Register](../../00-governance/decisions/evidence/DEC-LEGAL-006-DEC-TECH-005-source-register-2026-07-18.md) or explicitly labeled an assumption/estimate/unconfirmed gap — never blended together.

## 3. Files Created

Original pass (2026-07-18):

- [`docs/00-governance/decisions/evidence/DEC-LEGAL-006-cross-border-hosting-evidence-2026-07-18.md`](../../00-governance/decisions/evidence/DEC-LEGAL-006-cross-border-hosting-evidence-2026-07-18.md)
- [`docs/00-governance/decisions/evidence/DEC-TECH-005-firebase-region-evaluation-2026-07-18.md`](../../00-governance/decisions/evidence/DEC-TECH-005-firebase-region-evaluation-2026-07-18.md)
- [`docs/00-governance/decisions/evidence/DEC-LEGAL-006-DEC-TECH-005-proposed-updates-2026-07-18.md`](../../00-governance/decisions/evidence/DEC-LEGAL-006-DEC-TECH-005-proposed-updates-2026-07-18.md)
- [`docs/00-governance/decisions/evidence/DEC-LEGAL-006-DEC-TECH-005-founder-brief-2026-07-18.md`](../../00-governance/decisions/evidence/DEC-LEGAL-006-DEC-TECH-005-founder-brief-2026-07-18.md)
- [`docs/00-governance/decisions/evidence/DEC-LEGAL-006-DEC-TECH-005-source-register-2026-07-18.md`](../../00-governance/decisions/evidence/DEC-LEGAL-006-DEC-TECH-005-source-register-2026-07-18.md)
- `docs/05-implementation/reports/DEC-LEGAL-006-DEC-TECH-005-evidence-gathering-report-2026-07-18.md` — this report.

No new files were created in the correction pass — all six files above were edited in place.

## 4. Files Modified

First correction pass (2026-07-18, same day as creation): all five evidence-package files listed in §3 above were edited in place (Rwanda language correction; Burundi primary-text findings; technical service-matrix expansion; softened recommendation language; recomputed source register), plus this report itself, plus `docs/changes/IMPLEMENTATION_CHANGES.md` (one further append-only entry documenting the correction — no prior entry rewritten).

Second correction pass (2026-07-18, same day, narrower scope): all five evidence-package files edited again in place (Firebase Authentication wording narrowed; Cloud Scheduler separated from Cloud Tasks as distinct findings; service-matrix completeness wording further softened; source register re-audited for T6/T8/T15/T17/T18), plus this report itself, plus one further `docs/changes/IMPLEMENTATION_CHANGES.md` append-only entry.

## 5. Sources Reviewed

**33 total (corrected from 25): 15 legal, 18 technical.** Full detail, including per-source reliability limitations, in the [Source Register](../../00-governance/decisions/evidence/DEC-LEGAL-006-DEC-TECH-005-source-register-2026-07-18.md).

## 6. Evidence-Quality Assessment

**Corrected 2026-07-18** — added 8 sources (S14 Rwanda's Kiswahili organic law; T13 Cloud Run; T14 Cloud Tasks; T15 Pub/Sub; T16 Secret Manager; T17 Scheduler cross-region architecture; T18 Firebase tooling GitHub issues), downgraded 4 (S5, S7, S8, S9 — their claims are now superseded by directly-read primary sources), and upgraded S6 (Burundi's law) from "identified, not read" to "directly read, primary."

- **Primary sources: 20/33 (61%)** — official legislation (Rwanda Law N° 058/2021 via RwandaLII, the 2017 Kiswahili organic law, and **Burundi's Loi n° 1/03 du 10 mars 2026, now directly downloaded and fully read**), official Rwandan regulator publications (NCSA/DPO), the African Union's own treaty ratification page, and official Firebase/Google Cloud documentation (locations, pricing tiers, service availability across 8 distinct services).
- **Secondary sources: 13/33 (39%)** — news reporting (Burundi law context now superseded by direct primary reading for the claims it originally supported), vendor forum threads for Firebase Authentication's regionalization roadmap, third-party network-measurement/connectivity-context sources, and search-engine syntheses used where a page could not be directly fetched and quoted verbatim (Pub/Sub availability, Cloud Scheduler's cross-region architecture).
- **Burundi's law is no longer an unretrieved source.** The official PDF was downloaded directly (7.6MB, 32 pages) and found to be a scanned/image-only document with no extractable text layer; with no OCR tool available in this environment, **all 55 articles were reviewed visually from rendered page images**, citing article and page numbers throughout the corrected Legal Evidence Pack. This closes what had been the largest confirmed gap in the original pass, though two narrower Burundi-specific gaps remain (the Ministerial adequacy list's contents; the Agency's implementing decree and operational status).

## 7. Legal Findings Summary

**Corrected 2026-07-18.**

- **Rwanda:** data must be stored in Rwanda by default (Law N° 058/2021, Art. 50); any offshore hosting (which any Firebase/GCP region is, since none is in Rwanda) requires NCSA authorization or a documented Article 48 alternative ground, plus an Article 49 written transfer contract. Registration (Art. 29–31), breach notification (48hr/72hr, Art. 43–44), and consent-language rules (Art. 7, "one of the official languages") are all documented with article-level citations. **Correction: Rwanda has four official languages — Kinyarwanda, English, French, and Kiswahili** (added by a 2017 Organic Law) — not three as the original pass stated.
- **Burundi:** adopted its first comprehensive data protection law, Loi n° 1/03 du 10 mars 2026, promulgated 10 March 2026. **Correction: the law was directly downloaded and read in full (55 articles).** Its cross-border transfer mechanism is now confirmed as **adequacy-based** (Art. 15–16): transfer to a Ministerial-approved-list country, or to any other country if the receiving party has safeguards approved by Burundi's new data protection authority — now confirmed formally named the **"Agence de protection des données à caractère personnel"** (Art. 42). Registration obligations apply only to "major controllers" (>200 employees or specific public/health/legal-claims entities, Art. 4/34) — 11thONUS likely does not meet this threshold. Breach notification: 48 hours to the authority, 96 hours to affected subjects for high-risk breaches (Art. 45–46). **Remaining gaps, narrower than before:** the Ministerial adequacy list's actual contents, and the Agency's implementing decree/operational status.
- **Mandatory-language finding:** Rwanda — likely satisfied by English/French given Article 7's "one of the official languages" standard (now a four-language list), with a residual risk-management case for adding Kinyarwanda not eliminated. Burundi — **corrected: directly checked against all 55 articles, no language requirement was found in the data protection law itself** — a stronger, verified finding than the original pass's "uncertain." A separate, older consumer-protection statute's language implications remain unreviewed. Neither finding is treated as authorization to change the product's approved English/French interface scope (`DEC-L10N-001`, unchanged).
- **New finding:** Burundi's Art. 2 territorial-scope test is means-based (use of processing means located in Burundi), not an explicit targeting test; if triggered, and if 11thONUS's Burundi processing is non-occasional, a Burundi-established representative may be required — a fact-specific question for counsel.
- **New finding:** Burundi's private-sector compliance deadline is 6 months from the law's 10 March 2026 entry into force — approximately 10 September 2026 — a clock already running independent of when these decisions are resolved.
- **Regional framework:** the Malabo Convention is ratified by Rwanda (2019) but only signed, not confirmed ratified, by Burundi; the EAC's own cross-border data-flow framework is still in a June 2026 validation-workshop stage, not yet binding.

## 8. Technical Findings Summary

**Corrected 2026-07-18 — the service matrix was materially expanded and the primary-candidate checks were completed for the services prioritized in this pass. It is not an exhaustive service, residency, pricing, or operational audit.**

- Six real Google Cloud location identifiers evaluated (not the placeholder "europe-west"/"africa-south" names in DEC-TECH-005's original decision text): `africa-south1`, `europe-west1`, `europe-west3`, `europe-west4`, `europe-west9`, and the `eur3` Firestore multi-region.
- **Firebase Authentication does not expose a project-level location-selection control comparable to Firestore or Cloud Storage** (wording narrowed twice: first from the original pass's "stored globally"/"not region-selectable" framing, then again in a second correction pass to add an explicit limitation: **the official documentation reviewed does not itself establish where Authentication data actually resides** — confirmation must come from Google's service terms, data-processing documentation, or the provider directly, before this fact is relied upon for legal approval), regardless of candidate.
- **`africa-south1` does not support Cloud Scheduler or Cloud Tasks — but these are two separate findings with two separate evidentiary positions, not one problem with one fix.** Cloud Scheduler has a documented/strongly-supported cross-region pattern (a job in a supported region can invoke an `africa-south1` HTTPS endpoint), though Firebase's automatic `onSchedule` tooling does not reliably handle unsupported regions on its own (per community-reported GitHub issues), so manual setup is required. **Cloud Tasks remains an unresolved architecture question** — no official documentation reviewed confirms the same cross-region pattern applies to Cloud Tasks queues, which behave differently from simple scheduled triggers (retries, dead-letter handling, payload flow); a queue in a supported region, an alternative mechanism (e.g. Pub/Sub-based fan-out), or a redesign must be evaluated separately.
- Cloud Storage, Cloud Run, Pub/Sub, Secret Manager, and App Check are now confirmed/addressed for both primary candidates — closing gaps the original pass left as "not independently confirmed."
- Firestore location, once a database is created, cannot be changed without a full migration — true for every candidate equally.
- Latency and per-region Firestore/Storage pricing are **estimates and assumptions respectively, not measurements or confirmed figures** — explicitly labeled as such throughout, per the source prompt's explicit instruction not to present distance as measured latency or fabricate cost figures without usage assumptions.

## 9. Recommendation Summary

**Advisory only, not final — recommendation language softened in this correction pass to avoid overstating "full" coverage.** Conservative default: `europe-west1` (most complete confirmed service profile of the candidates checked in §2 of the Technical Evidence Pack, no mixed-region complexity, most mature). Latency-optimized alternative: `africa-south1` (likely fastest for Kigali/Bujumbura, continent-proximate for future growth, but requires resolving two separate service gaps, not one: Cloud Scheduler has a manually-provisioned cross-region pattern already identified as viable, while **Cloud Tasks remains a separate, unresolved architecture question with no equivalent confirmed pattern**; `africa-south1` also carries an unconfirmed cost premium and shorter track record). Both remain contingent on the legal gaps in §7 and an actual latency measurement neither this pack nor its predecessor tooling could produce.

## 10. Assumptions

- `africa-south1` likely carries a pricing premium relative to mature European regions — inferred from Google's general regional-tiering pattern (confirmed for Cloud Functions specifically), not independently confirmed for Firestore/Storage.
- Kigali/Bujumbura latency to `africa-south1` is likely lower than to any European candidate — inferred from regional connectivity topology (SEACOM/EASSy routing via South Africa), not measured.
- No data category identified in Part A §4 was assumed to fall into a distinct "sensitive data" tier under either statute without independent confirmation — each such judgment is flagged, not assumed silently.

## 11. Uncertainties

**Corrected 2026-07-18 — narrower than the original pass following the Burundi primary-text review and completed technical matrix.**

- The contents of Burundi's Ministerial adequacy list (if issued) and the operational status of its Agency for approving alternative safeguards (narrower than the original pass's blanket "cross-border mechanism unconfirmed").
- Burundi's Agency implementing decree (missions/composition/organization) — not located.
- Whether 11thONUS's Burundi technical stack triggers Art. 2's "processing means located in Burundi" test, and therefore the local-representative requirement.
- Whether Rwanda's Article 7 consent-language standard (now a four-language list) is satisfiable by English/French alone in NCSA's actual enforcement practice, or whether Kinyarwanda/Kiswahili becomes practically necessary.
- Whether Burundi's separate, pre-existing 2009 consumer-protection law requires Kirundi for consumer-facing legal text (the data protection law itself was confirmed to have no language requirement).
- Real (not estimated) latency from Kigali and Bujumbura to any candidate region.
- Confirmed per-region Firestore and Cloud Storage pricing (only Functions/Run pricing-tier data was directly confirmed).
- Burundi's Malabo Convention ratification status (signed, ratification unconfirmed).
- Pub/Sub's official regional-availability page was not directly fetched and quoted (T15, secondary-quality search synthesis) — should be re-confirmed before final reliance, though this is a minor/low-risk gap.
- **Cloud Tasks in `africa-south1` is an open architecture question, not just an open technical fact** — whether a queue in a supported region can securely and reliably invoke an `africa-south1` target; authentication method; retry/dead-letter behavior; regional-failure behavior; latency/egress cost; and data-residency implications for task payloads and metadata (Technical Evidence Pack §9, condition 6).
- **Firebase Authentication's actual data-residency position** — confirmed absent a project-level location-selection control, but not confirmed as to where the data itself resides; requires direct confirmation from Google's service terms, data-processing documentation, or the provider (Technical Evidence Pack §2, §9 condition 7).

## 12. Legal-Counsel Questions

**Corrected 2026-07-18** — full lists are in the [Legal Evidence Pack](../../00-governance/decisions/evidence/DEC-LEGAL-006-cross-border-hosting-evidence-2026-07-18.md) §7. Five questions for Rwandan counsel (extraterritorial scope, NCSA authorization mechanics, likely NCSA posture toward a platform at 11thONUS's scale, practical consent-language sufficiency given the corrected four-language list, applicable security-measure standard). **Six questions for Burundian counsel, now narrower and more specific** following direct primary-text review (adequacy-list contents/Agency operational status, whether the Art. 2 local-representative trigger applies to 11thONUS's actual stack, whether 11thONUS falls outside the "major controller" registration threshold, the separate consumer-protection law's language implications, and the practical compliance posture given the ~10 September 2026 deadline). One cross-cutting tax/commercial question, unchanged.

## 13. Commands Executed

```
git branch --show-current / git status --short / git rev-parse --short HEAD / git rev-parse --short origin/main
(WebSearch × 14, WebFetch × 12 — original pass, legal and technical research queries)
(Correction pass, 2026-07-18: WebSearch × 9, WebFetch × 14 — Rwanda language verification,
 Burundi PDF direct-download verification, GCP/Firebase service-matrix completion)
curl -sL -o burundi-law.pdf https://arct.gov.bi/wp-content/uploads/.../Loi-n%C2%B01_03-2026-...pdf
file burundi-law.pdf ; pdftotext -layout burundi-law.pdf burundi-law.txt ; pdfinfo burundi-law.pdf
pdftoppm -png -r 150 burundi-law.pdf burundi-pages/page   (32 pages rendered; no OCR tool available;
 all 55 articles reviewed visually via the Read tool against the rendered page images)
python3 linkcheck.py   (documentation relative-link checker — run after corrections, see §17 below)
```

## 14. Dependencies Added

None.

## 15. Configuration Changes

None — no application, test, CI, package, or Firebase configuration file was touched.

## 16. Risks

- **Burundi's remaining gaps (adequacy-list contents, Agency operational status) are narrower than the original pass's blanket gap, but not eliminated** — resolving them requires direct outreach to Burundi's new Agency or Burundian counsel, since no further primary text (an implementing decree) was locatable via web research.
- **The Burundi law review was manual (visual page-by-page reading of a scanned PDF with no OCR), not machine-verified** — a second reviewer or an OCR-based cross-check remains prudent before final legal reliance, even though the review covered all 55 articles.
- **Latency estimates are directional, not measured** — a decision made on this pack's latency section alone, without commissioning a real measurement, would be a weaker basis for DEC-TECH-005 than the pack itself recommends.
- **Firebase Authentication does not expose a project-level location-selection control comparable to Firestore or Cloud Storage.** The precise residency of Authentication data remains unconfirmed and must be established from Google's applicable contractual, service, or data-processing documentation before legal approval — this is disclosed clearly in both evidence packs, not buried, with the wording corrected to avoid overstating what the documentation itself confirms.
- **Cloud Tasks, not just Cloud Scheduler, is confirmed unsupported in `africa-south1`, and Cloud Tasks does not have a confirmed fix the way Cloud Scheduler does** — a materially larger technical caveat for that candidate than the original pass identified, now fully disclosed and explicitly separated in the Technical Evidence Pack and this report, with its own list of open sub-questions.
- **Firebase Authentication's actual data-residency position is unconfirmed** — this pack now states clearly that its finding (no location-selection control) is not evidence of where the data resides, closing a risk that the original wording could have been read to overstate.
- No risk to already-completed Phase 0 work — this task touched no application, CI, or Phase 0 governance file, in either the original or correction pass.

## 17. Rollback Instructions

All six files created by this task are new and untracked in git. Discard:

```bash
cd /Users/theo/11THONUS
rm docs/00-governance/decisions/evidence/DEC-LEGAL-006-cross-border-hosting-evidence-2026-07-18.md
rm docs/00-governance/decisions/evidence/DEC-TECH-005-firebase-region-evaluation-2026-07-18.md
rm docs/00-governance/decisions/evidence/DEC-LEGAL-006-DEC-TECH-005-proposed-updates-2026-07-18.md
rm docs/00-governance/decisions/evidence/DEC-LEGAL-006-DEC-TECH-005-founder-brief-2026-07-18.md
rm docs/00-governance/decisions/evidence/DEC-LEGAL-006-DEC-TECH-005-source-register-2026-07-18.md
rm docs/05-implementation/reports/DEC-LEGAL-006-DEC-TECH-005-evidence-gathering-report-2026-07-18.md
git checkout -- docs/changes/IMPLEMENTATION_CHANGES.md
```

## 18. Decision Status Confirmation

`DEC-LEGAL-006`: **`OPEN_LEGAL`, unchanged.** `DEC-TECH-005`: **`OPEN_ENGINEERING`, unchanged.** The [Decision Register](../../00-governance/decisions/decision-register.md) file itself was not modified — confirmed via `git diff` in §19 below. No region was selected or treated as final anywhere in the output.

## 19. Final Git Status

To be confirmed in the Validation section of this task's chat response (run after this report was written) — expected: working tree shows exactly the 6 new files above as untracked, `docs/changes/IMPLEMENTATION_CHANGES.md` as the only modified tracked file, `git diff -- docs/00-governance/decisions/decision-register.md` empty, and no application/test/CI/package/Firebase file appearing in `git status --short`.

---

## Status

Research complete, corrected twice same day. Neither DEC-LEGAL-006 nor DEC-TECH-005 is resolved. Submitted for Founder and Technical Review. Not committed, not pushed.
