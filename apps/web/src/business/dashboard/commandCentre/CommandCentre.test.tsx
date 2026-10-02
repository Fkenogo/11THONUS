import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CommandCentre } from "./CommandCentre";
import type { BusinessContext } from "../../api/businessContext";

const state = vi.hoisted(() => ({
  programs: [] as unknown[],
  rewards: [] as unknown[],
  cycles: [] as unknown[],
  purchases: {} as Record<string, unknown[]>,
}));

const ok = (data: unknown) => ({
  data,
  isPending: false,
  isError: false,
  refetch: vi.fn(),
});

vi.mock("../../hooks/rewardProgramQueries", () => ({
  useRewardProgramsQuery: () => ok(state.programs),
}));
vi.mock("../../hooks/businessLoyaltyQueries", () => ({
  useBusinessAvailableRewardsQuery: () => ok({ rewards: state.rewards }),
  useBusinessCycleProgressQuery: () => ok({ cycles: state.cycles }),
}));
vi.mock("../../hooks/purchaseQueries", () => ({
  usePurchasesQuery: (_id: string, status?: string) =>
    ok({ purchases: state.purchases[status ?? "all"] ?? [] }),
}));

const context = { businessId: "biz-1", displayName: "Acme Salon" } as BusinessContext;

function purchase(id: string, status: string) {
  return {
    id,
    status,
    quantity: 1,
    itemLabel: "Premium haircut",
    canonicalLoyaltyNumberValue: "LN-1",
    purchaseDate: "2026-09-01T10:00:00.000Z",
  };
}

function renderCc(role: "owner" | "manager") {
  return render(
    <MemoryRouter>
      <CommandCentre context={context} role={role} />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  state.programs = [
    {
      program: { id: "p1", displayName: "Premium Cut Circle", status: "active" },
      currentVersion: {
        status: "active",
        requiredVerifiedUnits: 10,
        rewardDescription: "A free haircut",
      },
      draftVersion: null,
    },
  ];
  state.rewards = [];
  state.cycles = [];
  state.purchases = {};
});

describe("CommandCentre", () => {
  it("shows the all-clear state when nothing needs attention", () => {
    renderCc("owner");
    expect(screen.getByText("Nothing needs your attention right now.")).toBeInTheDocument();
    expect(screen.getByText("Premium Cut Circle")).toBeInTheDocument();
  });

  it("presents a Purchase awaiting the customer as NOT counted — never as progress", () => {
    state.purchases = {
      waiting_for_customer: [purchase("a", "waiting_for_customer")],
      all: [purchase("a", "waiting_for_customer")],
    };
    renderCc("owner");
    const item = document.querySelector('[data-attention="waitingForCustomer"]') as HTMLElement;
    expect(item).not.toBeNull();
    expect(
      within(item).getByText(/only count toward a Circle once the customer verifies/),
    ).toBeInTheDocument();
    expect(screen.getByText("Not counted until the customer verifies")).toBeInTheDocument();
    // No progress bar is produced from an unverified purchase.
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("explains held Purchases as the Commercial consequence, with role-specific next step", () => {
    state.purchases = { pending_admission: [purchase("h", "pending_admission")] };
    const { unmount } = renderCc("owner");
    expect(screen.getByText("New Circles are paused")).toBeInTheDocument();
    expect(screen.getByText(/rewards already earned stay redeemable/)).toBeInTheDocument();
    expect(screen.getByText(/Contact 11thONUS support/)).toBeInTheDocument();
    unmount();
    renderCc("manager");
    expect(screen.getByText(/Ask the Business Owner/)).toBeInTheDocument();
    expect(screen.queryByText(/Contact 11thONUS support/)).not.toBeInTheDocument();
  });

  it("never exposes Commercial internals", () => {
    state.purchases = { pending_admission: [purchase("h", "pending_admission")] };
    renderCc("owner");
    const text = document.body.textContent ?? "";
    for (const forbidden of [
      /earmark/i,
      /settlement/i,
      /ledger/i,
      /processor/i,
      /scheduler/i,
      /credit/i,
      /balance/i,
    ]) {
      expect(text).not.toMatch(forbidden);
    }
  });

  it("shows rewards ready and the closest Circles from verified progress only", () => {
    state.rewards = [{}, {}];
    state.cycles = [
      {
        rewardProgramId: "p1",
        rewardProgramName: "Premium Cut Circle",
        customerLoyaltyNumber: "LN-7",
        cycleSequenceNumber: 1,
        cycleState: "active",
        allocatedUnits: 7,
        threshold: 10,
        unitsToReward: 3,
        pendingUnits: 0,
        reward: null,
        updatedAt: "2026-09-01T00:00:00.000Z",
      },
    ];
    renderCc("manager");
    expect(screen.getByText("Rewards ready", { selector: "h3" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "7");
  });

  it("flags a Business with no live program", () => {
    state.programs = [];
    renderCc("owner");
    expect(screen.getByText("No live Reward Program yet")).toBeInTheDocument();
  });
});
