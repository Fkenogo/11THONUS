import { afterEach, describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { i18n } from "../i18n";
import { CustomerRoutes } from "./CustomerRoutes";

function renderCustomer(initialPath = "/customer") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/customer/*" element={<CustomerRoutes />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(async () => {
  await i18n.changeLanguage("en");
});

describe("CustomerShell / CustomerRoutes", () => {
  it("renders every nav destination and the routed Home content in English", () => {
    renderCustomer();
    const nav = screen.getByRole("navigation", { name: "Customer navigation" });
    expect(within(nav).getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Scan" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Rewards" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Activity" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Account" })).toBeInTheDocument();
    expect(screen.getByText("You don't have a loyalty number yet.")).toBeInTheDocument();
    expect(screen.getByText("Your loyalty QR code isn't available yet.")).toBeInTheDocument();
  });

  it("renders the nav and destinations in French", async () => {
    await i18n.changeLanguage("fr");
    renderCustomer();
    const nav = screen.getByRole("navigation", { name: "Navigation client" });
    expect(within(nav).getByRole("link", { name: "Accueil" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Scanner" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Récompenses" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Activité" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Compte" })).toBeInTheDocument();
  });

  it("shows an honest not-yet-available stub for Scan, never fabricated activity", () => {
    renderCustomer("/customer/scan");
    expect(screen.getByText("Scanning isn't available yet.")).toBeInTheDocument();
  });

  it("shows an honest not-yet-available stub for Rewards", () => {
    renderCustomer("/customer/rewards");
    expect(screen.getByText("You don't have any rewards yet.")).toBeInTheDocument();
  });

  it("shows an honest not-yet-available stub for Activity", () => {
    renderCustomer("/customer/activity");
    expect(screen.getByText("Your activity isn't available yet.")).toBeInTheDocument();
  });

  it("shows an honest not-yet-available stub for Account", () => {
    renderCustomer("/customer/account");
    expect(screen.getByText("Account settings aren't available yet.")).toBeInTheDocument();
  });
});
