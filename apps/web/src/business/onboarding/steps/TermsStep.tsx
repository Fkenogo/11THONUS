/**
 * Terms-acceptance step (design §37.6). No real Terms content/version is
 * governed anywhere (`DEC-LEGAL-002` open) — this renders the state
 * plumbing only: an explicit, never-pre-checked affirmative checkbox, and a
 * neutral unavailable state when the backend reports Terms configuration is
 * unavailable. Never fakes acceptance, never bypasses the step.
 */

import { useState } from "react";
import { useTranslation } from "../../../i18n";
import { Button, Checkbox } from "../../../components/ui/formPrimitives";
import { BusinessApiError } from "../../api/businessCallableClient";
import type { BusinessContextTermsAcceptance } from "../../api/businessContext";

export type TermsStepProps = {
  termsAcceptance: BusinessContextTermsAcceptance;
  isAccepting: boolean;
  acceptError: unknown;
  onAccept: () => void;
  onContinue: () => void;
};

function isUnavailableError(error: unknown): boolean {
  return error instanceof BusinessApiError && error.code === "unavailable";
}

export function TermsStep({
  termsAcceptance,
  isAccepting,
  acceptError,
  onAccept,
  onContinue,
}: TermsStepProps) {
  const { t } = useTranslation("business");
  const [agreed, setAgreed] = useState(false);

  const unavailable = isUnavailableError(acceptError);

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">{t("terms.title")}</h2>

      {unavailable ? (
        <p role="status" className="text-[var(--color-muted-foreground)]">
          {t("terms.unavailable")}
        </p>
      ) : termsAcceptance.accepted ? (
        <p role="status">{t("terms.accepted")}</p>
      ) : (
        <div className="flex flex-col gap-4">
          <Checkbox
            id="terms-agree"
            label={t("terms.agreeLabel")}
            checked={agreed}
            onChange={setAgreed}
          />
          <Button
            type="button"
            disabled={!agreed || isAccepting}
            onClick={onAccept}
            aria-label={t("terms.agreeLabel")}
          >
            {t("terms.agreeLabel")}
          </Button>
        </div>
      )}

      <div className="mt-6">
        <Button type="button" onClick={onContinue} disabled={!termsAcceptance.accepted}>
          {t("actions.continue")}
        </Button>
      </div>
    </section>
  );
}
