import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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

describe("TermsStep — no governed readable Terms content/link exists yet (DEC-LEGAL-002 open)", () => {
  // 1/2/3/9 — the acceptance control must not exist at all while there is no
  // governed readable Terms document/link, not merely be disabled. A user must
  // never be able to consent to content they were never shown, and there must
  // be no control to discover by trial.
  it("renders no checkbox, no accept button, and a neutral unavailable state before any acceptance attempt", () => {
    renderStep({ accepted: false });

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /I agree/i })).not.toBeInTheDocument();
    expect(screen.getByText(/currently unavailable/i)).toBeInTheDocument();
  });

  it("keeps Continue disabled while Terms content is unavailable", () => {
    renderStep({ accepted: false });
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  // 4 — since no control exists, the acceptance mutation can never be triggered.
  it("never calls onAccept — there is no interaction path to trigger it", () => {
    const { onAccept } = renderStep({ accepted: false });
    expect(onAccept).not.toHaveBeenCalled();
  });

  // 5
  it("shows the accepted state and enables Continue once the server confirms acceptance", () => {
    renderStep({ accepted: true, version: "2026-08-21", acceptedAt: "2026-08-22T00:00:00.000Z" });
    expect(screen.getByText(/accepted the Business Terms/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  // 6 — secondary defense: a backend config-unavailable error (relevant once
  // content exists and acceptance is attempted) renders the same neutral state.
  it("renders the same neutral unavailable state when the backend reports Terms configuration is unavailable", () => {
    renderStep({ accepted: false }, { error: new BusinessApiError("unavailable") });
    expect(screen.getByText(/currently unavailable/i)).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  // 7 — no fabricated legal text, URL, or document reference anywhere in the rendered output.
  it("renders no Terms URL, document link, or fabricated legal text", () => {
    renderStep({ accepted: false });
    const html = document.body.innerHTML;
    expect(html).not.toMatch(/https?:\/\//i);
    expect(html).not.toMatch(/\.pdf/i);
  });
});
