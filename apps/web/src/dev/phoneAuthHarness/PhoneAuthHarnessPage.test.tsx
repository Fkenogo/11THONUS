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
  mockConfirm,
  mockConfirmationResult,
  signInWithPhoneNumber,
  mockAuth,
  getPhoneAuthHarnessAuth,
  getAppEnv,
} = vi.hoisted(() => {
  const recaptchaClear = vi.fn();
  class MockRecaptchaVerifier {
    clear = recaptchaClear;
  }

  const mockConfirm = vi.fn();
  const mockConfirmationResult = { confirm: mockConfirm };
  const signInWithPhoneNumber = vi.fn(async () => mockConfirmationResult);

  const mockAuth = { name: "mock-harness-auth" };
  // Replicates `phoneAuthHarnessAuth.ts`'s own real, independently-tested
  // demo-project refusal (see `phoneAuthHarnessAuth.test.ts`) — mocked
  // here only to avoid a real `firebase/app` secondary-app initialization
  // inside a component test, not to bypass the guard's observable
  // behaviour.
  const getPhoneAuthHarnessAuth = vi.fn((config: { projectId: string }) => {
    if (config.projectId === "demo-11thonus") {
      throw new Error(
        "Phone Auth harness refused to activate: the resolved Firebase config is the " +
          "Emulator Suite's demo fallback project, not a real Firebase project.",
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

function renderHarness(dev = true) {
  return render(<PhoneAuthHarnessPage dev={dev} />);
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
      await screen.findByText(/request accepted/i);

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

      await screen.findByText(/real firebase project/i);
      expect(signInWithPhoneNumber).not.toHaveBeenCalled();
    });
  });

  describe("OTP confirmation", () => {
    async function sendOtp() {
      fireEvent.change(getPhoneInput(), { target: { value: TEST_NUMBER } });
      fireEvent.change(getCarrierSelect(), { target: { value: "lumitel" } });
      fireEvent.click(screen.getByRole("button", { name: /send/i }));
      await screen.findByText(/request accepted/i);
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
      await screen.findByText(/request accepted/i);

      expect(screen.getByText(/sms received.*no/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /mark.*received/i }));

      expect(screen.getByText(/sms received.*yes/i)).toBeInTheDocument();
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
      await screen.findByText(/request accepted/i);
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
      await screen.findByText(/request accepted/i);

      expect(window.location.search).toBe("");
      expect(window.location.hash).toBe("");
    });
  });

  describe("reset", () => {
    it("clears phone number, carrier, OTP, results, and errors on reset", async () => {
      renderHarness();
      fireEvent.change(getPhoneInput(), { target: { value: TEST_NUMBER } });
      fireEvent.change(getCarrierSelect(), { target: { value: "lumitel" } });
      fireEvent.click(screen.getByRole("button", { name: /send/i }));
      await screen.findByText(/request accepted/i);

      fireEvent.click(screen.getByRole("button", { name: /^reset/i }));

      expect(getPhoneInput().value).toBe("");
      expect(getCarrierSelect().value).toBe("");
      expect(screen.queryByText(/request accepted/i)).not.toBeInTheDocument();
      expect(recaptchaClear).toHaveBeenCalled();
    });
  });
});
