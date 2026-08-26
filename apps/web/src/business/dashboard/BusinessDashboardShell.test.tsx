import { afterEach, describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { i18n } from "../../i18n";
import { BusinessDashboardShell } from "./BusinessDashboardShell";
import type { BusinessContext } from "../api/businessContext";

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
  branch: { branchId: "br-1", displayName: "Main Branch", countryCode: "BI", city: "Bujumbura" },
  termsAcceptance: { accepted: false },
};

function renderShell(initialPath = "/business/biz-123/dashboard") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/business/:businessId/dashboard/*"
          element={<BusinessDashboardShell context={context} />}
        >
          <Route index element={<p>home content</p>} />
          <Route path="profile" element={<p>profile content</p>} />
          <Route path="team" element={<p>team content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(async () => {
  await i18n.changeLanguage("en");
});

describe("BusinessDashboardShell", () => {
  it("renders the Business identity and the routed page content together", () => {
    renderShell();
    expect(screen.getAllByText("Acme Salon").length).toBeGreaterThan(0);
    expect(screen.getByText("home content")).toBeInTheDocument();
  });

  it("exposes all navigation destinations regardless of mobile menu open state (mobile/desktop share one nav)", () => {
    renderShell();
    const nav = screen.getByRole("navigation", { name: "Business Dashboard navigation" });
    expect(within(nav).getByRole("link", { name: "Overview" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Business Profile" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Locations" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Team" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Business Terms" })).toBeInTheDocument();
  });

  it("identifies the current section via aria-current", () => {
    renderShell("/business/biz-123/dashboard/team");
    const nav = screen.getByRole("navigation", { name: "Business Dashboard navigation" });
    expect(within(nav).getByRole("link", { name: "Team" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Overview" })).not.toHaveAttribute("aria-current");
  });

  it("opens the mobile navigation menu from a collapsed state", async () => {
    const user = userEvent.setup();
    renderShell();
    const nav = screen.getByRole("navigation", { name: "Business Dashboard navigation" });
    expect(nav.className).toMatch(/\bhidden\b/);
    const trigger = screen.getByRole("button", { name: "Open navigation" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(nav.className).not.toMatch(/\bhidden\b/);
  });

  it("closes the mobile navigation menu and returns focus to the trigger on Escape", async () => {
    const user = userEvent.setup();
    renderShell();
    const trigger = screen.getByRole("button", { name: "Open navigation" });
    await user.click(trigger);
    expect(screen.getByRole("button", { name: "Close navigation" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Open navigation" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.getByRole("button", { name: "Open navigation" })).toHaveFocus();
  });

  it("closes the mobile navigation menu after selecting a destination", async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    const nav = screen.getByRole("navigation", { name: "Business Dashboard navigation" });
    await user.click(within(nav).getByRole("link", { name: "Business Profile" }));
    expect(screen.getByRole("button", { name: "Open navigation" })).toBeInTheDocument();
  });

  it("keeps the language switcher reachable from the shell", () => {
    renderShell();
    expect(screen.getByRole("button", { name: "Français" })).toBeInTheDocument();
  });

  it("switches the shell language EN -> FR and back FR -> EN while preserving the current route and Business context", async () => {
    const user = userEvent.setup();
    renderShell("/business/biz-123/dashboard/profile");
    await user.click(screen.getByRole("button", { name: "Français" }));
    const navFr = await screen.findByRole("navigation");
    expect(within(navFr).getByRole("link", { name: "Aperçu" })).toBeInTheDocument();
    expect(screen.getByText("profile content")).toBeInTheDocument();
    expect(screen.getAllByText("Acme Salon").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "English" }));
    const navEn = await screen.findByRole("navigation");
    expect(within(navEn).getByRole("link", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByText("profile content")).toBeInTheDocument();
  });
});
