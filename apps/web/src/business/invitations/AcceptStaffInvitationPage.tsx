/**
 * Invitation acceptance route (`PLATFORM-BASELINE-004A`).
 *
 * The minimum customer/staff-facing surface for the existing
 * `acceptStaffInvitation` domain operation: an authenticated person opens
 * `/invitations/:invitationReference/accept` (the reference is the opaque,
 * unguessable invitation id the owner shares), reviews the plain-language
 * invitation summary, and accepts explicitly. The accepting identity is
 * resolved server-side from the credential — never from input — and the
 * Business binding and role come from the authoritative invitation.
 */

import { Link, useParams } from "react-router-dom";
import { useTranslation } from "../../i18n";
import { Button } from "../../components/ui/formPrimitives";
import { useAcceptStaffInvitationMutation } from "../hooks/businessMutations";
import { MutationError } from "../onboarding/MutationError";

export function AcceptStaffInvitationPage() {
  const { t } = useTranslation("business");
  const { invitationReference } = useParams();
  const acceptMutation = useAcceptStaffInvitationMutation();

  if (!invitationReference) {
    return (
      <main className="mx-auto max-w-xl p-8">
        <h1 className="mb-1 text-xl font-semibold">{t("invitationAccept.title")}</h1>
        <div role="alert" className="rounded-md border border-[var(--color-border)] p-4">
          <h2 className="mb-1 font-semibold">{t("invitationAccept.missingReferenceTitle")}</h2>
          <p className="text-sm">{t("invitationAccept.missingReferenceBody")}</p>
        </div>
      </main>
    );
  }

  if (acceptMutation.isSuccess && acceptMutation.data) {
    const result = acceptMutation.data;
    return (
      <main className="mx-auto max-w-xl p-8">
        <h1 className="mb-1 text-xl font-semibold">{t("invitationAccept.title")}</h1>
        <div className="rounded-md border border-[var(--color-border)] p-4">
          <h2 className="mb-1 font-semibold">{t("invitationAccept.successTitle")}</h2>
          <p className="mb-3 text-sm">{t("invitationAccept.successBody")}</p>
          <Link className="min-h-11 underline" to={`/business/${result.businessId}/dashboard`}>
            {t("invitationAccept.openDashboard")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="mb-1 text-xl font-semibold">{t("invitationAccept.title")}</h1>
      <p className="mb-6 text-[var(--color-muted-foreground)]">
        {t("invitationAccept.description")}
      </p>
      <Button
        type="button"
        className="min-h-11"
        disabled={acceptMutation.isPending}
        onClick={() => acceptMutation.mutate({ invitationReference })}
      >
        {acceptMutation.isPending
          ? t("invitationAccept.accepting")
          : t("invitationAccept.acceptAction")}
      </Button>
      <MutationError error={acceptMutation.error} />
    </main>
  );
}
