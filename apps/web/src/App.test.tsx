import { render, screen } from "@testing-library/react";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { Auth } from "firebase/auth";
import type { Functions } from "firebase/functions";
import App from "./App";

const fakeAuth = { onAuthStateChanged: () => () => {} } as unknown as Auth;
const fakeSignedOutAuth = {
  onAuthStateChanged: (callback: (user: null) => void) => {
    callback(null);
    return () => {};
  },
} as unknown as Auth;
const fakeFunctions = {} as Functions;

describe("App shell", () => {
  it("renders the Phase 0 engineering foundation heading", () => {
    render(
      <BrowserRouter>
        <App auth={fakeAuth} functions={fakeFunctions} />
      </BrowserRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /11thONUS — Engineering Foundation/i }),
    ).toBeInTheDocument();
  });

  it("wires the EXT-TECH-001 phone-auth harness at a dev-only, lazily-loaded route (build-time exclusion verified separately against a real production build)", async () => {
    render(
      <MemoryRouter initialEntries={["/dev/phone-auth-harness"]}>
        <App auth={fakeAuth} functions={fakeFunctions} />
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
        <App auth={fakeAuth} functions={fakeFunctions} />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /Sign-in preview/i })).toBeInTheDocument();
  });

  it("routes a signed-out visitor to /business to the sign-in-required fallback", async () => {
    render(
      <MemoryRouter initialEntries={["/business"]}>
        <App auth={fakeSignedOutAuth} functions={fakeFunctions} />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Please sign in to continue.")).toBeInTheDocument();
  });
});
