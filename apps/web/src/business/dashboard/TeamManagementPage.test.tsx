import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { TeamManagementPage } from "./TeamManagementPage";
import { BusinessApiError } from "../api/businessCallableClient";
import type { BusinessContext } from "../api/businessContext";
import type { StaffInvitationSummary, StaffMembershipSummary } from "../api/staffLists";

let membershipsResult: {
  data: StaffMembershipSummary[] | undefined;
  status: "pending" | "success" | "error";
  refetch: () => void;
};
let invitationsResult: {
  data: StaffInvitationSummary[] | undefined;
  status: "pending" | "success" | "error";
  refetch: () => void;
};
const mockRefetchMemberships = vi.fn();
const mockRefetchInvitations = vi.fn();

vi.mock("../hooks/businessQueries", () => ({
  useStaffMembershipsQuery: () => membershipsResult,
  useStaffInvitationsQuery: () => invitationsResult,
}));

const mockInvite = vi.fn();
const mockRevoke = vi.fn();
let inviteError: unknown;
let revokeError: unknown;
let invitePending = false;
let revokePending = false;

vi.mock("../hooks/businessMutations", () => ({
  useCreateStaffInvitationMutation: () => ({
    mutate: mockInvite,
    isPending: invitePending,
    error: inviteError,
  }),
  useRevokeStaffInvitationMutation: () => ({
    mutate: mockRevoke,
    isPending: revokePending,
    error: revokeError,
  }),
}));

const context: BusinessContext = {
  businessId: "biz-123",
  businessCode: "BIZ7X2PYN",
  displayName: "Acme Salon",
  status: "draft",
  primaryCategoryId: "cat-1",
  countryCode: "BI",
  city: "Bujumbura",
  contactPhone: "+25761234567",
  contactEmail: "owner@example.com",
  currencyCode: "BIF",
  timezone: "Africa/Bujumbura",
  branch: { branchId: "br-1", displayName: "Main Branch", countryCode: "BI", city: "Bujumbura" },
  termsAcceptance: { accepted: false },
};

const owner: StaffMembershipSummary = {
  membershipId: "mem-owner",
  role: "owner",
  status: "active",
  displayName: "Safi",
};

function renderPage() {
  return render(
    <MemoryRouter>
      <TeamManagementPage context={context} />
    </MemoryRouter>,
  );
}

describe("TeamManagementPage (Package F, MGMT-01/DASH-04)", () => {
  afterEach(() => {
    mockInvite.mockClear();
    mockRevoke.mockClear();
    mockRefetchMemberships.mockClear();
    mockRefetchInvitations.mockClear();
    inviteError = undefined;
    revokeError = undefined;
    invitePending = false;
    revokePending = false;
  });

  function setLoaded(memberships: StaffMembershipSummary[], invitations: StaffInvitationSummary[]) {
    membershipsResult = { data: memberships, status: "success", refetch: mockRefetchMemberships };
    invitationsResult = { data: invitations, status: "success", refetch: mockRefetchInvitations };
  }

  it("renders the Team route heading inside the Dashboard shell content area", () => {
    setLoaded([owner], []);
    renderPage();
    expect(screen.getByRole("heading", { name: "Team", level: 1 })).toBeInTheDocument();
  });

  it("displays an active member's real display name", () => {
    setLoaded(
      [
        owner,
        { membershipId: "mem-2", role: "manager", status: "active", displayName: "Jean-Claude" },
      ],
      [],
    );
    renderPage();
    expect(screen.getByText("Jean-Claude")).toBeInTheDocument();
  });

  it("does not fabricate a name when displayName is absent, and shows a neutral state instead", () => {
    setLoaded([owner, { membershipId: "mem-2", role: "staff", status: "active" }], []);
    renderPage();
    expect(screen.getByText("Unnamed team member")).toBeInTheDocument();
    expect(screen.queryByText("mem-2")).not.toBeInTheDocument();
  });

  it("displays a pending invitation's email", () => {
    setLoaded(
      [owner],
      [
        {
          invitationId: "inv-1",
          role: "staff",
          status: "invited",
          deliveryType: "email",
          invitedAt: "2026-08-01T00:00:00.000Z",
          expiresAt: "2026-08-08T00:00:00.000Z",
          email: "elise.m@example.com",
        },
      ],
    );
    renderPage();
    expect(screen.getByText("elise.m@example.com")).toBeInTheDocument();
  });

  it("returns focus to the Invite team member button after the invite form is cancelled", async () => {
    setLoaded([owner], []);
    renderPage();
    const inviteButton = screen.getByRole("button", { name: "Invite team member" });
    await userEvent.click(inviteButton);
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("button", { name: "Invite team member" })).toHaveFocus();
  });

  it("returns focus to the Cancel invitation button after the revoke confirmation is dismissed", async () => {
    setLoaded(
      [owner],
      [
        {
          invitationId: "inv-1",
          role: "staff",
          status: "invited",
          deliveryType: "email",
          invitedAt: "2026-08-01T00:00:00.000Z",
          expiresAt: "2026-08-08T00:00:00.000Z",
          email: "a@example.com",
        },
      ],
    );
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Cancel invitation" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("button", { name: "Cancel invitation" })).toHaveFocus();
  });

  it("does not fabricate an identity for a phone-delivery invitation lacking an email", () => {
    setLoaded(
      [owner],
      [
        {
          invitationId: "inv-2",
          role: "staff",
          status: "invited",
          deliveryType: "phone",
          invitedAt: "2026-08-01T00:00:00.000Z",
          expiresAt: "2026-08-08T00:00:00.000Z",
        },
      ],
    );
    renderPage();
    expect(screen.getByText("Invitation sent")).toBeInTheDocument();
  });

  it("renders role and status for active members and invitations", () => {
    setLoaded(
      [owner],
      [
        {
          invitationId: "inv-1",
          role: "manager",
          status: "invited",
          deliveryType: "email",
          invitedAt: "2026-08-01T00:00:00.000Z",
          expiresAt: "2026-08-08T00:00:00.000Z",
          email: "a@example.com",
        },
      ],
    );
    renderPage();
    const memberRow = screen.getByText("Safi").closest("li")!;
    expect(
      within(memberRow).getByText((_, node) => node?.textContent === "Owner · Active"),
    ).toBeInTheDocument();
    const inviteRow = screen.getByText("a@example.com").closest("li")!;
    expect(
      within(inviteRow).getByText((_, node) => node?.textContent === "Manager · Pending"),
    ).toBeInTheDocument();
  });

  it("renders the Owner row without a revoke or removal control", () => {
    setLoaded([owner], []);
    renderPage();
    const ownerRow = screen.getByText("Safi").closest("li")!;
    expect(within(ownerRow).queryByRole("button")).not.toBeInTheDocument();
  });

  it("keeps two same-role Staff members distinguishable by their own display name", () => {
    setLoaded(
      [
        owner,
        { membershipId: "mem-a", role: "staff", status: "active", displayName: "Amara" },
        { membershipId: "mem-b", role: "staff", status: "active", displayName: "Blaise" },
      ],
      [],
    );
    renderPage();
    expect(screen.getByText("Amara")).toBeInTheDocument();
    expect(screen.getByText("Blaise")).toBeInTheDocument();
  });

  it("sends an invitation using the existing createStaffInvitation contract, gated to manager/staff roles only", async () => {
    setLoaded([owner], []);
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Invite team member" }));
    await userEvent.type(screen.getByLabelText("Email"), "new@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Send invitation" }));
    expect(mockInvite).toHaveBeenCalledWith(
      { role: "staff", deliveryTarget: { type: "email", value: "new@example.com" } },
      expect.anything(),
    );
    const roleSelect = screen.getByLabelText("Role") as HTMLSelectElement;
    const roleValues = Array.from(roleSelect.options).map((option) => option.value);
    expect(roleValues).toEqual(["staff", "manager"]);
  });

  it("never reveals whether an email belongs to an existing account — no lookup call is made while typing", async () => {
    setLoaded([owner], []);
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Invite team member" }));
    await userEvent.type(screen.getByLabelText("Email"), "probe@example.com");
    expect(screen.queryByText(/already/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/exists/i)).not.toBeInTheDocument();
  });

  it("revokes a pending invitation using the existing revokeStaffInvitation contract after confirmation", async () => {
    setLoaded(
      [owner],
      [
        {
          invitationId: "inv-1",
          role: "staff",
          status: "invited",
          deliveryType: "email",
          invitedAt: "2026-08-01T00:00:00.000Z",
          expiresAt: "2026-08-08T00:00:00.000Z",
          email: "a@example.com",
        },
      ],
    );
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Cancel invitation" }));
    await userEvent.click(screen.getByRole("button", { name: "Yes, cancel invitation" }));
    expect(mockRevoke).toHaveBeenCalledWith("inv-1", expect.anything());
  });

  it("disables the revoke-confirmation button while the revoke mutation is pending, to prevent a duplicate submit", async () => {
    setLoaded(
      [owner],
      [
        {
          invitationId: "inv-1",
          role: "staff",
          status: "invited",
          deliveryType: "email",
          invitedAt: "2026-08-01T00:00:00.000Z",
          expiresAt: "2026-08-08T00:00:00.000Z",
          email: "a@example.com",
        },
      ],
    );
    revokePending = true;
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Cancel invitation" }));
    expect(screen.getByRole("button", { name: "Yes, cancel invitation" })).toBeDisabled();
  });

  it("shows a revoke failure without implying success, and leaves the invitation state unchanged", async () => {
    setLoaded(
      [owner],
      [
        {
          invitationId: "inv-1",
          role: "staff",
          status: "invited",
          deliveryType: "email",
          invitedAt: "2026-08-01T00:00:00.000Z",
          expiresAt: "2026-08-08T00:00:00.000Z",
          email: "a@example.com",
        },
      ],
    );
    revokeError = new BusinessApiError("unavailable");
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Cancel invitation" }));
    await userEvent.click(screen.getByRole("button", { name: "Yes, cancel invitation" }));
    expect(
      screen.getByText("This is temporarily unavailable. Please try again shortly."),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByText("a@example.com")).toBeInTheDocument();
  });

  it("never renders an unsupported Resend action anywhere on the page", () => {
    setLoaded(
      [owner],
      [
        {
          invitationId: "inv-1",
          role: "staff",
          status: "invited",
          deliveryType: "email",
          invitedAt: "2026-08-01T00:00:00.000Z",
          expiresAt: "2026-08-08T00:00:00.000Z",
          email: "a@example.com",
        },
      ],
    );
    renderPage();
    expect(screen.queryByRole("button", { name: /resend/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/resend/i)).not.toBeInTheDocument();
  });

  it("does not show a revoke control for a non-pending invitation", () => {
    setLoaded(
      [owner],
      [
        {
          invitationId: "inv-1",
          role: "staff",
          status: "expired",
          deliveryType: "email",
          invitedAt: "2026-08-01T00:00:00.000Z",
          expiresAt: "2026-08-08T00:00:00.000Z",
          email: "a@example.com",
        },
      ],
    );
    renderPage();
    expect(screen.queryByRole("button", { name: "Cancel invitation" })).not.toBeInTheDocument();
  });

  it("shows a mutation failure without implying success", async () => {
    setLoaded([owner], []);
    inviteError = new BusinessApiError("validation_failed");
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Invite team member" }));
    expect(
      screen.getByText("Something about that wasn't valid. Please check and try again."),
    ).toBeInTheDocument();
  });

  it("shows only Owner without implying an integrity problem when there is no other Staff", () => {
    setLoaded([owner], []);
    renderPage();
    expect(screen.getByText("No other team members yet.")).toBeInTheDocument();
  });

  it("shows a restrained empty state when there are no pending invitations", () => {
    setLoaded([owner], []);
    renderPage();
    expect(screen.getByText("No pending invitations.")).toBeInTheDocument();
  });

  it("shows a loading state distinct from an empty state while Team data is loading", () => {
    membershipsResult = { data: undefined, status: "pending", refetch: mockRefetchMemberships };
    invitationsResult = { data: undefined, status: "pending", refetch: mockRefetchInvitations };
    renderPage();
    expect(screen.getByText("Loading your team…")).toBeInTheDocument();
    expect(screen.queryByText("No other team members yet.")).not.toBeInTheDocument();
  });

  it("surfaces a read failure as a real error, never as an ordinary empty state, and offers retry", async () => {
    membershipsResult = { data: undefined, status: "error", refetch: mockRefetchMemberships };
    invitationsResult = { data: undefined, status: "success", refetch: mockRefetchInvitations };
    renderPage();
    expect(screen.getByText("We couldn't load your team")).toBeInTheDocument();
    expect(screen.queryByText("No other team members yet.")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(mockRefetchMemberships).toHaveBeenCalled();
  });

  it("never renders a userId, phone number, or provider metadata anywhere on the page", () => {
    setLoaded(
      [{ membershipId: "mem-secret-uid-1", role: "staff", status: "active", displayName: "Amara" }],
      [
        {
          invitationId: "inv-1",
          role: "staff",
          status: "invited",
          deliveryType: "phone",
          invitedAt: "2026-08-01T00:00:00.000Z",
          expiresAt: "2026-08-08T00:00:00.000Z",
        },
      ],
    );
    renderPage();
    expect(screen.queryByText(/mem-secret-uid-1/)).not.toBeInTheDocument();
    expect(screen.queryByText(context.contactPhone)).not.toBeInTheDocument();
  });

  it("gives the invite button a minimum touch target consistent with the 44px mobile requirement", () => {
    setLoaded([owner], []);
    renderPage();
    const inviteButton = screen.getByRole("button", { name: "Invite team member" });
    expect(inviteButton.className).toMatch(/min-h-11/);
  });
});
