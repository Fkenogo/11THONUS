/**
 * Terms-acceptance step (design §37.6).
 *
 * Content-authority finding (independent review, corrected from the
 * original implementation): a server-authoritative *required Terms
 * version* (`termsAcceptance.version`) is not the same thing as a
 * user-*readable* Terms document/link. See `../../termsAvailability.ts`
 * (`TERMS_READABLE_CONTENT_AVAILABLE`, the single source of truth for this
 * question, also reused by Dashboard Home) for the full rationale — no
 * checkbox, no accept button, Continue disabled — until a future package
 * wires in a real governed content source and that flag is deliberately
 * flipped. The backend's own config-unavailable failure (`unavailable`
 * error code) is handled as secondary defense for after that day, not as
 * how this gate is discovered today.
 */

import { useState } from "react";
import { useTranslation } from "../../../i18n";
import { Button, Checkbox } from "../../../components/ui/formPrimitives";
import { BusinessApiError } from "../../api/businessCallableClient";
import { TERMS_READABLE_CONTENT_AVAILABLE } from "../../termsAvailability";
import type { BusinessContextTermsAcceptance } from "../../api/businessContext";

export type TermsStepProps = {
  termsAcceptance: BusinessContextTermsAcceptance;
  isAccepting: boolean;
  acceptError: unknown;
  onAccept: () => void;
  onContinue: () => void;
  /**
   * `ENG-P3-002-UI-IMP-D`: omits the wizard-only "Continue" footer for
   * non-wizard hosts (the Dashboard Activation screen has no next step to
   * continue to). Defaults to `false` — every existing caller/test is
   * unaffected.
   */
  hideContinue?: boolean;
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
  hideContinue = false,
}: TermsStepProps) {
  const { t } = useTranslation("business");
  const [agreed, setAgreed] = useState(false);

  const unavailable = !TERMS_READABLE_CONTENT_AVAILABLE || isUnavailableError(acceptError);

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">{t("terms.title")}</h2>

      {termsAcceptance.accepted ? (
        <p role="status">{t("terms.accepted")}</p>
      ) : unavailable ? (
        <p role="status" className="text-[var(--color-muted-foreground)]">
          {t("terms.unavailable")}
        </p>
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

      {!hideContinue && (
        <div className="mt-6">
          <Button type="button" onClick={onContinue} disabled={!termsAcceptance.accepted}>
            {t("actions.continue")}
          </Button>
        </div>
      )}
    </section>
  );
}
