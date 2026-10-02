import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { BusinessDashboardRoutes } from "./BusinessDashboardRoutes";
import type { BusinessContext } from "../api/businessContext";

const role = vi.hoisted(() => ({ current: undefined as string | undefined }));

vi.mock("../hooks/businessQueries", () => ({
  useBusinessCategoriesQuery: () => ({ data: [{ id: "cat-1", displayLabel: "Hair salon" }] }),
  useAccessibleBusinessesQuery: () => ({
    data: role.current ? [{ businessId: "biz-123", role: role.current }] : [],
    status: "success",
  }),
}));
vi.mock("./commandCentre/CommandCentre", () => ({
  CommandCentre: ({ role: r }: { role: string }) => <p>command centre for {r}</p>,
}));

const context = {
  businessId: "biz-123",
  businessCode: "BIZ1",
  displayName: "Acme Salon",
  status: "active",
  primaryCategoryId: "cat-1",
  termsAcceptance: { accepted: true },
} as unknown as BusinessContext;

function renderHome() {
  return render(
    <MemoryRouter initialEntries={["/business/biz-123/dashboard"]}>
      <Routes>
        <Route
          path="/business/:businessId/dashboard/*"
          element={<BusinessDashboardRoutes context={context} />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("BusinessDashboardRoutes — Command Centre by role (EA-003)", () => {
  it.each(["owner", "manager"])("renders the Command Centre for %s", (r) => {
    role.current = r;
    renderHome();
    expect(screen.getByText(`command centre for ${r}`)).toBeInTheDocument();
  });

  it("does not render the Command Centre for Staff or an unresolved role", () => {
    role.current = "staff";
    const { unmount } = renderHome();
    expect(screen.queryByText(/command centre for/)).not.toBeInTheDocument();
    unmount();
    role.current = undefined;
    renderHome();
    expect(screen.queryByText(/command centre for/)).not.toBeInTheDocument();
  });
});
