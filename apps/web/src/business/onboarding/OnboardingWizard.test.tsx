import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { OnboardingWizard } from "./OnboardingWizard";
import type { BusinessContext } from "../api/businessContext";

vi.mock("./steps/ClassificationStep", () => ({
  ClassificationStep: () => <div>classification step</div>,
}));
vi.mock("./steps/BranchStep", () => ({ BranchStep: () => <div>branch step</div> }));
vi.mock("./steps/TermsStepContainer", () => ({ TermsStepContainer: () => <div>terms step</div> }));
vi.mock("./steps/TeamStep", () => ({ TeamStep: () => <div>team step</div> }));
vi.mock("./steps/ReviewStep", () => ({ ReviewStep: () => <div>review step</div> }));

const baseContext: BusinessContext = {
  businessId: "b-1",
  businessCode: "BC-1",
  displayName: "Acme",
  status: "draft",
  primaryCategoryId: "",
  countryCode: "BI",
  city: "Bujumbura",
  contactPhone: "+25761234567",
  branch: { branchId: "br-1", displayName: "Main", countryCode: "BI", city: "Bujumbura" },
  termsAcceptance: { accepted: false },
};

describe("OnboardingWizard", () => {
  it("shows the classification step first when classification is the first incomplete required stage", () => {
    render(<OnboardingWizard context={baseContext} />);
    expect(screen.getByText("classification step")).toBeInTheDocument();
  });

  it("shows the terms step when classification and branch are already complete", () => {
    render(<OnboardingWizard context={{ ...baseContext, primaryCategoryId: "cat-1" }} />);
    expect(screen.getByText("terms step")).toBeInTheDocument();
  });

  it("shows the review step once every required stage is already complete", () => {
    render(
      <OnboardingWizard
        context={{
          ...baseContext,
          primaryCategoryId: "cat-1",
          termsAcceptance: { accepted: true, version: "v1", acceptedAt: "t" },
        }}
      />,
    );
    expect(screen.getByText("review step")).toBeInTheDocument();
  });

  it("renders a generic integrity-error state instead of any step when the branch is missing — never a create-first-branch flow", () => {
    render(
      <OnboardingWizard context={{ ...baseContext, primaryCategoryId: "cat-1", branch: null }} />,
    );
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.queryByText("branch step")).not.toBeInTheDocument();
    expect(screen.queryByText("terms step")).not.toBeInTheDocument();
  });
});
