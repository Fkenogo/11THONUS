/** Wires the presentational `TermsStep` to the real `acceptBusinessTerms` mutation and context. */

import { useAcceptBusinessTermsMutation } from "../../hooks/businessMutations";
import type { BusinessContext } from "../../api/businessContext";
import { TermsStep } from "./TermsStep";

export function TermsStepContainer({
  context,
  onContinue,
}: {
  context: BusinessContext;
  onContinue: () => void;
}) {
  const mutation = useAcceptBusinessTermsMutation(context.businessId);

  return (
    <TermsStep
      termsAcceptance={context.termsAcceptance}
      isAccepting={mutation.isPending}
      acceptError={mutation.error}
      onAccept={() => mutation.mutate()}
      onContinue={onContinue}
    />
  );
}
