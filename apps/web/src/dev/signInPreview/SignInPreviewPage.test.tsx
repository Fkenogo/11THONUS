import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18n from "../../i18n/config";
import { en } from "../../i18n/locales/en";
import { fr } from "../../i18n/locales/fr";
import type { SignInPanelActions } from "../../authentication/SignInPanel";
import type { AuthProviderId } from "../../authentication/providerConfig";
import type { AuthenticateOutcome } from "../../authentication/authenticateClient";
import type { PhoneConfirmation } from "../../authentication/phoneSignInFlow";
import { SignInPreviewPage } from "./SignInPreviewPage";

const registered: AuthenticateOutcome = {
  mode: "registered",
  customerIdentityId: "cid-1",
  session: {
    customerIdentityId: "cid-1",
    authReference: { referenceType: "google_sign_in", referenceId: "uid-1" },
    issuedAt: "2026-08-12T00:00:00.000Z",
  },
};

function makeActions(enabled: AuthProviderId[]): SignInPanelActions {
  return {
    enabledProviders: new Set(enabled),
    signInWithGoogle: vi.fn(async () => registered),
    registerWithEmail: vi.fn(async () => registered),
    signInWithEmail: vi.fn(async () => registered),
    sendPhoneCode: vi.fn(async () => ({ confirm: vi.fn() }) as unknown as PhoneConfirmation),
    confirmPhoneCode: vi.fn(async () => registered),
  };
}

afterEach(async () => {
  await i18n.changeLanguage("en");
});

describe("SignInPreviewPage — gating", () => {
  it("fails closed (renders nothing) when neither dev nor the preview build is enabled", () => {
    const { container } = render(
      <SignInPreviewPage dev={false} previewBuild={false} actions={makeActions(["email"])} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders when the dedicated preview build is enabled", () => {
    render(<SignInPreviewPage dev={false} previewBuild={true} actions={makeActions(["email"])} />);
    expect(screen.getByLabelText(en.auth.signIn.emailLabel)).toBeInTheDocument();
  });

  it("renders on the dev-server route", () => {
    render(<SignInPreviewPage dev={true} actions={makeActions(["google_sign_in"])} />);
    expect(
      screen.getByRole("button", { name: en.auth.signIn.continueWithGoogle }),
    ).toBeInTheDocument();
  });
});

describe("SignInPreviewPage — provider surface (reuses the real SignInPanel)", () => {
  it("exposes Email/Password when the email provider is enabled", () => {
    render(<SignInPreviewPage dev previewBuild actions={makeActions(["email"])} />);
    expect(screen.getByLabelText(en.auth.signIn.emailLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(en.auth.signIn.passwordLabel)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: en.auth.signIn.createAccount })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: en.auth.signIn.emailSignIn })).toBeInTheDocument();
  });

  it("exposes Google when the google provider is enabled", () => {
    render(<SignInPreviewPage dev previewBuild actions={makeActions(["google_sign_in"])} />);
    expect(
      screen.getByRole("button", { name: en.auth.signIn.continueWithGoogle }),
    ).toBeInTheDocument();
  });

  it("keeps Phone absent for the mandatory core (Email + Google, phone disabled)", () => {
    render(
      <SignInPreviewPage dev previewBuild actions={makeActions(["email", "google_sign_in"])} />,
    );
    expect(screen.getByLabelText(en.auth.signIn.emailLabel)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: en.auth.signIn.continueWithGoogle }),
    ).toBeInTheDocument();
    expect(screen.queryByText(en.auth.signIn.phoneLabel)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: en.auth.signIn.sendCode })).not.toBeInTheDocument();
  });

  it("exposes Phone only when the phone provider is explicitly enabled", () => {
    render(
      <SignInPreviewPage
        dev
        previewBuild
        actions={makeActions(["email", "google_sign_in", "phone_otp"])}
      />,
    );
    expect(screen.getByText(en.auth.signIn.phoneLabel)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: en.auth.signIn.sendCode })).toBeInTheDocument();
  });

  it("exposes no provider when every provider flag is disabled", () => {
    render(<SignInPreviewPage dev previewBuild actions={makeActions([])} />);
    expect(screen.getByText(en.auth.signIn.unavailable)).toBeInTheDocument();
    expect(screen.queryByLabelText(en.auth.signIn.emailLabel)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: en.auth.signIn.continueWithGoogle }),
    ).not.toBeInTheDocument();
  });
});

describe("SignInPreviewPage — localization (I18N-001)", () => {
  it("renders the customer-facing auth copy in English by default", () => {
    render(
      <SignInPreviewPage dev previewBuild actions={makeActions(["email", "google_sign_in"])} />,
    );
    expect(
      screen.getByRole("button", { name: en.auth.signIn.continueWithGoogle }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(en.auth.signIn.emailLabel)).toBeInTheDocument();
  });

  it("renders the customer-facing auth copy in French when French is selected", async () => {
    await i18n.changeLanguage("fr");
    render(
      <SignInPreviewPage dev previewBuild actions={makeActions(["email", "google_sign_in"])} />,
    );
    expect(
      screen.getByRole("button", { name: fr.auth.signIn.continueWithGoogle }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(fr.auth.signIn.emailLabel)).toBeInTheDocument();
  });

  it("includes a runtime language switcher offering the supported languages", () => {
    render(<SignInPreviewPage dev previewBuild actions={makeActions(["email"])} />);
    const group = screen.getByRole("group", { name: en.common.language.label });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "English" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Français" })).toBeInTheDocument();
  });

  it("switches the customer-facing auth copy at runtime via the switcher", async () => {
    const user = userEvent.setup();
    render(<SignInPreviewPage dev previewBuild actions={makeActions(["google_sign_in"])} />);
    expect(
      screen.getByRole("button", { name: en.auth.signIn.continueWithGoogle }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Français" }));

    expect(
      screen.getByRole("button", { name: fr.auth.signIn.continueWithGoogle }),
    ).toBeInTheDocument();
  });
});
