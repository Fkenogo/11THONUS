import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Auth } from "firebase/auth";
import type { Functions } from "firebase/functions";
import type { TotpSecret } from "firebase/auth";
import i18n from "../../i18n/config";
import { en } from "../../i18n/locales/en";
import { fr } from "../../i18n/locales/fr";
import { MfaEnrollmentPage } from "./MfaEnrollmentPage";
import * as discoverApi from "./api/discoverPlatformAdministrator";
import * as mfaSdkFlow from "./mfaSdkFlow";
import * as signOutFlow from "../signOutFlow";
import { MfaApiError } from "./api/mfaCallableClient";

const fakeSecret = {
  secretKey: "MANUALKEY1234567890",
  codeLength: 6,
  codeIntervalSeconds: 30,
} as TotpSecret;

const fakePreview = {
  secret: fakeSecret,
  qrCodeUrl: "otpauth://totp/11thONUS:admin@example.com?secret=MANUALKEY1234567890",
  secretKey: "MANUALKEY1234567890",
  codeLength: 6,
  codeIntervalSeconds: 30,
};

const verifiedAdminUser = {
  email: "admin@example.com",
  emailVerified: true,
  providerData: [{ providerId: "google.com" }],
  getIdToken: async () => "tok",
};

function makeAuth(user: unknown) {
  return {
    onAuthStateChanged: (callback: (u: unknown) => void) => {
      callback(user);
      return () => {};
    },
  } as unknown as Auth;
}

const fakeFunctions = {} as Functions;

function renderPage(auth: Auth = makeAuth(verifiedAdminUser)) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MfaEnrollmentPage auth={auth} functions={fakeFunctions} />
    </QueryClientProvider>,
  );
}

function stubDiscovery(result: { isPlatformAdministrator: boolean }) {
  return vi
    .spyOn(discoverApi, "makeCallDiscoverPlatformAdministrator")
    .mockReturnValue(async () => result);
}

function stubFlow(
  overrides: Partial<{
    hasEnrolledTotpFactor: () => boolean;
    startEnrollment: () => Promise<typeof fakePreview>;
    completeEnrollment: () => Promise<void>;
  }> = {},
) {
  const flow = {
    hasEnrolledTotpFactor: vi.fn(() => false),
    startEnrollment: vi.fn(async () => fakePreview),
    completeEnrollment: vi.fn(async () => undefined),
    ...overrides,
  };
  vi.spyOn(mfaSdkFlow, "createMfaEnrollmentFlow").mockReturnValue(flow as never);
  return flow;
}

async function goToSetup() {
  await screen.findByText(en.mfa.intro.title);
  await userEvent.click(screen.getByRole("button", { name: en.mfa.intro.begin }));
  await screen.findByText(en.mfa.setup.title);
}

async function goToVerify() {
  await goToSetup();
  await userEvent.click(screen.getByRole("button", { name: en.mfa.setup.continue }));
  await screen.findByText(en.mfa.verify.title);
}

afterEach(async () => {
  vi.restoreAllMocks();
  await i18n.changeLanguage("en");
});

describe("MfaEnrollmentPage — access gate (trusted discovery)", () => {
  it("shows a bounded access-restricted state to a non-administrator and never starts enrollment", async () => {
    stubDiscovery({ isPlatformAdministrator: false });
    const flow = stubFlow();
    renderPage();
    expect(await screen.findByText(en.mfa.access.deniedTitle)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: en.mfa.intro.begin })).not.toBeInTheDocument();
    expect(flow.startEnrollment).not.toHaveBeenCalled();
  });

  it("calls only the discovery callable (never a Firestore SDK) and passes the governed actor fields", async () => {
    let discoverCall: ReturnType<typeof vi.fn> | undefined;
    vi.spyOn(discoverApi, "makeCallDiscoverPlatformAdministrator").mockImplementation(() => {
      const inner = vi.fn(async () => ({ isPlatformAdministrator: true }));
      discoverCall = inner;
      return inner;
    });
    stubFlow();
    renderPage();
    await screen.findByText(en.mfa.intro.title);
    expect(discoverCall).toBeDefined();
    await waitFor(() =>
      expect(discoverCall).toHaveBeenCalledWith(
        expect.objectContaining({ referenceType: "google_sign_in" }),
      ),
    );
  });

  it("shows a mapped failure with a retry when discovery itself fails", async () => {
    let attempts = 0;
    vi.spyOn(discoverApi, "makeCallDiscoverPlatformAdministrator").mockReturnValue(async () => {
      attempts += 1;
      if (attempts === 1) throw new MfaApiError("unavailable");
      return { isPlatformAdministrator: true };
    });
    stubFlow();
    renderPage();
    expect(await screen.findByRole("alert")).toHaveTextContent(en.mfa.page.failed);
    expect(screen.queryByRole("button", { name: en.mfa.intro.begin })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: en.mfa.page.retry }));
    expect(await screen.findByText(en.mfa.intro.title)).toBeInTheDocument();
  });

  it("never leaks a raw discovery error message", async () => {
    vi.spyOn(discoverApi, "makeCallDiscoverPlatformAdministrator").mockReturnValue(async () => {
      throw new MfaApiError("failed");
    });
    renderPage();
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).not.toMatch(/firebase|internal|stack|exception/i);
  });
});

describe("MfaEnrollmentPage — session gates", () => {
  it("asks a signed-out visitor to sign in", async () => {
    stubDiscovery({ isPlatformAdministrator: true });
    renderPage(makeAuth(null));
    expect(await screen.findByText(en.mfa.page.signInRequired)).toBeInTheDocument();
  });
});

describe("MfaEnrollmentPage — verified-email and already-enrolled gates", () => {
  it("blocks enrollment before starting when the email is unverified", async () => {
    stubDiscovery({ isPlatformAdministrator: true });
    const flow = stubFlow();
    renderPage(makeAuth({ ...verifiedAdminUser, emailVerified: false }));
    expect(await screen.findByText(en.mfa.access.unverifiedEmailTitle)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: en.mfa.intro.begin })).not.toBeInTheDocument();
    expect(flow.startEnrollment).not.toHaveBeenCalled();
  });

  it("blocks enrollment when a TOTP factor is already enrolled (no re-enrollment)", async () => {
    stubDiscovery({ isPlatformAdministrator: true });
    const flow = stubFlow({ hasEnrolledTotpFactor: () => true });
    renderPage();
    expect(await screen.findByText(en.mfa.access.alreadyEnrolledTitle)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: en.mfa.intro.begin })).not.toBeInTheDocument();
    expect(flow.startEnrollment).not.toHaveBeenCalled();
  });
});

describe("MfaEnrollmentPage — intro → setup", () => {
  it("renders the QR, the manual entry key, and the code-length hint", async () => {
    stubDiscovery({ isPlatformAdministrator: true });
    stubFlow();
    renderPage();
    await screen.findByText(en.mfa.intro.title);

    await goToSetup();

    const qr = screen.getByRole("img", { name: en.mfa.setup.qrLabel });
    expect(qr).toBeInTheDocument();
    expect(screen.getByText("MANUALKEY1234567890")).toBeInTheDocument();
    expect(
      screen.getByText(
        new RegExp(`${en.mfa.setup.codeLengthLabel}: 6 digits, refreshed every 30 seconds`),
      ),
    ).toBeInTheDocument();
  });

  it("cancelling on setup clears the transient material and returns to intro", async () => {
    stubDiscovery({ isPlatformAdministrator: true });
    stubFlow();
    renderPage();
    await goToSetup();
    expect(screen.getByText("MANUALKEY1234567890")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: en.mfa.setup.cancel }));

    expect(await screen.findByText(en.mfa.intro.title)).toBeInTheDocument();
    expect(screen.queryByText("MANUALKEY1234567890")).not.toBeInTheDocument();
  });
});

describe("MfaEnrollmentPage — verify step", () => {
  it("keeps Confirm disabled until exactly the code length is entered", async () => {
    stubDiscovery({ isPlatformAdministrator: true });
    stubFlow();
    renderPage();
    await goToVerify();

    const confirm = screen.getByRole("button", { name: en.mfa.verify.confirm });
    expect(confirm).toBeDisabled();

    await userEvent.type(screen.getByLabelText(en.mfa.verify.codeLabel), "123");
    expect(confirm).toBeDisabled();

    await userEvent.type(screen.getByLabelText(en.mfa.verify.codeLabel), "456");
    expect(confirm).toBeEnabled();
  });

  it("completes enrollment, drops the transient secret, and shows the completion state", async () => {
    stubDiscovery({ isPlatformAdministrator: true });
    const flow = stubFlow();
    renderPage();
    await goToVerify();

    await userEvent.type(screen.getByLabelText(en.mfa.verify.codeLabel), "123456");
    await userEvent.click(screen.getByRole("button", { name: en.mfa.verify.confirm }));

    expect(await screen.findByText(en.mfa.completion.title)).toBeInTheDocument();
    expect(flow.completeEnrollment).toHaveBeenCalledWith(
      expect.objectContaining({ email: "admin@example.com" }),
      fakeSecret,
      "123456",
    );
    expect(screen.queryByText("MANUALKEY1234567890")).not.toBeInTheDocument();
  });

  it("submits with Enter and never double-submits while a confirmation is in flight", async () => {
    stubDiscovery({ isPlatformAdministrator: true });
    let resolveConfirm: () => void = () => {};
    const flow = stubFlow({
      completeEnrollment: vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveConfirm = resolve;
          }),
      ),
    });
    renderPage();
    await goToVerify();

    await userEvent.type(screen.getByLabelText(en.mfa.verify.codeLabel), "123456{Enter}");
    await waitFor(() => expect(flow.completeEnrollment).toHaveBeenCalledTimes(1));

    const confirm = screen.getByRole("button", { name: en.mfa.verify.verifying });
    expect(confirm).toBeDisabled();

    resolveConfirm();
    expect(await screen.findByText(en.mfa.completion.title)).toBeInTheDocument();
  });

  it("shows an inline error and stays on verify when the code is rejected, then a retry can succeed", async () => {
    stubDiscovery({ isPlatformAdministrator: true });
    let attempts = 0;
    const flow = stubFlow({
      completeEnrollment: vi.fn(async () => {
        attempts += 1;
        if (attempts === 1) throw new Error("auth/invalid-verification-code");
      }),
    });
    renderPage();
    await goToVerify();

    await userEvent.type(screen.getByLabelText(en.mfa.verify.codeLabel), "123456");
    await userEvent.click(screen.getByRole("button", { name: en.mfa.verify.confirm }));

    expect(await screen.findByRole("alert")).toHaveTextContent(en.mfa.verify.errorInvalid);
    expect(screen.getByLabelText(en.mfa.verify.codeLabel)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(en.mfa.verify.codeLabel), "654321");
    await userEvent.click(screen.getByRole("button", { name: en.mfa.verify.confirm }));

    expect(await screen.findByText(en.mfa.completion.title)).toBeInTheDocument();
    expect(flow.completeEnrollment).toHaveBeenCalledTimes(2);
  });

  it("never leaks a raw enrollment error", async () => {
    stubDiscovery({ isPlatformAdministrator: true });
    stubFlow({
      completeEnrollment: async () => {
        throw new Error("AUTH-CRITICAL-INTERNAL-DETAILS");
      },
    });
    renderPage();
    await goToVerify();

    await userEvent.type(screen.getByLabelText(en.mfa.verify.codeLabel), "123456");
    await userEvent.click(screen.getByRole("button", { name: en.mfa.verify.confirm }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).not.toMatch(/AUTH-CRITICAL|firebase|stack|exception/i);
    expect(alert).toHaveTextContent(en.mfa.verify.errorInvalid);
  });

  it("blocks the flow into the verified-email precondition state and clears the secret when the SDK rejects the enrollment", async () => {
    stubDiscovery({ isPlatformAdministrator: true });
    stubFlow({
      completeEnrollment: async () => {
        throw Object.assign(new Error("unverified email"), { code: "auth/unverified-email" });
      },
    });
    renderPage();
    await goToVerify();

    await userEvent.type(screen.getByLabelText(en.mfa.verify.codeLabel), "123456");
    await userEvent.click(screen.getByRole("button", { name: en.mfa.verify.confirm }));

    expect(await screen.findByText(en.mfa.access.unverifiedEmailTitle)).toBeInTheDocument();
    expect(screen.queryByLabelText(en.mfa.verify.codeLabel)).not.toBeInTheDocument();
  });

  it("cancelling on verify clears the secret and never calls completion", async () => {
    stubDiscovery({ isPlatformAdministrator: true });
    const flow = stubFlow();
    renderPage();
    await goToVerify();

    await userEvent.type(screen.getByLabelText(en.mfa.verify.codeLabel), "123456");
    await userEvent.click(screen.getByRole("button", { name: en.mfa.verify.cancel }));

    expect(await screen.findByText(en.mfa.intro.title)).toBeInTheDocument();
    expect(flow.completeEnrollment).not.toHaveBeenCalled();
    expect(screen.queryByText("MANUALKEY1234567890")).not.toBeInTheDocument();
  });
});

describe("MfaEnrollmentPage — completion handoff", () => {
  it("signs the caller out after successful enrollment", async () => {
    stubDiscovery({ isPlatformAdministrator: true });
    stubFlow();
    const auth = makeAuth(verifiedAdminUser);
    const signOut = vi.spyOn(signOutFlow, "signOutCurrentSession").mockResolvedValue(undefined);
    renderPage(auth);
    await goToVerify();

    await userEvent.type(screen.getByLabelText(en.mfa.verify.codeLabel), "123456");
    await userEvent.click(screen.getByRole("button", { name: en.mfa.verify.confirm }));
    await screen.findByText(en.mfa.completion.title);

    await userEvent.click(screen.getByRole("button", { name: en.mfa.completion.signOut }));
    await waitFor(() => expect(signOut).toHaveBeenCalledWith(auth));
  });

  it("surfaces a bounded retry message if sign-out itself fails", async () => {
    stubDiscovery({ isPlatformAdministrator: true });
    stubFlow();
    vi.spyOn(signOutFlow, "signOutCurrentSession").mockRejectedValue(new Error("network"));
    renderPage();
    await goToVerify();

    await userEvent.type(screen.getByLabelText(en.mfa.verify.codeLabel), "123456");
    await userEvent.click(screen.getByRole("button", { name: en.mfa.verify.confirm }));
    await screen.findByText(en.mfa.completion.title);

    await userEvent.click(screen.getByRole("button", { name: en.mfa.completion.signOut }));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).not.toMatch(/network|stack|exception/i);
  });
});

describe("MfaEnrollmentPage — no secret persistence", () => {
  it("never writes the enrollment material to web storage", async () => {
    const lsSet = vi.spyOn(Storage.prototype, "setItem");
    stubDiscovery({ isPlatformAdministrator: true });
    stubFlow();
    renderPage();
    await goToSetup();
    expect(screen.getByText("MANUALKEY1234567890")).toBeInTheDocument();

    expect(lsSet).not.toHaveBeenCalled();
  });
});

describe("MfaEnrollmentPage — accessibility", () => {
  it("offers an on-page language switch, matching every other standalone page", () => {
    stubDiscovery({ isPlatformAdministrator: true });
    stubFlow();
    renderPage();
    expect(screen.getByRole("button", { name: "Français" })).toBeInTheDocument();
  });
});

describe("MfaEnrollmentPage — localization", () => {
  it("renders French copy across the flow with no English leakage", async () => {
    await i18n.changeLanguage("fr");
    stubDiscovery({ isPlatformAdministrator: true });
    const flow = stubFlow();
    const { container } = renderPage();

    expect(await screen.findByText(fr.mfa.intro.title)).toBeInTheDocument();
    expect(container.textContent).not.toContain(en.mfa.intro.title);

    await userEvent.click(screen.getByRole("button", { name: fr.mfa.intro.begin }));
    expect(await screen.findByText(fr.mfa.setup.title)).toBeInTheDocument();
    expect(container.textContent).not.toContain(en.mfa.setup.title);

    await userEvent.click(screen.getByRole("button", { name: fr.mfa.setup.continue }));
    expect(await screen.findByText(fr.mfa.verify.title)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(fr.mfa.verify.codeLabel), "123456");
    await userEvent.click(screen.getByRole("button", { name: fr.mfa.verify.confirm }));
    expect(await screen.findByText(fr.mfa.completion.title)).toBeInTheDocument();
    expect(flow.completeEnrollment).toHaveBeenCalledTimes(1);
  });

  it("switches EN to FR mid-flow preserving the entered code and route state", async () => {
    stubDiscovery({ isPlatformAdministrator: true });
    stubFlow();
    renderPage();
    await goToVerify();

    await userEvent.type(screen.getByLabelText(en.mfa.verify.codeLabel), "123456");
    await userEvent.click(screen.getByRole("button", { name: "Français" }));

    expect(await screen.findByText(fr.mfa.verify.title)).toBeInTheDocument();
    expect(screen.getByLabelText(fr.mfa.verify.codeLabel)).toHaveValue("123456");
  });

  it("preserves the rendered manual key across a language switch on setup", async () => {
    stubDiscovery({ isPlatformAdministrator: true });
    stubFlow();
    renderPage();
    await goToSetup();

    await userEvent.click(screen.getByRole("button", { name: "Français" }));

    expect(await screen.findByText(fr.mfa.setup.title)).toBeInTheDocument();
    expect(screen.getByText("MANUALKEY1234567890")).toBeInTheDocument();
  });
});
