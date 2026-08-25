import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EstablishmentIdentityStep } from "./EstablishmentIdentityStep";

vi.mock("../../hooks/businessQueries", () => ({
  useBusinessCategoriesQuery: () => ({
    data: [{ id: "cat-1", displayLabel: "Salon", nodeType: "business_category" }],
  }),
  useBusinessTypesQuery: (categoryId: string | undefined) => ({
    data: categoryId ? [{ id: "type-1", displayLabel: "Family Salon" }] : [],
    status: categoryId ? "success" : "pending",
  }),
}));

const initialValues = {
  displayName: "",
  primaryCategoryId: "",
  businessTypeId: "",
  contactPhone: "",
};

describe("EstablishmentIdentityStep", () => {
  it("keeps Continue disabled until name, category, and phone are filled — type stays optional", async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    render(<EstablishmentIdentityStep initialValues={initialValues} onContinue={onContinue} />);

    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();

    await user.type(screen.getByLabelText("Business name"), "Acme Salon");
    await user.selectOptions(screen.getByLabelText("Business category"), "cat-1");
    await user.type(screen.getByLabelText("Phone number"), "+25761234567");

    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  it("clears the selected Business Type when the category changes (never keeps a mismatched type)", async () => {
    const user = userEvent.setup();
    render(
      <EstablishmentIdentityStep
        initialValues={{ ...initialValues, primaryCategoryId: "cat-1", businessTypeId: "type-1" }}
        onContinue={vi.fn()}
      />,
    );
    await user.selectOptions(screen.getByLabelText("Business category"), "");
    await user.selectOptions(screen.getByLabelText("Business category"), "cat-1");
    expect(screen.getByLabelText("Business type (optional)")).toHaveValue("");
  });

  it("calls onContinue with the exact entered values, including empty optional type", async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    render(<EstablishmentIdentityStep initialValues={initialValues} onContinue={onContinue} />);

    await user.type(screen.getByLabelText("Business name"), "Acme Salon");
    await user.selectOptions(screen.getByLabelText("Business category"), "cat-1");
    await user.type(screen.getByLabelText("Phone number"), "+25761234567");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(onContinue).toHaveBeenCalledWith({
      displayName: "Acme Salon",
      primaryCategoryId: "cat-1",
      businessTypeId: "",
      contactPhone: "+25761234567",
    });
  });

  it("preserves previously entered values when re-rendered with them as initialValues (EN/FR switch survives state)", () => {
    render(
      <EstablishmentIdentityStep
        initialValues={{
          displayName: "Acme Salon",
          primaryCategoryId: "cat-1",
          businessTypeId: "",
          contactPhone: "+25761234567",
        }}
        onContinue={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Business name")).toHaveValue("Acme Salon");
    expect(screen.getByLabelText("Phone number")).toHaveValue("+25761234567");
  });
});
