import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DashboardComingSoon } from "./DashboardComingSoon";

function renderComingSoon(section: "profile" | "locations" | "team" | "terms") {
  return render(
    <MemoryRouter>
      <DashboardComingSoon section={section} businessId="biz-123" />
    </MemoryRouter>,
  );
}

describe("DashboardComingSoon", () => {
  it("renders a restrained not-yet-available treatment for a section, with no fabricated functionality", () => {
    renderComingSoon("team");
    expect(screen.getByRole("heading", { name: "Team" })).toBeInTheDocument();
    expect(screen.getByText("This section isn't available yet.")).toBeInTheDocument();
  });

  it("links back to the Dashboard Home", () => {
    renderComingSoon("locations");
    expect(screen.getByRole("link", { name: "Back to Overview" })).toHaveAttribute(
      "href",
      "/business/biz-123/dashboard",
    );
  });
});
