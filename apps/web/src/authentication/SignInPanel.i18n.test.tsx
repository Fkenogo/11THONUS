import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import i18n from "../i18n/config";
import { en } from "../i18n/locales/en";
import { fr } from "../i18n/locales/fr";
import { SignInPanel, type SignInPanelActions } from "./SignInPanel";
import type { AuthenticateOutcome } from "./authenticateClient";
import type { PhoneConfirmation } from "./phoneSignInFlow";

const registered: AuthenticateOutcome = {
  mode: "registered",
  customerIdentityId: "cid-1",
  session: {
    customerIdentityId: "cid-1",
    authReference: { referenceType: "google_sign_in", referenceId: "uid-1" },
    issuedAt: "2026-08-09T00:00:00.000Z",
  },
};

function makeActions(overrides: Partial<SignInPanelActions> = {}): SignInPanelActions {
  return {
    enabledProviders: new Set(["phone_otp", "google_sign_in"]),
    signInWithGoogle: vi.fn(async () => registered),
    sendPhoneCode: vi.fn(async () => ({ confirm: vi.fn() }) as unknown as PhoneConfirmation),
    confirmPhoneCode: vi.fn(async () => registered),
    ...overrides,
  };
}

afterEach(async () => {
  await i18n.changeLanguage("en");
});

describe("SignInPanel — localization (I18N-001 retrofit)", () => {
  it("renders customer-facing copy from translation keys in English by default", () => {
    render(<SignInPanel actions={makeActions()} />);
    // Exactly the catalog values — proving the copy is key-driven, not hard-coded.
    expect(
      screen.getByRole("button", { name: en.auth.signIn.continueWithGoogle }),
    ).toBeInTheDocument();
    expect(screen.getByText(en.auth.signIn.phoneLabel)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: en.auth.signIn.sendCode })).toBeInTheDocument();
  });

  it("renders the French copy when French is selected", async () => {
    await i18n.changeLanguage("fr");
    render(<SignInPanel actions={makeActions()} />);
    expect(
      screen.getByRole("button", { name: fr.auth.signIn.continueWithGoogle }),
    ).toBeInTheDocument();
    expect(screen.getByText(fr.auth.signIn.phoneLabel)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: fr.auth.signIn.sendCode })).toBeInTheDocument();
  });

  it("leaves no untranslated English copy in the French rendering (migrated strings)", async () => {
    await i18n.changeLanguage("fr");
    const { container } = render(<SignInPanel actions={makeActions()} />);
    const text = container.textContent ?? "";
    // The migrated visible strings must not appear in their English form.
    expect(text).not.toContain(en.auth.signIn.continueWithGoogle);
    expect(text).not.toContain(en.auth.signIn.sendCode);
    expect(text).not.toContain(en.auth.signIn.phoneLabel);
    // aria-label is localized too.
    expect(screen.getByLabelText(fr.auth.signIn.ariaLabel)).toBeInTheDocument();
  });

  it("localizes the stable error message via keys without leaking the code", async () => {
    await i18n.changeLanguage("fr");
    const { AuthenticateError } = await import("./authenticateClient");
    const actions = makeActions({
      enabledProviders: new Set(["google_sign_in"]),
      signInWithGoogle: vi.fn(async () => {
        throw new AuthenticateError("auth_forbidden");
      }),
    });
    const { default: userEvent } = await import("@testing-library/user-event");
    render(<SignInPanel actions={actions} />);
    await userEvent.click(screen.getByRole("button", { name: fr.auth.signIn.continueWithGoogle }));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe(fr.auth.errors.auth_forbidden);
    expect(alert.textContent).not.toContain("auth_forbidden");
  });
});
