import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Auth } from "firebase/auth";
import type { Functions } from "firebase/functions";
import { SignInPage } from "./SignInPage";
import type { SignInPanelActions } from "./SignInPanel";
import type { PhoneConfirmation } from "./phoneSignInFlow";
import { en } from "../i18n/locales/en";

const actions: SignInPanelActions = {
  enabledProviders: new Set(["email"]),
  signInWithGoogle: vi.fn(),
  registerWithEmail: vi.fn(),
  signInWithEmail: vi.fn(),
  sendPhoneCode: vi.fn(async () => ({ confirm: vi.fn() }) as unknown as PhoneConfirmation),
  confirmPhoneCode: vi.fn(),
};

function renderPage() {
  return render(<SignInPage auth={{} as Auth} functions={{} as Functions} actions={actions} />);
}

describe("SignInPage — mode-aware heading (EA-BL-001 correction)", () => {
  it("shows sign-in copy by default", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { level: 2, name: en.customer.entry.signInTitle }),
    ).toBeInTheDocument();
  });

  it("shows Create account copy, not Sign in copy, in register mode, and reverts", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: en.auth.signIn.switchToRegister }));
    expect(
      screen.getByRole("heading", { level: 2, name: en.customer.entry.createAccountTitle }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 2, name: en.customer.entry.signInTitle }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText(en.customer.entry.createAccountDescription).length).toBeGreaterThan(
      0,
    );
    expect(screen.queryByText(en.customer.entry.description)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: en.auth.signIn.switchToSignIn }));
    expect(
      screen.getByRole("heading", { level: 2, name: en.customer.entry.signInTitle }),
    ).toBeInTheDocument();
  });
});
