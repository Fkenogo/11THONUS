import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { TeamManagementPage } from "./TeamManagementPage";
import { BusinessApiError } from "../api/businessCallableClient";
import { i18n } from "../../i18n";
import type { BusinessContext } from "../api/businessContext";
import type { StaffInvitationSummary, StaffMembershipSummary } from "../api/staffLists";

/**
 * `PLATFORM-BASELINE-004A` — authorization-driven Team Management
 * controls: role-change and membership-lifecycle actions render exactly
 * for the operations the viewer's own live role authorizes (Owner: full;
 * Manager: lifecycle on Staff rows only; Staff/unknown: none), and each
 * control reaches its governed callable with server-derived ids only.
 */

let memberships: StaffMembershipSummary[];
let invitations: StaffInvitationSummary[];
let viewerRole: "owner" | "manager" | "staff" | undefined;

vi.mock("../hooks/businessQueries", () => ({
  useStaffMembershipsQuery: () => ({ data: memberships, status: "success", refetch: vi.fn() }),
  useStaffInvitationsQuery: () => ({ data: invitations, status: "success", refetch: vi.fn() }),
  useAccessibleBusinessesQuery: () => ({
    data:
      viewerRole === undefined
        ? []
        : [{ businessId: "biz-123", displayName: "Acme", status: "active", role: viewerRole }],
    status: "success" as const,
  }),
}));

const mockSuspend = vi.fn();
const mockReactivate = vi.fn();
const mockRemove = vi.fn();
const mockChangeRole = vi.fn();
let lifecycleError: unknown = null;

vi.mock("../hooks/businessMutations", () => ({
  useCreateStaffInvitationMutation: () => ({ mutate: vi.fn(), isPending: false, error: null }),
  useRevokeStaffInvitationMutation: () => ({ mutate: vi.fn(), isPending: false, error: null }),
  useSuspendStaffMembershipMutation: () => ({
    mutate: mockSuspend,
    isPending: false,
    error: lifecycleError,
  }),
  useReactivateStaffMembershipMutation: () => ({
    mutate: mockReactivate,
    isPending: false,
    error: lifecycleError,
  }),
  useRemoveStaffMembershipMutation: () => ({
    mutate: mockRemove,
    isPending: false,
    error: lifecycleError,
  }),
  useChangeStaffMembershipRoleMutation: () => ({
    mutate: mockChangeRole,
    isPending: false,
    error: lifecycleError,
  }),
}));

const context: BusinessContext = {
  businessId: "biz-123",
  businessCode: "BIZ7X2PYN",
  displayName: "Acme Salon",
  status: "active",
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

const ownerRow: StaffMembershipSummary = {
  membershipId: "mem-owner",
  role: "owner",
  status: "active",
  displayName: "Safi",
};
const staffRow: StaffMembershipSummary = {
  membershipId: "mem-staff",
  role: "staff",
  status: "active",
  displayName: "Aline",
};
const managerRow: StaffMembershipSummary = {
  membershipId: "mem-manager",
  role: "manager",
  status: "active",
  displayName: "Jean",
};
const suspendedRow: StaffMembershipSummary = {
  membershipId: "mem-susp",
  role: "staff",
  status: "suspended",
  displayName: "Paola",
};
const removedRow: StaffMembershipSummary = {
  membershipId: "mem-rem",
  role: "staff",
  status: "removed",
  displayName: "Theo",
};

function renderPage() {
  return render(
    <MemoryRouter>
      <TeamManagementPage context={context} />
    </MemoryRouter>,
  );
}

afterEach(async () => {
  mockSuspend.mockClear();
  mockReactivate.mockClear();
  mockRemove.mockClear();
  mockChangeRole.mockClear();
  lifecycleError = null;
  await i18n.changeLanguage("en");
});

describe("TeamManagementPage workforce administration (PLATFORM-BASELINE-004A)", () => {
  it("owner sees suspend/remove on an active staff row and suspend confirms before mutating", async () => {
    viewerRole = "owner";
    memberships = [ownerRow, staffRow];
    invitations = [];
    const user = userEvent.setup();
    renderPage();

    const row = screen.getByText("Aline").closest("li")!;
    expect(within(row).getByRole("button", { name: "Suspend" })).toBeInTheDocument();
    expect(within(row).getByRole("button", { name: "Remove" })).toBeInTheDocument();

    // Suspend requires inline confirmation — no callable fires on first click.
    await user.click(within(row).getByRole("button", { name: "Suspend" }));
    expect(mockSuspend).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Yes, suspend" }));
    expect(mockSuspend).toHaveBeenCalledWith("mem-staff", expect.objectContaining({}));
  });

  it("owner sees reactivate (direct) and remove (confirmed) on a suspended row, and no controls on a removed row", async () => {
    viewerRole = "owner";
    memberships = [ownerRow, suspendedRow, removedRow];
    invitations = [];
    const user = userEvent.setup();
    renderPage();

    const suspended = screen.getByText("Paola").closest("li")!;
    expect(suspended.textContent).toContain("Suspended");
    await user.click(within(suspended).getByRole("button", { name: "Reactivate" }));
    expect(mockReactivate).toHaveBeenCalledWith("mem-susp");

    const removed = screen.getByText("Theo").closest("li")!;
    expect(removed.textContent).toContain("Removed");
    expect(within(removed).queryByRole("button")).not.toBeInTheDocument();
  });

  it("owner can change a staff member's role via the closed manager/staff vocabulary", async () => {
    viewerRole = "owner";
    memberships = [ownerRow, staffRow];
    invitations = [];
    const user = userEvent.setup();
    renderPage();

    const row = screen.getByText("Aline").closest("li")!;
    const select = within(row).getByLabelText("New role");
    await user.selectOptions(select, "manager");
    await user.click(within(row).getByRole("button", { name: "Change role" }));
    expect(mockChangeRole).toHaveBeenCalledWith({
      targetMembershipId: "mem-staff",
      fromRole: "staff",
      toRole: "manager",
    });
  });

  it("owner rows never carry management controls (owner targets are never permitted)", () => {
    viewerRole = "owner";
    memberships = [ownerRow, staffRow];
    invitations = [];
    renderPage();

    const row = screen.getByText("Safi").closest("li")!;
    expect(within(row).queryByRole("button")).not.toBeInTheDocument();
  });

  it("manager sees lifecycle controls on staff rows only — no role editor, nothing on manager rows", () => {
    viewerRole = "manager";
    memberships = [ownerRow, managerRow, staffRow];
    invitations = [];
    renderPage();

    const staff = screen.getByText("Aline").closest("li")!;
    expect(within(staff).getByRole("button", { name: "Suspend" })).toBeInTheDocument();
    expect(within(staff).queryByLabelText("New role")).not.toBeInTheDocument();

    const manager = screen.getByText("Jean").closest("li")!;
    expect(within(manager).queryByRole("button")).not.toBeInTheDocument();

    const owner = screen.getByText("Safi").closest("li")!;
    expect(within(owner).queryByRole("button")).not.toBeInTheDocument();
  });

  it("staff viewer and unknown viewer see no management controls", () => {
    for (const role of ["staff", undefined] as const) {
      viewerRole = role;
      memberships = [ownerRow, staffRow];
      invitations = [];
      const { unmount } = renderPage();
      expect(screen.queryByRole("button", { name: "Suspend" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Reactivate" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Change role" })).not.toBeInTheDocument();
      unmount();
    }
  });

  it("surfaces a denied lifecycle attempt through the localized forbidden message", () => {
    viewerRole = "owner";
    memberships = [ownerRow, staffRow];
    invitations = [];
    lifecycleError = new BusinessApiError("auth_forbidden");
    renderPage();

    expect(screen.getAllByText("You don't have permission to do that.").length).toBeGreaterThan(0);
  });

  it("copies the invitation accept link for a pending invitation", async () => {
    viewerRole = "owner";
    memberships = [ownerRow];
    invitations = [
      {
        invitationId: "inv-1",
        role: "staff",
        status: "pending",
        deliveryType: "email",
        email: "a@b.com",
        invitedAt: "2026-09-12T00:00:00.000Z",
        expiresAt: "2026-09-19T00:00:00.000Z",
      },
    ];
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    renderPage();

    // `fireEvent` (not `userEvent`) for this affordance: under jsdom,
    // `userEvent.click` dispatches through a context whose `navigator`
    // global is not the stubbed test-realm one, so the stubbed
    // `clipboard.writeText` is never observed; `fireEvent` dispatches
    // synchronously in-realm (verified empirically). The component code
    // itself reads the standard ambient `navigator.clipboard` and degrades
    // silently when unavailable.
    fireEvent.click(screen.getByRole("button", { name: "Copy invitation link" }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("/invitations/inv-1/accept"));
    expect(await screen.findByText("Invitation link copied.")).toBeInTheDocument();
  });

  it("renders suspend/reactivate/remove controls in French with semantic parity", async () => {
    await i18n.changeLanguage("fr");
    viewerRole = "owner";
    memberships = [ownerRow, staffRow, suspendedRow];
    invitations = [];
    renderPage();

    expect(screen.getByRole("button", { name: "Suspendre" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Retirer" })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Réactiver" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Changer le rôle" })).toBeInTheDocument();
  });
});
