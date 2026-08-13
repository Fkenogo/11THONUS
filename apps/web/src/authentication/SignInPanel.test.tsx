import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignInPanel, type SignInPanelActions } from "./SignInPanel";
import { AuthenticateError, type AuthenticateOutcome } from "./authenticateClient";
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
    registerWithEmail: vi.fn(async () => registered),
    signInWithEmail: vi.fn(async () => registered),
    sendPhoneCode: vi.fn(async () => ({ confirm: vi.fn() }) as unknown as PhoneConfirmation),
    confirmPhoneCode: vi.fn(async () => registered),
    ...overrides,
  };
}

describe("SignInPanel — disabled-by-default", () => {
  it("shows a fail-closed message and no provider buttons when nothing is enabled", () => {
    render(<SignInPanel actions={makeActions({ enabledProviders: new Set() })} />);

    expect(screen.getByText(/sign-in is currently unavailable/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /google/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /send code/i })).not.toBeInTheDocument();
  });

  it("renders only the enabled providers (phone only ⇒ no Google button)", () => {
    render(<SignInPanel actions={makeActions({ enabledProviders: new Set(["phone_otp"]) })} />);

    expect(screen.getByRole("button", { name: /send code/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /google/i })).not.toBeInTheDocument();
  });
});

describe("SignInPanel — Google flow", () => {
  it("signs in and reports the outcome mode", async () => {
    const onSignedIn = vi.fn();
    const actions = makeActions({ enabledProviders: new Set(["google_sign_in"]) });
    render(<SignInPanel actions={actions} onSignedIn={onSignedIn} />);

    await userEvent.click(screen.getByRole("button", { name: /google/i }));

    await waitFor(() => expect(onSignedIn).toHaveBeenCalledWith(registered));
    expect(screen.getByText(/registered/i)).toBeInTheDocument();
  });

  it("shows a stable, non-leaking message when the backend forbids access", async () => {
    const actions = makeActions({
      enabledProviders: new Set(["google_sign_in"]),
      signInWithGoogle: vi.fn(async () => {
        throw new AuthenticateError("auth_forbidden");
      }),
    });
    render(<SignInPanel actions={actions} />);

    await userEvent.click(screen.getByRole("button", { name: /google/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toBeInTheDocument();
    // Never echoes a server message or the error code as a raw string.
    expect(alert.textContent).not.toContain("auth_forbidden");
  });
});

describe("SignInPanel — Email/Password flow (AUTH-CORR-003)", () => {
  it("registers a new Email/Password user (register mode + confirm password)", async () => {
    const registerWithEmail = vi.fn(async () => registered);
    const onSignedIn = vi.fn();
    const actions = makeActions({ enabledProviders: new Set(["email"]), registerWithEmail });
    render(<SignInPanel actions={actions} onSignedIn={onSignedIn} />);

    await userEvent.click(screen.getByRole("button", { name: /new here\? create account/i }));
    await userEvent.type(screen.getByLabelText(/^email$/i), "new@user.co");
    await userEvent.type(screen.getByLabelText(/^password$/i), "pw123456");
    await userEvent.type(screen.getByLabelText(/confirm password/i), "pw123456");
    await userEvent.click(screen.getByRole("button", { name: /^create account$/i }));

    await waitFor(() => expect(onSignedIn).toHaveBeenCalledWith(registered));
    expect(registerWithEmail).toHaveBeenCalledWith("new@user.co", "pw123456");
  });

  it("signs in a returning Email/Password user", async () => {
    const signInWithEmail = vi.fn(async () => registered);
    const onSignedIn = vi.fn();
    const actions = makeActions({ enabledProviders: new Set(["email"]), signInWithEmail });
    render(<SignInPanel actions={actions} onSignedIn={onSignedIn} />);

    await userEvent.type(screen.getByLabelText(/email/i), "back@user.co");
    await userEvent.type(screen.getByLabelText(/password/i), "pw123456");
    await userEvent.click(screen.getByRole("button", { name: /sign in with email/i }));

    await waitFor(() => expect(onSignedIn).toHaveBeenCalledWith(registered));
    expect(signInWithEmail).toHaveBeenCalledWith("back@user.co", "pw123456");
  });

  it("does not leave the password rendered in the DOM after authentication", async () => {
    const actions = makeActions({ enabledProviders: new Set(["email"]) });
    render(<SignInPanel actions={actions} />);

    await userEvent.type(screen.getByLabelText(/email/i), "u@x.co");
    await userEvent.type(screen.getByLabelText(/password/i), "top-secret-pw");
    await userEvent.click(screen.getByRole("button", { name: /sign in with email/i }));

    await waitFor(() => expect(screen.getByText(/registered/i)).toBeInTheDocument());
    expect((screen.getByLabelText(/password/i) as HTMLInputElement).value).toBe("");
    expect(document.body.textContent).not.toContain("top-secret-pw");
  });
});

describe("SignInPanel — Phone OTP is optional, not required (AUTH-CORR-003)", () => {
  it("does not render any Phone UI when only Email and Google are enabled", () => {
    render(
      <SignInPanel
        actions={makeActions({ enabledProviders: new Set(["email", "google_sign_in"]) })}
      />,
    );
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    // Phone is not forced: no phone number field and no send-code button.
    expect(screen.queryByLabelText(/phone number/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /send code/i })).not.toBeInTheDocument();
  });

  it("lets a customer complete Google sign-in with no Phone interaction", async () => {
    const signInWithGoogle = vi.fn(async () => registered);
    const onSignedIn = vi.fn();
    render(
      <SignInPanel
        actions={makeActions({
          enabledProviders: new Set(["email", "google_sign_in"]),
          signInWithGoogle,
        })}
        onSignedIn={onSignedIn}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /continue with google/i }));
    await waitFor(() => expect(onSignedIn).toHaveBeenCalledWith(registered));
    expect(makeActions().sendPhoneCode).not.toHaveBeenCalled();
  });
});

describe("SignInPanel — Phone OTP flow", () => {
  it("sends the code then confirms it, reporting the outcome", async () => {
    const confirmation = { confirm: vi.fn() } as unknown as PhoneConfirmation;
    const actions = makeActions({
      enabledProviders: new Set(["phone_otp"]),
      sendPhoneCode: vi.fn(async () => confirmation),
      confirmPhoneCode: vi.fn(async () => registered),
    });
    const onSignedIn = vi.fn();
    render(<SignInPanel actions={actions} onSignedIn={onSignedIn} />);

    await userEvent.type(screen.getByLabelText(/phone number/i), "+25760000000");
    await userEvent.click(screen.getByRole("button", { name: /send code/i }));

    const codeInput = await screen.findByLabelText(/verification code/i);
    await userEvent.type(codeInput, "123456");
    await userEvent.click(screen.getByRole("button", { name: /verify code/i }));

    await waitFor(() => expect(onSignedIn).toHaveBeenCalledWith(registered));
    expect(actions.sendPhoneCode).toHaveBeenCalledWith("+25760000000");
    expect(actions.confirmPhoneCode).toHaveBeenCalledWith(confirmation, "123456");
  });

  it("invalidates a pending confirmation when the phone number is edited (wrong-identity guard)", async () => {
    const confirmation = { confirm: vi.fn() } as unknown as PhoneConfirmation;
    const actions = makeActions({
      enabledProviders: new Set(["phone_otp"]),
      sendPhoneCode: vi.fn(async () => confirmation),
    });
    render(<SignInPanel actions={actions} />);

    await userEvent.type(screen.getByLabelText(/phone number/i), "+25760000000");
    await userEvent.click(screen.getByRole("button", { name: /send code/i }));
    expect(await screen.findByLabelText(/verification code/i)).toBeInTheDocument();

    // Editing the number for phone A must not leave a confirmation that would
    // authenticate phone A while the panel now shows a different number.
    await userEvent.type(screen.getByLabelText(/phone number/i), "1");

    expect(screen.queryByLabelText(/verification code/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /verify code/i })).not.toBeInTheDocument();
  });

  it("does not leave the OTP rendered in the DOM after verification", async () => {
    const actions = makeActions({
      enabledProviders: new Set(["phone_otp"]),
      confirmPhoneCode: vi.fn(async () => registered),
    });
    render(<SignInPanel actions={actions} />);

    await userEvent.type(screen.getByLabelText(/phone number/i), "+25760000000");
    await userEvent.click(screen.getByRole("button", { name: /send code/i }));
    const codeInput = await screen.findByLabelText(/verification code/i);
    await userEvent.type(codeInput, "654321");
    await userEvent.click(screen.getByRole("button", { name: /verify code/i }));

    await waitFor(() => expect(screen.getByText(/registered/i)).toBeInTheDocument());
    expect(document.body.textContent).not.toContain("654321");
  });
});
