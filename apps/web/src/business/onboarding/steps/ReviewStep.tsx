/**
 * Review + submit (design §Phase P/Q). No frontend-only "complete" flag —
 * `isReadyToSubmit` re-derives readiness from the same governed fields the
 * backend itself requires; if anything is incomplete, the user is guided
 * back to that step rather than allowed to submit.
 */

import { useTranslation } from "../../../i18n";
import { Button } from "../../../components/ui/formPrimitives";
import { useStaffInvitationsQuery } from "../../hooks/businessQueries";
import { useSubmitBusinessForVerificationMutation } from "../../hooks/businessMutations";
import { isReadyToSubmit } from "../completeness";
import type { BusinessContext } from "../../api/businessContext";

export function ReviewStep({ context }: { context: BusinessContext }) {
  const { t } = useTranslation("business");
  const invitationsQuery = useStaffInvitationsQuery(context.businessId);
  const mutation = useSubmitBusinessForVerificationMutation(context.businessId);
  const ready = isReadyToSubmit(context);

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">{t("review.title")}</h2>
      <dl className="mb-6 flex flex-col gap-2 text-sm">
        <div>
          <dt className="font-medium">{t("review.businessNameLabel")}</dt>
          <dd>{context.displayName}</dd>
        </div>
        <div>
          <dt className="font-medium">{t("review.categoryLabel")}</dt>
          <dd>{context.primaryCategoryId || "—"}</dd>
        </div>
        <div>
          <dt className="font-medium">{t("review.locationLabel")}</dt>
          <dd>{context.branch ? `${context.branch.displayName}, ${context.branch.city}` : "—"}</dd>
        </div>
        <div>
          <dt className="font-medium">{t("review.termsLabel")}</dt>
          <dd>{context.termsAcceptance.accepted ? t("terms.accepted") : t("review.incomplete")}</dd>
        </div>
        <div>
          <dt className="font-medium">{t("review.teamLabel")}</dt>
          <dd>{(invitationsQuery.data ?? []).length}</dd>
        </div>
      </dl>

      {!ready && <p role="alert">{t("review.incomplete")}</p>}

      <Button
        type="button"
        disabled={!ready || mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {t("actions.submit")}
      </Button>
    </section>
  );
}
