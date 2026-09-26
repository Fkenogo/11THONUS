import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { i18n } from "../../i18n";
import { CustomerRewardsProgressPage } from "./CustomerRewardsProgressPage";
import { BusinessApiError } from "../api/businessCallableClient";
import type { BusinessContext } from "../api/businessContext";
import type {
  BusinessAvailableRewardWire,
  BusinessLoyaltyCycleProgressWire,
} from "../api/businessLoyaltyVisibility";

type QueryResult<T> = {
  data: T | undefined;
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: unknown;
  refetch: () => void;
};

function ok<T>(data: T): QueryResult<T> {
  return { data, isPending: false, isError: false, isSuccess: true, error: null, refetch: vi.fn() };
}
function pending<T>(): QueryResult<T> {
  return {
    data: undefined,
    isPending: true,
    isError: false,
    isSuccess: false,
    error: null,
    refetch: vi.fn(),
  };
}
function failed<T>(error: unknown): QueryResult<T> {
  return {
    data: undefined,
    isPending: false,
    isError: true,
    isSuccess: false,
    error,
    refetch: vi.fn(),
  };
}

let accessibleResult: QueryResult<{ businessId: string; role: string }[]>;
let rewardsResult: QueryResult<{ rewards: BusinessAvailableRewardWire[] }>;
let cyclesResult: QueryResult<{ cycles: BusinessLoyaltyCycleProgressWire[] }>;
const rewardsEnabled = vi.fn();
const cyclesEnabled = vi.fn();

vi.mock("../hooks/businessQueries", () => ({
  useAccessibleBusinessesQuery: () => accessibleResult,
}));

vi.mock("../hooks/businessLoyaltyQueries", () => ({
  BUSINESS_LOYALTY_PAGE_LIMIT: 100,
  useBusinessAvailableRewardsQuery: (_businessId: string, enabled: boolean) => {
    rewardsEnabled(enabled);
    return rewardsResult;
  },
  useBusinessCycleProgressQuery: (_businessId: string, enabled: boolean) => {
    cyclesEnabled(enabled);
    return cyclesResult;
  },
}));

const context = { businessId: "biz-1" } as BusinessContext;

function asRole(role: "owner" | "manager" | "staff") {
  accessibleResult = ok([{ businessId: "biz-1", role }]);
}

const reward: BusinessAvailableRewardWire = {
  rewardProgramId: "rp-1",
  rewardProgramName: "Coffee Club",
  customerLoyaltyNumber: "ABC234",
  rewardDescription: "One free coffee",
  rewardQuantity: 1,
  state: "available",
  availableAt: "2026-09-26T10:00:00.000Z",
  cycleSequenceNumber: 1,
};

const activeCycle: BusinessLoyaltyCycleProgressWire = {
  rewardProgramId: "rp-1",
  rewardProgramName: "Coffee Club",
  customerLoyaltyNumber: "DEF345",
  cycleSequenceNumber: 2,
  cycleState: "active",
  allocatedUnits: 3,
  threshold: 10,
  unitsToReward: 7,
  pendingUnits: 0,
  reward: null,
  updatedAt: "2026-09-26T10:00:00.000Z",
};

const readyCycle: BusinessLoyaltyCycleProgressWire = {
  ...activeCycle,
  customerLoyaltyNumber: "ABC234",
  cycleSequenceNumber: 1,
  cycleState: "reward_available",
  allocatedUnits: 10,
  unitsToReward: 0,
  pendingUnits: 2,
  reward: {
    state: "available",
    rewardDescription: "One free coffee",
    availableAt: reward.availableAt,
  },
};

function renderPage() {
  return render(
    <MemoryRouter>
      <CustomerRewardsProgressPage context={context} />
    </MemoryRouter>,
  );
}

afterEach(async () => {
  await i18n.changeLanguage("en");
  vi.clearAllMocks();
});

describe("CustomerRewardsProgressPage", () => {
  it("shows loading while the viewer's role and the reads resolve", () => {
    accessibleResult = pending();
    rewardsResult = pending();
    cyclesResult = pending();
    renderPage();
    expect(screen.getByRole("heading", { level: 1, name: "Customer Rewards" })).toBeInTheDocument();
    expect(screen.getByText("Loading…")).toBeInTheDocument();
    // Role unknown → reads not enabled yet.
    expect(rewardsEnabled).toHaveBeenLastCalledWith(false);
    expect(cyclesEnabled).toHaveBeenLastCalledWith(false);
  });

  it("shows per-section loading for an Owner while reads are pending", () => {
    asRole("owner");
    rewardsResult = pending();
    cyclesResult = pending();
    renderPage();
    expect(screen.getAllByText("Loading…")).toHaveLength(2);
    expect(rewardsEnabled).toHaveBeenLastCalledWith(true);
  });

  it("shows empty states when no Customer has progress or a reward", () => {
    asRole("owner");
    rewardsResult = ok({ rewards: [] });
    cyclesResult = ok({ cycles: [] });
    renderPage();
    expect(screen.getByText("No customer has a reward ready right now.")).toBeInTheDocument();
    expect(
      screen.getByText("No customer has verified a purchase in a Reward Program yet."),
    ).toBeInTheDocument();
  });

  it("renders server-provided rewards and cycle progress verbatim (Owner)", () => {
    asRole("owner");
    rewardsResult = ok({ rewards: [reward] });
    cyclesResult = ok({ cycles: [readyCycle, activeCycle] });
    renderPage();

    const rewards = screen.getByRole("region", { name: "Rewards ready" });
    expect(within(rewards).getByText("One free coffee")).toBeInTheDocument();
    expect(within(rewards).getByText("Coffee Club")).toBeInTheDocument();
    expect(within(rewards).getByText("Customer loyalty number ABC234")).toBeInTheDocument();
    expect(within(rewards).getByText("Ready")).toBeInTheDocument();

    const progress = screen.getByRole("region", { name: "Customer progress" });
    const bars = within(progress).getAllByRole("progressbar");
    expect(bars).toHaveLength(2);
    expect(bars[0]).toHaveAttribute("aria-valuenow", "10");
    expect(bars[0]).toHaveAttribute("aria-valuemax", "10");
    expect(bars[1]).toHaveAttribute("aria-valuenow", "3");
    expect(within(progress).getByText("Reward ready: One free coffee")).toBeInTheDocument();
    expect(within(progress).getByText("Units waiting for the next cycle: 2")).toBeInTheDocument();
    expect(within(progress).getByText("Units to next reward: 7")).toBeInTheDocument();
    expect(within(progress).getByText("3 of 10 verified units · Cycle 2")).toBeInTheDocument();
    expect(within(progress).getByText("In progress")).toBeInTheDocument();
  });

  it("gives a Manager the same view", () => {
    asRole("manager");
    rewardsResult = ok({ rewards: [reward] });
    cyclesResult = ok({ cycles: [activeCycle] });
    renderPage();
    expect(screen.getByRole("region", { name: "Rewards ready" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Customer progress" })).toBeInTheDocument();
    expect(cyclesEnabled).toHaveBeenLastCalledWith(true);
  });

  it("shows Staff a notice and never enables the reads", () => {
    asRole("staff");
    rewardsResult = ok({ rewards: [reward] });
    cyclesResult = ok({ cycles: [activeCycle] });
    renderPage();
    expect(
      screen.getByText(
        "Only the Business Owner or a Manager can view customer rewards and progress.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Rewards ready" })).not.toBeInTheDocument();
    expect(screen.queryByText("One free coffee")).not.toBeInTheDocument();
    expect(rewardsEnabled).toHaveBeenLastCalledWith(false);
    expect(cyclesEnabled).toHaveBeenLastCalledWith(false);
  });

  it("treats a viewer with no membership for this Business like Staff", () => {
    accessibleResult = ok([{ businessId: "other-biz", role: "owner" }]);
    rewardsResult = ok({ rewards: [] });
    cyclesResult = ok({ cycles: [] });
    renderPage();
    expect(rewardsEnabled).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole("region", { name: "Rewards ready" })).not.toBeInTheDocument();
  });

  it("shows an error with a retry for a failed read, mapped to the shared error catalog", async () => {
    const user = userEvent.setup();
    asRole("owner");
    rewardsResult = failed(new BusinessApiError("auth_forbidden"));
    cyclesResult = ok({ cycles: [] });
    renderPage();
    const alert = within(screen.getByRole("region", { name: "Rewards ready" })).getAllByRole(
      "alert",
    )[0];
    expect(within(alert).getByText("We couldn't load this. Please try again.")).toBeInTheDocument();
    expect(within(alert).getByText("You don't have permission to do that.")).toBeInTheDocument();
    await user.click(within(alert).getByRole("button", { name: "Try again" }));
    expect(rewardsResult.refetch).toHaveBeenCalledTimes(1);
  });

  it("renders no mutation controls — only read content (no redeem/fulfil/cancel actions)", () => {
    asRole("owner");
    rewardsResult = ok({ rewards: [reward] });
    cyclesResult = ok({ cycles: [readyCycle, activeCycle] });
    renderPage();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
    expect(screen.queryAllByRole("combobox")).toHaveLength(0);
    expect(screen.queryByText(/redeem/i)).not.toBeInTheDocument();
  });

  it("uses a mobile-first single-column layout that widens at md", () => {
    asRole("owner");
    rewardsResult = ok({ rewards: [reward] });
    cyclesResult = ok({ cycles: [activeCycle] });
    renderPage();
    const lists = screen.getAllByRole("list");
    expect(lists.length).toBe(2);
    for (const list of lists) {
      expect(list.className).toMatch(/\bgrid-cols-1\b/);
      expect(list.className).toMatch(/\bmd:grid-cols-2\b/);
    }
  });

  it("renders in French", async () => {
    await i18n.changeLanguage("fr");
    asRole("owner");
    rewardsResult = ok({ rewards: [] });
    cyclesResult = ok({ cycles: [activeCycle] });
    renderPage();
    expect(
      screen.getByRole("heading", { level: 1, name: "Récompenses clients" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Unités restantes avant la récompense : 7")).toBeInTheDocument();
  });

  it("does not crash when the detected language tag is not valid BCP 47 (e.g. en-US@posix)", async () => {
    await i18n.changeLanguage("en-US@posix");
    asRole("owner");
    rewardsResult = ok({ rewards: [reward] });
    cyclesResult = ok({ cycles: [] });
    renderPage();
    expect(screen.getByText(/^Ready since /)).toBeInTheDocument();
  });
});
