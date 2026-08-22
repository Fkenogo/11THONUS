import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, Checkbox, FieldError, Select, TextField } from "./formPrimitives";

describe("TextField", () => {
  it("associates its label and, when present, its error message via aria-describedby", () => {
    render(<TextField id="name" label="Business name" errorMessage="Required" />);

    const input = screen.getByLabelText("Business name");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Required");
  });

  it("has no error association when errorMessage is absent", () => {
    render(<TextField id="name" label="Business name" />);
    expect(screen.getByLabelText("Business name")).not.toHaveAttribute("aria-invalid");
  });
});

describe("Select", () => {
  it("renders the given options and reports the selected value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Select
        id="category"
        label="Category"
        value=""
        onChange={onChange}
        options={[{ value: "cat-1", label: "Salon" }]}
      />,
    );

    await user.selectOptions(screen.getByLabelText("Category"), "cat-1");

    expect(onChange).toHaveBeenCalledWith("cat-1");
  });
});

describe("Checkbox", () => {
  it("defaults unchecked and reports toggles", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox id="terms" label="I agree" checked={false} onChange={onChange} />);

    const checkbox = screen.getByLabelText("I agree");
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);

    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe("Button", () => {
  it("is disabled when disabled is passed, and not clickable", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Continue
      </Button>,
    );

    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("FieldError", () => {
  it("renders nothing when there is no message", () => {
    const { container } = render(<FieldError id="e" message={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the message when present", () => {
    render(<FieldError id="e" message="Required" />);
    expect(screen.getByText("Required")).toBeInTheDocument();
  });
});
