/**
 * Onboarding wizard orchestration (design §8/§38): step-to-step navigation
 * is local UI state, but which step opens and which are already "done" is
 * derived purely from `BusinessContext` via the completeness predicates —
 * never from `localStorage` or a persisted `onboardingStep`. "Business
 * details" is always complete once a `BusinessContext` exists at all
 * (`createBusiness` enforces those fields atomically), so it is not a
 * separate resumable stage here.
 */

import { useState } from "react";
import { useTranslation } from "../../i18n";
import type { BusinessContext } from "../api/businessContext";
import { isBranchComplete, isClassificationComplete, isTermsComplete } from "./completeness";
import { ClassificationStep } from "./steps/ClassificationStep";
import { BranchStep } from "./steps/BranchStep";
import { TermsStepContainer } from "./steps/TermsStepContainer";
import { TeamStep } from "./steps/TeamStep";
import { ReviewStep } from "./steps/ReviewStep";

const STEP_ORDER = ["classification", "branch", "terms", "team", "review"] as const;
type Step = (typeof STEP_ORDER)[number];

function firstIncompleteStep(context: BusinessContext): Step {
  if (!isClassificationComplete(context)) return "classification";
  if (!isBranchComplete(context)) return "branch";
  if (!isTermsComplete(context)) return "terms";
  return "review";
}

export function OnboardingWizard({ context }: { context: BusinessContext }) {
  const { t } = useTranslation("business");
  const [step, setStep] = useState<Step>(() => firstIncompleteStep(context));

  if (context.branch === null) {
    return (
      <main className="mx-auto max-w-md p-8 text-center">
        <h1 className="mb-2 text-lg font-semibold">{t("integrityError.title")}</h1>
        <p>{t("integrityError.body")}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg p-6">
      <nav aria-label={t("steps.review")} className="mb-6 flex flex-wrap gap-2 text-sm">
        {STEP_ORDER.map((candidate) => (
          <button
            key={candidate}
            type="button"
            onClick={() => setStep(candidate)}
            className="rounded-md border border-[var(--color-border)] px-2 py-1"
            aria-current={step === candidate ? "step" : undefined}
          >
            {t(
              `steps.${candidate === "team" ? "team" : candidate === "review" ? "review" : candidate}`,
            )}
          </button>
        ))}
      </nav>

      {step === "classification" && (
        <ClassificationStep context={context} onContinue={() => setStep("branch")} />
      )}
      {step === "branch" && <BranchStep context={context} onContinue={() => setStep("terms")} />}
      {step === "terms" && (
        <TermsStepContainer context={context} onContinue={() => setStep("team")} />
      )}
      {step === "team" && <TeamStep context={context} onContinue={() => setStep("review")} />}
      {step === "review" && <ReviewStep context={context} />}
    </main>
  );
}
