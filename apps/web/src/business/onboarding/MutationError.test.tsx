import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MutationError } from "./MutationError";
import { BusinessApiError } from "../api/businessCallableClient";

describe("MutationError", () => {
  it("renders nothing when there is no error", () => {
    const { container } = render(<MutationError error={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for an unrecognized (non-BusinessApiError) error, never a raw message", () => {
    const { container } = render(<MutationError error={new Error("raw internal stack trace")} />);
    expect(container.textContent).not.toMatch(/raw internal stack trace/);
  });

  it("maps a forbidden BusinessApiError to the localized forbidden message", () => {
    render(<MutationError error={new BusinessApiError("auth_forbidden")} />);
    expect(screen.getByRole("alert")).toHaveTextContent("You don't have permission to do that.");
  });

  it("maps a validation_failed BusinessApiError to the localized validation message", () => {
    render(<MutationError error={new BusinessApiError("validation_failed")} />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Something about that wasn't valid. Please check and try again.",
    );
  });
});
