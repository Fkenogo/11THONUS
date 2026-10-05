import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CustomerCircleWire } from "../api/customerExperienceClient";
import { CustomerLoyaltyCircle } from "./CustomerLoyaltyCircle";

function circle(overrides: Partial<CustomerCircleWire> = {}): CustomerCircleWire {
  return {
    id: "cycle-1",
    businessId: "biz-1",
    businessName: "Café Lumière",
    rewardProgramId: "program-1",
    programmeName: "Coffee Circle",
    qualifyingItemName: "Coffee",
    cycleId: "cycle-1",
    cycleNumber: 2,
    cycleState: "active",
    verifiedUnits: 8,
    pendingUnits: 1,
    rewardAvailable: false,
    rewardDescription: null,
    ...overrides,
  };
}

describe("CustomerLoyaltyCircle", () => {
  it("distinguishes verified and waiting units in the circle", () => {
    render(<CustomerLoyaltyCircle circle={circle()} />);

    expect(
      screen.getByRole("img", { name: "8 verified units, 1 waiting for confirmation" }),
    ).toBeInTheDocument();
    expect(screen.getByText("8 verified")).toBeInTheDocument();
    expect(screen.getByText("1 waiting for confirmation")).toBeInTheDocument();
    expect(screen.getByText("Cycle 2")).toBeInTheDocument();
  });

  it("renders the server-provided available reward as the center state", () => {
    render(
      <CustomerLoyaltyCircle
        circle={circle({
          cycleState: "reward_available",
          verifiedUnits: 10,
          rewardAvailable: true,
          pendingUnits: 0,
        })}
      />,
    );

    expect(screen.getByText("11th ON US")).toBeInTheDocument();
    expect(screen.getByText("Circle complete — your Coffee is on us!")).toBeInTheDocument();
  });
});
