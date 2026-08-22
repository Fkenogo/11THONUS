import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TermsStep } from "./TermsStep";
import type { BusinessContextTermsAcceptance } from "../../api/businessContext";
import { BusinessApiError } from "../../api/businessCallableClient";

function renderStep(
  termsAcceptance: BusinessContextTermsAcceptance,
  overrides: Partial<{
    isPending: boolean;
    error: unknown;
    onAccept: () => void;
    onContinue: () => void;
  }> = {},
) {
  const onAccept = overrides.onAccept ?? vi.fn();
  const onContinue = overrides.onContinue ?? vi.fn();
  render(
    <TermsStep
      termsAcceptance={termsAcceptance}
      isAccepting={overrides.isPending ?? false}
      acceptError={overrides.error ?? null}
      onAccept={onAccept}
      onContinue={onContinue}
    />,
  );
  return { onAccept, onContinue };
}

describe("TermsStep", () => {
  it("renders the consent checkbox unchecked by default when not yet accepted", () => {
    renderStep({ accepted: false });
    expect(
      screen.getByRole("checkbox", { name: /I agree to the Business Terms/i }),
    ).not.toBeChecked();
  });

  it("does not allow Continue until the checkbox is checked and accepted server-side", () => {
    renderStep({ accepted: false });
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("calls onAccept only after the user checks the box and confirms — never pre-checked, never automatic", async () => {
    const user = userEvent.setup();
    const { onAccept } = renderStep({ accepted: false });

    await user.click(screen.getByRole("checkbox", { name: /I agree to the Business Terms/i }));
    expect(onAccept).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "I agree to the Business Terms" }));
    expect(onAccept).toHaveBeenCalledOnce();
  });

  it("shows the accepted state and enables Continue once the server confirms acceptance", () => {
    renderStep({ accepted: true, version: "2026-08-21", acceptedAt: "2026-08-22T00:00:00.000Z" });
    expect(screen.getByText(/accepted the Business Terms/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  it("renders a neutral unavailable state and blocks Continue when Terms configuration is unavailable — never fakes acceptance", () => {
    renderStep({ accepted: false }, { error: new BusinessApiError("unavailable") });

    expect(screen.getByText(/currently unavailable/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: /I agree to the Business Terms/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });
});
