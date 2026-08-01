import { StrictMode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const REAL_FIREBASE_CONFIG = {
  apiKey: "real-api-key",
  authDomain: "eleventh-on-us-dev.firebaseapp.com",
  projectId: "eleventh-on-us-dev",
  storageBucket: "eleventh-on-us-dev.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
};

const {
  MockRecaptchaVerifier,
  recaptchaClear,
  recaptchaVerifierConstructorCalls,
  mockConfirm,
  mockConfirmationResult,
  signInWithPhoneNumber,
  mockAuth,
  getPhoneAuthHarnessAuth,
  getAppEnv,
} = vi.hoisted(() => {
  const recaptchaClear = vi.fn();
  // CR3: captures the exact (auth, container, options) arguments each
  // `new RecaptchaVerifier(...)` call received, so tests can assert the
  // fix's actual mechanism — a distinct, fresh DOM container per
  // construction — not merely its symptom.
  const recaptchaVerifierConstructorCalls: unknown[][] = [];
  class MockRecaptchaVerifier {
    clear = recaptchaClear;
    constructor(...args: unknown[]) {
      recaptchaVerifierConstructorCalls.push(args);
    }
  }

  const mockConfirm = vi.fn();
  const mockConfirmationResult = { confirm: mockConfirm };
  const signInWithPhoneNumber = vi.fn(async () => mockConfirmationResult);

  const mockAuth = { name: "mock-harness-auth" };
  const APPROVED_DEV_PROJECT_ID = "eleventh-on-us-dev";
  // Replicates `phoneAuthHarnessAuth.ts`'s own real, independently-tested
  // positive allowlist (see `phoneAuthHarnessAuth.test.ts`, CR1 Correction
  // 1) — mocked here only to avoid a real `firebase/app` secondary-app
  // initialization inside a component test, not to bypass the guard's
  // observable behaviour.
  const getPhoneAuthHarnessAuth = vi.fn((config: { projectId: string }) => {
    if (config.projectId !== APPROVED_DEV_PROJECT_ID) {
      const resolved = config.projectId ? `"${config.projectId}"` : "(missing)";
      throw new Error(
        `Phone Auth harness refused to activate: the resolved Firebase project is ` +
          `${resolved}, which is not the approved development project.`,
      );
    }
    return mockAuth;
  });

  const getAppEnv = vi.fn(() => ({
    firebase: {
      apiKey: "real-api-key",
      authDomain: "eleventh-on-us-dev.firebaseapp.com",
      projectId: "eleventh-on-us-dev",
      storageBucket: "eleventh-on-us-dev.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:abcdef",
    },
    useEmulator: false,
  }));

  return {
    MockRecaptchaVerifier,
    recaptchaClear,
    recaptchaVerifierConstructorCalls,
    mockConfirm,
    mockConfirmationResult,
    signInWithPhoneNumber,
    mockAuth,
    getPhoneAuthHarnessAuth,
    getAppEnv,
  };
});

vi.mock("firebase/auth", () => ({
  RecaptchaVerifier: MockRecaptchaVerifier,
  signInWithPhoneNumber,
}));

vi.mock("./phoneAuthHarnessAuth", () => ({ getPhoneAuthHarnessAuth }));

vi.mock("../../config/env", () => ({ getAppEnv }));

import { PhoneAuthHarnessPage } from "./PhoneAuthHarnessPage";

const TEST_NUMBER = "+25779123456";
const TEST_OTP = "654321";

function renderHarness(dev = true, testHarnessBuild = false) {
  return render(<PhoneAuthHarnessPage dev={dev} testHarnessBuild={testHarnessBuild} />);
}

function getPhoneInput() {
  return screen.getByLabelText(/phone number/i) as HTMLInputElement;
}

function getCarrierSelect() {
  return screen.getByLabelText(/carrier/i) as HTMLSelectElement;
}

function getOtpInput() {
  return screen.queryByLabelText(/verification code|otp/i) as HTMLInputElement | null;
}

describe("PhoneAuthHarnessPage", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    recaptchaVerifierConstructorCalls.length = 0;
    signInWithPhoneNumber.mockResolvedValue(mockConfirmationResult);
    mockConfirm.mockResolvedValue({ user: { uid: "test-uid" } });
    localStorage.clear();
    sessionStorage.clear();
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe("development-only access", () => {
    it("renders nothing and does not touch Firebase when dev is false", () => {
      const { container } = renderHarness(false);

      expect(container).toBeEmptyDOMElement();
      expect(getPhoneAuthHarnessAuth).not.toHaveBeenCalled();
    });

    it("renders the harness form when dev is true", () => {
      renderHarness(true);

      expect(getPhoneInput()).toBeInTheDocument();
    });
  });

  describe("CR3 hosted test-harness build access", () => {
    it("renders nothing when both dev and testHarnessBuild are false — runtime navigation cannot bypass the guard", () => {
      const { container } = renderHarness(false, false);

      expect(container).toBeEmptyDOMElement();
      expect(getPhoneAuthHarnessAuth).not.toHaveBeenCalled();
    });

    it("renders the harness form when testHarnessBuild is true, even though dev is false", () => {
      renderHarness(false, true);

      expect(getPhoneInput()).toBeInTheDocument();
    });

    it("defaults testHarnessBuild to false when the prop is omitted, so ordinary dev-server callers are unaffected", () => {
      const { container } = render(<PhoneAuthHarnessPage dev={false} />);

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("runtime phone input", () => {
    it("has no pre-populated phone number", () => {
      renderHarness();

      expect(getPhoneInput().value).toBe("");
    });

    it("accepts a phone number typed at runtime", () => {
      renderHarness();
      const input = getPhoneInput();

      fireEvent.change(input, { target: { value: TEST_NUMBER } });

      expect(input.value).toBe(TEST_NUMBER);
    });

    it("requires a carrier selection before sending is enabled", () => {
      renderHarness();
      fireEvent.change(getPhoneInput(), { target: { value: TEST_NUMBER } });

      const sendButton = screen.getByRole("button", { name: /send/i });

      expect(sendButton).toBeDisabled();

      fireEvent.change(getCarrierSelect(), { target: { value: "lumitel" } });

      expect(sendButton).toBeEnabled();
    });
  });

  describe("masking", () => {
    it("displays only a masked form of the number after submission, never the raw value again", async () => {
      renderHarness();
      fireEvent.change(getPhoneInput(), { target: { value: TEST_NUMBER } });
      fireEvent.change(getCarrierSelect(), { target: { value: "lumitel" } });

      fireEvent.click(screen.getByRole("button", { name: /send/i }));
      await screen.findByText(/\*{5,}56/);

      expect(screen.queryByDisplayValue(TEST_NUMBER)).not.toBeInTheDocument();
      expect(document.body.textContent).not.toContain(TEST_NUMBER);
    });
  });

  describe("real Firebase SMS trigger", () => {
    it("invokes the genuine signInWithPhoneNumber route via the dedicated harness auth", async () => {
      renderHarness();
      fireEvent.change(getPhoneInput(), { target: { value: TEST_NUMBER } });
      fireEvent.change(getCarrierSelect(), { target: { value: "lumitel" } });

      fireEvent.click(screen.getByRole("button", { name: /send/i }));
      await screen.findByRole("button", { name: /mark.*received/i });

      expect(getPhoneAuthHarnessAuth).toHaveBeenCalledWith(REAL_FIREBASE_CONFIG);
      expect(signInWithPhoneNumber).toHaveBeenCalledWith(
        mockAuth,
        TEST_NUMBER,
        expect.any(MockRecaptchaVerifier),
      );
    });

    it("refuses to send when the resolved config is the emulator demo project", async () => {
      getAppEnv.mockReturnValueOnce({
        firebase: { ...REAL_FIREBASE_CONFIG, projectId: "demo-11thonus" },
        useEmulator: true,
      });
      renderHarness();
      fireEvent.change(getPhoneInput(), { target: { value: TEST_NUMBER } });
      fireEvent.change(getCarrierSelect(), { target: { value: "lumitel" } });

      fireEvent.click(screen.getByRole("button", { name: /send/i }));

      await screen.findByText(/not the approved development project/i);
      expect(signInWithPhoneNumber).not.toHaveBeenCalled();
    });

    it("refuses to send when the resolved config is a different real project (e.g. staging) — CR1 Correction 1", async () => {
      getAppEnv.mockReturnValueOnce({
        firebase: { ...REAL_FIREBASE_CONFIG, projectId: "eleventh-on-us-staging" },
        useEmulator: false,
      });
      renderHarness();
      fireEvent.change(getPhoneInput(), { target: { value: TEST_NUMBER } });
      fireEvent.change(getCarrierSelect(), { target: { value: "lumitel" } });

      fireEvent.click(screen.getByRole("button", { name: /send/i }));

      await screen.findByText(/not the approved development project/i);
      expect(signInWithPhoneNumber).not.toHaveBeenCalled();
    });
  });

  describe("OTP confirmation", () => {
    async function sendOtp() {
      fireEvent.change(getPhoneInput(), { target: { value: TEST_NUMBER } });
      fireEvent.change(getCarrierSelect(), { target: { value: "lumitel" } });
      fireEvent.click(screen.getByRole("button", { name: /send/i }));
      await screen.findByRole("button", { name: /mark.*received/i });
    }

    it("accepts an OTP typed at runtime and completes real Firebase confirmation", async () => {
      renderHarness();
      await sendOtp();

      fireEvent.change(getOtpInput()!, { target: { value: TEST_OTP } });
      fireEvent.click(screen.getByRole("button", { name: /verify/i }));

      await screen.findByText(/otp verified.*yes/i);
      expect(mockConfirm).toHaveBeenCalledWith(TEST_OTP);
    });

    it("clears the OTP field immediately after successful verification", async () => {
      renderHarness();
      await sendOtp();
      fireEvent.change(getOtpInput()!, { target: { value: TEST_OTP } });
      fireEvent.click(screen.getByRole("button", { name: /verify/i }));

      await screen.findByText(/otp verified.*yes/i);

      expect(getOtpInput()?.value ?? "").toBe("");
    });

    it("never logs the OTP value to the console", async () => {
      renderHarness();
      await sendOtp();
      fireEvent.change(getOtpInput()!, { target: { value: TEST_OTP } });
      fireEvent.click(screen.getByRole("button", { name: /verify/i }));

      await screen.findByText(/otp verified.*yes/i);

      const allLoggedText = [
        ...consoleLogSpy.mock.calls,
        ...consoleErrorSpy.mock.calls,
        ...consoleWarnSpy.mock.calls,
      ]
        .flat()
        .map(String)
        .join(" ");
      expect(allLoggedText).not.toContain(TEST_OTP);
    });
  });

  describe("timing evidence", () => {
    it("only marks SMS received when the tester manually confirms it, never automatically", async () => {
      renderHarness();
      fireEvent.change(getPhoneInput(), { target: { value: TEST_NUMBER } });
      fireEvent.change(getCarrierSelect(), { target: { value: "lumitel" } });
      fireEvent.click(screen.getByRole("button", { name: /send/i }));
      await screen.findByRole("button", { name: /mark.*received/i });

      expect(screen.getByText(/sms received.*no/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /mark.*received/i }));

      expect(screen.getByText(/sms received.*yes/i)).toBeInTheDocument();
    });

    it("measures delivery latency from the Send click, not from Firebase acceptance (CR1 Correction 2)", async () => {
      // A real, artificial delay inside the mocked signInWithPhoneNumber
      // stands in for reCAPTCHA/network time. The pre-CR1 defect measured
      // latency from Firebase acceptance (after this delay), which would
      // report well under this delay's length here (just the click's own
      // reaction time). Measuring from the Send click captures the full
      // delay too.
      signInWithPhoneNumber.mockImplementationOnce(async () => {
        await new Promise((resolve) => setTimeout(resolve, 60));
        return mockConfirmationResult;
      });

      renderHarness();
      fireEvent.change(getPhoneInput(), { target: { value: TEST_NUMBER } });
      fireEvent.change(getCarrierSelect(), { target: { value: "lumitel" } });
      fireEvent.click(screen.getByRole("button", { name: /send/i }));
      await screen.findByRole("button", { name: /mark.*received/i });

      fireEvent.click(screen.getByRole("button", { name: /mark.*received/i }));

      const latencyMs = Number(
        screen.getByText(/delivery latency/i).textContent?.match(/(\d+) ms/)?.[1],
      );
      expect(latencyMs).toBeGreaterThanOrEqual(50);
    });

    it("does not claim automatic SMS receipt detection anywhere in the delivery-latency label", async () => {
      renderHarness();
      fireEvent.change(getPhoneInput(), { target: { value: TEST_NUMBER } });
      fireEvent.change(getCarrierSelect(), { target: { value: "lumitel" } });
      fireEvent.click(screen.getByRole("button", { name: /send/i }));
      await screen.findByRole("button", { name: /mark.*received/i });

      expect(screen.getByText(/delivery latency/i).textContent).toMatch(/tester-confirmed/i);
    });
  });

  describe("error sanitisation", () => {
    it("displays only the Firebase error code, never the raw error message", async () => {
      signInWithPhoneNumber.mockRejectedValueOnce(
        Object.assign(new Error(`Invalid phone number: ${TEST_NUMBER} is malformed`), {
          code: "auth/invalid-phone-number",
        }),
      );
      renderHarness();
      fireEvent.change(getPhoneInput(), { target: { value: TEST_NUMBER } });
      fireEvent.change(getCarrierSelect(), { target: { value: "lumitel" } });

      fireEvent.click(screen.getByRole("button", { name: /send/i }));

      await screen.findByText(/auth\/invalid-phone-number/);
      expect(document.body.textContent).not.toContain("is malformed");
      expect(document.body.textContent).not.toContain(TEST_NUMBER);
    });
  });

  describe("no storage persistence", () => {
    it("never writes the phone number or OTP to localStorage or sessionStorage", async () => {
      renderHarness();
      fireEvent.change(getPhoneInput(), { target: { value: TEST_NUMBER } });
      fireEvent.change(getCarrierSelect(), { target: { value: "lumitel" } });
      fireEvent.click(screen.getByRole("button", { name: /send/i }));
      await screen.findByRole("button", { name: /mark.*received/i });
      fireEvent.change(getOtpInput()!, { target: { value: TEST_OTP } });
      fireEvent.click(screen.getByRole("button", { name: /verify/i }));
      await screen.findByText(/otp verified.*yes/i);

      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(0);
    });

    it("never places the phone number or OTP in the URL", async () => {
      renderHarness();
      fireEvent.change(getPhoneInput(), { target: { value: TEST_NUMBER } });
      fireEvent.change(getCarrierSelect(), { target: { value: "lumitel" } });
      fireEvent.click(screen.getByRole("button", { name: /send/i }));
      await screen.findByRole("button", { name: /mark.*received/i });

      expect(window.location.search).toBe("");
      expect(window.location.hash).toBe("");
    });
  });

  describe("retry / resend flow (CR1 Correction 3)", () => {
    async function sendInitial() {
      fireEvent.change(getPhoneInput(), { target: { value: TEST_NUMBER } });
      fireEvent.change(getCarrierSelect(), { target: { value: "lumitel" } });
      fireEvent.click(screen.getByRole("button", { name: /send/i }));
      await screen.findByRole("button", { name: /mark.*received/i });
    }

    function getRetryButton() {
      return screen.getByRole("button", { name: /retry|resend/i });
    }

    it("is reachable after the first request without calling reset", async () => {
      renderHarness();
      await sendInitial();

      expect(getRetryButton()).toBeInTheDocument();
      expect(screen.getByText(/retry count.*0/i)).toBeInTheDocument();
    });

    it("increments retry count to 1 on first retry and preserves the masked identity and carrier", async () => {
      renderHarness();
      await sendInitial();

      fireEvent.click(getRetryButton());
      await screen.findByText(/retry count.*1/i);

      expect(signInWithPhoneNumber).toHaveBeenCalledTimes(2);
      expect(screen.getByText(/\*{5,}56/)).toBeInTheDocument();
      expect(screen.getByText(/carrier: lumitel/i)).toBeInTheDocument();
    });

    it("increments correctly across multiple retries", async () => {
      renderHarness();
      await sendInitial();

      fireEvent.click(getRetryButton());
      await screen.findByText(/retry count.*1/i);
      fireEvent.click(getRetryButton());
      await screen.findByText(/retry count.*2/i);

      expect(signInWithPhoneNumber).toHaveBeenCalledTimes(3);
    });

    it("disables the retry control once the bound is reached", async () => {
      renderHarness();
      await sendInitial();

      fireEvent.click(getRetryButton());
      await screen.findByText(/retry count.*1/i);
      fireEvent.click(getRetryButton());
      await screen.findByText(/retry count.*2/i);
      fireEvent.click(getRetryButton());
      await screen.findByText(/retry count.*3/i);

      expect(getRetryButton()).toBeDisabled();
    });

    it("clears stale OTP input on retry", async () => {
      renderHarness();
      await sendInitial();
      fireEvent.change(getOtpInput()!, { target: { value: TEST_OTP } });
      expect(getOtpInput()!.value).toBe(TEST_OTP);

      fireEvent.click(getRetryButton());
      await screen.findByText(/retry count.*1/i);

      expect(getOtpInput()?.value ?? "").toBe("");
    });

    it("records fresh request timing on retry rather than reusing the prior attempt's timestamp", async () => {
      renderHarness();
      await sendInitial();

      // A real elapsed gap between the first attempt and the retry click,
      // so a regression that reused the first attempt's requestStartedAt
      // would produce a clearly larger, easily-distinguished latency value
      // below (well over 100ms) instead of the small one asserted here.
      await new Promise((resolve) => setTimeout(resolve, 100));

      fireEvent.click(getRetryButton());
      await screen.findByText(/retry count.*1/i);
      fireEvent.click(screen.getByRole("button", { name: /mark.*received/i }));

      const latencyMs = Number(
        screen.getByText(/delivery latency/i).textContent?.match(/(\d+) ms/)?.[1],
      );
      expect(latencyMs).toBeLessThan(80);
    });

    it("returns retry count to 0 on a full reset", async () => {
      renderHarness();
      await sendInitial();
      fireEvent.click(getRetryButton());
      await screen.findByText(/retry count.*1/i);

      fireEvent.click(screen.getByRole("button", { name: /^reset/i }));

      expect(screen.queryByText(/request accepted/i)).not.toBeInTheDocument();
    });

    it("does not persist the phone number or OTP across a retry", async () => {
      renderHarness();
      await sendInitial();
      fireEvent.change(getOtpInput()!, { target: { value: TEST_OTP } });

      fireEvent.click(getRetryButton());
      await screen.findByText(/retry count.*1/i);

      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(0);
      expect(document.body.textContent).not.toContain(TEST_NUMBER);
    });

    it("constructs a fresh RecaptchaVerifier for each retry, clearing the prior one first (CR2)", async () => {
      // Firebase's JS SDK does not reliably support reusing a
      // RecaptchaVerifier after a failed signInWithPhoneNumber call — the
      // widget's already-rendered DOM node desyncs from the SDK's internal
      // render-tracking, producing "reCAPTCHA has already been rendered in
      // this element" on the next .verify() call. Every send attempt
      // (first send and every retry alike) must clear any existing
      // verifier and construct a brand new one, per Firebase's own
      // documented guidance for handling signInWithPhoneNumber failures.
      renderHarness();
      await sendInitial();

      const firstVerifierArg = (signInWithPhoneNumber.mock.calls[0] as unknown[])[2];

      fireEvent.click(getRetryButton());
      await screen.findByText(/retry count.*1/i);

      const secondVerifierArg = (signInWithPhoneNumber.mock.calls[1] as unknown[])[2];

      expect(secondVerifierArg).not.toBe(firstVerifierArg);
      expect(recaptchaClear).toHaveBeenCalled();
    });
  });

  describe("CR3 reCAPTCHA lifecycle correction", () => {
    // Root cause, confirmed by direct reproduction against the real
    // grecaptcha.js widget (see the CR3 implementation report): calling
    // `.clear()` on a RecaptchaVerifier resets its internal widget state
    // but does NOT remove the DOM nodes grecaptcha.render() injected into
    // the container element — so a brand-new RecaptchaVerifier targeting
    // that SAME container element still throws "reCAPTCHA has already
    // been rendered in this element" the next time .verify() runs
    // internally. CR2's clear()-and-reconstruct fix (still reusing the
    // one static container id) was therefore insufficient. The only
    // reliable fix is a genuinely fresh, never-before-used DOM node per
    // verifier.
    async function sendInitial() {
      fireEvent.change(getPhoneInput(), { target: { value: TEST_NUMBER } });
      fireEvent.change(getCarrierSelect(), { target: { value: "lumitel" } });
      fireEvent.click(screen.getByRole("button", { name: /send/i }));
      await screen.findByRole("button", { name: /mark.*received/i });
    }

    function getRetryButton() {
      return screen.getByRole("button", { name: /retry|resend/i });
    }

    function containerArg(callIndex: number): HTMLElement {
      return recaptchaVerifierConstructorCalls[callIndex]![1] as HTMLElement;
    }

    it("constructs each verifier against a distinct, fresh DOM element — never a reused container", async () => {
      renderHarness();
      await sendInitial();
      fireEvent.click(getRetryButton());
      await screen.findByText(/retry count.*1/i);

      expect(recaptchaVerifierConstructorCalls).toHaveLength(2);
      const first = containerArg(0);
      const second = containerArg(1);

      expect(first).toBeInstanceOf(HTMLElement);
      expect(second).toBeInstanceOf(HTMLElement);
      expect(second).not.toBe(first);
    });

    it("removes the prior attempt's container node from the document after clearing it", async () => {
      renderHarness();
      await sendInitial();
      const first = containerArg(0);
      expect(document.body.contains(first)).toBe(true);

      fireEvent.click(getRetryButton());
      await screen.findByText(/retry count.*1/i);

      expect(document.body.contains(first)).toBe(false);
      expect(document.body.contains(containerArg(1))).toBe(true);
    });

    it("recovers from a failed first request: the retry succeeds against a fresh container", async () => {
      signInWithPhoneNumber.mockRejectedValueOnce(
        Object.assign(new Error("invalid app credential"), {
          code: "auth/invalid-app-credential",
        }),
      );
      renderHarness();
      fireEvent.change(getPhoneInput(), { target: { value: TEST_NUMBER } });
      fireEvent.change(getCarrierSelect(), { target: { value: "lumitel" } });
      fireEvent.click(screen.getByRole("button", { name: /send/i }));
      await screen.findByText(/auth\/invalid-app-credential/);

      fireEvent.click(getRetryButton());
      await screen.findByRole("button", { name: /mark.*received/i });

      expect(recaptchaVerifierConstructorCalls).toHaveLength(2);
      expect(containerArg(1)).not.toBe(containerArg(0));
      expect(recaptchaClear).toHaveBeenCalledTimes(1);
    });

    it("restores a pristine container (zero leftover recaptcha DOM nodes) on reset after a failure", async () => {
      signInWithPhoneNumber.mockRejectedValueOnce(
        Object.assign(new Error("invalid app credential"), {
          code: "auth/invalid-app-credential",
        }),
      );
      renderHarness();
      fireEvent.change(getPhoneInput(), { target: { value: TEST_NUMBER } });
      fireEvent.change(getCarrierSelect(), { target: { value: "lumitel" } });
      fireEvent.click(screen.getByRole("button", { name: /send/i }));
      await screen.findByText(/auth\/invalid-app-credential/);
      const failedContainer = containerArg(0);

      fireEvent.click(screen.getByRole("button", { name: /^reset/i }));

      expect(recaptchaClear).toHaveBeenCalledTimes(1);
      expect(document.body.contains(failedContainer)).toBe(false);
    });

    it("does not throw and does not accumulate residual nodes across repeated resets", async () => {
      renderHarness();

      expect(() => {
        fireEvent.click(screen.getByRole("button", { name: /^reset/i }));
        fireEvent.click(screen.getByRole("button", { name: /^reset/i }));
      }).not.toThrow();

      await sendInitial();
      fireEvent.click(screen.getByRole("button", { name: /^reset/i }));
      fireEvent.click(screen.getByRole("button", { name: /^reset/i }));

      // Exactly the one real container from the single send attempt above
      // should have ever been created; neither reset (including the
      // redundant second one) constructs a new verifier or leaves a node
      // behind.
      expect(recaptchaVerifierConstructorCalls).toHaveLength(1);
      expect(document.body.contains(containerArg(0))).toBe(false);
    });

    it("clears the verifier and removes its container on unmount", async () => {
      const { unmount } = renderHarness();
      await sendInitial();
      const container = containerArg(0);

      unmount();

      expect(recaptchaClear).toHaveBeenCalledTimes(1);
      expect(document.body.contains(container)).toBe(false);
    });

    it("constructs exactly one verifier per Send click under React StrictMode", async () => {
      render(
        <StrictMode>
          <PhoneAuthHarnessPage dev={true} testHarnessBuild={false} />
        </StrictMode>,
      );
      await sendInitial();

      expect(recaptchaVerifierConstructorCalls).toHaveLength(1);
      expect(signInWithPhoneNumber).toHaveBeenCalledTimes(1);
    });

    it("blocks a second overlapping retry while one is already in flight", async () => {
      renderHarness();
      await sendInitial();

      // Two rapid clicks with no await between them, simulating a
      // double-click landing before the first attempt's async work (and
      // the `isSending` state update it triggers) has settled.
      fireEvent.click(getRetryButton());
      fireEvent.click(getRetryButton());
      await screen.findByText(/retry count.*1/i);

      // Exactly one additional attempt (the first send + this one retry)
      // was ever dispatched to Firebase — the overlapping second click
      // was blocked, not queued as a second real attempt.
      expect(signInWithPhoneNumber).toHaveBeenCalledTimes(2);
    });
  });

  describe("reset", () => {
    it("clears phone number, carrier, OTP, results, and errors on reset", async () => {
      renderHarness();
      fireEvent.change(getPhoneInput(), { target: { value: TEST_NUMBER } });
      fireEvent.change(getCarrierSelect(), { target: { value: "lumitel" } });
      fireEvent.click(screen.getByRole("button", { name: /send/i }));
      await screen.findByRole("button", { name: /mark.*received/i });

      fireEvent.click(screen.getByRole("button", { name: /^reset/i }));

      expect(getPhoneInput().value).toBe("");
      expect(getCarrierSelect().value).toBe("");
      expect(screen.queryByText(/request accepted/i)).not.toBeInTheDocument();
      expect(recaptchaClear).toHaveBeenCalled();
    });
  });
});
