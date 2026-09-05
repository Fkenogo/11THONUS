import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignInPanel, type SignInPanelActions } from "./SignInPanel";
import type { AuthenticateOutcome } from "./authenticateClient";
import type { PhoneConfirmation } from "./phoneSignInFlow";
import { MfaChallengeUnavailableError, type PendingMfaChallenge } from "./mfa/mfaSdkChallenge";

const outcome: AuthenticateOutcome = {
  mode: "signed_in",
  customerIdentityId: "cid",
  session: {
    customerIdentityId: "cid",
    authReference: { referenceType: "email", referenceId: "uid" },
    issuedAt: "2026-09-05T00:00:00.000Z",
  },
};

function challenge(
  submit: PendingMfaChallenge["submit"] = vi.fn(async () => outcome),
  clear: PendingMfaChallenge["clear"] = vi.fn(),
): PendingMfaChallenge {
  return {
    kind: "mfa-challenge",
    factorUids: ["totp-1"],
    submit,
    clear,
  };
}

function makeActions(overrides: Partial<SignInPanelActions> = {}): SignInPanelActions {
  return {
    enabledProviders: new Set(["email", "google_sign_in"]),
    signInWithGoogle: vi.fn(async () => outcome),
    registerWithEmail: vi.fn(async () => outcome),
    signInWithEmail: vi.fn(async () => outcome),
    sendPhoneCode: vi.fn(async () => ({ confirm: vi.fn() }) as unknown as PhoneConfirmation),
    confirmPhoneCode: vi.fn(async () => outcome),
    ...overrides,
  };
}

describe("SignInPanel — TOTP second-factor challenge (AUTH-MFA-003C)", () => {
  it("renders the challenge step instead of the provider surface when a first factor is pending MFA", async () => {
    const actions = makeActions({ signInWithEmail: vi.fn(async () => challenge()) });
    const user = userEvent.setup();
    render(<SignInPanel actions={actions} />);

    await user.type(screen.getByLabelText(/email/i), "admin@onus.co");
    await user.type(screen.getByLabelText(/password/i), "password");
    await user.click(screen.getByRole("button", { name: /sign in with email/i }));

    // The provider buttons are gone; only the challenge step remains.
    expect(screen.queryByRole("button", { name: /continue with google/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /sign in with email/i })).not.toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: /two-step verification/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
  });

  it("accepts exactly six digits; rejecting a non-numeric input and gating confirm", async () => {
    const actions = makeActions({ signInWithGoogle: vi.fn(async () => challenge()) });
    const user = userEvent.setup();
    render(<SignInPanel actions={actions} />);

    await user.click(screen.getByRole("button", { name: /continue with google/i }));
    const input = await screen.findByLabelText(/verification code/i);
    const confirm = screen.getByRole("button", { name: /confirm sign-in/i });
    expect(confirm).toBeDisabled();

    // Non-numeric characters are stripped.
    await user.type(input, "12ab34");
    expect(input).toHaveValue("1234");
    expect(confirm).toBeDisabled();

    // Pricing to six digits enables confirm.
    await user.type(input, "56");
    expect(input).toHaveValue("123456");
    expect(screen.getByRole("button", { name: /confirm sign-in/i })).toBeEnabled();
  });

  it("resolves the challenge and reports the signed-in outcome, clearing the resolver", async () => {
    const clear = vi.fn();
    const submit = vi.fn(async () => outcome);
    const actions = makeActions({ signInWithEmail: vi.fn(async () => challenge(submit, clear)) });
    const onSignedIn = vi.fn();
    const user = userEvent.setup();
    render(<SignInPanel actions={actions} onSignedIn={onSignedIn} />);

    await user.type(screen.getByLabelText(/email/i), "admin@onus.co");
    await user.type(screen.getByLabelText(/password/i), "password");
    await user.click(screen.getByRole("button", { name: /sign in with email/i }));

    const input = await screen.findByLabelText(/verification code/i);
    await user.type(input, "123456");
    await user.click(screen.getByRole("button", { name: /confirm sign-in/i }));

    await waitFor(() => expect(submit).toHaveBeenCalledWith("123456"));
    await waitFor(() => expect(onSignedIn).toHaveBeenCalledWith(outcome));
    // The resolver is released on success and the challenge step is gone.
    expect(clear).toHaveBeenCalled();
    expect(
      screen.queryByRole("heading", { name: /two-step verification/i }),
    ).not.toBeInTheDocument();
  });

  it("keeps the challenge on an invalid code with a localized inline error and a cleared code (no raw message)", async () => {
    const submit = vi.fn(async () => {
      throw { code: "auth/invalid-verification-code" };
    });
    const actions = makeActions({ signInWithGoogle: vi.fn(async () => challenge(submit)) });
    const onSignedIn = vi.fn();
    const user = userEvent.setup();
    render(<SignInPanel actions={actions} onSignedIn={onSignedIn} />);

    await user.click(screen.getByRole("button", { name: /continue with google/i }));
    const input = await screen.findByLabelText(/verification code/i);
    await user.type(input, "111111");
    await user.click(screen.getByRole("button", { name: /confirm sign-in/i }));

    // Stays on the challenge, emits the bounded message, never a raw SDK code.
    expect(await screen.findByText(/that code didn't work/i)).toBeInTheDocument();
    expect(screen.queryByText(/invalid-verification-code/i)).not.toBeInTheDocument();
    expect(onSignedIn).not.toHaveBeenCalled();

    // The code is cleared after the failed attempt, prompt ready for retry.
    expect(input).toHaveValue("");
    expect(screen.getByRole("button", { name: /confirm sign-in/i })).toBeDisabled();
  });

  it("releases the resolver on a terminal session-expired error and returns to sign-in", async () => {
    const clear = vi.fn();
    const submit = vi.fn(async () => {
      throw { code: "auth/invalid-multi-factor-session" };
    });
    const actions = makeActions({ signInWithGoogle: vi.fn(async () => challenge(submit, clear)) });
    const user = userEvent.setup();
    render(<SignInPanel actions={actions} />);

    await user.click(screen.getByRole("button", { name: /continue with google/i }));
    const input = await screen.findByLabelText(/verification code/i);
    await user.type(input, "123456");
    await user.click(screen.getByRole("button", { name: /confirm sign-in/i }));

    // Resolver dropped and the first-factor surface is back.
    await waitFor(() => expect(clear).toHaveBeenCalled());
    expect(
      await screen.findByRole("button", { name: /continue with google/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/sign-in didn't work/i);
  });

  it("can be cancelled, releasing the resolver and returning to the providers", async () => {
    const clear = vi.fn();
    const actions = makeActions({
      signInWithGoogle: vi.fn(async () => challenge(undefined, clear)),
    });
    const user = userEvent.setup();
    render(<SignInPanel actions={actions} />);

    await user.click(screen.getByRole("button", { name: /continue with google/i }));
    await user.click(await screen.findByRole("button", { name: /cancel/i }));

    expect(clear).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
  });

  it("fails closed with auth_forbidden when no TOTP factor is resolvable", async () => {
    const actions = makeActions({
      signInWithEmail: vi.fn(async () => {
        throw new MfaChallengeUnavailableError();
      }),
    });
    const onSignedIn = vi.fn();
    const user = userEvent.setup();
    render(<SignInPanel actions={actions} onSignedIn={onSignedIn} />);

    await user.type(screen.getByLabelText(/email/i), "admin@onus.co");
    await user.type(screen.getByLabelText(/password/i), "password");
    await user.click(screen.getByRole("button", { name: /sign in with email/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/can't sign in right now/i);
    expect(onSignedIn).not.toHaveBeenCalled();
  });
});
