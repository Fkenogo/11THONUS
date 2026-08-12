import { render, screen } from "@testing-library/react";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App shell", () => {
  it("renders the Phase 0 engineering foundation heading", () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /11thONUS — Engineering Foundation/i }),
    ).toBeInTheDocument();
  });

  it("wires the EXT-TECH-001 phone-auth harness at a dev-only, lazily-loaded route (build-time exclusion verified separately against a real production build)", async () => {
    render(
      <MemoryRouter initialEntries={["/dev/phone-auth-harness"]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", {
        name: /EXT-TECH-001 Phone Auth Delivery-Test Harness/i,
      }),
    ).toBeInTheDocument();
  });

  it("wires the multi-provider sign-in preview at a dev-only, lazily-loaded route (isolated hosted build is the authoritative validation surface)", async () => {
    render(
      <MemoryRouter initialEntries={["/dev/sign-in-preview"]}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /Sign-in preview/i })).toBeInTheDocument();
  });
});
