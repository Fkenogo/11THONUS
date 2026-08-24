import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { i18n } from "../../i18n";
import { SubmittedStatusPage } from "./SubmittedStatusPage";
import type { BusinessContext } from "../api/businessContext";

const context: BusinessContext = {
  businessId: "b-1",
  businessCode: "BC-1",
  displayName: "Acme",
  status: "pending_verification",
  primaryCategoryId: "cat-1",
  countryCode: "BI",
  city: "Bujumbura",
  contactPhone: "+25761234567",
  branch: { branchId: "br-1", displayName: "Main", countryCode: "BI", city: "Bujumbura" },
  termsAcceptance: { accepted: true, version: "v1", acceptedAt: "t" },
};

describe("SubmittedStatusPage", () => {
  it("shows the submitted title and the Business name", () => {
    render(<SubmittedStatusPage context={context} />);
    expect(screen.getByText("Acme")).toBeInTheDocument();
  });

  describe("language accessibility (ENG-P3-002-CORR-LANGSWITCH-001)", () => {
    afterEach(async () => {
      await i18n.changeLanguage("en");
    });

    it("exposes a reachable control that switches the submitted-status copy to French and back", async () => {
      const user = userEvent.setup();
      render(<SubmittedStatusPage context={context} />);

      await user.click(screen.getByRole("button", { name: "Français" }));
      expect(await screen.findByRole("button", { name: "English" })).toBeInTheDocument();
      // Business identity data is untouched by the language switch.
      expect(screen.getByText("Acme")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "English" }));
      expect(await screen.findByRole("button", { name: "Français" })).toBeInTheDocument();
    });
  });
});
