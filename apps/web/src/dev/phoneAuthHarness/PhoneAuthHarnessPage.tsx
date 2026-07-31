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
 */

import { useId, useRef, useState } from "react";
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

export function PhoneAuthHarnessPage({ dev }: { dev: boolean }) {
  const phoneInputId = useId();
  const carrierSelectId = useId();
  const otpInputId = useId();
  const recaptchaContainerId = useId();

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

  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  if (!isHarnessEnabled(dev)) {
    return null;
  }

  function resetAll() {
    recaptchaVerifierRef.current?.clear();
    recaptchaVerifierRef.current = null;
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
  }

  async function handleSend() {
    setErrorText(null);
    if (submittedPhoneNumber !== null) {
      setRetryCount((n) => n + 1);
    }
    // Transition to the results/status view immediately — it must show
    // an error state too, not only a successful acceptance, so this
    // happens before the async call, not after it resolves.
    setSubmittedPhoneNumber(phoneNumber);
    const requestStartedAt = Date.now();
    setTiming((t) => ({ ...t, requestStartedAt }));

    try {
      const env = getAppEnv();
      const auth = getPhoneAuthHarnessAuth(env.firebase);

      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaContainerId, {
          size: "invisible",
        });
      }

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
    }
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
      <h1 className="text-xl font-semibold">EXT-TECH-001 Phone Auth Delivery-Test Harness</h1>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Development-only tool. Not a customer-facing screen. Never paste a real phone number or OTP
        into a coding-agent conversation, repository file, issue, pull request, or committed
        screenshot.
      </p>

      <div id={recaptchaContainerId} />

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
            Delivery latency (request → tester-confirmed receipt):{" "}
            {elapsedMs(timing.requestAcceptedAt, timing.smsReceivedMarkedAt)}
          </p>
          <p>OTP verified: {otpVerified ? "Yes" : "No"}</p>
          <p>Retry count: {retryCount}</p>
          <p>Environment / project: {getAppEnv().firebase.projectId}</p>

          {errorText && <p role="alert">Error: {errorText}</p>}

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
