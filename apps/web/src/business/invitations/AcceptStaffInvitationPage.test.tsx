import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AcceptStaffInvitationPage } from "./AcceptStaffInvitationPage";
import { BusinessApiError } from "../api/businessCallableClient";
import { i18n } from "../../i18n";

/**
 * `PLATFORM-BASELINE-004A` — invitation acceptance flow: idle, pending,
 * success (with governed dashboard link), domain-error mapping, missing
 * reference, and EN/FR copy.
 */

const mockAccept = vi.fn();
let acceptState: {
  mutate: typeof mockAccept;
  isPending: boolean;
  isSuccess: boolean;
  data:
    | {
        membershipId: string;
        businessId: string;
        userId: string;
        role: string;
        acceptedAt: string;
      }
    | undefined;
  error: unknown;
};

vi.mock("../hooks/businessMutations", () => ({
  useAcceptStaffInvitationMutation: () => acceptState,
}));

function renderPage(entry = "/invitations/inv-ref-1/accept") {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route
          path="/invitations/:invitationReference/accept"
          element={<AcceptStaffInvitationPage />}
        />
        <Route path="/business/:businessId/dashboard" element={<div>dashboard stub</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function setIdle() {
  acceptState = {
    mutate: mockAccept,
    isPending: false,
    isSuccess: false,
    data: undefined,
    error: null,
  };
}

afterEach(async () => {
  mockAccept.mockClear();
  await i18n.changeLanguage("en");
});

describe("AcceptStaffInvitationPage (PLATFORM-BASELINE-004A)", () => {
  it("accepts the referenced invitation through the self-service mutation (reference only, no actor/role input)", async () => {
    setIdle();
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByRole("heading", { name: "Team invitation", level: 1 })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Accept invitation" }));
    expect(mockAccept).toHaveBeenCalledWith({ invitationReference: "inv-ref-1" });
  });

  it("shows the accepting state while the mutation is pending", () => {
    acceptState = {
      mutate: mockAccept,
      isPending: true,
      isSuccess: false,
      data: undefined,
      error: null,
    };
    renderPage();

    expect(screen.getByRole("button", { name: "Accepting your invitation…" })).toBeDisabled();
    expect(mockAccept).not.toHaveBeenCalled();
  });

  it("shows success with a dashboard link to the server-bound business after acceptance", async () => {
    acceptState = {
      mutate: mockAccept,
      isPending: false,
      isSuccess: true,
      data: {
        membershipId: "mem-1",
        businessId: "biz-9",
        userId: "u-1",
        role: "staff",
        acceptedAt: "2026-09-12T00:00:00.000Z",
      },
      error: null,
    };
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByText("You're on the team")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Open business dashboard" });
    expect(link).toHaveAttribute("href", "/business/biz-9/dashboard");
    await user.click(link);
    expect(await screen.findByText("dashboard stub")).toBeInTheDocument();
  });

  it("maps a denied/expired invitation to the localized error catalog (never a raw server message)", () => {
    acceptState = {
      mutate: mockAccept,
      isPending: false,
      isSuccess: false,
      data: undefined,
      error: new BusinessApiError("not_found"),
    };
    renderPage();

    expect(screen.getByText("We couldn't find that.")).toBeInTheDocument();
  });

  it("renders the French accept flow with semantic parity", async () => {
    await i18n.changeLanguage("fr");
    setIdle();
    renderPage();

    expect(
      screen.getByRole("heading", { name: "Invitation à l'équipe", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Accepter l'invitation" })).toBeInTheDocument();
  });
});
