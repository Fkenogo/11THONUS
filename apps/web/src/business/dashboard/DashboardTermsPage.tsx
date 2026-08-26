/**
 * Package D — Business Terms / Activation (ACT-01, `ENG-P3-002-UI-IMP-D`, per
 * `ENG-P3-002-UI-RECON-001` Part XV Package D and the ACT-01 brief in
 * `ENG-P3-002-UI-HANDOFF-001` Part V). Relocates Terms acceptance into a standalone
 * Dashboard-reachable surface — a container wrapping the existing, unmodified `TermsStep`
 * presentational component (its own tests untouched) — and adds the Submit-for-Verification
 * action the ACT-01 brief bundles into the same screen concept, gated on the existing,
 * unmodified `isReadyToSubmit` predicate. Both `acceptBusinessTerms` and
 * `submitBusinessForVerification` are existing, unchanged callables; no new backend contract.
 *
 * No "Effective Date" field: RECON-001 makes it contingent on a separate backend PR this task
 * was not authorized to make, so it is omitted rather than fabricated (no such field exists on
 * `Business`/`BusinessContext`). No Terms document body, version metadata, or "View Business
 * Terms" link: `TERMS_READABLE_CONTENT_AVAILABLE` (`../termsAvailability.ts`) is hard-pinned
 * `false` (`DEC-LEGAL-002` open) — `TermsStep` itself already renders only the neutral
 * "unavailable" state under that condition, which this container inherits unchanged; several v3
 * Stitch mockups invent a full placeholder legal document and a fabricated
 * "Version 1.0 / Effective 25 August 2026" — both ignored, not reproduced.
 *
 * Once `context.status` is `pending_verification` (reachable here per Package B's FD-4 Dashboard
 * availability disposition — the Dashboard is never status-gated), the Terms/Submit UI is
 * replaced with the same governed "submitted" copy `SubmittedStatusPage` already uses for the
 * pre-Dashboard wizard boundary, adapted for this already-inside-the-Dashboard context.
 */

import { useTranslation } from "../../i18n";
import { Button } from "../../components/ui/formPrimitives";
import {
  useAcceptBusinessTermsMutation,
  useSubmitBusinessForVerificationMutation,
} from "../hooks/businessMutations";
import { isReadyToSubmit } from "../onboarding/completeness";
import { TermsStep } from "../onboarding/steps/TermsStep";
import { MutationError } from "../onboarding/MutationError";
import type { BusinessContext } from "../api/businessContext";

export function DashboardTermsPage({ context }: { context: BusinessContext }) {
  const { t } = useTranslation("business");
  const acceptMutation = useAcceptBusinessTermsMutation(context.businessId);
  const submitMutation = useSubmitBusinessForVerificationMutation(context.businessId);

  if (context.status === "pending_verification") {
    return (
      <section>
        <h1 className="mb-2 text-xl font-semibold">{t("submitted.title")}</h1>
        <p className="text-[var(--color-muted-foreground)]">{t("submitted.body")}</p>
      </section>
    );
  }

  const ready = isReadyToSubmit(context);

  return (
    <section>
      {/* `TermsStep` already renders "Business Terms" as its own heading — no second,
          duplicate page-level heading is added here. */}
      <TermsStep
        termsAcceptance={context.termsAcceptance}
        isAccepting={acceptMutation.isPending}
        acceptError={acceptMutation.error}
        onAccept={() => acceptMutation.mutate()}
        onContinue={() => {}}
        hideContinue
      />

      <div className="mt-8 border-t border-[var(--color-border)] pt-6">
        <Button
          type="button"
          disabled={!ready || submitMutation.isPending}
          onClick={() => submitMutation.mutate()}
        >
          {t("actions.submit")}
        </Button>
        <MutationError error={submitMutation.error} />
      </div>
    </section>
  );
}
