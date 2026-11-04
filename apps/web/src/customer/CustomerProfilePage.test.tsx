import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { i18n } from "../i18n";
import { CustomerProfilePage } from "./CustomerProfilePage";

const { signOut } = vi.hoisted(() => ({ signOut: vi.fn() }));
vi.mock("../authentication/signOutFlow", () => ({
  signOutCurrentSession: (...args: unknown[]) => signOut(...args),
}));
vi.mock("./hooks/experienceQueries", () => ({
  useCustomerExperienceOverviewQuery: () => ({ data: { circles: [] } }),
}));

function Destination() {
  return <p>{useLocation().pathname}</p>;
}
function renderProfile() {
  return render(
    <MemoryRouter initialEntries={["/customer/profile"]}>
      <Routes>
        <Route
          element={
            <Outlet
              context={{
                identity: { displayName: "Amina", loyaltyNumber: "LN-1" },
                openIdentity: vi.fn(),
              }}
            />
          }
        >
          <Route
            path="/customer/profile"
            element={<CustomerProfilePage auth={{} as never} functions={{} as never} />}
          />
        </Route>
        <Route path="/" element={<Destination />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(async () => {
  await i18n.changeLanguage("en");
  vi.clearAllMocks();
});

describe("Customer profile sign out", () => {
  it("clears the Firebase session and returns to the signed-out entry route", async () => {
    signOut.mockResolvedValueOnce(undefined);
    renderProfile();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(signOut).toHaveBeenCalledOnce();
    expect(await screen.findByText("/")).toBeInTheDocument();
  });

  it("renders sign-out copy in French", async () => {
    await i18n.changeLanguage("fr");
    renderProfile();
    expect(screen.getByRole("button", { name: "Se déconnecter" })).toBeInTheDocument();
  });
});
