/**
 * EXT-TECH-001 delivery-test harness (development only).
 *
 * A Founder/authorised-tester-operated tool, not a customer-facing
 * authentication screen. Invokes the genuine Firebase Authentication
 * Phone Sign-In SMS route (`RecaptchaVerifier` + `signInWithPhoneNumber`
 * + `ConfirmationResult.confirm`) via a dedicated, never-emulator-
 * connected Auth instance (`phoneAuthHarnessAuth.ts`), so a real SMS is
 * sent only when a tester enters a real number and clicks Send.
 *
 * Privacy invariants enforced throughout this file: the phone number and
 * OTP live only in component state (never `localStorage`/`sessionStorage`/
 * URL); the raw number is never rendered again once the request is sent
 * (only `maskPhoneNumber()`'s output is shown); the OTP is never rendered
 * back and is cleared immediately on successful verification or reset;
 * Firebase errors are surfaced by `.code` only, never `.message` (which
 * can embed the phone number); nothing here imports or calls into
 * `observability/*` — this tool's inputs must never reach a diagnostics
 * provider. "SMS received" is set only by the tester's own manual click
 * after physically observing their phone — this component cannot and
 * does not claim to detect delivery automatically.
 *
 * CR1 corrections: the displayed delivery latency measures the complete
 * user-observed flow (Send click → tester-confirmed receipt), not merely
 * the interval after Firebase accepts the request — see `performSend`'s
 * `requestStartedAt` capture and the "Delivery latency" line below. A
 * bounded Retry/Resend control (`MAX_RETRY_COUNT`) lets a tester resend to
 * the same masked identity/carrier without a full `resetAll()`, clearing
 * only the stale per-attempt OTP/result/timing state.
 */

import { useEffect, useId, useRef, useState } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import { getAppEnv } from "../../config/env";
import { getPhoneAuthHarnessAuth } from "./phoneAuthHarnessAuth";
import { isHarnessEnabled } from "./harnessGate";
import { maskPhoneNumber } from "./mask";

type Carrier = "lumitel" | "econet_leo" | "onatel" | "other_unknown" | "";

const CARRIER_LABELS: Record<Exclude<Carrier, "">, string> = {
  lumitel: "Lumitel",
  econet_leo: "Econet Leo",
  onatel: "Onatel / Onamob",
  other_unknown: "Other / Unknown",
};

interface TimingState {
  requestStartedAt?: number;
  requestAcceptedAt?: number;
  smsReceivedMarkedAt?: number;
  otpVerifiedAt?: number;
}

function elapsedMs(from?: number, to?: number): string {
  if (from === undefined || to === undefined) return "—";
  return `${to - from} ms`;
}

const INITIAL_TIMING: TimingState = {};

// Bounded per the runbook's own guidance (do not retry a failing carrier
// more than once or twice) and Firebase's abuse-prevention throttles — a
// small, explicit maximum rather than a time-based cooldown, since this is
// a manually-operated test-harness control, not a production retry policy.
const MAX_RETRY_COUNT = 3;

export function PhoneAuthHarnessPage({
  dev,
  testHarnessBuild = false,
}: {
  dev: boolean;
  /**
   * CR3: set only by `harnessMain.tsx`, and only from the same literal,
   * build-time-foldable `isTestHarnessBuildEnabled(...)` check that gates
   * whether `harness.html` is even built. Re-checked here too — not just
   * at the build-entry level — so a direct navigation to a hosted preview
   * whose build somehow didn't satisfy every condition still can't reach
   * the interactive form. Defaults to `false` so every existing caller
   * (the dev-server route in `App.tsx`, and every test that doesn't pass
   * it) is unaffected and still fails closed.
   */
  testHarnessBuild?: boolean;
}) {
  const phoneInputId = useId();
  const carrierSelectId = useId();
  const otpInputId = useId();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [carrier, setCarrier] = useState<Carrier>("");
  const [otp, setOtp] = useState("");
  const [submittedPhoneNumber, setSubmittedPhoneNumber] = useState<string | null>(null);
  const [requestAccepted, setRequestAccepted] = useState(false);
  const [smsReceivedConfirmed, setSmsReceivedConfirmed] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [timing, setTiming] = useState<TimingState>(INITIAL_TIMING);
  const [isSending, setIsSending] = useState(false);

  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  // CR3 root-cause fix: `RecaptchaVerifier.clear()` resets the widget's
  // internal state but does NOT remove the DOM nodes `grecaptcha.render()`
  // injected into its container element — confirmed by direct
  // reproduction against the real widget (see the CR3 implementation
  // report). A second `RecaptchaVerifier` built against that SAME
  // container element still throws "reCAPTCHA has already been rendered
  // in this element" the next time `.verify()` runs internally, which is
  // exactly what CR2's clear()-and-reconstruct fix hit — it reused one
  // static container id for every attempt. The only reliable fix is a
  // genuinely fresh, never-before-used DOM node per verifier:
  // `recaptchaWrapperRef` is the one stable, React-owned element in the
  // tree; `recaptchaContainerNodeRef` tracks whichever plain DOM `<div>`
  // is the CURRENT attempt's container, created fresh and appended to the
  // wrapper on every attempt, then detached and discarded once that
  // attempt's verifier is torn down.
  const recaptchaWrapperRef = useRef<HTMLDivElement | null>(null);
  const recaptchaContainerNodeRef = useRef<HTMLElement | null>(null);
  // Synchronous, ref-based (not state-based) reentrancy guard: state
  // updates are batched and not necessarily reflected in the DOM (or even
  // in this closure) before a second call could start, so a plain boolean
  // ref is what actually prevents two overlapping `performSend` calls
  // from constructing two verifiers against the wrapper at once.
  const isSendingRef = useRef(false);

  function teardownRecaptchaVerifier() {
    recaptchaVerifierRef.current?.clear();
    recaptchaVerifierRef.current = null;
    const node = recaptchaContainerNodeRef.current;
    if (node?.parentNode) {
      node.parentNode.removeChild(node);
    }
    recaptchaContainerNodeRef.current = null;
  }

  function createFreshRecaptchaContainer(): HTMLElement {
    const node = document.createElement("div");
    recaptchaWrapperRef.current?.appendChild(node);
    recaptchaContainerNodeRef.current = node;
    return node;
  }

  // Unmount cleanup: reads the refs directly (not via the function above,
  // to avoid an exhaustive-deps lint dependency on a function recreated
  // every render) at the moment of actual unmount — refs are mutable and
  // shared, not captured by value, so this correctly tears down whichever
  // verifier/container is current, not whichever existed when this effect
  // was first set up.
  useEffect(() => {
    return () => {
      recaptchaVerifierRef.current?.clear();
      recaptchaVerifierRef.current = null;
      const node = recaptchaContainerNodeRef.current;
      if (node?.parentNode) {
        node.parentNode.removeChild(node);
      }
      recaptchaContainerNodeRef.current = null;
    };
  }, []);

  // CR3: a hosted preview is reachable over the public internet, so it
  // needs its own explicit no-index signal beyond `harness.html`'s static
  // <meta> tag (which this effect does not replace — belt and suspenders:
  // the static tag covers crawlers that never execute JS at all). Never
  // added for the ordinary dev-server route, since localhost is already
  // unreachable from the outside.
  useEffect(() => {
    if (!testHarnessBuild) return;
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "robots");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "noindex, nofollow, noarchive");
  }, [testHarnessBuild]);

  if (!isHarnessEnabled(dev) && !testHarnessBuild) {
    return null;
  }

  function resetAll() {
    teardownRecaptchaVerifier();
    confirmationResultRef.current = null;
    setPhoneNumber("");
    setCarrier("");
    setOtp("");
    setSubmittedPhoneNumber(null);
    setRequestAccepted(false);
    setSmsReceivedConfirmed(false);
    setOtpVerified(false);
    setRetryCount(0);
    setErrorText(null);
    setTiming(INITIAL_TIMING);
    setIsSending(false);
  }

  // Shared by the first Send and every subsequent Retry/Resend — a retry
  // is exactly a fresh send attempt against the same masked identity and
  // carrier, with per-attempt state (accepted/received/verified/OTP/
  // error/timing) reset so stale results from a prior attempt are never
  // shown alongside a new one. `phoneNumber`/`carrier`/`retryCount` are
  // deliberately left untouched by this function.
  async function performSend(isRetry: boolean) {
    // Synchronous concurrency guard — see the isSendingRef comment above.
    if (isSendingRef.current) return;
    isSendingRef.current = true;
    setIsSending(true);
    setErrorText(null);
    setOtp("");
    confirmationResultRef.current = null;
    setRequestAccepted(false);
    setSmsReceivedConfirmed(false);
    setOtpVerified(false);
    if (isRetry) {
      setRetryCount((n) => n + 1);
    }
    // Transition to the results/status view immediately — it must show
    // an error state too, not only a successful acceptance, so this
    // happens before the async call, not after it resolves.
    setSubmittedPhoneNumber(phoneNumber);
    const requestStartedAt = Date.now();
    setTiming({ requestStartedAt });

    try {
      const env = getAppEnv();
      const auth = getPhoneAuthHarnessAuth(env.firebase);

      // CR3: tear down the prior attempt's verifier AND its container DOM
      // node, then construct the new verifier against a brand-new
      // container. CR2's fix (clear() + reconstruct against the same
      // static container id) was necessary but not sufficient — see the
      // teardownRecaptchaVerifier/createFreshRecaptchaContainer comments
      // above for the confirmed root cause.
      teardownRecaptchaVerifier();
      const container = createFreshRecaptchaContainer();
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, container, {
        size: "invisible",
      });

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        recaptchaVerifierRef.current,
      );

      confirmationResultRef.current = confirmationResult;
      setRequestAccepted(true);
      setTiming((t) => ({ ...t, requestAcceptedAt: Date.now() }));
    } catch (error) {
      setErrorText(describeError(error));
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
    }
  }

  async function handleSend() {
    await performSend(false);
  }

  async function handleRetry() {
    await performSend(true);
  }

  async function handleVerify() {
    if (!confirmationResultRef.current) return;
    setErrorText(null);

    try {
      await confirmationResultRef.current.confirm(otp);
      setOtp("");
      setOtpVerified(true);
      setTiming((t) => ({ ...t, otpVerifiedAt: Date.now() }));
    } catch (error) {
      setOtp("");
      setErrorText(describeError(error));
    }
  }

  function handleMarkReceived() {
    setSmsReceivedConfirmed(true);
    setTiming((t) => ({ ...t, smsReceivedMarkedAt: Date.now() }));
  }

  const canSend = phoneNumber.trim() !== "" && carrier !== "";

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-8">
      {testHarnessBuild && (
        <div
          role="alert"
          className="rounded border-2 border-red-600 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900"
        >
          TEST-ONLY PREVIEW — temporary environment for EXT-TECH-001 verification. Do not index,
          bookmark, or share this URL. This deployment is torn down after testing.
        </div>
      )}
      <h1 className="text-xl font-semibold">EXT-TECH-001 Phone Auth Delivery-Test Harness</h1>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Development-only tool. Not a customer-facing screen. Never paste a real phone number or OTP
        into a coding-agent conversation, repository file, issue, pull request, or committed
        screenshot.
      </p>

      <div ref={recaptchaWrapperRef} />

      {submittedPhoneNumber === null ? (
        <div className="flex flex-col gap-3">
          <label htmlFor={phoneInputId} className="text-sm font-medium">
            Phone number (E.164, e.g. +257...)
          </label>
          <input
            id={phoneInputId}
            type="tel"
            autoComplete="off"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="rounded border px-3 py-2"
          />

          <label htmlFor={carrierSelectId} className="text-sm font-medium">
            Carrier
          </label>
          <select
            id={carrierSelectId}
            value={carrier}
            onChange={(e) => setCarrier(e.target.value as Carrier)}
            className="rounded border px-3 py-2"
          >
            <option value="">Select carrier…</option>
            {Object.entries(CARRIER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className="rounded bg-[var(--color-primary)] px-4 py-2 text-white disabled:opacity-50"
          >
            Send OTP
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 text-sm">
          <p>Masked number: {maskPhoneNumber(submittedPhoneNumber)}</p>
          <p>Carrier: {carrier ? CARRIER_LABELS[carrier as Exclude<Carrier, "">] : "—"}</p>
          <p>Request accepted: {requestAccepted ? "Yes" : "No"}</p>
          <p>SMS received: {smsReceivedConfirmed ? "Yes" : "No"}</p>
          <p>
            Delivery latency (Send click → tester-confirmed receipt):{" "}
            {elapsedMs(timing.requestStartedAt, timing.smsReceivedMarkedAt)}
          </p>
          <p>
            Firebase acceptance latency (internal diagnostic; Send click → Firebase accepted):{" "}
            {elapsedMs(timing.requestStartedAt, timing.requestAcceptedAt)}
          </p>
          <p>OTP verified: {otpVerified ? "Yes" : "No"}</p>
          <p>Retry count: {retryCount}</p>
          <p>Environment / project: {getAppEnv().firebase.projectId}</p>

          {errorText && <p role="alert">Error: {errorText}</p>}

          <button
            type="button"
            onClick={handleRetry}
            disabled={isSending || retryCount >= MAX_RETRY_COUNT}
            className="self-start rounded border px-4 py-2"
          >
            {retryCount >= MAX_RETRY_COUNT
              ? `Retry limit reached (${MAX_RETRY_COUNT}/${MAX_RETRY_COUNT})`
              : "Retry / Resend"}
          </button>

          {requestAccepted && !smsReceivedConfirmed && (
            <button
              type="button"
              onClick={handleMarkReceived}
              className="self-start rounded border px-4 py-2"
            >
              Mark SMS Received
            </button>
          )}

          {requestAccepted && !otpVerified && (
            <div className="flex flex-col gap-2">
              <label htmlFor={otpInputId} className="text-sm font-medium">
                Verification code (OTP)
              </label>
              <input
                id={otpInputId}
                type="password"
                autoComplete="off"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="rounded border px-3 py-2"
              />
              <button
                type="button"
                onClick={handleVerify}
                disabled={otp.trim() === ""}
                className="self-start rounded bg-[var(--color-primary)] px-4 py-2 text-white disabled:opacity-50"
              >
                Verify OTP
              </button>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={resetAll}
        className="mt-4 self-start rounded border px-4 py-2 text-sm"
      >
        Reset harness
      </button>
    </main>
  );
}

function describeError(error: unknown): string {
  if (error instanceof Error && !isFirebaseSdkError(error)) {
    // A harness-internal guard error (e.g. demo-project refusal) — a
    // static developer-facing string that never embeds user input, safe
    // to show in full.
    return error.message;
  }

  const code = (error as { code?: unknown } | undefined)?.code;
  return typeof code === "string" ? code : "unknown-error";
}

function isFirebaseSdkError(error: Error): boolean {
  return typeof (error as { code?: unknown }).code === "string";
}
