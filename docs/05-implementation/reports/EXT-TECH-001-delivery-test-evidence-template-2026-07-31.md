> **Title:** EXT-TECH-001 Delivery-Test Evidence Template
> **Purpose:** Privacy-safe results record for the Burundi carrier OTP delivery test, populated by the tester per the accompanying [Manual Runbook](EXT-TECH-001-TEST-HARNESS-manual-runbook-2026-07-31.md). **Never enter a full phone number, OTP, or any secret into this file.**
> **Source-of-truth path:** `docs/05-implementation/reports/EXT-TECH-001-delivery-test-evidence-template-2026-07-31.md`
> **Prepared:** 2026-07-31 (template only — not yet populated with any test result). **Updated:** 2026-08-01 (CR1 — the harness now enforces an approved-project allowlist, so `Environment / project` should always read exactly `eleventh-on-us-dev`; `Delivery latency` is now the full Send-click-to-receipt interval; `Retry count` is bounded to 3 per session — see notes below each column).

---

## Technical proof threshold (engineering recommendation — no governing document defines this threshold; label accordingly if cited elsewhere)

At least one successful, tester-confirmed SMS receipt **and** successful OTP verification on **each** of the three carriers named by `EXT-TECH-001` (Lumitel, Econet Leo, Onatel/Onamob) constitutes the minimum technical-feasibility proof this evidence template exists to capture. A single successful test on one carrier proves the route works for that carrier only — it must not be read as proof for the other two.

## Launch-reliability threshold (engineering recommendation — separate and broader; not addressed by this template alone)

Production-launch reliability requires a materially larger, statistically meaningful sample across each carrier, sustained over time, plus cost-per-SMS confirmation and abuse-control validation under real traffic — out of scope for this bounded delivery test, and not something a handful of manual trials can establish. This template's rows are technical-proof evidence only.

---

## Results

| Test ID | Masked number | Carrier | Date / local time | Environment / project | Request accepted | SMS received | Delivery latency | OTP verified | Retry count | Firebase error code | Notes / evidence reference |
|---|---|---|---|---|---|---|---|---|---|---|---|
| | | | | eleventh-on-us-dev | | | | | | | |
| | | | | eleventh-on-us-dev | | | | | | | |
| | | | | eleventh-on-us-dev | | | | | | | |

*(Add rows as needed — one row per test attempt, not one row per carrier; a retried carrier gets a new row with an incremented Retry count context noted in Notes.)*

**Column notes (CR1):**
- **Environment / project:** the harness now refuses to send against anything other than `eleventh-on-us-dev` — this column should never legitimately read anything else. A different value here would indicate the harness's allowlist was bypassed and the row's evidence should not be trusted.
- **Delivery latency:** the harness's "Delivery latency (Send click → tester-confirmed receipt)" figure — the complete end-to-end interval including reCAPTCHA, Firebase, and carrier delivery time. Do not use the harness's separate "Firebase acceptance latency (internal diagnostic)" figure here; that one measures only the pre-acceptance portion and undercounts the true delivery time.
- **Retry count:** the harness's own on-screen, automatically-incremented count for that test session — bounded to 3 (4 total attempts). If the bound was reached without success, note "retry limit reached" in Notes and record the row as `Still Pending`/`Failed`.

## Per-carrier summary (fill in after all attempts for a carrier are recorded above)

| Carrier | Attempts | Best result | Technical proof met? |
|---|---|---|---|
| Lumitel | | | |
| Econet Leo | | | |
| Onatel / Onamob | | | |

## Overall determination (fill in once all three carriers have at least one attempt)

- [ ] Resolved — technical proof met on all three required carriers.
- [ ] Resolved with Launch Conditions — technical proof met on all three, broader reliability sampling remains a launch-readiness condition.
- [ ] Still Pending — one or more required carriers not yet tested, or evidence inconclusive.
- [ ] Failed — valid testing demonstrates the approved route does not meet the technical proof requirement on one or more carriers.

**Determined by:** _______________ **Date:** _______________

This determination should be transcribed (masked evidence only) into a future task's report for recording against the External Dependencies Register — do not edit the Register directly from this template.
