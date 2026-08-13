import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignInPanel, type SignInPanelActions } from "./SignInPanel";
import { AuthenticateError, type AuthenticateOutcome } from "./authenticateClient";
import type { PhoneConfirmation } from "./phoneSignInFlow";
import { en } from "../i18n/locales/en";

const registered: AuthenticateOutcome = {
  mode: "registered",
  customerIdentityId: "cid-1",
  session: {
    customerIdentityId: "cid-1",
    authReference: { referenceType: "email", referenceId: "uid-1" },
    issuedAt: "2026-08-13T00:00:00.000Z",
  },
};

function emailActions(overrides: Partial<SignInPanelActions> = {}): SignInPanelActions {
  return {
    enabledProviders: new Set(["email"]),
    signInWithGoogle: vi.fn(async () => registered),
    registerWithEmail: vi.fn(async () => registered),
    signInWithEmail: vi.fn(async () => registered),
    sendPhoneCode: vi.fn(async () => ({ confirm: vi.fn() }) as unknown as PhoneConfirmation),
    confirmPhoneCode: vi.fn(async () => registered),
    ...overrides,
  };
}

describe("SignInPanel — Email mode clarity (AUTH-UX-CORR-001)", () => {
  it("defaults to sign-in mode: Email + Password + Sign in, no Confirm password", () => {
    render(<SignInPanel actions={emailActions()} />);
    expect(screen.getByLabelText(en.auth.signIn.emailLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(en.auth.signIn.passwordLabel)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: en.auth.signIn.emailSignIn })).toBeInTheDocument();
    expect(screen.queryByLabelText(en.auth.signIn.confirmPasswordLabel)).not.toBeInTheDocument();
    // No standalone "Create account" submit in sign-in mode — only the switch control.
    expect(
      screen.queryByRole("button", { name: en.auth.signIn.createAccount }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: en.auth.signIn.switchToRegister }),
    ).toBeInTheDocument();
  });

  it("switches to register mode: Email + Password + Confirm password + Create account", async () => {
    render(<SignInPanel actions={emailActions()} />);
    await userEvent.click(screen.getByRole("button", { name: en.auth.signIn.switchToRegister }));

    expect(screen.getByLabelText(en.auth.signIn.emailLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(en.auth.signIn.passwordLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(en.auth.signIn.confirmPasswordLabel)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: en.auth.signIn.createAccount })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: en.auth.signIn.switchToSignIn })).toBeInTheDocument();
    // The returning sign-in submit is not shown in register mode.
    expect(
      screen.queryByRole("button", { name: en.auth.signIn.emailSignIn }),
    ).not.toBeInTheDocument();
  });

  it("switching modes never invokes Firebase and clears the password", async () => {
    const registerWithEmail = vi.fn(async () => registered);
    const signInWithEmail = vi.fn(async () => registered);
    render(<SignInPanel actions={emailActions({ registerWithEmail, signInWithEmail })} />);

    await userEvent.type(screen.getByLabelText(en.auth.signIn.passwordLabel), "secret-pw");
    await userEvent.click(screen.getByRole("button", { name: en.auth.signIn.switchToRegister }));

    expect(registerWithEmail).not.toHaveBeenCalled();
    expect(signInWithEmail).not.toHaveBeenCalled();
    // Password cleared on mode switch (security).
    expect((screen.getByLabelText(en.auth.signIn.passwordLabel) as HTMLInputElement).value).toBe(
      "",
    );
    expect(document.body.textContent).not.toContain("secret-pw");
  });

  it("preserves the typed email across a mode switch", async () => {
    render(<SignInPanel actions={emailActions()} />);
    await userEvent.type(screen.getByLabelText(en.auth.signIn.emailLabel), "keep@user.co");
    await userEvent.click(screen.getByRole("button", { name: en.auth.signIn.switchToRegister }));
    expect((screen.getByLabelText(en.auth.signIn.emailLabel) as HTMLInputElement).value).toBe(
      "keep@user.co",
    );
  });

  it("blocks registration and shows an accessible localized error when passwords do not match", async () => {
    const registerWithEmail = vi.fn(async () => registered);
    render(<SignInPanel actions={emailActions({ registerWithEmail })} />);
    await userEvent.click(screen.getByRole("button", { name: en.auth.signIn.switchToRegister }));

    await userEvent.type(screen.getByLabelText(en.auth.signIn.emailLabel), "new@user.co");
    await userEvent.type(screen.getByLabelText(en.auth.signIn.passwordLabel), "pw123456");
    await userEvent.type(screen.getByLabelText(en.auth.signIn.confirmPasswordLabel), "different");
    await userEvent.click(screen.getByRole("button", { name: en.auth.signIn.createAccount }));

    expect(registerWithEmail).not.toHaveBeenCalled();
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(en.auth.signIn.passwordMismatch);
    // Error is associated with the confirm-password field for assistive tech.
    const confirm = screen.getByLabelText(en.auth.signIn.confirmPasswordLabel);
    expect(confirm).toHaveAttribute("aria-invalid", "true");
    expect(confirm).toHaveAttribute("aria-describedby", alert.id);
  });

  it("registers with only email + password when the passwords match (confirm never passed)", async () => {
    const registerWithEmail = vi.fn(async () => registered);
    const onSignedIn = vi.fn();
    render(<SignInPanel actions={emailActions({ registerWithEmail })} onSignedIn={onSignedIn} />);
    await userEvent.click(screen.getByRole("button", { name: en.auth.signIn.switchToRegister }));

    await userEvent.type(screen.getByLabelText(en.auth.signIn.emailLabel), "new@user.co");
    await userEvent.type(screen.getByLabelText(en.auth.signIn.passwordLabel), "pw123456");
    await userEvent.type(screen.getByLabelText(en.auth.signIn.confirmPasswordLabel), "pw123456");
    await userEvent.click(screen.getByRole("button", { name: en.auth.signIn.createAccount }));

    await waitFor(() => expect(registerWithEmail).toHaveBeenCalledTimes(1));
    expect(registerWithEmail).toHaveBeenCalledWith("new@user.co", "pw123456");
    // The two-arg contract is preserved — confirm value is never a third argument.
    expect(registerWithEmail.mock.calls[0]).toHaveLength(2);
    await waitFor(() => expect(onSignedIn).toHaveBeenCalledWith(registered));
  });

  it("clears password and confirm password after a successful registration", async () => {
    render(<SignInPanel actions={emailActions()} />);
    await userEvent.click(screen.getByRole("button", { name: en.auth.signIn.switchToRegister }));
    await userEvent.type(screen.getByLabelText(en.auth.signIn.emailLabel), "new@user.co");
    await userEvent.type(screen.getByLabelText(en.auth.signIn.passwordLabel), "top-secret-pw");
    await userEvent.type(
      screen.getByLabelText(en.auth.signIn.confirmPasswordLabel),
      "top-secret-pw",
    );
    await userEvent.click(screen.getByRole("button", { name: en.auth.signIn.createAccount }));

    await waitFor(() => expect(screen.getByText(/registered/i)).toBeInTheDocument());
    expect((screen.getByLabelText(en.auth.signIn.passwordLabel) as HTMLInputElement).value).toBe(
      "",
    );
    expect(
      (screen.getByLabelText(en.auth.signIn.confirmPasswordLabel) as HTMLInputElement).value,
    ).toBe("");
    expect(document.body.textContent).not.toContain("top-secret-pw");
  });

  it("clears a stale mismatch error after correcting and switching back to sign-in", async () => {
    render(<SignInPanel actions={emailActions()} />);
    await userEvent.click(screen.getByRole("button", { name: en.auth.signIn.switchToRegister }));
    await userEvent.type(screen.getByLabelText(en.auth.signIn.emailLabel), "new@user.co");
    await userEvent.type(screen.getByLabelText(en.auth.signIn.passwordLabel), "pw123456");
    await userEvent.type(screen.getByLabelText(en.auth.signIn.confirmPasswordLabel), "nope");
    await userEvent.click(screen.getByRole("button", { name: en.auth.signIn.createAccount }));
    expect(await screen.findByRole("alert")).toHaveTextContent(en.auth.signIn.passwordMismatch);

    await userEvent.click(screen.getByRole("button", { name: en.auth.signIn.switchToSignIn }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("clears the mismatch error when the primary password is edited to match (Codex P2)", async () => {
    render(<SignInPanel actions={emailActions()} />);
    await userEvent.click(screen.getByRole("button", { name: en.auth.signIn.switchToRegister }));
    await userEvent.type(screen.getByLabelText(en.auth.signIn.emailLabel), "new@user.co");
    await userEvent.type(screen.getByLabelText(en.auth.signIn.passwordLabel), "pw123456");
    await userEvent.type(screen.getByLabelText(en.auth.signIn.confirmPasswordLabel), "pw1234");
    await userEvent.click(screen.getByRole("button", { name: en.auth.signIn.createAccount }));
    expect(await screen.findByRole("alert")).toHaveTextContent(en.auth.signIn.passwordMismatch);

    // Correcting via the PRIMARY password field must clear the stale error + aria-invalid.
    await userEvent.type(screen.getByLabelText(en.auth.signIn.passwordLabel), "56");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByLabelText(en.auth.signIn.confirmPasswordLabel)).toHaveAttribute(
      "aria-invalid",
      "false",
    );
  });

  it("clears a stale server error before showing a client-side mismatch (Codex P2)", async () => {
    // First create attempt reaches Firebase and fails → server errorCode is set.
    const registerWithEmail = vi
      .fn<SignInPanelActions["registerWithEmail"]>()
      .mockRejectedValueOnce(new AuthenticateError("auth_forbidden"))
      .mockResolvedValue(registered);
    render(<SignInPanel actions={emailActions({ registerWithEmail })} />);
    await userEvent.click(screen.getByRole("button", { name: en.auth.signIn.switchToRegister }));
    await userEvent.type(screen.getByLabelText(en.auth.signIn.emailLabel), "new@user.co");
    await userEvent.type(screen.getByLabelText(en.auth.signIn.passwordLabel), "pw123456");
    await userEvent.type(screen.getByLabelText(en.auth.signIn.confirmPasswordLabel), "pw123456");
    await userEvent.click(screen.getByRole("button", { name: en.auth.signIn.createAccount }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(en.auth.errors.auth_forbidden),
    );

    // Retry with a NON-matching confirm: only the mismatch must show — the stale
    // server error must not still be announced alongside it. (Both fields were
    // cleared after the failed attempt, so a real retry re-enters them.)
    await userEvent.type(screen.getByLabelText(en.auth.signIn.passwordLabel), "pw123456");
    await userEvent.type(screen.getByLabelText(en.auth.signIn.confirmPasswordLabel), "different");
    await userEvent.click(screen.getByRole("button", { name: en.auth.signIn.createAccount }));

    const alerts = await screen.findAllByRole("alert");
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toHaveTextContent(en.auth.signIn.passwordMismatch);
    expect(document.body.textContent).not.toContain(en.auth.errors.auth_forbidden);
  });

  it("uses new-password autocomplete in register mode and current-password in sign-in mode", async () => {
    render(<SignInPanel actions={emailActions()} />);
    expect(screen.getByLabelText(en.auth.signIn.passwordLabel)).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
    await userEvent.click(screen.getByRole("button", { name: en.auth.signIn.switchToRegister }));
    expect(screen.getByLabelText(en.auth.signIn.passwordLabel)).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
    expect(screen.getByLabelText(en.auth.signIn.confirmPasswordLabel)).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
  });
});
