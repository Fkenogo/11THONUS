import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EstablishmentProgress } from "./EstablishmentProgress";

describe("EstablishmentProgress (ENG-P3-002-UI-IMP-A-CORR-001 Finding 3)", () => {
  it("renders 'Step 1 of 3' for EST-01", () => {
    render(<EstablishmentProgress current={1} total={3} />);
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
  });

  it("renders 'Step 2 of 3' for EST-02", () => {
    render(<EstablishmentProgress current={2} total={3} />);
    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
  });

  it("renders 'Step 3 of 3' for EST-03", () => {
    render(<EstablishmentProgress current={3} total={3} />);
    expect(screen.getByText("Step 3 of 3")).toBeInTheDocument();
  });

  it("is a status announcement, not an interactive control — no button/link/tab role, nothing to click", () => {
    render(<EstablishmentProgress current={1} total={3} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
