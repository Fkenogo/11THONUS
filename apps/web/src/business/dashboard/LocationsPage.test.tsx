import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { LocationsPage } from "./LocationsPage";
import { BusinessApiError } from "../api/businessCallableClient";
import type { BusinessContext } from "../api/businessContext";

const mockUpdateBranch = vi.fn();
let mockError: unknown;
vi.mock("../hooks/businessMutations", () => ({
  useUpdateBusinessBranchProfileMutation: () => ({
    mutate: mockUpdateBranch,
    isPending: false,
    error: mockError,
  }),
}));

const context: BusinessContext = {
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
  branch: {
    branchId: "br-1",
    displayName: "Safi Glow — Main Branch",
    countryCode: "BI",
    city: "Bujumbura",
    address: "Rohero, Avenue de France",
  },
  termsAcceptance: { accepted: false },
};

function renderPage(ctx: BusinessContext = context) {
  return render(
    <MemoryRouter>
      <LocationsPage context={ctx} />
    </MemoryRouter>,
  );
}

describe("LocationsPage (Package C, MGMT-03)", () => {
  afterEach(() => {
    mockUpdateBranch.mockClear();
    mockError = undefined;
  });

  it("renders the persisted Main Location", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: "Locations" })).toBeInTheDocument();
    expect(screen.getByText("Safi Glow — Main Branch")).toBeInTheDocument();
    expect(screen.getByText("Bujumbura")).toBeInTheDocument();
    expect(screen.getByText("Burundi")).toBeInTheDocument();
    expect(screen.getByText("Rohero, Avenue de France")).toBeInTheDocument();
  });

  it("shows a restrained 'no address provided' treatment when address is absent, not an error", () => {
    renderPage({ ...context, branch: { ...context.branch!, address: undefined } });
    expect(screen.getByText("No address provided")).toBeInTheDocument();
  });

  it("never renders an 'Add new location' action (explicitly excluded from Package C)", () => {
    renderPage();
    expect(screen.queryByRole("button", { name: /add new location/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/add new location/i)).not.toBeInTheDocument();
  });

  it("never renders per-location status/photo/ID (explicitly excluded from Package C)", () => {
    renderPage();
    expect(screen.queryByText(/\bActive\b/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^ID:/)).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("enters edit mode with persisted values pre-filled", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByRole("heading", { name: "Edit Location" })).toBeInTheDocument();
    expect(screen.getByLabelText("Location name")).toHaveValue("Safi Glow — Main Branch");
    expect(screen.getByLabelText("Address (optional)")).toHaveValue("Rohero, Avenue de France");
  });

  it("Save calls updateBusinessBranchProfile with the edited fields", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.clear(screen.getByLabelText("City"));
    await user.type(screen.getByLabelText("City"), "Gitega");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(mockUpdateBranch).toHaveBeenCalledWith(
      expect.objectContaining({ city: "Gitega", displayName: "Safi Glow — Main Branch" }),
      expect.anything(),
    );
  });

  it("Cancel discards unsaved edits and returns to the persisted state, without saving", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.clear(screen.getByLabelText("City"));
    await user.type(screen.getByLabelText("City"), "Unsaved City");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockUpdateBranch).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Locations" })).toBeInTheDocument();
    expect(screen.getByText("Bujumbura")).toBeInTheDocument();
  });

  it("shows the mutation error message on a failed save, and does not falsely advance to the read view (no false success)", async () => {
    mockError = new BusinessApiError("conflict");
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "That's already being processed. Please wait a moment and try again.",
    );
    expect(screen.getByRole("heading", { name: "Edit Location" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Locations" })).not.toBeInTheDocument();
  });

  it("does not offer to edit the country (matches BranchStep's existing precedent; no new mutability invented)", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.queryByLabelText(/country/i)).not.toBeInTheDocument();
  });
});
