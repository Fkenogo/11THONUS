import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TeamStep } from "./TeamStep";
import { BusinessApiError } from "../../api/businessCallableClient";
import type { BusinessContext } from "../../api/businessContext";

const mockCreateMutate = vi.fn();
const mockRevokeMutate = vi.fn();
let createError: unknown = null;

vi.mock("../../hooks/businessQueries", () => ({
  useStaffInvitationsQuery: () => ({ data: [] }),
}));
vi.mock("../../hooks/businessMutations", () => ({
  useCreateStaffInvitationMutation: () => ({
    mutate: mockCreateMutate,
    isPending: false,
    error: createError,
  }),
  useRevokeStaffInvitationMutation: () => ({ mutate: mockRevokeMutate, isPending: false }),
}));

const context: BusinessContext = {
  businessId: "b-1",
  businessCode: "BC-1",
  displayName: "Acme",
  status: "draft",
  primaryCategoryId: "cat-1",
  countryCode: "BI",
  city: "Bujumbura",
  contactPhone: "+25761234567",
  currencyCode: "BIF",
  timezone: "Africa/Bujumbura",
  branch: { branchId: "br-1", displayName: "Main", countryCode: "BI", city: "Bujumbura" },
  termsAcceptance: { accepted: false },
};

describe("TeamStep — mutation error visibility", () => {
  it("shows a localized error when the invite mutation fails (e.g. denied while the Business is draft — a real, currently-blocked case)", () => {
    createError = new BusinessApiError("auth_forbidden");

    render(<TeamStep context={context} onContinue={vi.fn()} />);

    expect(screen.getByRole("alert")).toHaveTextContent("You don't have permission to do that.");
  });

  it("shows nothing when there is no error", () => {
    createError = null;
    render(<TeamStep context={context} onContinue={vi.fn()} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("still allows skipping past the step regardless of any invite error", async () => {
    createError = new BusinessApiError("auth_forbidden");
    const onContinue = vi.fn();
    const user = userEvent.setup();

    render(<TeamStep context={context} onContinue={onContinue} />);
    await user.click(screen.getByRole("button", { name: "Skip for now" }));

    expect(onContinue).toHaveBeenCalledOnce();
  });
});
