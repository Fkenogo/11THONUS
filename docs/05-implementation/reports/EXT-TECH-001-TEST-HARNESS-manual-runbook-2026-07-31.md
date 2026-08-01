> **Title:** EXT-TECH-001 Delivery-Test Harness — Manual Runbook
> **Audience:** Founder or an authorised tester holding a physical Burundi SIM. Operational, not narrative — follow the numbered steps.
> **Source-of-truth path:** `docs/05-implementation/reports/EXT-TECH-001-TEST-HARNESS-manual-runbook-2026-07-31.md`
> **Prepared:** 2026-07-31. **Updated:** 2026-08-01 (CR1 — approved-project allowlist, full end-to-end latency definition, bounded retry procedure; see the implementation report's CR1 addendum for the corrective-review context).

---

> **Never paste a real phone number or OTP into a coding-agent conversation, repository file, issue, pull request, or committed screenshot.**

## 1. Run the harness locally

```bash
pnpm --filter web dev
```

The harness route is `/dev/phone-auth-harness`, only reachable when Vite is running in development mode (`pnpm dev`, not a production build). Open:

```
http://localhost:5173/dev/phone-auth-harness
```

(Vite's default dev port; check the terminal output if it differs.)

## 2. Confirm the Firebase development project is selected

The harness ignores `VITE_USE_FIREBASE_EMULATOR` and always uses a dedicated, never-emulator-connected Firebase Auth instance (`phoneAuthHarnessAuth.ts`). It requires `apps/web/.env.local` to contain the **real** `eleventh-on-us-dev` project's client config:

```bash
cp apps/web/.env.example apps/web/.env.local   # if not already done
# then fill in the real VITE_FIREBASE_* values from the Firebase Console
# (Project settings → General → Your apps → Web app, project eleventh-on-us-dev)
```

As of CR1, the harness enforces a **positive allowlist**, not merely a rejection of the Emulator Suite's demo project: it refuses to send unless the resolved `projectId` is exactly `eleventh-on-us-dev`. A missing `.env.local`, the demo project, the staging project, or any other real Firebase project are all refused with the same on-screen error — none of them can silently send a real SMS through the wrong environment.

## 3. Verify the SMS allowlist contains only `BI`

Before sending, confirm the live SMS Region Policy has not drifted from the `EXT-TECH-001-ENV-READY` state:

```bash
TOKEN=$(gcloud auth print-access-token --account=<your-account>)
curl -s -X GET "https://identitytoolkit.googleapis.com/admin/v2/projects/eleventh-on-us-dev/config" \
  -H "Authorization: Bearer $TOKEN" -H "x-goog-user-project: eleventh-on-us-dev" \
  | grep -A3 smsRegionConfig
```

Expected: `"allowlistOnly": {"allowedRegions": ["BI"]}`. If it reads differently, stop and re-establish it before testing (do not test against an unreviewed region policy).

## 4. Select the correct carrier

On the harness page, choose the carrier that matches the physical SIM you are about to test (Lumitel / Econet Leo / Onatel / Onamob / Other-Unknown). The harness does not infer carrier from the number — you must select it, since carrier-specific delivery is exactly what this test measures.

## 5. Enter a real number privately

Type the real Burundi number (E.164 format, e.g. `+257...`) directly into the phone field on your own screen. Do not say it, type it, or screenshot it anywhere outside this local page. The harness never stores or echoes the raw number after you click Send — only a masked form (e.g. `+*********56`) is shown afterward.

## 6. Trigger the OTP

Click **Send OTP**. This invokes the genuine Firebase Authentication Phone Sign-In route (`RecaptchaVerifier` + `signInWithPhoneNumber`) against the real `eleventh-on-us-dev` project — a real SMS billing charge applies at this point if the request is accepted. The page will show "Request accepted: Yes" if Firebase accepted the send; this does **not** by itself mean the SMS arrived — see step 7.

## 7. Mark the physical SMS as received

Watch the physical phone. The harness cannot detect delivery automatically — it deliberately does not attempt to. The moment the SMS actually arrives on the device, click **Mark SMS Received** on the harness page. This captures the tester-confirmed receipt timestamp used for the delivery-latency measurement.

If no SMS arrives within a reasonable window (a few minutes), do not keep waiting indefinitely — see step 8 for the bounded retry procedure, and step 13 for when to stop altogether.

## 8. If no SMS arrives, use the bounded Retry / Resend control

The harness now has a **Retry / Resend** button, visible as soon as a request has been sent — you do not need to click **Reset harness** to try again. Clicking it:

- Resends to the **same** masked number and carrier you already entered (nothing needs to be re-typed).
- Clears any OTP you had started entering and any prior result/error for that attempt.
- Starts a **new** delivery-latency timer for this attempt only (the old attempt's timing is discarded, not blended in).
- Increments the on-screen **Retry count**.

**The retry control is bounded to 3 retries per test session** (4 total send attempts including the first). Once the limit is reached, the button is disabled and reads "Retry limit reached (3/3)". This is a deliberate, small bound — consistent with "do not immediately retry more than once or twice" below — not a production retry policy; it exists to keep manual testing disciplined and to avoid tripping Firebase's own abuse-prevention throttles (see step 13). If the limit is reached without a successful receipt, stop for that carrier, record it as `Still Pending`/`Failed` in the evidence template, and click **Reset harness** before trying a different carrier or number.

## 9. Enter the OTP

Read the code from the received SMS and type it into the Verification Code field, then click **Verify OTP**. This calls the real `ConfirmationResult.confirm()` against Firebase. "OTP verified: Yes" confirms a full, genuine round trip.

## 10. Record delivery latency

The harness displays two timing figures once available:

- **"Delivery latency (Send click → tester-confirmed receipt)"** — the number to transcribe into the evidence template. This is the complete, end-to-end, user-observed interval: it includes reCAPTCHA time, the Firebase network round trip, and carrier delivery time, measured from the moment you clicked Send (or Retry) to the moment you clicked Mark SMS Received.
- **"Firebase acceptance latency (internal diagnostic; Send click → Firebase accepted)"** — a secondary, internal-only figure showing how much of the total interval was spent before Firebase accepted the request (reCAPTCHA + Firebase's own round trip), useful for distinguishing a slow carrier from a slow request — not itself the figure to transcribe.

Do not transcribe the real number.

## 11. Capture privacy-safe evidence

Take a screenshot of the results panel only if it shows the **masked** number (never re-enter or re-display the raw number for a screenshot). Copy the visible fields (masked number, carrier, request accepted, SMS received, delivery latency, OTP verified, retry count, error code if any) into the evidence template.

## 12. Reset the harness

Click **Reset harness** before testing a second carrier or ending the session. This clears the phone number, carrier, OTP, all results, the retry count, and the reCAPTCHA widget state from memory — nothing persists across a reset or a page reload (the harness never writes to `localStorage`/`sessionStorage`).

## 13. Stop if repeated sends risk rate limiting

Firebase's standard quotas (900 SMS/minute, 3,000/day project-wide; 50/minute, 500/hour per-IP; an undocumented per-number throttle) apply. The harness's own Retry/Resend bound (step 8) already prevents more than 4 total attempts per session without a full reset, but use judgement below that bound too: if a carrier fails once, do not treat every remaining retry as automatic — record it as `Still Pending`/`Failed` for that carrier in the evidence template and stop, rather than risk tripping Firebase's abuse-prevention throttles, which could then interfere with testing the remaining carriers.

## 14. Remove or disable the harness after testing

No action is required to "turn off" the harness for production — it is already excluded from every production build (`import.meta.env.DEV`-gated `React.lazy` route, verified absent from `dist/` after a real `pnpm build`, per the accompanying implementation report). It remains available in local development only. If a future task wants it fully removed from the repository, delete `apps/web/src/dev/phoneAuthHarness/` and the corresponding route registration in `apps/web/src/App.tsx`.
