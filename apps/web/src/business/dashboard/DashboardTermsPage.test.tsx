import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { DashboardTermsPage } from "./DashboardTermsPage";
import { BusinessApiError } from "../api/businessCallableClient";
import type { BusinessContext } from "../api/businessContext";

const mockAccept = vi.fn();
const mockSubmit = vi.fn();
let acceptError: unknown;
let submitError: unknown;
let acceptPending = false;
let submitPending = false;

vi.mock("../hooks/businessMutations", () => ({
  useAcceptBusinessTermsMutation: () => ({
    mutate: mockAccept,
    isPending: acceptPending,
    error: acceptError,
  }),
  useSubmitBusinessForVerificationMutation: () => ({
    mutate: mockSubmit,
    isPending: submitPending,
    error: submitError,
  }),
}));

const readyContext: BusinessContext = {
  businessId: "biz-123",
  businessCode: "BIZ1",
  displayName: "Acme Salon",
  status: "draft",
  primaryCategoryId: "cat-1",
  countryCode: "BI",
  city: "Bujumbura",
  contactPhone: "+25761234567",
  currencyCode: "BIF",
  timezone: "Africa/Bujumbura",
  branch: { branchId: "br-1", displayName: "Main Branch", countryCode: "BI", city: "Bujumbura" },
  termsAcceptance: { accepted: true, version: "2026-08-21" },
};

const notReadyContext: BusinessContext = {
  ...readyContext,
  termsAcceptance: { accepted: false },
};

function renderPage(context: BusinessContext) {
  return render(
    <MemoryRouter>
      <DashboardTermsPage context={context} />
    </MemoryRouter>,
  );
}

describe("DashboardTermsPage (Package D, ACT-01)", () => {
  afterEach(() => {
    mockAccept.mockClear();
    mockSubmit.mockClear();
    acceptError = undefined;
    submitError = undefined;
    acceptPending = false;
    submitPending = false;
  });

  it("renders inside the Dashboard route table with the shared Business Terms heading", () => {
    renderPage(notReadyContext);
    expect(screen.getByRole("heading", { name: "Business Terms", level: 2 })).toBeInTheDocument();
  });

  it("shows the neutral Terms-unavailable state (DEC-LEGAL-002 open) — no checkbox, no accept control, no fabricated legal content", () => {
    renderPage(notReadyContext);
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getByText(/currently unavailable/i)).toBeInTheDocument();
    const html = document.body.innerHTML;
    expect(html).not.toMatch(/https?:\/\//i);
    expect(html).not.toMatch(/effective date/i);
    expect(html).not.toMatch(/version 1\.0/i);
  });

  it("never renders the wizard-only Continue button on this standalone Dashboard screen", () => {
    renderPage(notReadyContext);
    expect(screen.queryByRole("button", { name: "Continue" })).not.toBeInTheDocument();
  });

  it("Submit for Verification is disabled while not ready (Terms not accepted)", () => {
    renderPage(notReadyContext);
    expect(screen.getByRole("button", { name: "Submit for verification" })).toBeDisabled();
  });

  it("Submit for Verification is enabled once isReadyToSubmit is true and calls the real mutation", async () => {
    const user = userEvent.setup();
    renderPage(readyContext);
    const submitButton = screen.getByRole("button", { name: "Submit for verification" });
    expect(submitButton).toBeEnabled();
    await user.click(submitButton);
    expect(mockSubmit).toHaveBeenCalledTimes(1);
  });

  it("shows the mutation error on a failed submission, without falsely advancing to the submitted state", () => {
    submitError = new BusinessApiError("conflict");
    renderPage(readyContext);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "That's already being processed. Please wait a moment and try again.",
    );
    expect(screen.getByRole("heading", { name: "Business Terms", level: 2 })).toBeInTheDocument();
  });

  it("shows the submitted/pending-verification state once status transitions, replacing the Terms/Submit UI entirely", () => {
    renderPage({ ...readyContext, status: "pending_verification" });
    expect(
      screen.getByRole("heading", { name: "Submitted — pending verification" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Submit for verification" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/currently unavailable/i)).not.toBeInTheDocument();
  });

  it("never presents a draft/pending Business as Active, and never invents Tier/Subscription/merchant/appointments content", () => {
    renderPage(notReadyContext);
    for (const forbidden of [
      /\bActive\b/,
      /tier/i,
      /subscription/i,
      /merchant account/i,
      /appointments?/i,
    ]) {
      expect(screen.queryByText(forbidden)).not.toBeInTheDocument();
    }
  });
});
