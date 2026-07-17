import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
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
});
