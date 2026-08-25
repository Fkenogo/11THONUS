import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EstablishmentLocationStep } from "./EstablishmentLocationStep";
import type { EstablishmentIdentityValues } from "./EstablishmentIdentityStep";

const mockMutate = vi.fn();
vi.mock("../../hooks/businessMutations", () => ({
  useCreateBusinessMutation: () => ({ mutate: mockMutate, isPending: false, error: undefined }),
}));

const identityValues: EstablishmentIdentityValues = {
  displayName: "Acme Salon",
  primaryCategoryId: "cat-1",
  businessTypeId: "",
  contactPhone: "+25761234567",
};

const initialValues = {
  countryCode: "",
  city: "",
  displayName: "",
  address: "",
  currencyCode: "",
  timezone: "",
};

function fillAllFields() {
  const user = userEvent.setup();
  return { user };
}

describe("EstablishmentLocationStep", () => {
  beforeEach(() => {
    mockMutate.mockClear();
  });

  it("keeps Continue disabled until country, city, location name, currency, and timezone are all filled — address stays optional", async () => {
    const { user } = fillAllFields();
    render(
      <EstablishmentLocationStep
        identityValues={identityValues}
        initialValues={initialValues}
        onBack={vi.fn()}
        onCreated={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();

    await user.type(screen.getByLabelText("Country"), "BI");
    await user.type(screen.getByLabelText("City"), "Bujumbura");
    await user.type(screen.getByLabelText("Location name"), "Main Branch");
    await user.type(screen.getByLabelText("Currency"), "BIF");
    await user.type(screen.getByLabelText("Timezone"), "Africa/Bujumbura");

    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  it("fires createBusiness with every EST-01 + EST-02 value combined, exactly once, and supportedLanguages: []", async () => {
    const { user } = fillAllFields();
    render(
      <EstablishmentLocationStep
        identityValues={identityValues}
        initialValues={initialValues}
        onBack={vi.fn()}
        onCreated={vi.fn()}
      />,
    );
    await user.type(screen.getByLabelText("Country"), "BI");
    await user.type(screen.getByLabelText("City"), "Bujumbura");
    await user.type(screen.getByLabelText("Location name"), "Main Branch");
    await user.type(screen.getByLabelText("Currency"), "BIF");
    await user.type(screen.getByLabelText("Timezone"), "Africa/Bujumbura");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate).toHaveBeenCalledWith(
      {
        displayName: "Acme Salon",
        primaryCategoryId: "cat-1",
        businessTypeId: undefined,
        contactPhone: "+25761234567",
        countryCode: "BI",
        city: "Bujumbura",
        currencyCode: "BIF",
        timezone: "Africa/Bujumbura",
        supportedLanguages: [],
      },
      expect.anything(),
    );
  });

  it("does not send a Branch address field to createBusiness — Main Location address is BusinessBranch.address, applied after creation, never synced onto Business.address", async () => {
    const { user } = fillAllFields();
    render(
      <EstablishmentLocationStep
        identityValues={identityValues}
        initialValues={initialValues}
        onBack={vi.fn()}
        onCreated={vi.fn()}
      />,
    );
    await user.type(screen.getByLabelText("Country"), "BI");
    await user.type(screen.getByLabelText("City"), "Bujumbura");
    await user.type(screen.getByLabelText("Location name"), "Main Branch");
    await user.type(screen.getByLabelText("Address (optional)"), "123 Maple St");
    await user.type(screen.getByLabelText("Currency"), "BIF");
    await user.type(screen.getByLabelText("Timezone"), "Africa/Bujumbura");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    const [payload] = mockMutate.mock.calls[0];
    expect(payload).not.toHaveProperty("address");
  });

  it("calls onBack when Back is clicked, without firing createBusiness", async () => {
    const { user } = fillAllFields();
    const onBack = vi.fn();
    render(
      <EstablishmentLocationStep
        identityValues={identityValues}
        initialValues={initialValues}
        onBack={onBack}
        onCreated={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(mockMutate).not.toHaveBeenCalled();
  });
});
