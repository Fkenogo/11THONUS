import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import i18n from "../../i18n/config";
import { en } from "../../i18n/locales/en";
import type { SignInPanelActions } from "../../authentication/SignInPanel";
import type { AuthProviderId } from "../../authentication/providerConfig";
import type { AuthenticateOutcome } from "../../authentication/authenticateClient";
import type { PhoneConfirmation } from "../../authentication/phoneSignInFlow";
import { FounderQaPreviewSignInRoute } from "./FounderQaPreviewSignInRoute";

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

describe("FounderQaPreviewSignInRoute — gating", () => {
  it("fails closed (renders nothing) when previewBuild is false", () => {
    const { container } = render(
      <MemoryRouter>
        <FounderQaPreviewSignInRoute previewBuild={false} actions={makeActions(["email"])} />
      </MemoryRouter>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the real sign-in composition when previewBuild is true", () => {
    render(
      <MemoryRouter>
        <FounderQaPreviewSignInRoute previewBuild={true} actions={makeActions(["email"])} />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText(en.auth.signIn.emailLabel)).toBeInTheDocument();
  });
});
