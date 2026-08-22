/**
 * Terms-acceptance step (design §37.6).
 *
 * Content-authority finding (independent review, corrected from the
 * original implementation): a server-authoritative *required Terms
 * version* (`termsAcceptance.version`) is not the same thing as a
 * user-*readable* Terms document/link. Grepping the full repository finds
 * no `termsDocumentId`/`termsUrl`/readable-content source anywhere —
 * `ENG-P3-002-DESIGN-001` §37.5 itself confirms "no in-repo legal-document
 * CMS" and defers the actual content to the still-open `DEC-LEGAL-002`.
 * A user must never be offered a consent control for content they cannot
 * read. `TERMS_READABLE_CONTENT_AVAILABLE` is therefore hard-pinned to
 * `false` — no checkbox, no accept button, Continue disabled — until a
 * future package wires in a real governed content source and this flag
 * (or its replacement) is deliberately flipped. The backend's own
 * config-unavailable failure (`unavailable` error code) is handled as
 * secondary defense for after that day, not as how this gate is
 * discovered today.
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

/** No governed, user-readable Terms document/link exists anywhere yet (`DEC-LEGAL-002` open). */
const TERMS_READABLE_CONTENT_AVAILABLE = false;

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

      <div className="mt-6">
        <Button type="button" onClick={onContinue} disabled={!termsAcceptance.accepted}>
          {t("actions.continue")}
        </Button>
      </div>
    </section>
  );
}
